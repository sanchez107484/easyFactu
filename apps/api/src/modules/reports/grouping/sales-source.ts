import { Prisma } from '@prisma/client';
import {
  ReportAppliedFilters,
  ReportDimension,
  ReportTimeGrouping,
  SalesMetrics,
} from '@easyfactura/shared-types';
import { buildRevenueInvoiceFilter } from '../../invoices/invoice-revenue-filter';
import { ReportPeriod, PERIOD_KEY_SQL_FORMAT } from '../report-period.helpers';
import { LINE_NET_BASE_SQL, sqlInList, toAmount, toCount } from '../report-sql.helpers';
import { DimensionSql, GroupedSource, NULL_TEXT_SQL } from './grouped-source';
import { MetricsOps } from './grouped-rows.builder';

export const FREE_TEXT_PRODUCT_KEY = '__free__';
const FREE_TEXT_PRODUCT_LABEL = 'Sin artículo (concepto libre)';

function salesDimension(dimension: ReportDimension, grouping: ReportTimeGrouping): DimensionSql {
  switch (dimension) {
    case ReportDimension.CUSTOMER:
      return { key: Prisma.sql`c.id`, label: Prisma.sql`c.name`, sublabel: Prisma.sql`c.nif` };
    case ReportDimension.PRODUCT:
      return {
        key: Prisma.sql`COALESCE(l.product_id, ${FREE_TEXT_PRODUCT_KEY})`,
        label: Prisma.sql`COALESCE(p.name, ${FREE_TEXT_PRODUCT_LABEL})`,
        sublabel: Prisma.sql`p.reference`,
      };
    case ReportDimension.PERIOD: {
      const key = Prisma.sql`TO_CHAR(i.issue_date, ${PERIOD_KEY_SQL_FORMAT[grouping]})`;
      return { key, label: key, sublabel: NULL_TEXT_SQL };
    }
    default:
      throw new Error(`Unsupported sales dimension: ${dimension}`);
  }
}

/** Invoice lines of revenue-counting invoices (rectificatives included algebraically). */
export const SALES_SOURCE: GroupedSource = {
  from: Prisma.sql`
    FROM invoice_lines l
    JOIN invoices i ON i.id = l.invoice_id AND i.tenant_id = l.tenant_id
    JOIN customers c ON c.id = i.customer_id
    JOIN invoice_series s ON s.id = i.series_id
    LEFT JOIN products p ON p.id = l.product_id AND p.tenant_id = l.tenant_id
  `,
  rowId: Prisma.sql`i.id`,
  units: Prisma.sql`l.quantity`,
  amount: LINE_NET_BASE_SQL,
  dimension: salesDimension,
};

/** Invoice-level conditions — shared with the customer metrics query (alias `i`, `s`). */
export function buildSalesInvoiceConditions(
  tenantId: string,
  { from, to }: ReportPeriod,
  filters: ReportAppliedFilters
): Prisma.Sql[] {
  const conditions = [
    Prisma.sql`i.tenant_id = ${tenantId}`,
    buildRevenueInvoiceFilter('i'),
    Prisma.sql`i.issue_date >= ${from}`,
    Prisma.sql`i.issue_date <= ${to}`,
  ];
  if (filters.customers) {
    conditions.push(
      Prisma.sql`i.customer_id IN (${sqlInList(filters.customers.map((c) => c.id))})`
    );
  }
  if (filters.seriesCodes) {
    conditions.push(Prisma.sql`s.code IN (${sqlInList(filters.seriesCodes)})`);
  }
  if (filters.paymentStatuses) {
    conditions.push(Prisma.sql`i.payment_status::text IN (${sqlInList(filters.paymentStatuses)})`);
  }
  return conditions;
}

export function buildSalesWhere(
  tenantId: string,
  period: ReportPeriod,
  filters: ReportAppliedFilters
): Prisma.Sql {
  const conditions = [
    Prisma.sql`l.tenant_id = ${tenantId}`,
    ...buildSalesInvoiceConditions(tenantId, period, filters),
  ];
  if (filters.products) {
    conditions.push(Prisma.sql`l.product_id IN (${sqlInList(filters.products.map((p) => p.id))})`);
  }
  if (filters.productType) {
    conditions.push(Prisma.sql`p.type::text = ${filters.productType}`);
  }
  return Prisma.join(conditions, ' AND ');
}

function withAveragePrice(metrics: Omit<SalesMetrics, 'averagePrice'>): SalesMetrics {
  const averagePrice = metrics.units === 0 ? 0 : toAmount(metrics.invoiced / metrics.units);
  return { ...metrics, averagePrice };
}

function addOptional(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined && b === undefined ? undefined : toAmount((a ?? 0) + (b ?? 0));
}

export const SALES_METRICS_OPS: MetricsOps<SalesMetrics> = {
  fromRaw: (raw) =>
    withAveragePrice({
      invoiced: toAmount(raw.amount),
      units: toAmount(raw.units),
      invoicesCount: toCount(raw.cnt),
    }),
  zero: () => ({ invoiced: 0, units: 0, invoicesCount: 0, averagePrice: 0 }),
  add: (a, b) =>
    withAveragePrice({
      invoiced: toAmount(a.invoiced + b.invoiced),
      units: toAmount(a.units + b.units),
      invoicesCount: a.invoicesCount + b.invoicesCount,
      expenses: addOptional(a.expenses, b.expenses),
      margin: addOptional(a.margin, b.margin),
      collectedGross: addOptional(a.collectedGross, b.collectedGross),
      pendingGross: addOptional(a.pendingGross, b.pendingGross),
    }),
};
