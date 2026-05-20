import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, CustomerType as PrismaCustomerType } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { validateNif } from '@easyfactura/shared-validators';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
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
        type: dto.type as unknown as PrismaCustomerType,
        nif,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, query: QueryCustomerDto) {
    const { page = 1, limit = 20, search, type, active, sortBy, sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type as unknown as PrismaCustomerType;
    }

    if (active !== undefined) {
      where.isActive = active;
    }

    // Búsqueda exacta por NIF (para detección de duplicados en el frontend)
    if (query.nif) {
      where.nif = { equals: query.nif.toUpperCase().trim(), mode: 'insensitive' };
    }

    const CUSTOMER_SORT_FIELDS: Record<string, true> = {
      name: true,
      nif: true,
      city: true,
      type: true,
      createdAt: true,
    };
    const orderBy = { [CUSTOMER_SORT_FIELDS[sortBy ?? ''] ? sortBy! : 'name']: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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

    const data: Prisma.CustomerUpdateInput = {
      ...dto,
      type: dto.type as unknown as PrismaCustomerType,
      legalName: dto.legalName !== undefined ? dto.legalName.trim() || null : undefined,
    };

    return this.prisma.customer.update({
      where: { id },
      data,
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

  async restore(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.customer.update({
      where: { id },
      data: { isActive: true },
    });
  }

  // ─── Agency shared pool ─────────────────────────────────────────────────────

  /**
   * Returns customers from sibling tenants that share the same managing agency.
   * Only works if the calling tenant is an active client of an agency.
   * Returns an empty array (not an error) if no agency relation exists.
   */
  async findAgencySharedPool(tenantId: string, search?: string) {
    const relation = await this.prisma.agencyClientRelation.findFirst({
      where: { clientTenantId: tenantId },
      select: {
        agencyTenantId: true,
        agencyTenant: { select: { businessName: true } },
      },
    });

    if (!relation) return [];

    const siblings = await this.prisma.agencyClientRelation.findMany({
      where: {
        agencyTenantId: relation.agencyTenantId,
        clientTenantId: { not: tenantId },
      },
      select: {
        clientTenantId: true,
        clientTenant: { select: { businessName: true } },
      },
    });

    // Include the agency's own customer directory + all sibling client tenants
    const allSourceIds = [relation.agencyTenantId, ...siblings.map((s) => s.clientTenantId)];

    const tenantNameMap = new Map<string, string>([
      [relation.agencyTenantId, relation.agencyTenant.businessName],
      ...siblings.map((s): [string, string] => [s.clientTenantId, s.clientTenant.businessName]),
    ]);

    const where: Prisma.CustomerWhereInput = {
      tenantId: { in: allSourceIds },
      isActive: true,
    };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nif: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      // Fetch all matching records; deduplication by NIF happens below.
      // Do NOT apply take here — we need the full set to pick the most-recent per NIF.
      orderBy: { updatedAt: 'desc' },
    });

    // Deduplicate by NIF: keep only the most recently updated record per NIF.
    // A customer can appear in multiple tenants (agency + sibling clients).
    // The first record wins because we ordered by updatedAt DESC.
    const seenNifs = new Map<string, (typeof customers)[0]>();
    for (const customer of customers) {
      const normalizedNif = customer.nif.toUpperCase();
      if (!seenNifs.has(normalizedNif)) {
        seenNifs.set(normalizedNif, customer);
      }
    }

    return Array.from(seenNifs.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .slice(0, 50)
      .map((c) => ({
        ...c,
        sourceTenantId: c.tenantId,
        sourceTenantName: tenantNameMap.get(c.tenantId) ?? '',
      }));
  }

  /**
   * Copies a customer from any sibling tenant (same agency) into the current tenant.
   * If a customer with the same NIF already exists in the current tenant, returns it.
   * The source is identified by NIF — safe canonical identifier across tenants.
   */
  async importFromAgencyPool(tenantId: string, nif: string) {
    const relation = await this.prisma.agencyClientRelation.findFirst({
      where: { clientTenantId: tenantId },
      select: { agencyTenantId: true },
    });

    if (!relation) {
      throw new ForbiddenException('Este tenant no pertenece a ninguna asesoría');
    }

    const normalizedNif = nif.toUpperCase().trim();

    // Return existing customer if already present in this tenant (active or inactive)
    // Checking regardless of isActive to avoid the unique constraint on (tenant_id, nif)
    const existing = await this.prisma.customer.findFirst({
      where: { tenantId, nif: { equals: normalizedNif, mode: 'insensitive' } },
    });
    if (existing) {
      // Reactivate if it was soft-deleted
      if (!existing.isActive) {
        return this.prisma.customer.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      return existing;
    }

    const siblings = await this.prisma.agencyClientRelation.findMany({
      where: {
        agencyTenantId: relation.agencyTenantId,
        clientTenantId: { not: tenantId },
      },
      select: { clientTenantId: true },
    });

    // Include the agency's own customers in the import source pool
    const allSourceIds = [relation.agencyTenantId, ...siblings.map((s) => s.clientTenantId)];

    const source = await this.prisma.customer.findFirst({
      where: {
        tenantId: { in: allSourceIds },
        nif: { equals: normalizedNif, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (!source) {
      throw new NotFoundException(
        `No se encontró ningún cliente con NIF ${normalizedNif} en el directorio`
      );
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        type: source.type,
        name: source.name,
        legalName: source.legalName,
        nif: source.nif,
        email: source.email,
        phone: source.phone,
        address: source.address,
        postalCode: source.postalCode,
        city: source.city,
        province: source.province,
        country: source.country,
        notes: source.notes,
        isActive: true,
      },
    });
  }
}
