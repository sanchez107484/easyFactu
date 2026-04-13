import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurringFrequency, RecurringStatus, Prisma } from '@prisma/client';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { InvoiceNumberService } from '../invoices/invoice-number.service';

// ==================== DATE HELPERS ====================

/**
 * Returns the frequency step in months.
 */
export function frequencyToMonths(frequency: RecurringFrequency): number {
  switch (frequency) {
    case RecurringFrequency.MONTHLY:
      return 1;
    case RecurringFrequency.BIMONTHLY:
      return 2;
    case RecurringFrequency.QUARTERLY:
      return 3;
    case RecurringFrequency.SEMIANNUAL:
      return 6;
    case RecurringFrequency.ANNUAL:
      return 12;
  }
}

/**
 * Computes the next run date given a base UTC date, frequency and dayOfMonth.
 *
 * Algorithm:
 *   1. Start with a candidate = (baseDate year/month) at dayOfMonth, clamped to month end.
 *   2. If candidate <= baseDate, advance by one frequency period.
 *   3. Return the resulting UTC Date.
 *
 * All arithmetic is done in UTC to avoid timezone discrepancies (BUG-05 backend side).
 */
export function computeNextRunDate(
  baseDate: Date,
  frequency: RecurringFrequency,
  dayOfMonth: number
): Date {
  const months = frequencyToMonths(frequency);

  // Work in UTC
  let year = baseDate.getUTCFullYear();
  let month = baseDate.getUTCMonth(); // 0-based

  // Build candidate for the current month
  const candidate = buildUtcDate(year, month, dayOfMonth);

  // If candidate is in the future relative to baseDate, use it
  if (candidate > baseDate) {
    return candidate;
  }

  // Otherwise advance by one period
  month += months;
  year += Math.floor(month / 12);
  month = month % 12;

  return buildUtcDate(year, month, dayOfMonth);
}

/**
 * Builds a UTC Date for the given year/month/dayOfMonth,
 * clamping dayOfMonth to the last day of the month if needed.
 */
function buildUtcDate(year: number, month: number, dayOfMonth: number): Date {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(dayOfMonth, daysInMonth);
  return new Date(Date.UTC(year, month, clampedDay));
}

// ==================== SERVICE ====================

@Injectable()
export class RecurringInvoiceService {
  constructor(
    private prisma: PrismaService,
    private invoiceNumberService: InvoiceNumberService
  ) {}

  // ==================== PRIVATE HELPERS ====================

  private async findOneOrFail(tenantId: string, id: string) {
    const recurring = await this.prisma.recurringInvoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
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

  // ==================== CRUD ====================

  async create(tenantId: string, dto: CreateRecurringInvoiceDto) {
    await this.validateCustomer(tenantId, dto.customerId);

    if (dto.seriesId) {
      await this.invoiceNumberService.validateSeries(tenantId, dto.seriesId);
    }

    const startDate = new Date(dto.startDate);
    const nextRunDate = computeNextRunDate(startDate, dto.frequency, dto.dayOfMonth);

    return this.prisma.recurringInvoice.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        seriesId: dto.seriesId ?? null,
        name: dto.name,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        maxOccurrences: dto.maxOccurrences ?? null,
        status: RecurringStatus.ACTIVE,
        nextRunDate,
        lines: dto.lines as unknown as Prisma.JsonArray,
        discountPercent: dto.discountPercent ?? null,
        irpfPercent: dto.irpfPercent ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        paymentDetails: dto.paymentDetails ? (dto.paymentDetails as Prisma.JsonObject) : Prisma.DbNull,
        notes: dto.notes ?? null,
        dueDays: dto.dueDays ?? null,
      },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
    });
  }

  async findAll(tenantId: string, query: QueryRecurringInvoiceDto) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RecurringInvoiceWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
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
          series: { select: { id: true, code: true, prefix: true } },
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
    return this.findOneOrFail(tenantId, id);
  }

  async findGeneratedInvoices(tenantId: string, id: string, page = 1, limit = 20) {
    await this.findOneOrFail(tenantId, id);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.recurringInvoiceLog.findMany({
        where: { recurringInvoiceId: id, tenantId },
        skip,
        take: limit,
        orderBy: { runDate: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              issueDate: true,
              total: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.recurringInvoiceLog.count({
        where: { recurringInvoiceId: id, tenantId },
      }),
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

  /**
   * Updates the recurring invoice template.
   *
   * BUG-01 FIX: Recalculates nextRunDate when dayOfMonth or frequency changes,
   * so the scheduler immediately uses the correct next date.
   */
  async update(tenantId: string, id: string, dto: UpdateRecurringInvoiceDto) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (
      existing.status === RecurringStatus.COMPLETED ||
      existing.status === RecurringStatus.CANCELLED
    ) {
      throw new ConflictException(
        'No se puede editar una factura recurrente completada o cancelada'
      );
    }

    if (dto.customerId) {
      await this.validateCustomer(tenantId, dto.customerId);
    }

    if (dto.seriesId) {
      await this.invoiceNumberService.validateSeries(tenantId, dto.seriesId);
    }

    // BUG-01: Recalculate nextRunDate if dayOfMonth or frequency changed
    const newFrequency = dto.frequency ?? existing.frequency;
    const newDayOfMonth = dto.dayOfMonth ?? existing.dayOfMonth;
    const scheduleChanged =
      (dto.frequency !== undefined && dto.frequency !== existing.frequency) ||
      (dto.dayOfMonth !== undefined && dto.dayOfMonth !== existing.dayOfMonth);

    let nextRunDate: Date | undefined;

    if (dto.nextRunDate) {
      // Manual override takes precedence (MISSING-02)
      nextRunDate = new Date(dto.nextRunDate);
    } else if (scheduleChanged) {
      // Recalculate from today UTC when schedule params change
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      nextRunDate = computeNextRunDate(today, newFrequency, newDayOfMonth);
    }

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        name: dto.name,
        customerId: dto.customerId,
        seriesId: dto.seriesId,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
        maxOccurrences: dto.maxOccurrences,
        lines: dto.lines ? (dto.lines as unknown as Prisma.JsonArray) : undefined,
        discountPercent: dto.discountPercent,
        irpfPercent: dto.irpfPercent,
        paymentMethod: dto.paymentMethod,
        paymentDetails:
          dto.paymentDetails !== undefined
            ? dto.paymentDetails
              ? (dto.paymentDetails as Prisma.JsonObject)
              : Prisma.DbNull
            : undefined,
        notes: dto.notes,
        dueDays: dto.dueDays,
        ...(nextRunDate !== undefined && { nextRunDate }),
      },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
    });
  }

  async pause(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);

    if (recurring.status !== RecurringStatus.ACTIVE) {
      throw new ConflictException('Solo se puede pausar una factura recurrente activa');
    }

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        status: RecurringStatus.PAUSED,
        pausedAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
    });
  }

  /**
   * Resumes a paused recurring invoice.
   *
   * BUG-02 FIX: Recalculates nextRunDate from today (not from pausedAt),
   * so the scheduler does NOT retroactively generate all missed invoices
   * from the pause period.
   */
  async resume(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);

    if (recurring.status !== RecurringStatus.PAUSED) {
      throw new ConflictException('Solo se puede reanudar una factura recurrente pausada');
    }

    // BUG-02: Recalculate from today, ignoring the pause period
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const nextRunDate = computeNextRunDate(today, recurring.frequency, recurring.dayOfMonth);

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        status: RecurringStatus.ACTIVE,
        pausedAt: null,
        nextRunDate,
      },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
    });
  }

  async cancel(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);

    if (
      recurring.status === RecurringStatus.COMPLETED ||
      recurring.status === RecurringStatus.CANCELLED
    ) {
      throw new ConflictException('La factura recurrente ya está finalizada');
    }

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        status: RecurringStatus.CANCELLED,
        nextRunDate: null,
      },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
    });
  }

  /**
   * MISSING-03: Skip the next generation without pausing everything.
   * Advances nextRunDate by one frequency period.
   */
  async skipNext(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);

    if (recurring.status !== RecurringStatus.ACTIVE) {
      throw new ConflictException(
        'Solo se puede saltar la siguiente generación de una factura recurrente activa'
      );
    }

    if (!recurring.nextRunDate) {
      throw new BadRequestException('No hay próxima fecha de generación programada');
    }

    // Advance by one full frequency period from the current nextRunDate
    const newNextRunDate = computeNextRunDate(
      recurring.nextRunDate,
      recurring.frequency,
      recurring.dayOfMonth
    );

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { nextRunDate: newNextRunDate },
      include: {
        customer: { select: { id: true, name: true, nif: true } },
        series: { select: { id: true, code: true, prefix: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOneOrFail(tenantId, id);

    await this.prisma.recurringInvoice.delete({ where: { id } });
  }
}
