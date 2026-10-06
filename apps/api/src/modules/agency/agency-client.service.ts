import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyClientService {
  constructor(private prisma: PrismaService) {}

  // ─── Clients list ─────────────────────────────────────────────────────

  async findAllClients(
    agencyTenantId: string,
    query: { page?: number; limit?: number; search?: string }
  ) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AgencyClientRelationWhereInput = {
      agencyTenantId,
      ...(search
        ? {
            clientTenant: {
              OR: [
                { businessName: { contains: search, mode: 'insensitive' } },
                { nif: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [relations, total] = await Promise.all([
      this.prisma.agencyClientRelation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          clientTenant: {
            select: {
              id: true,
              businessName: true,
              nif: true,
              email: true,
              phone: true,
              city: true,
              setupCompleted: true,
              isActive: true,
              createdAt: true,
              certificateExpiry: true,
              tenantUsers: {
                where: { isOwner: true },
                select: {
                  user: {
                    select: {
                      emailVerified: true,
                      accountActivationExpires: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.agencyClientRelation.count({ where }),
    ]);

    const clientIds = relations.map((r) => r.clientTenantId);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    type InvoiceStatRow = {
      tenant_id: string;
      total_invoices: bigint;
      pending_invoices: bigint;
      monthly_revenue: string | null;
      last_activity: Date | null;
      pending_export_count: bigint;
    };

    const invoiceStats =
      clientIds.length > 0
        ? await this.prisma.$queryRaw<InvoiceStatRow[]>(Prisma.sql`
            SELECT
              tenant_id::text,
              COUNT(*) FILTER (WHERE status != 'DRAFT') AS total_invoices,
              COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'SENT')) AS pending_invoices,
              SUM(total) FILTER (
                WHERE status IN ('CONFIRMED', 'SENT', 'PAID') AND issue_date >= ${startOfMonth}
              ) AS monthly_revenue,
              MAX(issue_date) FILTER (WHERE status != 'DRAFT') AS last_activity,
              COUNT(*) FILTER (
                WHERE status IN ('CONFIRMED', 'SENT', 'PAID')
                AND NOT EXISTS (
                  SELECT 1 FROM invoice_export_events e
                  WHERE e.invoice_id = invoices.id
                  AND e.agency_tenant_id = ${agencyTenantId}
                )
              ) AS pending_export_count
            FROM invoices
            WHERE tenant_id = ANY(ARRAY[${Prisma.join(clientIds.map((id) => Prisma.sql`${id}`))}])
            GROUP BY tenant_id
          `)
        : [];

    const statsMap = new Map(invoiceStats.map((r) => [r.tenant_id, r]));

    const enriched = relations.map((relation) => {
      const stats = statsMap.get(relation.clientTenantId);
      const ownerUser = relation.clientTenant.tenantUsers?.[0]?.user;
      const { tenantUsers: _tenantUsers, ...clientTenantWithoutUsers } =
        relation.clientTenant as typeof relation.clientTenant & { tenantUsers: unknown[] };
      void _tenantUsers;

      return {
        ...relation,
        clientTenant: clientTenantWithoutUsers,
        activationStatus: {
          emailVerified: ownerUser?.emailVerified ?? false,
          activationTokenExpires: ownerUser?.accountActivationExpires
            ? (ownerUser.accountActivationExpires as Date).toISOString()
            : null,
        },
        stats: {
          totalInvoices: Number(stats?.total_invoices ?? 0),
          pendingInvoices: Number(stats?.pending_invoices ?? 0),
          monthlyRevenue: Number(stats?.monthly_revenue ?? 0),
          lastActivity: stats?.last_activity ? (stats.last_activity as Date).toISOString() : null,
          pendingExportCount: Number(stats?.pending_export_count ?? 0),
        },
      };
    });

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Get single client detail ─────────────────────────────────────────

  async findOneClient(agencyTenantId: string, clientTenantId: string) {
    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
      include: {
        clientTenant: {
          select: {
            id: true,
            businessName: true,
            nif: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            province: true,
            postalCode: true,
            setupCompleted: true,
            isActive: true,
            createdAt: true,
            taxRegime: true,
            reaypRate: true,
            tenantUsers: {
              where: { isOwner: true },
              select: {
                user: {
                  select: {
                    emailVerified: true,
                    accountActivationExpires: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!relation) {
      throw new NotFoundException('Cliente no encontrado en tu cartera');
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    type ClientInvoiceStats = {
      total_invoices: bigint;
      pending_invoices: bigint;
      monthly_revenue: string | null;
    };

    const [invoiceStats, recentInvoices] = await Promise.all([
      this.prisma.$queryRaw<ClientInvoiceStats[]>`
        SELECT
          COUNT(*) FILTER (WHERE status != 'DRAFT') AS total_invoices,
          COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'SENT')) AS pending_invoices,
          SUM(total) FILTER (
            WHERE status IN ('CONFIRMED', 'SENT', 'PAID') AND issue_date >= ${startOfMonth}
          ) AS monthly_revenue
        FROM invoices
        WHERE tenant_id = ${clientTenantId}
      `,
      this.prisma.invoice.findMany({
        where: { tenantId: clientTenantId, status: { notIn: ['DRAFT'] } },
        orderBy: { issueDate: 'desc' },
        take: 5,
        select: {
          id: true,
          number: true,
          issueDate: true,
          total: true,
          status: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    const stats = invoiceStats[0];
    const ownerUser = relation.clientTenant.tenantUsers?.[0]?.user;
    const { tenantUsers: _tu, ...clientTenantWithoutUsers } =
      relation.clientTenant as typeof relation.clientTenant & { tenantUsers: unknown[] };
    void _tu;

    return {
      ...relation,
      clientTenant: clientTenantWithoutUsers,
      activationStatus: {
        emailVerified: ownerUser?.emailVerified ?? false,
        activationTokenExpires: ownerUser?.accountActivationExpires
          ? (ownerUser.accountActivationExpires as Date).toISOString()
          : null,
      },
      stats: {
        totalInvoices: Number(stats?.total_invoices ?? 0),
        pendingInvoices: Number(stats?.pending_invoices ?? 0),
        monthlyRevenue: Number(stats?.monthly_revenue ?? 0),
      },
      recentInvoices,
    };
  }

  // ─── Update notes for a client relation ───────────────────────────────

  async updateClientNotes(agencyTenantId: string, clientTenantId: string, notes: string) {
    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
    });

    if (!relation) {
      throw new NotFoundException('Cliente no encontrado en tu cartera');
    }

    return this.prisma.agencyClientRelation.update({
      where: { id: relation.id },
      data: { notes },
    });
  }

  // ─── Revoke client from agency ────────────────────────────────────────

  async revokeClient(agencyTenantId: string, clientTenantId: string, terminatedByUserId: string) {
    const [relation, agencyTenant, clientTenant] = await Promise.all([
      this.prisma.agencyClientRelation.findUnique({
        where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
      }),
      this.prisma.tenant.findUnique({
        where: { id: agencyTenantId },
        select: { businessName: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: clientTenantId },
        select: { businessName: true, nif: true },
      }),
    ]);

    if (!relation) {
      throw new NotFoundException('Relación no encontrada');
    }

    const agencyUsers = await this.prisma.tenantUser.findMany({
      where: { tenantId: agencyTenantId },
      select: { userId: true },
    });

    const agencyUserIds = agencyUsers.map((tu) => tu.userId);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.agencyClientRelation.delete({ where: { id: relation.id } });

      await tx.tenantUser.deleteMany({
        where: {
          tenantId: clientTenantId,
          userId: { in: agencyUserIds },
          isOwner: false,
        },
      });

      await tx.agencyClientRequest.updateMany({
        where: { clientTenantId, agencyTenantId, status: 'ACCEPTED' },
        data: { status: 'REVOKED' },
      });

      const closed = await tx.agencyRelationHistory.updateMany({
        where: { agencyTenantId, clientTenantId, endedAt: null },
        data: { endedAt: now, terminatedBy: 'AGENCY', terminatedByUserId },
      });

      if (closed.count === 0) {
        await tx.agencyRelationHistory.create({
          data: {
            agencyTenantId,
            clientTenantId,
            agencyBusinessName: agencyTenant?.businessName ?? 'Desconocido',
            clientBusinessName: clientTenant?.businessName ?? 'Desconocido',
            clientNif: clientTenant?.nif ?? 'DESCONOCIDO',
            startedAt: relation.createdAt,
            endedAt: now,
            terminatedBy: 'AGENCY',
            terminatedByUserId,
          },
        });
      }
    });
  }

  // ─── Shared customer pool ─────────────────────────────────────────────

  async findSharedCustomers(agencyTenantId: string, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId: agencyTenantId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { nif: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── My agencies (client side) ────────────────────────────────────────

  async findMyAgencies(clientTenantId: string) {
    const relations = await this.prisma.agencyClientRelation.findMany({
      where: { clientTenantId },
      orderBy: { createdAt: 'asc' },
      include: {
        agencyTenant: {
          select: {
            id: true,
            businessName: true,
            nif: true,
            email: true,
            phone: true,
            city: true,
          },
        },
      },
    });

    return relations.map((r) => ({
      id: r.id,
      agencyTenantId: r.agencyTenantId,
      agencyName: r.agencyTenant.businessName,
      agencyNif: r.agencyTenant.nif,
      agencyEmail: r.agencyTenant.email,
      agencyPhone: r.agencyTenant.phone,
      agencyCity: r.agencyTenant.city,
      linkedAt: r.createdAt.toISOString(),
    }));
  }

  // ─── Revoke my agency (client side) ───────────────────────────────────

  async revokeMyAgency(clientTenantId: string, agencyTenantId: string, terminatedByUserId: string) {
    const [relation, agencyTenant, clientTenant] = await Promise.all([
      this.prisma.agencyClientRelation.findUnique({
        where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
        select: { id: true, createdAt: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: agencyTenantId },
        select: { businessName: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: clientTenantId },
        select: { businessName: true, nif: true },
      }),
    ]);

    if (!relation) {
      throw new NotFoundException('Relación no encontrada');
    }

    const agencyUsers = await this.prisma.tenantUser.findMany({
      where: { tenantId: agencyTenantId },
      select: { userId: true },
    });

    const agencyUserIds = agencyUsers.map((tu) => tu.userId);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.agencyClientRelation.delete({ where: { id: relation.id } });

      await tx.tenantUser.deleteMany({
        where: {
          tenantId: clientTenantId,
          userId: { in: agencyUserIds },
          isOwner: false,
        },
      });

      await tx.agencyClientRequest.updateMany({
        where: { clientTenantId, agencyTenantId, status: 'ACCEPTED' },
        data: { status: 'REVOKED' },
      });

      const closed = await tx.agencyRelationHistory.updateMany({
        where: { agencyTenantId, clientTenantId, endedAt: null },
        data: { endedAt: now, terminatedBy: 'CLIENT', terminatedByUserId },
      });

      if (closed.count === 0) {
        await tx.agencyRelationHistory.create({
          data: {
            agencyTenantId,
            clientTenantId,
            agencyBusinessName: agencyTenant?.businessName ?? 'Desconocido',
            clientBusinessName: clientTenant?.businessName ?? 'Desconocido',
            clientNif: clientTenant?.nif ?? 'DESCONOCIDO',
            startedAt: relation.createdAt,
            endedAt: now,
            terminatedBy: 'CLIENT',
            terminatedByUserId,
          },
        });
      }
    });
  }

  // ─── Export logs ──────────────────────────────────────────────────────

  async getExportLogs(agencyTenantId: string, clientTenantId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = {
      agencyTenantId,
      ...(clientTenantId ? { clientTenantId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.agencyExportLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          clientTenantId: true,
          format: true,
          year: true,
          quarter: true,
          invoicesCount: true,
          totalRevenue: true,
          createdAt: true,
          requestedByUser: { select: { firstName: true, lastName: true, email: true } },
          clientTenant: { select: { businessName: true } },
        },
      }),
      this.prisma.agencyExportLog.count({ where }),
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
}
