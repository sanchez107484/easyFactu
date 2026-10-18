import { Injectable } from '@nestjs/common';
import {
  ReportAppliedFilters,
  ReportDimension,
  ReportOptions,
  ReportType,
  SalesMetrics,
  SalesReport,
} from '@easyfactura/shared-types';
import { ReportPeriod } from './report-period.helpers';
import { toAmount } from './report-sql.helpers';
import { GroupedReportService } from './grouping/grouped-report.service';
import { SALES_METRICS_OPS, SALES_SOURCE, buildSalesWhere } from './grouping/sales-source';
import { ReportsCustomerMetricsService } from './reports-customer-metrics.service';

type GroupedOptions = ReportOptions & { groupBy: ReportDimension };

/** Sales grouped by customer / product / period, with optional breakdown. */
@Injectable()
export class ReportsSalesService {
  constructor(
    private readonly groupedReport: GroupedReportService,
    private readonly customerMetrics: ReportsCustomerMetricsService
  ) {}

  async build(
    tenantId: string,
    period: ReportPeriod,
    options: GroupedOptions,
    filters: ReportAppliedFilters
  ): Promise<SalesReport> {
    const hasCustomerMetrics = supportsCustomerMetrics(options, filters);

    const output = await this.groupedReport.build({
      period,
      options,
      ops: SALES_METRICS_OPS,
      buildQuery: (queryPeriod) => ({
        source: SALES_SOURCE,
        where: buildSalesWhere(tenantId, queryPeriod, filters),
        groupBy: options.groupBy,
        breakdownBy: options.breakdownBy,
        timeGrouping: options.timeGrouping,
      }),
      enrichGroups: hasCustomerMetrics
        ? (rows) => this.customerMetrics.enrich(tenantId, period, filters, rows)
        : undefined,
    });

    return {
      type: ReportType.SALES,
      options,
      comparisonPeriod: output.comparisonPeriod,
      totals: hasCustomerMetrics ? withCustomerTotals(output.totals, output.rows) : output.totals,
      previousTotals: output.previousTotals,
      rows: output.rows,
      hasCustomerMetrics,
    };
  }
}

/** Invoice-level metrics are only meaningful when every row is a whole customer. */
function supportsCustomerMetrics(options: GroupedOptions, filters: ReportAppliedFilters): boolean {
  return (
    options.groupBy === ReportDimension.CUSTOMER &&
    options.breakdownBy !== ReportDimension.PRODUCT &&
    !filters.products &&
    !filters.productType
  );
}

/** Totals keep the SQL distinct invoice count; customer-only sums come from the rows. */
function withCustomerTotals(totals: SalesMetrics, rows: SalesReport['rows']): SalesMetrics {
  const sum = (pick: (metrics: SalesMetrics) => number | undefined) =>
    toAmount(rows.reduce((acc, row) => acc + (pick(row.metrics) ?? 0), 0));

  return {
    ...totals,
    expenses: sum((m) => m.expenses),
    margin: sum((m) => m.margin),
    collectedGross: sum((m) => m.collectedGross),
    pendingGross: sum((m) => m.pendingGross),
  };
}
