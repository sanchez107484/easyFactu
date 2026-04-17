import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceSeriesService } from '../invoice-series/invoice-series.service';
import { EmailService } from '../../common/email/email.service';
import { ConfigService } from '@nestjs/config';
import { CreateDirectClientDto } from './dto/create-direct-client.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { QueryAgencyClientsDto } from './dto/query-agency-clients.dto';
import { AgencyClientStatus } from '@easyfactura/shared-types';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyService {
  constructor(
    private prisma: PrismaService,
    private invoiceSeriesService: InvoiceSeriesService,
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  // ─── Guards ──────────────────────────────────────────────────────────────────

  private async assertAgencyTenant(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { accountType: true },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    if (tenant.accountType !== 'AGENCY') {
      throw new ForbiddenException('Solo las asesorías pueden acceder a este recurso');
    }
  }

  // ─── Clients list ─────────────────────────────────────────────────────────

  async findAllClients(agencyTenantId: string, query: QueryAgencyClientsDto) {
    await this.assertAgencyTenant(agencyTenantId);

    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AgencyClientRelationWhereInput = {
      agencyTenantId,
      ...(status ? { status } : {}),
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
            },
          },
        },
      }),
      this.prisma.agencyClientRelation.count({ where }),
    ]);

    // Batch-fetch invoice stats for all clients in 3 queries (not N*3)
    const clientIds = relations.map((r) => r.clientTenantId);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalCounts, pendingCounts, monthlyRevenues] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: clientIds }, status: { notIn: ['DRAFT'] } },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: clientIds }, status: { in: ['CONFIRMED', 'SENT'] } },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['tenantId'],
        where: {
          tenantId: { in: clientIds },
          status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
          issueDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
    ]);

    const totalCountMap = new Map(totalCounts.map((r) => [r.tenantId, r._count.id]));
    const pendingCountMap = new Map(pendingCounts.map((r) => [r.tenantId, r._count.id]));
    const monthlyRevenueMap = new Map(
      monthlyRevenues.map((r) => [r.tenantId, Number(r._sum.total ?? 0)])
    );

    const enriched = relations.map((relation) => ({
      ...relation,
      stats: {
        totalInvoices: totalCountMap.get(relation.clientTenantId) ?? 0,
        pendingInvoices: pendingCountMap.get(relation.clientTenantId) ?? 0,
        monthlyRevenue: monthlyRevenueMap.get(relation.clientTenantId) ?? 0,
      },
    }));

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Create direct client (agency creates tenant on behalf of client) ─────

  async createDirectClient(
    agencyTenantId: string,
    addedByUserId: string,
    dto: CreateDirectClientDto
  ) {
    await this.assertAgencyTenant(agencyTenantId);

    // Verify the NIF is not already registered
    const existingTenant = await this.prisma.tenant.findFirst({
      where: { nif: dto.nif.toUpperCase().trim() },
    });

    if (existingTenant) {
      // Check if it's already linked to this agency
      const existingRelation = await this.prisma.agencyClientRelation.findUnique({
        where: {
          agencyTenantId_clientTenantId: {
            agencyTenantId,
            clientTenantId: existingTenant.id,
          },
        },
      });

      if (existingRelation) {
        throw new ConflictException('Este cliente ya está en tu cartera');
      }

      // Link the existing tenant to this agency
      return this.linkExistingTenant(agencyTenantId, existingTenant.id, addedByUserId, dto.notes);
    }

    // Create new tenant + link to agency in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const clientTenant = await tx.tenant.create({
        data: {
          businessName: dto.businessName,
          nif: dto.nif.toUpperCase().trim(),
          email: dto.email,
          address: dto.address ?? '',
          postalCode: dto.postalCode ?? '',
          city: dto.city ?? '',
          province: dto.province ?? '',
          phone: dto.phone,
          setupCompleted: false,
        },
      });

      const relation = await tx.agencyClientRelation.create({
        data: {
          agencyTenantId,
          clientTenantId: clientTenant.id,
          addedByUserId,
          status: 'ACTIVE',
          notes: dto.notes,
        },
        include: { clientTenant: true },
      });

      // Grant all agency users (OWNER + ADMIN) access to the client tenant
      // This is what makes switchTenant work — the JWT strategy validates TenantUser
      const agencyUsers = await tx.tenantUser.findMany({
        where: {
          tenantId: agencyTenantId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });

      await tx.tenantUser.createMany({
        data: agencyUsers.map((tu) => ({
          tenantId: clientTenant.id,
          userId: tu.userId,
          role: 'ADMIN' as const,
          isOwner: false,
        })),
        skipDuplicates: true,
      });

      return { clientTenant, relation };
    });

    // Create default invoice series for the new client tenant
    await this.invoiceSeriesService.createDefaultSeries(result.clientTenant.id);

    // Send welcome email (fire-and-forget — don't block on email failure)
    const agencyTenant = await this.prisma.tenant.findUnique({
      where: { id: agencyTenantId },
      select: { businessName: true },
    });

    this.emailService.sendDirectClientWelcome({
      to: dto.email,
      clientName: dto.businessName,
      agencyName: agencyTenant?.businessName ?? 'Tu asesoría',
      loginUrl: `${this.configService.get('FRONTEND_URL') ?? 'https://app.novafactura.es'}/login`,
    });

    return result.relation;
  }

  // ─── Link existing tenant to agency ──────────────────────────────────────

  private async linkExistingTenant(
    agencyTenantId: string,
    clientTenantId: string,
    addedByUserId: string,
    notes?: string
  ) {
    return this.prisma.agencyClientRelation.create({
      data: {
        agencyTenantId,
        clientTenantId,
        addedByUserId,
        status: 'ACTIVE',
        notes,
      },
      include: { clientTenant: true },
    });
  }

  // ─── Send invitation to existing user ────────────────────────────────────

  async inviteClient(agencyTenantId: string, dto: InviteClientDto) {
    await this.assertAgencyTenant(agencyTenantId);

    // Check for an active pending invitation to same email
    const existingInvitation = await this.prisma.agencyInvitation.findFirst({
      where: {
        agencyTenantId,
        inviteeEmail: dto.inviteeEmail.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Ya existe una invitación pendiente para este email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [invitation, agencyTenant] = await Promise.all([
      this.prisma.agencyInvitation.create({
        data: {
          agencyTenantId,
          inviteeEmail: dto.inviteeEmail.toLowerCase(),
          inviteeName: dto.inviteeName,
          token,
          expiresAt,
        },
      }),
      this.prisma.tenant.findUnique({
        where: { id: agencyTenantId },
        select: { businessName: true, nif: true },
      }),
    ]);

    // Send invitation email (fire-and-forget)
    this.emailService.sendAgencyInvitation({
      to: dto.inviteeEmail,
      inviteeName: dto.inviteeName,
      agencyName: agencyTenant?.businessName ?? 'Tu asesoría',
      agencyNif: agencyTenant?.nif ?? '',
      invitationToken: token,
      expiresAt,
    });

    return invitation;
  }

  // ─── Get public invitation info (no auth required) ───────────────────────

  async findInvitationByToken(token: string) {
    const invitation = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: {
        agencyTenant: { select: { businessName: true, nif: true, city: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada');

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        invitation.status === 'ACCEPTED'
          ? 'Esta invitación ya fue aceptada'
          : 'Esta invitación fue cancelada'
      );
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('La invitación ha expirado');
    }

    // Return only safe public fields — never expose internal IDs or email logs
    return {
      inviteeName: invitation.inviteeName,
      agencyName: invitation.agencyTenant.businessName,
      agencyNif: invitation.agencyTenant.nif,
      agencyCity: invitation.agencyTenant.city,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    };
  }

  // ─── Accept invitation (called when client registers/logs in with token) ──
  async acceptInvitation(token: string, clientTenantId: string, userId: string) {
    const invitation = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: { agencyTenant: { select: { id: true, businessName: true } } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya fue usada o cancelada');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('La invitación ha expirado');
    }

    // Prevent an AGENCY tenant from becoming a client of another AGENCY (circular relations)
    const clientTenant = await this.prisma.tenant.findUnique({
      where: { id: clientTenantId },
      select: { accountType: true, businessName: true },
    });

    if (clientTenant?.accountType === 'AGENCY') {
      throw new BadRequestException(
        'Una asesoría no puede ser cliente de otra asesoría. Usa el sistema de colaboración para vincular gestorías.'
      );
    }

    // Check the relation doesn't already exist
    const existingRelation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: {
          agencyTenantId: invitation.agencyTenantId,
          clientTenantId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Ya estás vinculado a esta asesoría');
    }

    const relation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.agencyClientRelation.create({
        data: {
          agencyTenantId: invitation.agencyTenantId,
          clientTenantId,
          addedByUserId: userId,
          status: 'ACTIVE',
        },
        include: { clientTenant: true, agencyTenant: true },
      });

      await tx.agencyInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      // Grant all agency users (OWNER + ADMIN) access to the client tenant
      const agencyUsers = await tx.tenantUser.findMany({
        where: {
          tenantId: invitation.agencyTenantId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });

      await tx.tenantUser.createMany({
        data: agencyUsers.map((tu) => ({
          tenantId: clientTenantId,
          userId: tu.userId,
          role: 'ADMIN' as const,
          isOwner: false,
        })),
        skipDuplicates: true,
      });

      return created;
    });

    // Notify the agency that their client accepted the invitation (fire-and-forget)
    const agencyTenantDetails = await this.prisma.tenant.findUnique({
      where: { id: invitation.agencyTenantId },
      select: { email: true, businessName: true },
    });

    if (agencyTenantDetails) {
      this.emailService.sendClientAcceptedInvitationNotification({
        to: agencyTenantDetails.email,
        agencyName: agencyTenantDetails.businessName,
        clientName: relation.clientTenant.businessName,
        clientNif: relation.clientTenant.nif,
      });
    }

    return relation;
  }

  // ─── Revoke access ────────────────────────────────────────────────────────

  async revokeClient(agencyTenantId: string, clientTenantId: string) {
    await this.assertAgencyTenant(agencyTenantId);

    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: {
        agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId },
      },
    });

    if (!relation) {
      throw new NotFoundException('Relación no encontrada');
    }

    // Find all users belonging to the agency
    const agencyUsers = await this.prisma.tenantUser.findMany({
      where: { tenantId: agencyTenantId },
      select: { userId: true },
    });

    const agencyUserIds = agencyUsers.map((tu) => tu.userId);

    // Atomically revoke relation AND remove agency users from client TenantUser
    // isOwner: false guard ensures we never accidentally remove the client's own owner
    await this.prisma.$transaction([
      this.prisma.agencyClientRelation.update({
        where: { id: relation.id },
        data: { status: 'REVOKED' },
      }),
      this.prisma.tenantUser.deleteMany({
        where: {
          tenantId: clientTenantId,
          userId: { in: agencyUserIds },
          isOwner: false,
        },
      }),
    ]);
  }

  // ─── Pending invitations list ─────────────────────────────────────────────

  async findPendingInvitations(agencyTenantId: string) {
    await this.assertAgencyTenant(agencyTenantId);

    return this.prisma.agencyInvitation.findMany({
      where: {
        agencyTenantId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inviteeEmail: true,
        inviteeName: true,
        expiresAt: true,
        createdAt: true,
        status: true,
      },
    });
  }

  async cancelInvitation(agencyTenantId: string, invitationId: string) {
    await this.assertAgencyTenant(agencyTenantId);

    const invitation = await this.prisma.agencyInvitation.findFirst({
      where: { id: invitationId, agencyTenantId },
    });

    if (!invitation) throw new NotFoundException('Invitación no encontrada');
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya no está pendiente');
    }

    return this.prisma.agencyInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });
  }

  // ─── Get single client detail ─────────────────────────────────────────────

  async findOneClient(agencyTenantId: string, clientTenantId: string) {
    await this.assertAgencyTenant(agencyTenantId);

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
          },
        },
      },
    });

    if (!relation) {
      throw new NotFoundException('Cliente no encontrado en tu cartera');
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalCount, pendingCount, monthlyRevenue, recentInvoices] = await Promise.all([
      this.prisma.invoice.count({
        where: { tenantId: clientTenantId, status: { notIn: ['DRAFT'] } },
      }),
      this.prisma.invoice.count({
        where: { tenantId: clientTenantId, status: { in: ['CONFIRMED', 'SENT'] } },
      }),
      this.prisma.invoice.aggregate({
        where: {
          tenantId: clientTenantId,
          status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
          issueDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
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

    return {
      ...relation,
      stats: {
        totalInvoices: totalCount,
        pendingInvoices: pendingCount,
        monthlyRevenue: Number(monthlyRevenue._sum.total ?? 0),
      },
      recentInvoices,
    };
  }

  // ─── Update notes for a client relation ───────────────────────────────────

  async updateClientNotes(agencyTenantId: string, clientTenantId: string, notes: string) {
    await this.assertAgencyTenant(agencyTenantId);

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

  // ─── Shared customer pool ─────────────────────────────────────────────────
  // The agency's own Customer records (tenantId = agencyTenantId) act as the
  // shared pool. This endpoint returns them so the frontend can suggest imports.

  async findSharedCustomers(agencyTenantId: string, search?: string, page = 1, limit = 20) {
    await this.assertAgencyTenant(agencyTenantId);

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

  // ─── Dashboard stats for agency hub ──────────────────────────────────────

  async getAgencyStats(agencyTenantId: string) {
    await this.assertAgencyTenant(agencyTenantId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [
      totalClients,
      activeClients,
      pendingInvitations,
      clientsNeedingAttention,
      monthlyRevenueResult,
      clientsWithoutRecentInvoice,
      pendingVerifactuResult,
    ] = await Promise.all([
      this.prisma.agencyClientRelation.count({ where: { agencyTenantId } }),
      this.prisma.agencyClientRelation.count({
        where: { agencyTenantId, status: 'ACTIVE' },
      }),
      this.prisma.agencyInvitation.count({
        where: {
          agencyTenantId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
      }),
      // Clients with pending/sent invoices (need attention — awaiting payment)
      this.prisma.agencyClientRelation.count({
        where: {
          agencyTenantId,
          status: 'ACTIVE',
          clientTenant: {
            invoices: { some: { status: { in: ['CONFIRMED', 'SENT'] } } },
          },
        },
      }),
      // Total revenue across all active clients this month
      this.prisma.invoice.aggregate({
        where: {
          tenant: {
            clientRelations: { some: { agencyTenantId, status: 'ACTIVE' } },
          },
          status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
          issueDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      // Active clients with NO confirmed invoice in the last 3 months
      this.prisma.agencyClientRelation.count({
        where: {
          agencyTenantId,
          status: 'ACTIVE',
          clientTenant: {
            invoices: {
              none: {
                status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
                issueDate: { gte: threeMonthsAgo },
              },
            },
          },
        },
      }),
      // Active clients with VeriFactu errors/pending
      this.prisma.agencyClientRelation.count({
        where: {
          agencyTenantId,
          status: 'ACTIVE',
          clientTenant: {
            invoices: {
              some: {
                status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
                verifactuStatus: { in: ['PENDING', 'ERROR', 'REJECTED'] },
              },
            },
          },
        },
      }),
    ]);

    const alerts = this.buildDashboardAlerts({
      clientsWithoutRecentInvoice,
      pendingVerifactu: pendingVerifactuResult,
      clientsNeedingAttention,
    });

    return {
      totalClients,
      activeClients,
      pendingInvitations,
      clientsNeedingAttention,
      monthlyRevenue: Number(monthlyRevenueResult._sum.total ?? 0),
      alerts,
    };
  }

  private buildDashboardAlerts(params: {
    clientsWithoutRecentInvoice: number;
    pendingVerifactu: number;
    clientsNeedingAttention: number;
  }): Array<{ type: 'error' | 'warning' | 'info'; message: string; count: number }> {
    const alerts: Array<{ type: 'error' | 'warning' | 'info'; message: string; count: number }> =
      [];

    if (params.pendingVerifactu > 0) {
      alerts.push({
        type: 'error',
        message: `${params.pendingVerifactu} cliente${params.pendingVerifactu > 1 ? 's' : ''} con facturas pendientes de enviar a la AEAT`,
        count: params.pendingVerifactu,
      });
    }

    if (params.clientsWithoutRecentInvoice > 0) {
      alerts.push({
        type: 'warning',
        message: `${params.clientsWithoutRecentInvoice} cliente${params.clientsWithoutRecentInvoice > 1 ? 's' : ''} sin facturar en los últimos 3 meses`,
        count: params.clientsWithoutRecentInvoice,
      });
    }

    if (params.clientsNeedingAttention > 0) {
      alerts.push({
        type: 'info',
        message: `${params.clientsNeedingAttention} cliente${params.clientsNeedingAttention > 1 ? 's tienen' : ' tiene'} facturas pendientes de cobro`,
        count: params.clientsNeedingAttention,
      });
    }

    return alerts;
  }
}
