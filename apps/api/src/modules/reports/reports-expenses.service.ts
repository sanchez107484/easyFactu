import { Injectable } from '@nestjs/common';
import {
  ExpensesReport,
  ReportAppliedFilters,
  ReportDimension,
  ReportOptions,
  ReportType,
} from '@easyfactura/shared-types';
import { ReportPeriod } from './report-period.helpers';
import { GroupedReportService } from './grouping/grouped-report.service';
import {
  EXPENSES_SOURCE,
  EXPENSE_METRICS_OPS,
  buildExpensesWhere,
} from './grouping/expenses-source';

/** Expenses (tax base) grouped by category / supplier / period. */
@Injectable()
export class ReportsExpensesService {
  constructor(private readonly groupedReport: GroupedReportService) {}

  async build(
    tenantId: string,
    period: ReportPeriod,
    options: ReportOptions & { groupBy: ReportDimension },
    filters: ReportAppliedFilters
  ): Promise<ExpensesReport> {
    const output = await this.groupedReport.build({
      period,
      options,
      ops: EXPENSE_METRICS_OPS,
      buildQuery: (queryPeriod) => ({
        source: EXPENSES_SOURCE,
        where: buildExpensesWhere(tenantId, queryPeriod, filters),
        groupBy: options.groupBy,
        breakdownBy: options.breakdownBy,
        timeGrouping: options.timeGrouping,
      }),
    });

    return {
      type: ReportType.EXPENSES,
      options,
      comparisonPeriod: output.comparisonPeriod,
      totals: output.totals,
      previousTotals: output.previousTotals,
      rows: output.rows,
    };
  }
}
