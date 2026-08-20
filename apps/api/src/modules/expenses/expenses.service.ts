import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { ExpensesCalculationService } from './expenses-calculation.service';
import { SuppliersService } from '../suppliers/suppliers.service';

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private calculationService: ExpensesCalculationService,
    private suppliersService: SuppliersService
  ) {}

  async create(tenantId: string, userId: string, dto: CreateExpenseDto) {
    await this.validateRelations(tenantId, dto);
    this.validateDate(dto.date);

    const { vatAmount, totalAmount } = this.calculationService.calculate(
      dto.baseAmount,
      dto.vatRate
    );

    return this.prisma.expense.create({
      data: {
        tenantId,
        date: new Date(dto.date),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        supplierId: dto.supplierId ?? null,
        clientId: dto.clientId ?? null,
        baseAmount: dto.baseAmount,
        vatRate: dto.vatRate,
        vatAmount,
        totalAmount,
        notes: dto.notes?.trim() ?? null,
        attachmentId: dto.attachmentId ?? null,
        createdByUserId: userId,
      },
      include: {
        category: true,
        supplier: true,
        client: { select: { id: true, name: true, nif: true } },
        attachment: true,
      },
    });
  }

  async findAll(tenantId: string, query: QueryExpenseDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      supplierId,
      clientId,
      fromDate,
      toDate,
      sortBy,
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = { tenantId };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }

    const EXPENSE_SORT_FIELDS: Record<string, true> = {
      date: true,
      description: true,
      totalAmount: true,
      createdAt: true,
    };

    // Stable ordering: primary field + createdAt desc as tie-breaker.
    const primarySort = EXPENSE_SORT_FIELDS[sortBy ?? ''] ? sortBy! : 'date';
    const orderBy: Prisma.ExpenseOrderByWithRelationInput[] = [
      { [primarySort]: sortOrder },
      { createdAt: 'desc' },
    ];

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          supplier: { select: { id: true, name: true, taxId: true } },
          client: { select: { id: true, name: true, nif: true } },
          attachment: { select: { id: true, fileName: true, mimeType: true, size: true } },
        },
      }),
      this.prisma.expense.count({ where }),
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
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        supplier: true,
        client: { select: { id: true, name: true, nif: true } },
        attachment: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async update(tenantId: string, id: string, dto: UpdateExpenseDto) {
    const existing = await this.findOne(tenantId, id);

    await this.validateRelations(tenantId, dto);

    if (dto.date) {
      this.validateDate(dto.date);
    }

    const baseAmount = dto.baseAmount ?? existing.baseAmount;
    const vatRate = dto.vatRate ?? existing.vatRate;
    const { vatAmount, totalAmount } = this.calculationService.calculate(
      Number(baseAmount),
      Number(vatRate)
    );

    const data: Prisma.ExpenseUpdateInput = {
      date: dto.date ? new Date(dto.date) : undefined,
      description: dto.description?.trim() ?? undefined,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      supplier:
        dto.supplierId === undefined
          ? undefined
          : dto.supplierId
            ? { connect: { id: dto.supplierId } }
            : { disconnect: true },
      client:
        dto.clientId === undefined
          ? undefined
          : dto.clientId
            ? { connect: { id: dto.clientId } }
            : { disconnect: true },
      baseAmount: dto.baseAmount ?? undefined,
      vatRate: dto.vatRate ?? undefined,
      vatAmount,
      totalAmount,
      notes: dto.notes === undefined ? undefined : dto.notes.trim() || null,
      attachment:
        dto.attachmentId === undefined
          ? undefined
          : dto.attachmentId
            ? { connect: { id: dto.attachmentId } }
            : { disconnect: true },
    };

    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        category: true,
        supplier: true,
        client: { select: { id: true, name: true, nif: true } },
        attachment: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthResult, yearResult] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          tenantId,
          date: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          tenantId,
          date: { gte: startOfYear },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      monthTotal: monthResult._sum.totalAmount ?? 0,
      yearTotal: yearResult._sum.totalAmount ?? 0,
    };
  }

  private async validateRelations(tenantId: string, dto: CreateExpenseDto | UpdateExpenseDto): Promise<void> {
    if (dto.categoryId) {
      const category = await this.prisma.expenseCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || !category.isActive) {
        throw new BadRequestException('La categoría seleccionada no existe o no está activa');
      }
    }

    if (dto.supplierId) {
      const belongs = await this.suppliersService.belongsToTenant(tenantId, dto.supplierId);
      if (!belongs) {
        throw new BadRequestException('El proveedor seleccionado no existe o no pertenece a tu empresa');
      }
    }

    if (dto.clientId) {
      const client = await this.prisma.customer.findFirst({
        where: { id: dto.clientId, tenantId },
      });
      if (!client) {
        throw new BadRequestException('El cliente seleccionado no existe o no pertenece a tu empresa');
      }
    }

    if (dto.attachmentId) {
      const attachment = await this.prisma.expenseAttachment.findFirst({
        where: { id: dto.attachmentId, tenantId },
      });
      if (!attachment) {
        throw new BadRequestException('El adjunto seleccionado no existe o no pertenece a tu empresa');
      }
    }
  }

  private validateDate(dateString: string): void {
    const date = new Date(dateString);
    const now = new Date();
    const tenYearsAgo = new Date(now.getTime() - TEN_YEARS_MS);
    const tenYearsFromNow = new Date(now.getTime() + TEN_YEARS_MS);

    if (date < tenYearsAgo || date > tenYearsFromNow) {
      throw new BadRequestException(
        'La fecha debe estar dentro de un rango de 10 años desde hoy'
      );
    }
  }
}
