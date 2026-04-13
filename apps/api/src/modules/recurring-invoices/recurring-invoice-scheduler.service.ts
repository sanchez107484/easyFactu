import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurringStatus, Prisma, RecurringInvoice } from '@prisma/client';
import { InvoiceService } from '../invoices/invoice.service';
import { InvoiceNumberService } from '../invoices/invoice-number.service';
import { InvoiceCalculationService } from '../invoices/invoice-calculation.service';
import { computeNextRunDate } from './recurring-invoice.service';
import { CreateInvoiceDto, CreateInvoiceLineDto } from '../invoices/dto/create-invoice.dto';
import { PaymentMethod } from '@easyfactura/shared-types';

/**
 * Scheduler that generates recurring invoices daily at midnight UTC.
 *
 * Uses a lightweight setInterval approach — no external queue required.
 * The scheduler is also manually triggerable via POST /recurring-invoices/trigger-scheduler
 * (admin-only, BUG-06).
 */
@Injectable()
export class RecurringInvoiceSchedulerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(RecurringInvoiceSchedulerService.name);
  private schedulerTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private invoiceService: InvoiceService,
    private invoiceNumberService: InvoiceNumberService,
    private calculationService: InvoiceCalculationService
  ) {}

  onApplicationBootstrap() {
    this.scheduleNextRun();
  }

  onApplicationShutdown() {
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
    }
  }

  /**
   * Schedules the next run at the next UTC midnight.
   */
  private scheduleNextRun() {
    const now = new Date();
    const nextMidnightUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const msUntilMidnight = nextMidnightUTC.getTime() - now.getTime();

    this.schedulerTimer = setTimeout(async () => {
      await this.runScheduler();
      this.scheduleNextRun(); // Re-schedule for the next day
    }, msUntilMidnight);

    this.logger.log(`Next scheduler run in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  }

  /**
   * Manually trigger the scheduler. Used by the admin endpoint (BUG-06).
   */
  async triggerManually(): Promise<{ processed: number; errors: number }> {
    return this.runScheduler();
  }

  /**
   * Core scheduler logic: find all active recurring invoices due today or earlier,
   * generate a confirmed invoice for each one, then advance nextRunDate.
   */
  async runScheduler(): Promise<{ processed: number; errors: number }> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    this.logger.log(`Running recurring invoice scheduler for ${today.toISOString().split('T')[0]}`);

    const due = await this.prisma.recurringInvoice.findMany({
      where: {
        status: RecurringStatus.ACTIVE,
        nextRunDate: { lte: today },
      },
      include: {
        customer: true,
      },
    });

    this.logger.log(`Found ${due.length} recurring invoice(s) due`);

    let processed = 0;
    let errors = 0;

    for (const recurring of due) {
      try {
        await this.generateInvoice(recurring, today);
        processed++;
      } catch (err) {
        errors++;
        this.logger.error(
          `Failed to generate invoice for recurring ${recurring.id}: ${(err as Error).message}`,
          (err as Error).stack
        );
      }
    }

    this.logger.log(`Scheduler completed: ${processed} generated, ${errors} errors`);
    return { processed, errors };
  }

  /**
   * Generates a single confirmed invoice from a recurring invoice template.
   *
   * BUG-03 FIX: irpfRate is now passed per line, not ignored.
   */
  private async generateInvoice(recurring: RecurringInvoice, runDate: Date): Promise<void> {

    // Cast lines from JSON to typed array
    const lines = (recurring.lines as Prisma.JsonArray).map((line) => {
      const l = line as Record<string, unknown>;
      const lineDto: CreateInvoiceLineDto = {
        description: l['description'] as string,
        quantity: Number(l['quantity']),
        unitPrice: Number(l['unitPrice']),
        taxRate: Number(l['taxRate']),
        hideQty: Boolean(l['hideQty'] ?? false),
        ...(l['productId'] ? { productId: l['productId'] as string } : {}),
        // BUG-03 FIX: include irpfRate per line
        ...(l['irpfRate'] !== undefined && l['irpfRate'] !== null
          ? { irpfRate: Number(l['irpfRate']) }
          : {}),
      };
      return lineDto;
    });

    const issueDate = runDate.toISOString().split('T')[0]!;
    const dueDate =
      recurring.dueDays != null
        ? new Date(Date.UTC(
            runDate.getUTCFullYear(),
            runDate.getUTCMonth(),
            runDate.getUTCDate() + recurring.dueDays
          ))
            .toISOString()
            .split('T')[0]
        : undefined;

    const dto: CreateInvoiceDto = {
      customerId: recurring.customerId,
      seriesId: recurring.seriesId ?? undefined,
      issueDate,
      dueDate: dueDate ?? undefined,
      lines,
      discountPercent: recurring.discountPercent ? Number(recurring.discountPercent) : undefined,
      irpfPercent: recurring.irpfPercent ? Number(recurring.irpfPercent) : undefined,
      paymentMethod: recurring.paymentMethod as PaymentMethod | undefined,
      paymentDetails: recurring.paymentDetails
        ? (recurring.paymentDetails as CreateInvoiceDto['paymentDetails'])
        : undefined,
      notes: recurring.notes ?? undefined,
      invoiceType: 'standard',
    };

    // Create as DRAFT first, then confirm immediately
    const invoice = await this.invoiceService.create(recurring.tenantId, dto);
    const confirmed = await this.invoiceService.confirm(recurring.tenantId, invoice.id);

    // Compute the next run date
    const newNextRunDate = computeNextRunDate(runDate, recurring.frequency, recurring.dayOfMonth);

    // Determine if this was the last occurrence
    const newCount = recurring.occurrencesCount + 1;
    const isLastByCount =
      recurring.maxOccurrences != null && newCount >= recurring.maxOccurrences;
    const isLastByEndDate =
      recurring.endDate != null && newNextRunDate > (recurring.endDate as Date);

    const newStatus =
      isLastByCount || isLastByEndDate ? RecurringStatus.COMPLETED : RecurringStatus.ACTIVE;

    await this.prisma.$transaction(async (tx) => {
      // Update the recurring invoice state
      await tx.recurringInvoice.update({
        where: { id: recurring.id },
        data: {
          occurrencesCount: newCount,
          lastRunAt: runDate,
          nextRunDate: newStatus === RecurringStatus.COMPLETED ? null : newNextRunDate,
          status: newStatus,
        },
      });

      // Log the generation
      await tx.recurringInvoiceLog.create({
        data: {
          tenantId: recurring.tenantId,
          recurringInvoiceId: recurring.id,
          invoiceId: confirmed.id,
          runDate,
        },
      });
    });

    this.logger.log(
      `Generated invoice ${confirmed.number ?? confirmed.id} from recurring ${recurring.id}`
    );
  }

  /**
   * MISSING-06: Generate an invoice immediately (on demand), bypassing the scheduler.
   */
  async generateNow(tenantId: string, recurringId: string): Promise<void> {
    const recurring = await this.prisma.recurringInvoice.findFirst({
      where: { id: recurringId, tenantId },
      include: { customer: true },
    });

    if (!recurring) {
      throw new Error(`Recurring invoice ${recurringId} not found`);
    }

    if (recurring.status !== RecurringStatus.ACTIVE) {
      throw new Error('Solo se puede generar manualmente una factura recurrente activa');
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await this.generateInvoice(recurring, today);
  }
}
