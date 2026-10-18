import { Injectable } from '@nestjs/common';
import {
  ReportDateRange,
  ReportDimension,
  ReportGroupRow,
  ReportOptions,
} from '@easyfactura/shared-types';
import {
  ReportPeriod,
  buildBucketKeyMap,
  getComparisonPeriod,
  listBuckets,
  toDateRange,
} from '../report-period.helpers';
import { GroupedQueryService } from './grouped-query.service';
import { GroupedQuery } from './grouped-source';
import {
  ComparisonKeyMaps,
  GroupedTree,
  MetricsOps,
  applyTopN,
  attachComparison,
  buildTree,
  fillPeriodBuckets,
  sortRows,
} from './grouped-rows.builder';

export interface GroupedReportInput<M> {
  period: ReportPeriod;
  options: ReportOptions & { groupBy: ReportDimension };
  ops: MetricsOps<M>;
  /** The source query for a given period (filters stay the same, dates change). */
  buildQuery: (period: ReportPeriod) => GroupedQuery;
  /** Optional extra metrics merged into first-level rows before topN folding. */
  enrichGroups?: (rows: ReportGroupRow<M>[]) => Promise<ReportGroupRow<M>[]>;
  /** Ranking metric; when omitted the SQL order (by amount) is kept. */
  sortValue?: (metrics: M) => number;
}

export interface GroupedReportOutput<M> {
  totals: M;
  previousTotals?: M;
  rows: ReportGroupRow<M>[];
  comparisonPeriod?: ReportDateRange;
}

/** Shared pipeline: query → tree → enrich → comparison → empty buckets → top N. */
@Injectable()
export class GroupedReportService {
  constructor(private readonly queryService: GroupedQueryService) {}

  async build<M>(input: GroupedReportInput<M>): Promise<GroupedReportOutput<M>> {
    const { period, options, ops } = input;
    const comparisonPeriod = getComparisonPeriod(period, options.comparison);

    const [current, previous] = await Promise.all([
      this.buildTreeFor(input, period),
      comparisonPeriod ? this.buildTreeFor(input, comparisonPeriod) : undefined,
    ]);

    let rows = input.enrichGroups ? await input.enrichGroups(current.rows) : current.rows;
    if (previous && comparisonPeriod) {
      const keyMaps = buildKeyMaps(period, comparisonPeriod, options);
      rows = attachComparison(rows, previous.rows, keyMaps);
    }
    if (options.groupBy === ReportDimension.PERIOD) {
      rows = fillPeriodBuckets(rows, listBuckets(period, options.timeGrouping), ops);
    } else if (input.sortValue) {
      rows = sortRows(rows, input.sortValue);
    }

    return {
      totals: current.totals,
      previousTotals: previous?.totals,
      rows: applyTopN(rows, options.topN, ops),
      comparisonPeriod: comparisonPeriod ? toDateRange(comparisonPeriod) : undefined,
    };
  }

  private async buildTreeFor<M>(
    input: GroupedReportInput<M>,
    period: ReportPeriod
  ): Promise<GroupedTree<M>> {
    const result = await this.queryService.run(input.buildQuery(period));
    return buildTree(result, input.options, input.ops);
  }
}

function buildKeyMaps(
  period: ReportPeriod,
  comparisonPeriod: ReportPeriod,
  options: ReportOptions
): ComparisonKeyMaps {
  const periodMap = (dimension: ReportDimension | undefined) =>
    dimension === ReportDimension.PERIOD
      ? buildBucketKeyMap(period, comparisonPeriod, options.timeGrouping)
      : undefined;
  return { group: periodMap(options.groupBy), breakdown: periodMap(options.breakdownBy) };
}
