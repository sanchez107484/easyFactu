import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    // Validar NIF usando el validador compartido
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { validateNif } = require('@easyfactura/shared-validators');
    const nif = dto.nif?.toUpperCase().trim();
    if (!validateNif(nif)) {
      throw new ConflictException('El NIF/DNI/NIE no es válido');
    }

    // Check if NIF already exists for this tenant (case-insensitive)
    const existing = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        nif: { equals: nif, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new ConflictException('Ya existe un cliente con este NIF/CIF en tu empresa');
    }

    // Create customer
    return this.prisma.customer.create({
      data: {
        ...dto,
        nif,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, query: QueryCustomerDto) {
    const { page = 1, limit = 20, search, type, active } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (active !== undefined) {
      where.isActive = active;
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        invoices: {
          select: {
            id: true,
            number: true,
            issueDate: true,
            total: true,
            status: true,
          },
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(tenantId, id);

    // If updating NIF, check it's not already used by another customer
    if (dto.nif && dto.nif !== customer.nif) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, nif: dto.nif, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException('Ya existe un cliente con este NIF/CIF');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Soft delete by marking as inactive
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
