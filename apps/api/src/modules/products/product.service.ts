import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProductDto) {
    // Check if reference already exists for this tenant
    if (dto.reference) {
      const existing = await this.prisma.product.findFirst({
        where: { tenantId, reference: dto.reference },
      });

      if (existing) {
        throw new ConflictException('Ya existe un producto con este código');
      }
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, query: QueryProductDto) {
    const { page = 1, limit = 20, search, active } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== undefined) {
      where.isActive = active;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const product = await this.findOne(tenantId, id);

    // If updating reference, check it's not already used by another product
    if (dto.reference && dto.reference !== product.reference) {
      const existing = await this.prisma.product.findFirst({
        where: { tenantId, reference: dto.reference, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException('Ya existe un producto con este código');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Soft delete by marking as inactive
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
