import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurringFrequency, RecurringInvoiceStatus } from '@prisma/client';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { InvoiceService } from '../invoices/invoice.service';
import { CreateInvoiceDto, CreateInvoiceLineDto } from '../invoices/dto/create-invoice.dto';
import { PaymentMethod } from '@easyfactura/shared-types';

// ==================== HELPERS ====================

/**
 * Computes the next UTC date on which a recurring invoice should run.
 *
 * Algorithm (all in UTC):
 *   1. Start from `referenceDate` (today UTC).
 *   2. Find the target day within the current month (capped to 28).
 *   3. If that date is strictly in the future, use it.
 *   4. Otherwise advance by one frequency period and repeat.
 *
 * This function is pure (no side effects) and timezone-safe because
 * it works exclusively with UTC timestamps.
 */
export function computeNextRunDate(
  frequency: RecurringFrequency,
  dayOfMonth: number,
  referenceDate: Date = new Date()
): Date {
  // Work in UTC to avoid DST/timezone issues
  const ref = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  const safeDay = Math.min(dayOfMonth, 28);

  // Candidate: same month as reference, on the target day
  let candidate = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), safeDay));

  // If candidate is not strictly after today, advance by one period
  if (candidate <= ref) {
    candidate = advanceByFrequency(candidate, frequency);
  }

  return candidate;
}

function advanceByFrequency(date: Date, frequency: RecurringFrequency): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  switch (frequency) {
    case RecurringFrequency.WEEKLY:
      return new Date(Date.UTC(y, m, d + 7));
    case RecurringFrequency.BIWEEKLY:
      return new Date(Date.UTC(y, m, d + 14));
    case RecurringFrequency.MONTHLY:
      return new Date(Date.UTC(y, m + 1, d));
    case RecurringFrequency.QUARTERLY:
      return new Date(Date.UTC(y, m + 3, d));
    case RecurringFrequency.YEARLY:
      return new Date(Date.UTC(y + 1, m, d));
  }
}

// ==================== SERVICE ====================

@Injectable()
export class RecurringInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService
  ) {}

  // ==================== CRUD ====================

  async create(tenantId: string, dto: CreateRecurringInvoiceDto) {
    await this.validateCustomer(tenantId, dto.customerId);

    const startDate = new Date(dto.startDate);
    const nextRunDate = computeNextRunDate(dto.frequency, dto.dayOfMonth, startDate);

    const templateData = this.buildTemplateData(dto);

    return this.prisma.recurringInvoice.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        seriesId: dto.seriesId ?? null,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextRunDate,
        maxOccurrences: dto.maxOccurrences ?? null,
        description: dto.description ?? null,
        templateData,
      },
      include: this.defaultInclude(),
    });
  }

  async findAll(tenantId: string, query: QueryRecurringInvoiceDto) {
    const { page = 1, limit = 10, search, status, customerId } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' as const } },
          { customer: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.recurringInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, prefix: true, code: true } },
          _count: { select: { generatedInvoices: true } },
        },
      }),
      this.prisma.recurringInvoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const recurring = await this.prisma.recurringInvoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        series: true,
        generatedInvoices: {
          orderBy: { generatedAt: 'desc' },
          take: 50,
          include: {
            // We only store the log here; join to Invoice via a raw query below
          },
        },
      },
    });

    if (!recurring) {
      throw new NotFoundException(`Factura recurrente con id ${id} no encontrada`);
    }

    // Enrich logs with Invoice data
    const logIds = recurring.generatedInvoices.map((l) => l.invoiceId);
    const invoices =
      logIds.length > 0
        ? await this.prisma.invoice.findMany({
            where: { id: { in: logIds } },
            select: {
              id: true,
              number: true,
              issueDate: true,
              total: true,
              status: true,
              customer: { select: { name: true } },
            },
          })
        : [];

    const invoiceMap = Object.fromEntries(invoices.map((inv) => [inv.id, inv]));

    return {
      ...recurring,
      generatedInvoices: recurring.generatedInvoices.map((log) => ({
        ...log,
        invoice: invoiceMap[log.invoiceId] ?? null,
      })),
    };
  }

  /**
   * BUG-01 fix: recalculate nextRunDate when dayOfMonth or frequency changes.
   * Also supports manual override of nextRunDate (MISSING-02).
   */
  async update(tenantId: string, id: string, dto: UpdateRecurringInvoiceDto) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (existing.status === RecurringInvoiceStatus.COMPLETED) {
      throw new ConflictException('No se puede editar una recurrente completada');
    }

    const newFrequency = dto.frequency ?? existing.frequency;
    const newDayOfMonth = dto.dayOfMonth ?? existing.dayOfMonth;

    // Recalculate nextRunDate if scheduling params changed (BUG-01)
    let nextRunDate: Date = existing.nextRunDate;
    if (dto.nextRunDate) {
      // Manual override takes priority (MISSING-02)
      nextRunDate = new Date(dto.nextRunDate);
    } else if (dto.frequency !== undefined || dto.dayOfMonth !== undefined) {
      nextRunDate = computeNextRunDate(newFrequency, newDayOfMonth);
    }

    const updatedTemplateData = dto.lines
      ? this.buildTemplateData(dto as CreateRecurringInvoiceDto)
      : existing.templateData;

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        seriesId: dto.seriesId !== undefined ? (dto.seriesId ?? null) : undefined,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
        nextRunDate,
        maxOccurrences: dto.maxOccurrences !== undefined ? dto.maxOccurrences : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        templateData: updatedTemplateData as any,
      },
      include: this.defaultInclude(),
    });
  }

  async pause(tenantId: string, id: string) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (existing.status !== RecurringInvoiceStatus.ACTIVE) {
      throw new ConflictException('Solo se puede pausar una recurrente activa');
    }

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { status: RecurringInvoiceStatus.PAUSED },
      include: this.defaultInclude(),
    });
  }

  /**
   * BUG-02 fix: when resuming, recalculate nextRunDate from NOW to avoid
   * retroactive generation of all invoices during the pause period.
   */
  async resume(tenantId: string, id: string) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (existing.status !== RecurringInvoiceStatus.PAUSED) {
      throw new ConflictException('Solo se puede reanudar una recurrente pausada');
    }

    // Always recalculate from today to skip the paused period (BUG-02)
    const nextRunDate = computeNextRunDate(existing.frequency, existing.dayOfMonth, new Date());

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        status: RecurringInvoiceStatus.ACTIVE,
        nextRunDate,
      },
      include: this.defaultInclude(),
    });
  }

  /**
   * MISSING-03: Skip the next scheduled generation without pausing.
   * Advances nextRunDate by one frequency period.
   */
  async skipNext(tenantId: string, id: string) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (existing.status !== RecurringInvoiceStatus.ACTIVE) {
      throw new ConflictException('Solo se puede saltar la siguiente generación de una recurrente activa');
    }

    // Advance from current nextRunDate by one period
    const nextRunDate = computeNextRunDate(
      existing.frequency,
      existing.dayOfMonth,
      existing.nextRunDate
    );

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { nextRunDate },
      include: this.defaultInclude(),
    });
  }

  /**
   * MISSING-06: Generate an invoice immediately without waiting for the scheduler.
   */
  async generateNow(tenantId: string, id: string) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (existing.status === RecurringInvoiceStatus.CANCELLED) {
      throw new ConflictException('No se puede generar una factura de una recurrente cancelada');
    }

    const invoice = await this.generateInvoiceFromTemplate(tenantId, existing);

    // Advance nextRunDate after immediate generation
    const nextRunDate = computeNextRunDate(
      existing.frequency,
      existing.dayOfMonth,
      existing.nextRunDate
    );

    await this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        nextRunDate,
        lastRunDate: new Date(),
        generatedCount: { increment: 1 },
      },
    });

    return invoice;
  }

  async cancel(tenantId: string, id: string) {
    await this.findOneOrFail(tenantId, id);

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { status: RecurringInvoiceStatus.CANCELLED },
      include: this.defaultInclude(),
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOneOrFail(tenantId, id);

    await this.prisma.recurringInvoice.delete({ where: { id } });
  }

  // ==================== SCHEDULER LOGIC ====================

  /**
   * Returns all ACTIVE recurring invoices due for generation today (UTC).
   */
  async findDueForGeneration(): Promise<any[]> {
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    return this.prisma.recurringInvoice.findMany({
      where: {
        status: RecurringInvoiceStatus.ACTIVE,
        nextRunDate: { lte: todayUtc },
      },
    });
  }

  /**
   * Generates an invoice from a recurring template and records the log.
   * Used by both the scheduler and generateNow().
   */
  async generateInvoiceFromTemplate(tenantId: string, recurring: any) {
    const templateData = recurring.templateData as any;
    const issueDate = new Date();
    const issueDateStr = issueDate.toISOString().split('T')[0];

    let dueDateStr: string | undefined;
    if (templateData.dueDays != null && templateData.dueDays > 0) {
      const dueDate = new Date(issueDate);
      dueDate.setUTCDate(dueDate.getUTCDate() + templateData.dueDays);
      dueDateStr = dueDate.toISOString().split('T')[0];
    }

    const dto: CreateInvoiceDto = {
      customerId: recurring.customerId,
      seriesId: recurring.seriesId ?? undefined,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      discountPercent: templateData.discountPercent,
      irpfPercent: templateData.irpfPercent,
      paymentMethod: templateData.paymentMethod as PaymentMethod | undefined,
      paymentDetails: templateData.paymentDetails,
      notes: templateData.notes,
      lines: (templateData.lines as any[]).map((line: any) => {
        const lineDto: CreateInvoiceLineDto = {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          // BUG-03 fix: pass irpfRate per line
          ...(line.irpfRate != null ? { irpfRate: line.irpfRate } : {}),
          ...(line.productId ? { productId: line.productId } : {}),
          ...(line.hideQty != null ? { hideQty: line.hideQty } : {}),
        };
        return lineDto;
      }),
    };

    const invoice = await this.invoiceService.create(tenantId, dto);

    // Record the generation log
    await this.prisma.recurringInvoiceLog.create({
      data: {
        tenantId,
        recurringInvoiceId: recurring.id,
        invoiceId: invoice.id,
      },
    });

    return invoice;
  }

  /**
   * Marks a recurring invoice as completed or advances its nextRunDate.
   * Called by the scheduler after successful generation.
   */
  async advanceAfterGeneration(recurringId: string) {
    const recurring = await this.prisma.recurringInvoice.findUniqueOrThrow({
      where: { id: recurringId },
    });

    const newCount = recurring.generatedCount + 1;
    const nextRunDate = computeNextRunDate(
      recurring.frequency,
      recurring.dayOfMonth,
      recurring.nextRunDate
    );

    const isCompleted =
      (recurring.maxOccurrences != null && newCount >= recurring.maxOccurrences) ||
      (recurring.endDate != null && nextRunDate > recurring.endDate);

    await this.prisma.recurringInvoice.update({
      where: { id: recurringId },
      data: {
        generatedCount: newCount,
        lastRunDate: new Date(),
        nextRunDate: isCompleted ? recurring.nextRunDate : nextRunDate,
        status: isCompleted ? RecurringInvoiceStatus.COMPLETED : undefined,
      },
    });
  }

  // ==================== PRIVATE HELPERS ====================

  private async findOneOrFail(tenantId: string, id: string) {
    const recurring = await this.prisma.recurringInvoice.findFirst({
      where: { id, tenantId },
    });

    if (!recurring) {
      throw new NotFoundException(`Factura recurrente con id ${id} no encontrada`);
    }

    return recurring;
  }

  private async validateCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId, isActive: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado o no está activo');
    }
    return customer;
  }

  private buildTemplateData(dto: CreateRecurringInvoiceDto) {
    return {
      lines: dto.lines.map((l) => ({
        productId: l.productId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        irpfRate: l.irpfRate,
        hideQty: l.hideQty,
      })),
      discountPercent: dto.discountPercent,
      irpfPercent: dto.irpfPercent,
      paymentMethod: dto.paymentMethod,
      paymentDetails: dto.paymentDetails,
      notes: dto.notes,
      dueDays: dto.dueDays,
    };
  }

  private defaultInclude() {
    return {
      customer: { select: { id: true, name: true, nif: true } },
      series: { select: { id: true, prefix: true, code: true } },
      _count: { select: { generatedInvoices: true } },
    };
  }
}
