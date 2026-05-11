import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(days: number = 30) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Dynamic period boundaries
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);
    const prevPeriodEnd = new Date(periodStart);
    const prevPeriodStart = new Date(now);
    prevPeriodStart.setDate(now.getDate() - days * 2);

    const [
      userStats,
      tenantStats,
      tenantsByPlan,
      tenantsByType,
      invoiceStats,
      invoicesByStatus,
      invoiceTotalAmount,
      invoiceMonthAmount,
      verifactuCerts,
      verifactuSent,
      userGrowthCurrentRaw,
      userGrowthPreviousRaw,
      invoiceGrowthCurrentRaw,
      invoiceGrowthPreviousRaw,
      recentTenants,
    ] = await Promise.all([
      // Users total
      this.prisma.user.aggregate({ _count: { id: true } }),
      // Tenants total
      this.prisma.tenant.aggregate({ _count: { id: true }, where: {} }),
      // Tenants by plan
      this.prisma.tenant.groupBy({ by: ['plan'], _count: { id: true } }),
      // Tenants by accountType
      this.prisma.tenant.groupBy({ by: ['accountType'], _count: { id: true } }),
      // Invoice counts (non-draft)
      this.prisma.invoice.aggregate({
        _count: { id: true },
        where: { status: { notIn: ['DRAFT'] } },
      }),
      // Invoices by status
      this.prisma.invoice.groupBy({ by: ['status'], _count: { id: true } }),
      // Total confirmed invoice amount
      this.prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ['DRAFT'] } },
      }),
      // This month confirmed invoice amount
      this.prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ['DRAFT'] }, createdAt: { gte: startOfMonth } },
      }),
      // Tenants with VeriFactu certificate
      this.prisma.tenant.count({ where: { certificateUrl: { not: null } } }),
      // VeriFactu logs sent to AEAT
      this.prisma.verifactuLog.count(),
      // Users per day — current period
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("created_at")::text AS date, COUNT(*)::bigint AS count
        FROM users
        WHERE "created_at" >= ${periodStart}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
      // Users per day — previous period
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("created_at")::text AS date, COUNT(*)::bigint AS count
        FROM users
        WHERE "created_at" >= ${prevPeriodStart} AND "created_at" < ${prevPeriodEnd}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
      // Invoices per day — current period
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("created_at")::text AS date, COUNT(*)::bigint AS count
        FROM invoices
        WHERE "created_at" >= ${periodStart}
          AND status != 'DRAFT'
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
      // Invoices per day — previous period
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("created_at")::text AS date, COUNT(*)::bigint AS count
        FROM invoices
        WHERE "created_at" >= ${prevPeriodStart} AND "created_at" < ${prevPeriodEnd}
          AND status != 'DRAFT'
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
      // Last 100 tenants registered (client-side filtering)
      this.prisma.tenant.findMany({
        select: {
          id: true,
          businessName: true,
          email: true,
          plan: true,
          accountType: true,
          setupCompleted: true,
          createdAt: true,
          _count: { select: { invoices: true, customers: true, recurringInvoices: true } },
        tenantUsers: {
          select: { user: { select: { lastLoginAt: true } } },
        },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Sequential queries that depend on computed periodStart
    const [activeTenants, newUsersThisWeek, newUsersThisMonth, verifiedUsers, setupCompleted, invoicesThisMonth, invoicesThisWeek] =
      await Promise.all([
        this.prisma.tenant.count({
          where: {
            invoices: {
              some: { status: { notIn: ['DRAFT'] }, createdAt: { gte: periodStart } },
            },
          },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.user.count({ where: { emailVerified: true } }),
        this.prisma.tenant.count({ where: { setupCompleted: true } }),
        this.prisma.invoice.count({
          where: { status: { notIn: ['DRAFT'] }, createdAt: { gte: startOfMonth } },
        }),
        this.prisma.invoice.count({
          where: { status: { notIn: ['DRAFT'] }, createdAt: { gte: startOfWeek } },
        }),
      ]);

    // Build plan map
    const planMap: Record<string, number> = { FREE: 0, BASIC: 0, PROFESSIONAL: 0 };
    for (const row of tenantsByPlan) planMap[row.plan] = row._count.id;

    // Build accountType map
    const typeMap: Record<string, number> = {
      INDIVIDUAL: 0,
      BUSINESS: 0,
      AGENCY: 0,
      COLLABORATIVE: 0,
    };
    for (const row of tenantsByType) typeMap[row.accountType] = row._count.id;

    // Build status map
    const statusMap: Record<string, number> = {};
    for (const row of invoicesByStatus) statusMap[row.status] = row._count.id;

    // Convert BigInt from raw queries
    const toGrowth = (raw: Array<{ date: string; count: bigint }>) =>
      raw.map((r) => ({ date: r.date, count: Number(r.count) }));

    return {
      users: {
        total: userStats._count.id,
        verified: verifiedUsers,
        unverified: userStats._count.id - verifiedUsers,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      tenants: {
        total: tenantStats._count.id,
        active: activeTenants,
        inactive: tenantStats._count.id - activeTenants,
        setupCompleted,
        byPlan: planMap,
        byType: typeMap,
      },
      invoices: {
        total: invoiceStats._count.id,
        thisWeek: invoicesThisWeek,
        thisMonth: invoicesThisMonth,
        byStatus: statusMap,
        totalAmount: Number(invoiceTotalAmount._sum.total ?? 0),
        thisMonthAmount: Number(invoiceMonthAmount._sum.total ?? 0),
      },
      verifactu: {
        tenantsWithCertificate: verifactuCerts,
        totalSent: verifactuSent,
      },
      growth: {
        currentPeriod: {
          startDate: periodStart.toISOString(),
          endDate: now.toISOString(),
          users: toGrowth(userGrowthCurrentRaw),
          invoices: toGrowth(invoiceGrowthCurrentRaw),
        },
        previousPeriod: {
          startDate: prevPeriodStart.toISOString(),
          endDate: prevPeriodEnd.toISOString(),
          users: toGrowth(userGrowthPreviousRaw),
          invoices: toGrowth(invoiceGrowthPreviousRaw),
        },
      },
      recentTenants: recentTenants.map((t) => {
        const loginDates = t.tenantUsers
          .map((tu) => tu.user.lastLoginAt)
          .filter((d): d is Date => d !== null);
        const lastUserActivityAt =
          loginDates.length > 0
            ? new Date(Math.max(...loginDates.map((d) => d.getTime()))).toISOString()
            : null;
        return {
          id: t.id,
          businessName: t.businessName,
          email: t.email,
          plan: t.plan,
          accountType: t.accountType,
          setupCompleted: t.setupCompleted,
          createdAt: t.createdAt,
          invoiceCount: t._count.invoices,
          customerCount: t._count.customers,
          recurringInvoiceCount: t._count.recurringInvoices,
          lastUserActivityAt,
        };
      }),
      generatedAt: now.toISOString(),
    };
  }
}
