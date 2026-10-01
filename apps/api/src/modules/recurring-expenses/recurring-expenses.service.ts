import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RecurringExpenseFrequency } from '@prisma/client';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { QueryRecurringExpenseDto } from './dto/query-recurring-expense.dto';
import { ExpensesCalculationService } from '../expenses/expenses-calculation.service';
import { SuppliersService } from '../suppliers/suppliers.service';

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class RecurringExpensesService {
  constructor(
    private prisma: PrismaService,
    private calculationService: ExpensesCalculationService,
    private suppliersService: SuppliersService
  ) {}

  async create(tenantId: string, userId: string, dto: CreateRecurringExpenseDto) {
    await this.validateRelations(tenantId, dto);
    this.validateDate(dto.startDate);
    if (dto.endDate) this.validateEndDate(dto.startDate, dto.endDate);
    this.validateBaseAmount(dto.baseAmount);

    const { vatAmount, totalAmount } = this.calculationService.calculate(dto.baseAmount, dto.vatRate);

    return this.prisma.recurringExpense.create({
      data: {
        tenantId,
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        supplierId: dto.supplierId ?? null,
        clientId: dto.clientId ?? null,
        baseAmount: dto.baseAmount,
        vatRate: dto.vatRate,
        vatAmount,
        totalAmount,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes?.trim() ?? null,
        createdByUserId: userId,
      },
      include: { category: true, supplier: true, client: { select: { id: true, name: true, nif: true } } },
    });
  }

  async findAll(tenantId: string, query: QueryRecurringExpenseDto) {
    const { page = 1, limit = 20, search, isActive, sortBy, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.RecurringExpenseWhereInput = { tenantId };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const SORT_FIELDS: Record<string, true> = { description: true, startDate: true, totalAmount: true, createdAt: true };
    const primarySort = SORT_FIELDS[sortBy ?? ''] ? sortBy! : 'createdAt';
    const orderBy: Prisma.RecurringExpenseOrderByWithRelationInput[] = [{ [primarySort]: sortOrder }, { createdAt: 'desc' }];

    const [data, total] = await Promise.all([
      this.prisma.recurringExpense.findMany({
        where, skip, take: limit, orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          supplier: { select: { id: true, name: true, taxId: true } },
          client: { select: { id: true, name: true, nif: true } },
        },
      }),
      this.prisma.recurringExpense.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(tenantId: string, id: string) {
    const recurring = await this.prisma.recurringExpense.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        supplier: true,
        client: { select: { id: true, name: true, nif: true } },
        generatedExpenses: { select: { id: true, date: true, totalAmount: true }, orderBy: { date: 'desc' }, take: 12 },
      },
    });
    if (!recurring) throw new NotFoundException('Gasto recurrente no encontrado');
    return recurring;
  }

  async update(tenantId: string, id: string, dto: UpdateRecurringExpenseDto) {
    const existing = await this.findOne(tenantId, id);
    await this.validateRelations(tenantId, dto);
    if (dto.startDate) this.validateDate(dto.startDate);
    if (dto.endDate) {
      this.validateDate(dto.endDate);
      const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;
      if (new Date(dto.endDate) < start) throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }
    if (dto.baseAmount !== undefined) this.validateBaseAmount(dto.baseAmount);

    const baseAmount = dto.baseAmount ?? Number(existing.baseAmount);
    const vatRate = dto.vatRate ?? Number(existing.vatRate);
    const { vatAmount, totalAmount } = this.calculationService.calculate(baseAmount, vatRate);

    const supplierInput: Prisma.RecurringExpenseUpdateInput['supplier'] =
      dto.supplierId === undefined ? undefined : dto.supplierId ? { connect: { id: dto.supplierId } } : { disconnect: true };
    const clientInput: Prisma.RecurringExpenseUpdateInput['client'] =
      dto.clientId === undefined ? undefined : dto.clientId ? { connect: { id: dto.clientId } } : { disconnect: true };

    const data: Prisma.RecurringExpenseUpdateInput = {
      description: dto.description?.trim() ?? undefined,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      supplier: supplierInput,
      client: clientInput,
      baseAmount: dto.baseAmount ?? undefined,
      vatRate: dto.vatRate ?? undefined,
      vatAmount,
      totalAmount,
      frequency: dto.frequency ?? undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
      isActive: dto.isActive ?? undefined,
      notes: dto.notes === undefined ? undefined : dto.notes.trim() || null,
    };

    return this.prisma.recurringExpense.update({
      where: { id },
      data,
      include: { category: true, supplier: true, client: { select: { id: true, name: true, nif: true } } },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.expense.updateMany({ where: { recurringExpenseId: id, tenantId }, data: { recurringExpenseId: null } });
    await this.prisma.recurringExpense.delete({ where: { id } });
    return { id, deleted: true };
  }

  async generate(tenantId: string, id: string, upToDateInput?: string) {
    const recurring = await this.findOne(tenantId, id);
    if (!recurring.isActive) throw new BadRequestException('No se pueden generar gastos de una suscripción inactiva');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upToDate = upToDateInput ? new Date(upToDateInput) : today;
    upToDate.setHours(0, 0, 0, 0);
    if (upToDate > new Date(today.getTime() + TEN_YEARS_MS)) throw new BadRequestException('La fecha límite debe estar dentro de 10 años');

    let current = recurring.lastGeneratedDate
      ? this.nextDate(new Date(recurring.lastGeneratedDate), recurring.frequency)
      : new Date(recurring.startDate);
    current.setHours(0, 0, 0, 0);

    const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
    let generatedCount = 0;
    let lastGenerated: Date | null = null;
    const baseAmount = Number(recurring.baseAmount);
    const vatRate = Number(recurring.vatRate);
    const { vatAmount, totalAmount } = this.calculationService.calculate(baseAmount, vatRate);

    while (current <= upToDate && (!endDate || current <= endDate)) {
      await this.prisma.expense.create({
        data: {
          tenantId,
          date: new Date(current),
          description: recurring.description,
          categoryId: recurring.categoryId,
          supplierId: recurring.supplierId,
          clientId: recurring.clientId,
          baseAmount,
          vatRate,
          vatAmount,
          totalAmount,
          notes: recurring.notes,
          recurringExpenseId: recurring.id,
          createdByUserId: recurring.createdByUserId,
        },
      });
      generatedCount++;
      lastGenerated = new Date(current);
      current = this.nextDate(current, recurring.frequency);
    }

    if (lastGenerated) {
      await this.prisma.recurringExpense.update({ where: { id }, data: { lastGeneratedDate: lastGenerated } });
    }

    return { generatedCount, lastGeneratedDate: lastGenerated };
  }

  private nextDate(date: Date, frequency: RecurringExpenseFrequency): Date {
    const next = new Date(date);
    switch (frequency) {
      case 'WEEKLY': next.setDate(next.getDate() + 7); break;
      case 'MONTHLY': next.setMonth(next.getMonth() + 1); break;
      case 'BIMONTHLY': next.setMonth(next.getMonth() + 2); break;
      case 'QUARTERLY': next.setMonth(next.getMonth() + 3); break;
      case 'YEARLY': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  }

  private async validateRelations(tenantId: string, dto: CreateRecurringExpenseDto | UpdateRecurringExpenseDto): Promise<void> {
    if (dto.categoryId) {
      const category = await this.prisma.expenseCategory.findUnique({ where: { id: dto.categoryId } });
      if (!category || !category.isActive) throw new BadRequestException('La categoría seleccionada no existe o no está activa');
    }
    if (dto.supplierId) {
      const belongs = await this.suppliersService.belongsToTenant(tenantId, dto.supplierId);
      if (!belongs) throw new BadRequestException('El proveedor seleccionado no existe o no pertenece a tu empresa');
    }
    if (dto.clientId) {
      const client = await this.prisma.customer.findFirst({ where: { id: dto.clientId, tenantId } });
      if (!client) throw new BadRequestException('El cliente seleccionado no existe o no pertenece a tu empresa');
    }
  }

  private validateDate(dateString: string): void {
    const date = new Date(dateString);
    const now = new Date();
    const tenYearsAgo = new Date(now.getTime() - TEN_YEARS_MS);
    const tenYearsFromNow = new Date(now.getTime() + TEN_YEARS_MS);
    if (date < tenYearsAgo || date > tenYearsFromNow) {
      throw new BadRequestException('La fecha debe estar dentro de un rango de 10 años desde hoy');
    }
  }

  private validateEndDate(startDateString: string, endDateString: string): void {
    this.validateDate(endDateString);
    if (new Date(endDateString) < new Date(startDateString)) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }
  }

  private validateBaseAmount(baseAmount: number): void {
    if (baseAmount <= 0) throw new BadRequestException('La base imponible debe ser mayor que 0');
  }
}
