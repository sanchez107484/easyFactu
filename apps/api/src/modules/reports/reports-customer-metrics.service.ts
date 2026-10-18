import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReportAppliedFilters, ReportGroupRow, SalesMetrics } from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportPeriod } from './report-period.helpers';
import { sqlInList, toAmount } from './report-sql.helpers';
import { buildSalesInvoiceConditions } from './grouping/sales-source';

interface CustomerMetricsRow {
  customer_id: string;
  gross: string | null;
  collected: string | null;
  expenses: string | null;
}

/**
 * Invoice-level metrics (cash collected/pending, imputed expenses) that only make
 * sense per customer — they cannot be split across products.
 */
@Injectable()
export class ReportsCustomerMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async enrich(
    tenantId: string,
    period: ReportPeriod,
    filters: ReportAppliedFilters,
    rows: ReportGroupRow<SalesMetrics>[]
  ): Promise<ReportGroupRow<SalesMetrics>[]> {
    if (rows.length === 0) return rows;

    const metricsRows = await this.fetch(
      tenantId,
      period,
      filters,
      rows.map((row) => row.key)
    );
    const byCustomer = new Map(metricsRows.map((row) => [row.customer_id, row]));

    return rows.map((row) => {
      const extra = byCustomer.get(row.key);
      const expenses = toAmount(extra?.expenses);
      const collectedGross = toAmount(extra?.collected);
      return {
        ...row,
        metrics: {
          ...row.metrics,
          expenses,
          margin: toAmount(row.metrics.invoiced - expenses),
          collectedGross,
          pendingGross: toAmount(toAmount(extra?.gross) - collectedGross),
        },
      };
    });
  }

  private fetch(
    tenantId: string,
    period: ReportPeriod,
    filters: ReportAppliedFilters,
    customerIds: string[]
  ) {
    const invoiceWhere = Prisma.join(
      buildSalesInvoiceConditions(tenantId, period, filters),
      ' AND '
    );
    const ids = sqlInList(customerIds);

    return this.prisma.$queryRaw<CustomerMetricsRow[]>(Prisma.sql`
      WITH paid AS (
        SELECT p.invoice_id, SUM(p.amount) AS amount
        FROM payments p
        WHERE p.tenant_id = ${tenantId}
        GROUP BY p.invoice_id
      ),
      inv AS (
        SELECT i.customer_id, SUM(i.total) AS gross, SUM(COALESCE(paid.amount, 0)) AS collected
        FROM invoices i
        JOIN invoice_series s ON s.id = i.series_id
        LEFT JOIN paid ON paid.invoice_id = i.id
        WHERE ${invoiceWhere} AND i.customer_id IN (${ids})
        GROUP BY i.customer_id
      ),
      exp AS (
        SELECT e.client_id, SUM(e.base_amount) AS amount
        FROM expenses e
        WHERE e.tenant_id = ${tenantId}
          AND e.client_id IN (${ids})
          AND e.date >= ${period.from}
          AND e.date <= ${period.to}
        GROUP BY e.client_id
      )
      SELECT
        c.id               AS customer_id,
        inv.gross::text     AS gross,
        inv.collected::text AS collected,
        exp.amount::text    AS expenses
      FROM customers c
      LEFT JOIN inv ON inv.customer_id = c.id
      LEFT JOIN exp ON exp.client_id = c.id
      WHERE c.tenant_id = ${tenantId} AND c.id IN (${ids})
    `);
  }
}
