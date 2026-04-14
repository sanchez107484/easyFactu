import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurringStatus, Frequency } from '@easyfactura/shared-types';
import { getNextRunDate } from '@easyfactura/shared-constants';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { Prisma, RecurringStatus as PrismaRecurringStatus } from '@prisma/client';

@Injectable()
export class RecurringInvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== PRIVATE HELPERS ====================

  private async findOneOrFail(tenantId: string, id: string) {
    const recurring = await this.prisma.recurringInvoice.findFirst({
      where: { id, tenantId },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
        _count: { select: { generatedInvoices: true } },
      },
    });
    if (!recurring) {
      throw new NotFoundException('Factura recurrente no encontrada');
    }
    return recurring;
  }

  private calculateInitialNextRunDate(
    startDate: string,
    dayOfMonth: number,
    frequency: Frequency
  ): Date {
    // Parse date parts directly to avoid UTC vs local timezone ambiguity.
    // "2026-04-03" must always mean UTC April 3, never "March 31 22:00 UTC" in UTC+2.
    const parts = startDate.split('-').map(Number);
    const y = parts[0] ?? 2000;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    const startMs = Date.UTC(y, m - 1, d);

    const todayUTC = new Date();
    const todayMs = Date.UTC(
      todayUTC.getUTCFullYear(),
      todayUTC.getUTCMonth(),
      todayUTC.getUTCDate()
    );

    // Use the later of startDate and today as the base reference
    const baseMs = Math.max(startMs, todayMs);
    const base = new Date(baseMs);
    const baseYear = base.getUTCFullYear();
    const baseMonth = base.getUTCMonth(); // 0-indexed

    // Try to schedule on dayOfMonth within the base month
    const lastDayBase = new Date(Date.UTC(baseYear, baseMonth + 1, 0)).getUTCDate();
    const candidateMs = Date.UTC(baseYear, baseMonth, Math.min(dayOfMonth, lastDayBase));

    // If that day has already passed today, advance by one frequency period
    if (candidateMs < todayMs) {
      return getNextRunDate(new Date(todayMs), frequency, dayOfMonth);
    }

    return new Date(candidateMs);
  }

  private buildLinesCreateData(
    tenantId: string,
    lines: CreateRecurringInvoiceDto['lines']
  ): Prisma.RecurringInvoiceLineCreateManyRecurringInvoiceInput[] {
    return lines.map((line, index) => ({
      tenantId,
      ...(line.productId ? { productId: line.productId } : {}),
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      irpfRate: line.irpfRate ?? null,
      hideQty: line.hideQty ?? false,
      sortOrder: index,
    }));
  }

  // ==================== CRUD ====================

  async findAll(tenantId: string, query: QueryRecurringInvoiceDto) {
    const { page = 1, limit = 20, status, customerId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RecurringInvoiceWhereInput = {
      tenantId,
      ...(status ? { status: status as PrismaRecurringStatus } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            customer: {
              name: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.recurringInvoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, code: true, prefix: true } },
          lines: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { generatedInvoices: true } },
        },
        orderBy: [{ status: 'asc' }, { nextRunDate: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.recurringInvoice.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.findOneOrFail(tenantId, id);
  }

  async create(tenantId: string, dto: CreateRecurringInvoiceDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId, isActive: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado o no está activo');
    }

    if (dto.seriesId) {
      const series = await this.prisma.invoiceSeries.findFirst({
        where: { id: dto.seriesId, tenantId },
      });
      if (!series) {
        throw new NotFoundException('Serie no encontrada');
      }
    }

    const dayOfMonth = dto.dayOfMonth ?? 1;
    const nextRunDate = this.calculateInitialNextRunDate(dto.startDate, dayOfMonth, dto.frequency);

    return this.prisma.$transaction(async (tx) => {
      const recurring = await tx.recurringInvoice.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          seriesId: dto.seriesId ?? null,
          frequency: dto.frequency,
          dayOfMonth,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          nextRunDate,
          autoConfirm: dto.autoConfirm ?? false,
          status: PrismaRecurringStatus.ACTIVE,
          discountPercent: dto.discountPercent ?? null,
          irpfPercent: dto.irpfPercent ?? null,
          paymentMethod: dto.paymentMethod ?? null,
          paymentDetails: dto.paymentDetails ? { ...dto.paymentDetails } : Prisma.JsonNull,
          notes: dto.notes ?? null,
          lines: {
            createMany: {
              data: this.buildLinesCreateData(tenantId, dto.lines),
            },
          },
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
        },
      });

      // If converted from an existing invoice, link it so the invoice page shows the connection
      if (dto.sourceInvoiceId) {
        await tx.invoice.update({
          where: { id: dto.sourceInvoiceId, tenantId },
          data: { recurringInvoiceId: recurring.id },
        });
      }

      return recurring;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateRecurringInvoiceDto) {
    const existing = await this.findOneOrFail(tenantId, id);

    if (existing.status === PrismaRecurringStatus.COMPLETED) {
      throw new ConflictException('No se puede modificar una factura recurrente completada');
    }

    // BUG-01: Recalculate nextRunDate when scheduling params (frequency or dayOfMonth) change
    // to avoid generating invoices on the wrong date after an update.
    const newFrequency = (dto.frequency ?? existing.frequency) as Frequency;
    const newDayOfMonth = dto.dayOfMonth ?? existing.dayOfMonth;
    const schedulingParamsChanged =
      (dto.frequency !== undefined && dto.frequency !== existing.frequency) ||
      (dto.dayOfMonth !== undefined && dto.dayOfMonth !== existing.dayOfMonth);
    const recalculatedNextRunDate = schedulingParamsChanged
      ? this.calculateInitialNextRunDate(
          new Date().toISOString().split('T')[0]!,
          newDayOfMonth,
          newFrequency
        )
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (dto.lines) {
        await tx.recurringInvoiceLine.deleteMany({
          where: { recurringInvoiceId: id },
        });
      }

      return tx.recurringInvoice.update({
        where: { id },
        data: {
          ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
          ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
          ...(recalculatedNextRunDate ? { nextRunDate: recalculatedNextRunDate } : {}),
          ...(dto.endDate !== undefined
            ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
            : {}),
          ...(dto.autoConfirm !== undefined ? { autoConfirm: dto.autoConfirm } : {}),
          ...(dto.discountPercent !== undefined ? { discountPercent: dto.discountPercent } : {}),
          ...(dto.irpfPercent !== undefined ? { irpfPercent: dto.irpfPercent } : {}),
          ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod } : {}),
          ...(dto.paymentDetails !== undefined
            ? { paymentDetails: dto.paymentDetails ? { ...dto.paymentDetails } : Prisma.JsonNull }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.lines
            ? {
                lines: {
                  createMany: {
                    data: this.buildLinesCreateData(tenantId, dto.lines),
                  },
                },
              }
            : {}),
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
        },
      });
    });
  }

  async pause(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);
    if (recurring.status !== PrismaRecurringStatus.ACTIVE) {
      throw new ConflictException('Solo se pueden pausar facturas recurrentes activas');
    }
    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { status: PrismaRecurringStatus.PAUSED },
    });
  }

  async resume(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);
    if (recurring.status !== PrismaRecurringStatus.PAUSED) {
      throw new ConflictException('Solo se pueden reactivar facturas recurrentes pausadas');
    }
    // BUG-02: Recalculate nextRunDate from today when resuming to avoid scheduling
    // past dates (e.g. if the recurring invoice was paused for several periods).
    const today = new Date().toISOString().split('T')[0]!;
    const nextRunDate = this.calculateInitialNextRunDate(
      today,
      recurring.dayOfMonth,
      recurring.frequency as Frequency
    );
    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { status: PrismaRecurringStatus.ACTIVE, nextRunDate },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOneOrFail(tenantId, id);
    await this.prisma.recurringInvoice.delete({ where: { id } });
  }

  // ==================== SCHEDULER SUPPORT ====================

  /**
   * Returns all active recurring invoices due today or earlier.
   * Called exclusively by the scheduler service.
   */
  async findDueRecurringInvoices() {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    return this.prisma.recurringInvoice.findMany({
      where: {
        status: PrismaRecurringStatus.ACTIVE,
        nextRunDate: { lte: today },
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        series: true,
      },
    });
  }

  /**
   * Advances the nextRunDate after a successful generation.
   * If the new date exceeds endDate, marks the recurring invoice as COMPLETED.
   */
  async advanceNextRunDate(
    id: string,
    frequency: Frequency,
    dayOfMonth: number,
    endDate: Date | null
  ) {
    const current = await this.prisma.recurringInvoice.findUniqueOrThrow({ where: { id } });
    const nextDate = getNextRunDate(current.nextRunDate, frequency, dayOfMonth);

    const isCompleted = endDate !== null && nextDate > endDate;

    await this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        nextRunDate: nextDate,
        status: isCompleted ? PrismaRecurringStatus.COMPLETED : PrismaRecurringStatus.ACTIVE,
      },
    });
  }
}
