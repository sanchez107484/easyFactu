import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { isValidNif } from '@easyfactura/shared-validators';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSupplierDto) {
    this.validateTaxId(dto);

    const data: Prisma.SupplierCreateInput = {
      ...dto,
      country: dto.country ?? 'ES',
      tenant: { connect: { id: tenantId } },
    };

    return this.prisma.supplier.create({ data });
  }

  async findAll(tenantId: string, query: QuerySupplierDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = { tenantId };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { legalName: { contains: q, mode: 'insensitive' } },
        { taxId: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const SUPPLIER_SORT_FIELDS: Record<string, true> = {
      name: true,
      taxId: true,
      createdAt: true,
    };
    const orderBy = { [SUPPLIER_SORT_FIELDS[sortBy ?? ''] ? sortBy! : 'name']: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.supplier.count({ where }),
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
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(tenantId, id);
    this.validateTaxId(dto);

    const data: Prisma.SupplierUpdateInput = { ...dto };

    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  /**
   * Verifies that a supplier belongs to the tenant. Used by expense service
   * to prevent IDOR when associating suppliers to expenses.
   */
  async belongsToTenant(tenantId: string, id: string): Promise<boolean> {
    const count = await this.prisma.supplier.count({
      where: { id, tenantId },
    });
    return count > 0;
  }

  private validateTaxId(dto: CreateSupplierDto | UpdateSupplierDto): void {
    const country = dto.country ?? 'ES';
    const taxId = dto.taxId?.trim();

    if (country === 'ES' && taxId && !isValidNif(taxId)) {
      throw new BadRequestException('El NIF/CIF/NIE no es válido');
    }
  }
}
