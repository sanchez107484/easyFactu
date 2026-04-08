import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Frequency } from '@easyfactura/shared-types';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { InvoiceService } from '../invoices/invoice.service';
import { CreateInvoiceDto } from '../invoices/dto/create-invoice.dto';

@Injectable()
export class RecurringInvoiceSchedulerService {
  private readonly logger = new Logger(RecurringInvoiceSchedulerService.name);

  constructor(
    private readonly recurringInvoiceService: RecurringInvoiceService,
    private readonly invoiceService: InvoiceService
  ) {}

  /**
   * Safety cap: maximum number of invoices generated per scheduler run.
   * Prevents runaway catch-up if the server was down for an extended period
   * or if a bug causes infinite looping.
   */
  private static readonly MAX_INVOICES_PER_RUN = 200;

  @Cron('0 6 * * *', { name: 'generate-recurring-invoices' })
  async generateDueInvoices() {
    this.logger.log('Starting recurring invoice generation...');

    // Track recurring IDs that failed so we skip them on subsequent iterations
    // and avoid retrying a broken recurring invoice forever within the same run.
    const failedIds = new Set<string>();
    let totalGenerated = 0;

    // Loop until no recurring invoices remain due. This handles catch-up correctly:
    // if the server was down for several periods, all missed invoices are generated
    // in a single scheduler run rather than trickling in over multiple days.
    while (totalGenerated < RecurringInvoiceSchedulerService.MAX_INVOICES_PER_RUN) {
      const dueRecurring = (await this.recurringInvoiceService.findDueRecurringInvoices()).filter(
        (r) => !failedIds.has(r.id)
      );

      if (dueRecurring.length === 0) break;

      this.logger.log(`Found ${dueRecurring.length} recurring invoice(s) to process.`);

      for (const recurring of dueRecurring) {
        if (totalGenerated >= RecurringInvoiceSchedulerService.MAX_INVOICES_PER_RUN) break;
        const success = await this.processOneRecurringInvoice(recurring);
        if (success) {
          totalGenerated++;
        } else {
          failedIds.add(recurring.id);
        }
      }
    }

    if (totalGenerated === 0 && failedIds.size === 0) {
      this.logger.log('No recurring invoices due today.');
    } else {
      this.logger.log(
        `Recurring invoice run complete. Generated: ${totalGenerated}, failed: ${failedIds.size}.`
      );
    }

    if (totalGenerated >= RecurringInvoiceSchedulerService.MAX_INVOICES_PER_RUN) {
      this.logger.warn(
        `Hit safety cap of ${RecurringInvoiceSchedulerService.MAX_INVOICES_PER_RUN} invoices per run. ` +
          'Some periods may remain pending and will be processed on the next run.'
      );
    }
  }

  private async processOneRecurringInvoice(recurring: {
    id: string;
    tenantId: string;
    customerId: string;
    seriesId: string | null;
    frequency: string;
    dayOfMonth: number;
    endDate: Date | null;
    autoConfirm: boolean;
    discountPercent: unknown;
    irpfPercent: unknown;
    paymentMethod: string | null;
    paymentDetails: unknown;
    notes: string | null;
    lines: Array<{
      description: string;
      quantity: unknown;
      unitPrice: unknown;
      taxRate: unknown;
      irpfRate: unknown;
      hideQty: boolean;
      productId: string | null;
    }>;
  }): Promise<boolean> {
    try {
      const today = new Date();
      const issueDateStr = today.toISOString().split('T')[0]!;

      const dto: CreateInvoiceDto = {
        customerId: recurring.customerId,
        seriesId: recurring.seriesId ?? undefined,
        issueDate: issueDateStr,
        invoiceType: 'standard',
        discountPercent:
          recurring.discountPercent != null ? Number(recurring.discountPercent) : undefined,
        irpfPercent: recurring.irpfPercent != null ? Number(recurring.irpfPercent) : undefined,
        paymentMethod: recurring.paymentMethod as CreateInvoiceDto['paymentMethod'],
        paymentDetails: recurring.paymentDetails as Record<string, unknown> | undefined,
        notes: recurring.notes ?? undefined,
        lines: recurring.lines.map((line) => ({
          productId: line.productId ?? undefined,
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          taxRate: Number(line.taxRate),
          hideQty: line.hideQty,
        })),
      };

      const invoice = await this.invoiceService.create(recurring.tenantId, dto);

      // Link generated invoice to its recurring template
      await this.invoiceService.linkToRecurringInvoice(invoice.id, recurring.id);

      if (recurring.autoConfirm) {
        await this.invoiceService.confirm(recurring.tenantId, invoice.id);
        this.logger.log(
          `Auto-confirmed invoice ${invoice.id} for recurring ${recurring.id} (tenant ${recurring.tenantId})`
        );
      } else {
        this.logger.log(
          `Created draft invoice ${invoice.id} for recurring ${recurring.id} (tenant ${recurring.tenantId})`
        );
      }

      await this.recurringInvoiceService.advanceNextRunDate(
        recurring.id,
        recurring.frequency as Frequency,
        recurring.dayOfMonth,
        recurring.endDate
      );
      return true;
    } catch (error) {
      // Log but do not rethrow — one failure must not block other recurring invoices
      this.logger.error(
        `Failed to process recurring invoice ${recurring.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }
}
