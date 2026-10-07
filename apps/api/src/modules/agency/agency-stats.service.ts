import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyStatsService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard stats for agency hub ──────────────────────────────────────

  async getAgencyStats(agencyTenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [activeRelations, totalClients, pendingInvitations] = await Promise.all([
      this.prisma.agencyClientRelation.findMany({
        where: { agencyTenantId },
        select: { clientTenantId: true },
      }),
      this.prisma.agencyClientRelation.count({ where: { agencyTenantId } }),
      this.prisma.agencyInvitation.count({
        where: { agencyTenantId, status: 'PENDING', expiresAt: { gt: now } },
      }),
    ]);

    const activeClients = activeRelations.length;
    const clientIds = activeRelations.map((r) => r.clientTenantId);

    if (clientIds.length === 0) {
      return {
        totalClients,
        activeClients: 0,
        pendingInvitations,
        clientsNeedingAttention: 0,
        monthlyRevenue: 0,
        alerts: [],
      };
    }

    const [attentionGroups, monthlyRevenueResult, recentInvoiceGroups, verifactuGroups] =
      await Promise.all([
        this.prisma.invoice.groupBy({
          by: ['tenantId'],
          where: { tenantId: { in: clientIds }, status: { in: ['CONFIRMED', 'SENT'] } },
          _count: { id: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            tenantId: { in: clientIds },
            status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
            issueDate: { gte: startOfMonth },
          },
          _sum: { total: true },
        }),
        this.prisma.invoice.groupBy({
          by: ['tenantId'],
          where: {
            tenantId: { in: clientIds },
            status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
            issueDate: { gte: threeMonthsAgo },
          },
          _count: { id: true },
        }),
        this.prisma.invoice.groupBy({
          by: ['tenantId'],
          where: {
            tenantId: { in: clientIds },
            status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
            verifactuStatus: { in: ['PENDING', 'ERROR', 'REJECTED'] },
          },
          _count: { id: true },
        }),
      ]);

    const clientsNeedingAttention = attentionGroups.length;
    const clientsWithoutRecentInvoice =
      activeClients - new Set(recentInvoiceGroups.map((r) => r.tenantId)).size;
    const pendingVerifactu = verifactuGroups.length;

    const alerts = this.buildDashboardAlerts({
      clientsWithoutRecentInvoice,
      pendingVerifactu,
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

  // ─── Quarterly IVA summary across all active clients ──────────────────────

  async getQuarterlyIvaSummary(agencyTenantId: string) {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const year = now.getFullYear();
    const startDate = new Date(year, (quarter - 1) * 3, 1);
    const endDate = new Date(year, quarter * 3, 0, 23, 59, 59);

    const relations = await this.prisma.agencyClientRelation.findMany({
      where: { agencyTenantId },
      select: { clientTenantId: true },
    });

    if (relations.length === 0) {
      return {
        quarter,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalIva: 0,
        totalIrpf: 0,
        totalRevenue: 0,
        invoicesCount: 0,
        clientsWithData: 0,
      };
    }

    const clientIds = relations.map((r) => r.clientTenantId);

    type IvaRow = {
      total_iva: string | null;
      total_irpf: string | null;
      total_surcharge: string | null;
      total_revenue: string | null;
      invoices_count: bigint;
      clients_count: bigint;
    };

    const [result] = await this.prisma.$queryRaw<IvaRow[]>(Prisma.sql`
      SELECT
        SUM(tax_total)       AS total_iva,
        SUM(irpf_total)      AS total_irpf,
        SUM(surcharge_total) AS total_surcharge,
        SUM(total)           AS total_revenue,
        COUNT(*)             AS invoices_count,
        COUNT(DISTINCT tenant_id) AS clients_count
      FROM invoices
      WHERE tenant_id = ANY(ARRAY[${Prisma.join(clientIds.map((id) => Prisma.sql`${id}`))}])
        AND status IN ('CONFIRMED', 'SENT', 'PAID')
        AND issue_date >= ${startDate}
        AND issue_date <= ${endDate}
    `);

    return {
      quarter,
      year,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalIva: Number(result?.total_iva ?? 0),
      totalIrpf: Number(result?.total_irpf ?? 0),
      totalSurcharge: Number(result?.total_surcharge ?? 0),
      totalRevenue: Number(result?.total_revenue ?? 0),
      invoicesCount: Number(result?.invoices_count ?? 0),
      clientsWithData: Number(result?.clients_count ?? 0),
    };
  }

  // ─── Fiscal alerts summary ────────────────────────────────────────────────

  async getFiscalAlertsSummary(agencyTenantId: string) {
    const relations = await this.prisma.agencyClientRelation.findMany({
      where: { agencyTenantId },
      select: {
        clientTenantId: true,
        clientTenant: { select: { businessName: true, nif: true } },
      },
    });

    if (relations.length === 0) return [];

    const clientIds = relations.map((r) => r.clientTenantId);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const [
      pendingVerifactuGroups,
      verifactuErrorGroups,
      simplifiedOver400Groups,
      duplicateNifRows,
    ] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['tenantId'],
        where: {
          tenantId: { in: clientIds },
          verifactuStatus: { in: ['PENDING', 'ERROR'] },
          status: 'CONFIRMED',
        },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['tenantId'],
        where: {
          tenantId: { in: clientIds },
          status: { in: ['CONFIRMED', 'PAID'] },
          verifactuStatus: 'ERROR',
        },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['tenantId'],
        where: {
          tenantId: { in: clientIds },
          invoiceType: 'simplified',
          total: { gt: 400 },
          issueDate: { gte: startOfYear },
        },
        _count: { id: true },
      }),
      this.prisma
        .$queryRaw<Array<{ tenant_id: string }>>(
          Prisma.sql`
          SELECT DISTINCT i.tenant_id::text
          FROM invoices i
          JOIN customers c ON c.id = i.customer_id
          WHERE i.tenant_id = ANY(ARRAY[${Prisma.join(clientIds.map((id) => Prisma.sql`${id}`))}])
            AND i.issue_date >= NOW() - INTERVAL '12 months'
          GROUP BY i.tenant_id, c.nif
          HAVING COUNT(i.id) > 50
        `
        )
        .catch(() => [] as Array<{ tenant_id: string }>),
    ]);

    const pendingVerifactuSet = new Set(pendingVerifactuGroups.map((r) => r.tenantId));
    const verifactuErrorSet = new Set(verifactuErrorGroups.map((r) => r.tenantId));
    const simplifiedOver400Set = new Set(simplifiedOver400Groups.map((r) => r.tenantId));
    const duplicateNifSet = new Set(duplicateNifRows.map((r) => r.tenant_id));

    return relations
      .map((relation) => ({
        clientTenantId: relation.clientTenantId,
        clientName: relation.clientTenant?.businessName ?? '',
        nif: relation.clientTenant?.nif ?? '',
        errorCount:
          Number(pendingVerifactuSet.has(relation.clientTenantId)) +
          Number(verifactuErrorSet.has(relation.clientTenantId)),
        warningCount: Number(simplifiedOver400Set.has(relation.clientTenantId)),
        infoCount: Number(duplicateNifSet.has(relation.clientTenantId)),
      }))
      .filter((r) => r.errorCount + r.warningCount + r.infoCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount || b.warningCount - a.warningCount);
  }

  private buildDashboardAlerts(params: {
    clientsWithoutRecentInvoice: number;
    pendingVerifactu: number;
    clientsNeedingAttention: number;
  }): Array<{ type: 'error' | 'warning' | 'info'; message: string; count: number }> {
    const alerts: Array<{ type: 'error' | 'warning' | 'info'; message: string; count: number }> = [];

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
