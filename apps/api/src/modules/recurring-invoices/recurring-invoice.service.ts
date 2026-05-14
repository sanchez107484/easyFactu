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
      },
    });
    if (!recurring) {
      throw new NotFoundException('Factura recurrente no encontrada');
    }
    return recurring;
  }

  /**
   * Resolves agency info (userName + agencyName) for a list of `createdByUserId`s
   * in a single round trip — replaces the per-row nested
   * `createdByUser → tenantUsers → tenant` JOIN previously done in `findAll`.
   */
  private async loadAgencyInfoMap(
    userIds: string[]
  ): Promise<Map<string, { userName: string; agencyName: string }>> {
    const result = new Map<string, { userName: string; agencyName: string }>();
    if (userIds.length === 0) return result;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        tenantUsers: {
          where: { isOwner: true },
          select: { tenant: { select: { businessName: true } } },
          take: 1,
        },
      },
    });

    for (const u of users) {
      const ownerTenant = u.tenantUsers[0];
      if (!ownerTenant) continue;
      result.set(u.id, {
        userName: `${u.firstName} ${u.lastName}`.trim(),
        agencyName: ownerTenant.tenant.businessName,
      });
    }

    return result;
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
      ...(line.discountPercent != null && line.discountPercent > 0
        ? { discountPercent: line.discountPercent }
        : {}),
      hideQty: line.hideQty ?? false,
      sortOrder: index,
    }));
  }

  /**
   * Computes the estimated total of a recurring invoice from its lines and tenant-level
   * discount/IRPF percentages. Persisted in `RecurringInvoice.estimatedTotal` so the listing
   * endpoint can avoid loading every `RecurringInvoiceLine` row just to render the total.
   */
  private computeEstimatedTotal(
    lines: ReadonlyArray<{
      quantity: number | string | Prisma.Decimal;
      unitPrice: number | string | Prisma.Decimal;
      taxRate: number | string | Prisma.Decimal;
    }>,
    discountPercent: number | string | Prisma.Decimal | null | undefined,
    irpfPercent: number | string | Prisma.Decimal | null | undefined
  ): number {
    const discountFactor = discountPercent ? 1 - Number(discountPercent) / 100 : 1;
    const gross = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
    const netBase = gross * discountFactor;
    const totalTax = lines.reduce((sum, l) => {
      const lineNet = Number(l.quantity) * Number(l.unitPrice) * discountFactor;
      return sum + lineNet * (Number(l.taxRate) / 100);
    }, 0);
    const totalIrpf = irpfPercent ? netBase * (Number(irpfPercent) / 100) : 0;
    return Math.round((netBase + totalTax - totalIrpf) * 100) / 100;
  }

  /**
   * Applies an id-aware diff between existing recurring invoice lines and the incoming
   * DTO: lines with matching `id` are UPDATED, lines without `id` are CREATED, and
   * existing rows whose id is missing from the input are DELETED.
   *
   * Backwards compatible: a client that re-sends every line without ids degrades to the
   * previous behaviour (delete-all + create-all).
   */
  private async applyLineDiff(
    tx: Prisma.TransactionClient,
    tenantId: string,
    recurringInvoiceId: string,
    lines: CreateRecurringInvoiceDto['lines']
  ): Promise<void> {
    const existing = await tx.recurringInvoiceLine.findMany({
      where: { recurringInvoiceId, tenantId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));

    const toUpdate: Array<{ index: number; line: CreateRecurringInvoiceDto['lines'][number] }> = [];
    const toCreateIndexes: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.id) {
        if (!existingIds.has(line.id)) {
          throw new BadRequestException('Una de las líneas no pertenece a esta factura recurrente');
        }
        toUpdate.push({ index: i, line });
      } else {
        toCreateIndexes.push(i);
      }
    }

    const keepIds = new Set(toUpdate.map((u) => u.line.id!));
    const toDeleteIds = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);

    if (toDeleteIds.length > 0) {
      await tx.recurringInvoiceLine.deleteMany({
        where: { id: { in: toDeleteIds }, recurringInvoiceId, tenantId },
      });
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(({ index, line }) =>
          tx.recurringInvoiceLine.update({
            where: { id: line.id! },
            data: {
              productId: line.productId ?? null,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate,
              irpfRate: line.irpfRate ?? null,
              discountPercent:
                line.discountPercent != null && line.discountPercent > 0
                  ? line.discountPercent
                  : null,
              hideQty: line.hideQty ?? false,
              sortOrder: index,
            },
          })
        )
      );
    }

    if (toCreateIndexes.length > 0) {
      await tx.recurringInvoiceLine.createMany({
        data: toCreateIndexes.map((index) => {
          const line = lines[index]!;
          return {
            tenantId,
            recurringInvoiceId,
            productId: line.productId ?? null,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            irpfRate: line.irpfRate ?? null,
            discountPercent:
              line.discountPercent != null && line.discountPercent > 0
                ? line.discountPercent
                : null,
            hideQty: line.hideQty ?? false,
            sortOrder: index,
          };
        }),
      });
    }
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
        },
        orderBy: [{ status: 'asc' }, { nextRunDate: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.recurringInvoice.count({ where }),
    ]);

    // Resolve agency info in a single batch query instead of a per-row nested JOIN.
    const agencyUserIds = Array.from(
      new Set(
        rawData
          .map((d) => d.createdByUserId)
          .filter((id): id is string => id !== null && id !== undefined)
      )
    );
    const agencyMap = await this.loadAgencyInfoMap(agencyUserIds);

    // estimatedTotal is denormalized on the row — no need to load lines here.
    const data = rawData.map(({ estimatedTotal, createdByUserId, ...item }) => ({
      ...item,
      estimatedTotal: Number(estimatedTotal),
      createdByAgency: createdByUserId ? (agencyMap.get(createdByUserId) ?? null) : null,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const recurring = await this.findOneOrFail(tenantId, id);
    const { createdByUserId, ...rest } = recurring;
    const agencyMap = createdByUserId
      ? await this.loadAgencyInfoMap([createdByUserId])
      : new Map<string, { userName: string; agencyName: string }>();
    return {
      ...rest,
      createdByUserId,
      createdByAgency: createdByUserId ? (agencyMap.get(createdByUserId) ?? null) : null,
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
          compensacionPercent: dto.compensacionPercent ?? null,
          estimatedTotal: this.computeEstimatedTotal(
            dto.lines,
            dto.discountPercent ?? null,
            dto.irpfPercent ?? null
          ),
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

    // Recompute denormalized estimatedTotal whenever lines or any percentage change.
    const totalsAffected =
      dto.lines !== undefined || dto.discountPercent !== undefined || dto.irpfPercent !== undefined;
    const recomputedEstimatedTotal = totalsAffected
      ? this.computeEstimatedTotal(
          dto.lines ?? existing.lines,
          dto.discountPercent !== undefined ? dto.discountPercent : existing.discountPercent,
          dto.irpfPercent !== undefined ? dto.irpfPercent : existing.irpfPercent
        )
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (dto.lines) {
        await this.applyLineDiff(tx, tenantId, id, dto.lines);
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
          ...(dto.compensacionPercent !== undefined
            ? { compensacionPercent: dto.compensacionPercent }
            : {}),
          ...(recomputedEstimatedTotal !== undefined
            ? { estimatedTotal: recomputedEstimatedTotal }
            : {}),
          ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod } : {}),
          ...(dto.paymentDetails !== undefined
            ? { paymentDetails: dto.paymentDetails ? { ...dto.paymentDetails } : Prisma.JsonNull }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
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
