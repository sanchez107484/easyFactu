import { Prisma } from '@prisma/client';
import {
  ExpenseMetrics,
  ReportAppliedFilters,
  ReportDimension,
  ReportTimeGrouping,
} from '@easyfactura/shared-types';
import { ReportPeriod, PERIOD_KEY_SQL_FORMAT } from '../report-period.helpers';
import { sqlInList, toAmount, toCount } from '../report-sql.helpers';
import { DimensionSql, GroupedSource, NULL_TEXT_SQL } from './grouped-source';
import { MetricsOps } from './grouped-rows.builder';

const NO_SUPPLIER_KEY = '__none__';

function expensesDimension(dimension: ReportDimension, grouping: ReportTimeGrouping): DimensionSql {
  switch (dimension) {
    case ReportDimension.CATEGORY:
      return {
        key: Prisma.sql`e.category_id`,
        label: Prisma.sql`COALESCE(ec.name, 'Sin categoría')`,
        sublabel: NULL_TEXT_SQL,
      };
    case ReportDimension.SUPPLIER:
      return {
        key: Prisma.sql`COALESCE(e.supplier_id, ${NO_SUPPLIER_KEY})`,
        label: Prisma.sql`COALESCE(sp.name, 'Sin proveedor')`,
        sublabel: Prisma.sql`sp.tax_id`,
      };
    case ReportDimension.PERIOD: {
      const key = Prisma.sql`TO_CHAR(e.date, ${PERIOD_KEY_SQL_FORMAT[grouping]})`;
      return { key, label: key, sublabel: NULL_TEXT_SQL };
    }
    default:
      throw new Error(`Unsupported expenses dimension: ${dimension}`);
  }
}

export const EXPENSES_SOURCE: GroupedSource = {
  from: Prisma.sql`
    FROM expenses e
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    LEFT JOIN suppliers sp ON sp.id = e.supplier_id AND sp.tenant_id = e.tenant_id
  `,
  rowId: Prisma.sql`e.id`,
  units: Prisma.sql`NULL::numeric`,
  amount: Prisma.sql`e.base_amount`,
  dimension: expensesDimension,
};

export function buildExpensesWhere(
  tenantId: string,
  { from, to }: ReportPeriod,
  filters: ReportAppliedFilters
): Prisma.Sql {
  const conditions = [
    Prisma.sql`e.tenant_id = ${tenantId}`,
    Prisma.sql`e.date >= ${from}`,
    Prisma.sql`e.date <= ${to}`,
  ];
  if (filters.categories) {
    conditions.push(
      Prisma.sql`e.category_id IN (${sqlInList(filters.categories.map((c) => c.id))})`
    );
  }
  if (filters.suppliers) {
    conditions.push(
      Prisma.sql`e.supplier_id IN (${sqlInList(filters.suppliers.map((s) => s.id))})`
    );
  }
  return Prisma.join(conditions, ' AND ');
}

export const EXPENSE_METRICS_OPS: MetricsOps<ExpenseMetrics> = {
  fromRaw: (raw) => ({ amount: toAmount(raw.amount), count: toCount(raw.cnt) }),
  zero: () => ({ amount: 0, count: 0 }),
  add: (a, b) => ({ amount: toAmount(a.amount + b.amount), count: a.count + b.count }),
};
