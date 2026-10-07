import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgencyInvoiceService {
  constructor(private prisma: PrismaService) {}

  // ─── Consolidated multi-client invoices ─────────────────────────────────

  async findAllClientsInvoices(agencyTenantId: string, query: {
    clientTenantId?: string;
    status?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: string;
  }) {
    const {
      clientTenantId,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      search,
      minAmount,
      maxAmount,
      page = 1,
      limit = 25,
      sortBy = 'issueDate',
      sortDir = 'desc',
    } = query;

    const clientIds = await this.getManagedClientIds(agencyTenantId, clientTenantId);

    if (clientIds.length === 0) {
      return this.emptyInvoicesResponse(page, limit);
    }

    const where = this.buildInvoicesWhere({
      clientIds,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      search,
      minAmount,
      maxAmount,
    });

    const [total, rows, summary] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          number: true,
          issueDate: true,
          dueDate: true,
          status: true,
          paymentStatus: true,
          subtotal: true,
          taxTotal: true,
          irpfTotal: true,
          total: true,
          amountPaid: true,
          verifactuStatus: true,
          tenant: { select: { id: true, businessName: true, nif: true } },
          customer: { select: { name: true, nif: true } },
        },
      }),
      this.aggregateInvoicesSummary(where),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        number: r.number,
        issueDate: r.issueDate.toISOString(),
        dueDate: r.dueDate?.toISOString() ?? null,
        status: r.status,
        paymentStatus: r.paymentStatus,
        subtotal: Number(r.subtotal),
        taxTotal: Number(r.taxTotal),
        irpfTotal: r.irpfTotal === null ? null : Number(r.irpfTotal),
        total: Number(r.total),
        amountPaid: Number(r.amountPaid),
        client: {
          tenantId: r.tenant.id,
          businessName: r.tenant.businessName,
          nif: r.tenant.nif,
        },
        customer: { name: r.customer.name, nif: r.customer.nif },
        verifactuStatus: r.verifactuStatus,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async getManagedClientIds(
    agencyTenantId: string,
    onlyClientTenantId?: string
  ): Promise<string[]> {
    const relations = await this.prisma.agencyClientRelation.findMany({
      where: {
        agencyTenantId,
        ...(onlyClientTenantId ? { clientTenantId: onlyClientTenantId } : {}),
      },
      select: { clientTenantId: true },
    });
    return relations.map((r) => r.clientTenantId);
  }

  private buildInvoicesWhere(params: {
    clientIds: string[];
    status?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Prisma.InvoiceWhereInput {
    const { clientIds, status, paymentStatus, dateFrom, dateTo, search, minAmount, maxAmount } = params;

    const where: Prisma.InvoiceWhereInput = {
      tenantId: { in: clientIds },
      status: status
        ? (status as Prisma.EnumInvoiceStatusFilter['equals'])
        : { in: ['CONFIRMED', 'SENT', 'PAID', 'RECTIFIED'] },
    };

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter['equals'];
    }

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) (where.issueDate as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.issueDate as Prisma.DateTimeFilter).lte = new Date(dateTo);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.total = {};
      if (minAmount !== undefined) (where.total as Prisma.DecimalFilter).gte = minAmount;
      if (maxAmount !== undefined) (where.total as Prisma.DecimalFilter).lte = maxAmount;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { number: { contains: term, mode: 'insensitive' } },
        { customer: { is: { name: { contains: term, mode: 'insensitive' } } } },
        { customer: { is: { nif: { contains: term, mode: 'insensitive' } } } },
        { tenant: { is: { businessName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    return where;
  }

  private async aggregateInvoicesSummary(where: Prisma.InvoiceWhereInput) {
    const [agg, distinctClients] = await Promise.all([
      this.prisma.invoice.aggregate({
        where,
        _sum: { subtotal: true, taxTotal: true, irpfTotal: true, surchargeTotal: true, total: true, amountPaid: true },
        _count: { _all: true },
      }),
      this.prisma.invoice.findMany({
        where,
        select: { tenantId: true },
        distinct: ['tenantId'],
      }),
    ]);

    const totalRevenue = Number(agg._sum.total ?? 0);
    const totalPaid = Number(agg._sum.amountPaid ?? 0);

    return {
      invoicesCount: agg._count._all,
      clientsCount: distinctClients.length,
      totalSubtotal: Number(agg._sum.subtotal ?? 0),
      totalIva: Number(agg._sum.taxTotal ?? 0),
      totalIrpf: Number(agg._sum.irpfTotal ?? 0),
      totalSurcharge: Number(agg._sum.surchargeTotal ?? 0),
      totalRevenue,
      totalPending: Math.max(0, totalRevenue - totalPaid),
    };
  }

  private emptyInvoicesResponse(page: number, limit: number) {
    return {
      data: [],
      meta: { total: 0, page, limit, totalPages: 1 },
      summary: {
        invoicesCount: 0,
        clientsCount: 0,
        totalSubtotal: 0,
        totalIva: 0,
        totalIrpf: 0,
        totalSurcharge: 0,
        totalRevenue: 0,
        totalPending: 0,
      },
    };
  }
}
