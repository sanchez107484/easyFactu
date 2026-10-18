import { Prisma } from '@prisma/client';
import {
  CollectionMetrics,
  PaymentMethod,
  ReportAppliedFilters,
  ReportDimension,
  ReportTimeGrouping,
} from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { ReportPeriod, PERIOD_KEY_SQL_FORMAT } from '../report-period.helpers';
import { sqlInList, toAmount, toCount } from '../report-sql.helpers';
import { DimensionSql, GroupedSource, NULL_TEXT_SQL } from './grouped-source';
import { MetricsOps } from './grouped-rows.builder';

const NO_METHOD_KEY = '__none__';

/** The payment's own method, falling back to the method set on the invoice. */
const PAYMENT_METHOD_SQL = Prisma.sql`COALESCE(p.payment_method::text, i.payment_method::text)`;

/** Spanish labels come from the shared constants, passed as parameters (never interpolated). */
const PAYMENT_METHOD_LABEL_SQL = Prisma.sql`CASE ${PAYMENT_METHOD_SQL} ${Prisma.join(
  Object.values(PaymentMethod).map(
    (method) => Prisma.sql`WHEN ${method} THEN ${PAYMENT_METHOD_LABELS[method]}`
  ),
  ' '
)} ELSE 'Sin especificar' END`;

function collectionsDimension(
  dimension: ReportDimension,
  grouping: ReportTimeGrouping
): DimensionSql {
  switch (dimension) {
    case ReportDimension.CUSTOMER:
      return { key: Prisma.sql`c.id`, label: Prisma.sql`c.name`, sublabel: Prisma.sql`c.nif` };
    case ReportDimension.PAYMENT_METHOD:
      return {
        key: Prisma.sql`COALESCE(${PAYMENT_METHOD_SQL}, ${NO_METHOD_KEY})`,
        label: PAYMENT_METHOD_LABEL_SQL,
        sublabel: NULL_TEXT_SQL,
      };
    case ReportDimension.PERIOD: {
      const key = Prisma.sql`TO_CHAR(p.payment_date, ${PERIOD_KEY_SQL_FORMAT[grouping]})`;
      return { key, label: key, sublabel: NULL_TEXT_SQL };
    }
    default:
      throw new Error(`Unsupported collections dimension: ${dimension}`);
  }
}

/** Payments received, dated by payment date (cash in, taxes included). */
export const COLLECTIONS_SOURCE: GroupedSource = {
  from: Prisma.sql`
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id AND i.tenant_id = p.tenant_id
    JOIN customers c ON c.id = i.customer_id
    JOIN invoice_series s ON s.id = i.series_id
  `,
  rowId: Prisma.sql`p.id`,
  units: Prisma.sql`NULL::numeric`,
  amount: Prisma.sql`p.amount`,
  dimension: collectionsDimension,
};

export function buildCollectionsWhere(
  tenantId: string,
  { from, to }: ReportPeriod,
  filters: ReportAppliedFilters
): Prisma.Sql {
  const conditions = [
    Prisma.sql`p.tenant_id = ${tenantId}`,
    Prisma.sql`p.payment_date >= ${from}`,
    Prisma.sql`p.payment_date <= ${to}`,
  ];
  if (filters.customers) {
    conditions.push(
      Prisma.sql`i.customer_id IN (${sqlInList(filters.customers.map((c) => c.id))})`
    );
  }
  if (filters.seriesCodes) {
    conditions.push(Prisma.sql`s.code IN (${sqlInList(filters.seriesCodes)})`);
  }
  if (filters.paymentMethods) {
    conditions.push(Prisma.sql`${PAYMENT_METHOD_SQL} IN (${sqlInList(filters.paymentMethods)})`);
  }
  return Prisma.join(conditions, ' AND ');
}

export const COLLECTION_METRICS_OPS: MetricsOps<CollectionMetrics> = {
  fromRaw: (raw) => ({ amount: toAmount(raw.amount), count: toCount(raw.cnt) }),
  zero: () => ({ amount: 0, count: 0 }),
  add: (a, b) => ({ amount: toAmount(a.amount + b.amount), count: a.count + b.count }),
};
