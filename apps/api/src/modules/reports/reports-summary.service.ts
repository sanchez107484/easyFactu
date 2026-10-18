import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ReportOptions,
  ReportTimeGrouping,
  ReportType,
  SummaryReport,
  SummaryValues,
} from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildRevenueInvoiceFilter } from '../invoices/invoice-revenue-filter';
import {
  PERIOD_KEY_SQL_FORMAT,
  ReportPeriod,
  buildBucketKeyMap,
  formatBucketLabel,
  getComparisonPeriod,
  listBuckets,
  toDateRange,
} from './report-period.helpers';
import { INVOICE_NET_BASE_SQL, toAmount, toCount } from './report-sql.helpers';

interface BucketAmountRow {
  bucket: string;
  amount: string | null;
  count: bigint;
}

interface PeriodSummary {
  byBucket: Map<string, SummaryValues>;
  totals: SummaryReport['totals'];
}

/** Income vs expenses vs result (tax base) per month / quarter / year. */
@Injectable()
export class ReportsSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    tenantId: string,
    period: ReportPeriod,
    options: ReportOptions
  ): Promise<SummaryReport> {
    const comparisonPeriod = getComparisonPeriod(period, options.comparison);
    const [current, previous] = await Promise.all([
      this.summarize(tenantId, period, options.timeGrouping),
      comparisonPeriod
        ? this.summarize(tenantId, comparisonPeriod, options.timeGrouping)
        : undefined,
    ]);

    const previousByCurrentKey =
      previous && comparisonPeriod
        ? remapBuckets(
            previous.byBucket,
            buildBucketKeyMap(period, comparisonPeriod, options.timeGrouping)
          )
        : undefined;

    const buckets = listBuckets(period, options.timeGrouping).map((key) => ({
      period: key,
      label: formatBucketLabel(key),
      ...(current.byBucket.get(key) ?? zeroValues()),
      previous: previousByCurrentKey ? (previousByCurrentKey.get(key) ?? zeroValues()) : undefined,
    }));

    return {
      type: ReportType.SUMMARY,
      options,
      comparisonPeriod: comparisonPeriod ? toDateRange(comparisonPeriod) : undefined,
      totals: current.totals,
      previousTotals: previous?.totals,
      buckets,
    };
  }

  private async summarize(
    tenantId: string,
    period: ReportPeriod,
    grouping: ReportTimeGrouping
  ): Promise<PeriodSummary> {
    const [incomeRows, expenseRows] = await Promise.all([
      this.fetchIncome(tenantId, period, grouping),
      this.fetchExpenses(tenantId, period, grouping),
    ]);
    const income = new Map(incomeRows.map((r) => [r.bucket, toAmount(r.amount)]));
    const expenses = new Map(expenseRows.map((r) => [r.bucket, toAmount(r.amount)]));

    const byBucket = new Map<string, SummaryValues>();
    for (const key of new Set([...income.keys(), ...expenses.keys()])) {
      byBucket.set(key, toValues(income.get(key) ?? 0, expenses.get(key) ?? 0));
    }

    const totalIncome = toAmount([...income.values()].reduce((a, b) => a + b, 0));
    const totalExpenses = toAmount([...expenses.values()].reduce((a, b) => a + b, 0));
    return {
      byBucket,
      totals: {
        ...toValues(totalIncome, totalExpenses),
        invoicesCount: incomeRows.reduce((sum, r) => sum + toCount(r.count), 0),
        expensesCount: expenseRows.reduce((sum, r) => sum + toCount(r.count), 0),
      },
    };
  }

  private fetchIncome(tenantId: string, { from, to }: ReportPeriod, grouping: ReportTimeGrouping) {
    return this.prisma.$queryRaw<BucketAmountRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(i.issue_date, ${PERIOD_KEY_SQL_FORMAT[grouping]}) AS bucket,
        SUM(${INVOICE_NET_BASE_SQL})::text AS amount,
        COUNT(*) AS count
      FROM invoices i
      WHERE i.tenant_id = ${tenantId}
        AND ${buildRevenueInvoiceFilter('i')}
        AND i.issue_date >= ${from}
        AND i.issue_date <= ${to}
      GROUP BY bucket
    `);
  }

  private fetchExpenses(
    tenantId: string,
    { from, to }: ReportPeriod,
    grouping: ReportTimeGrouping
  ) {
    return this.prisma.$queryRaw<BucketAmountRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(e.date, ${PERIOD_KEY_SQL_FORMAT[grouping]}) AS bucket,
        SUM(e.base_amount)::text AS amount,
        COUNT(*) AS count
      FROM expenses e
      WHERE e.tenant_id = ${tenantId}
        AND e.date >= ${from}
        AND e.date <= ${to}
      GROUP BY bucket
    `);
  }
}

function toValues(income: number, expenses: number): SummaryValues {
  return { income, expenses, result: toAmount(income - expenses) };
}

function zeroValues(): SummaryValues {
  return { income: 0, expenses: 0, result: 0 };
}

function remapBuckets(
  byBucket: Map<string, SummaryValues>,
  keyMap: Map<string, string>
): Map<string, SummaryValues> {
  const remapped = new Map<string, SummaryValues>();
  for (const [key, values] of byBucket) {
    const currentKey = keyMap.get(key);
    if (currentKey) remapped.set(currentKey, values);
  }
  return remapped;
}
