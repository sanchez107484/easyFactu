import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurringStatus, Frequency } from '@easyfactura/shared-types';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { Prisma, RecurringStatus as PrismaRecurringStatus } from '@prisma/client';

@Injectable()
export class RecurringInvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== DATE HELPERS ====================

  /**
   * Converts a Frequency to its equivalent number of months.
   */
  private static frequencyToMonths(frequency: Frequency): number {
    switch (frequency) {
      case Frequency.MONTHLY:
        return 1;
      case Frequency.QUARTERLY:
        return 3;
      case Frequency.SEMIANNUAL:
        return 6;
      case Frequency.ANNUAL:
        return 12;
    }
  }

  /**
   * Builds a UTC Date for year/month (0-based)/dayOfMonth,
   * clamping dayOfMonth to the last real day of the month.
   * All arithmetic in UTC to avoid DST issues (BUG-05).
   */
  private static buildUtcDate(year: number, month: number, dayOfMonth: number): Date {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const clampedDay = Math.min(dayOfMonth, daysInMonth);
    return new Date(Date.UTC(year, month, clampedDay));
  }

  /**
   * Computes the next UTC date on which a recurring invoice should run.
   *
   * Algorithm:
   *   1. Build candidate = baseDate year/month at dayOfMonth (clamped to month end).
   *   2. If candidate is strictly after baseDate, use it.
   *   3. Otherwise advance by one frequency period and return.
   *
   * All arithmetic is done in UTC to avoid timezone/DST discrepancies.
   */
  static computeNextRunDate(baseDate: Date, frequency: Frequency, dayOfMonth: number): Date {
    const months = RecurringInvoiceService.frequencyToMonths(frequency);
    let year = baseDate.getUTCFullYear();
    let month = baseDate.getUTCMonth(); // 0-based

    const candidate = RecurringInvoiceService.buildUtcDate(year, month, dayOfMonth);

    if (candidate > baseDate) {
      return candidate;
    }

    // Advance by one period
    month += months;
    year += Math.floor(month / 12);
    month = month % 12;

    return RecurringInvoiceService.buildUtcDate(year, month, dayOfMonth);
  }

  // ==================== PRIVATE HELPERS ====================

  private async findOneOrFail(tenantId: string, id: string) {
    const recurring = await this.prisma.recurringInvoice.findFirst({
      where: { id, tenantId },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
        _count: { select: { generatedInvoices: true } },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tenantUsers: {
              where: { isOwner: true },
              select: {
                tenant: { select: { businessName: true } },
              },
            },
          },
        },
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
    const startDate_ = new Date(Date.UTC(y, m - 1, d));

    const todayUTC = new Date();
    const today = new Date(
      Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate())
    );

    // Use the later of startDate and today as base reference
    const base = startDate_ > today ? startDate_ : today;

    return RecurringInvoiceService.computeNextRunDate(base, frequency, dayOfMonth);
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

  private buildAgencyInfo(
    createdByUser: {
      firstName: string;
      lastName: string;
      tenantUsers: Array<{ tenant: { businessName: string } }>;
    } | null
  ): { userName: string; agencyName: string } | null {
    if (!createdByUser) return null;

    const agencyTenant = createdByUser.tenantUsers[0];
    if (!agencyTenant) return null;

    return {
      userName: `${createdByUser.firstName} ${createdByUser.lastName}`.trim(),
      agencyName: agencyTenant.tenant.businessName,
    };
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

    const [rawData, total] = await Promise.all([
      this.prisma.recurringInvoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, code: true, prefix: true } },
          _count: { select: { generatedInvoices: true } },
          lines: { select: { quantity: true, unitPrice: true, taxRate: true } },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              tenantUsers: {
                where: { isOwner: true },
                select: {
                  tenant: { select: { businessName: true } },
                },
              },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { nextRunDate: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.recurringInvoice.count({ where }),
    ]);

    // Compute estimated total server-side so the list endpoint does not ship full line objects.
    const data = rawData.map(({ lines, discountPercent, irpfPercent, createdByUser, ...item }) => {
      const gross = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
      const discountFactor = discountPercent ? 1 - Number(discountPercent) / 100 : 1;
      const netBase = gross * discountFactor;
      const totalTax = lines.reduce((sum, l) => {
        const lineNet = Number(l.quantity) * Number(l.unitPrice) * discountFactor;
        return sum + lineNet * (Number(l.taxRate) / 100);
      }, 0);
      const totalIrpf = irpfPercent ? netBase * (Number(irpfPercent) / 100) : 0;
      const estimatedTotal = Math.round((netBase + totalTax - totalIrpf) * 100) / 100;

      return {
        ...item,
        discountPercent,
        irpfPercent,
        estimatedTotal,
        createdByAgency: this.buildAgencyInfo(createdByUser ?? null),
      };
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const { createdByUser, ...recurring } = await this.findOneOrFail(tenantId, id);
    return {
      ...recurring,
      createdByAgency: this.buildAgencyInfo(createdByUser ?? null),
    };
  }

  async create(tenantId: string, createdByUserId: string, dto: CreateRecurringInvoiceDto) {
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
      // Only store createdByUserId when the creator is NOT the tenant owner.
      const isOwner = await tx.tenantUser.findFirst({
        where: { userId: createdByUserId, tenantId, isOwner: true },
        select: { id: true },
      });
      const resolvedCreatedByUserId = isOwner ? null : createdByUserId;

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
          createdByUserId: resolvedCreatedByUserId,
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
      ? RecurringInvoiceService.computeNextRunDate(new Date(), newFrequency, newDayOfMonth)
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
    const today = new Date();
    const nextRunDate = RecurringInvoiceService.computeNextRunDate(
      today,
      recurring.frequency as Frequency,
      recurring.dayOfMonth
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

  // ==================== GENERATED INVOICES ====================

  async findGeneratedInvoices(tenantId: string, recurringInvoiceId: string) {
    const exists = await this.prisma.recurringInvoice.findFirst({
      where: { id: recurringInvoiceId, tenantId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Factura recurrente no encontrada');
    }

    return this.prisma.invoice.findMany({
      where: { tenantId, recurringInvoiceId },
      select: { id: true, number: true, issueDate: true, status: true, total: true },
      orderBy: { issueDate: 'desc' },
      take: 50,
    });
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
    const nextDate = RecurringInvoiceService.computeNextRunDate(
      current.nextRunDate,
      frequency,
      dayOfMonth
    );

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
