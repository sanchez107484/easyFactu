'use client';

import { ReportDimension, ReportGroupRow } from '@easyfactura/shared-types';
import { REPORT_CHART_COLORS, ReportPeriodChart, ReportRankingChart } from './report-charts';

interface GroupedReportChartProps<M> {
  rows: ReportGroupRow<M>[];
  groupBy: ReportDimension;
  value: (metrics: M) => number;
  valueLabel: string;
  hasComparison: boolean;
}

/** Period groups → bars over time (with the comparison period); other groups → top 10 ranking. */
export function GroupedReportChart<M>({
  rows,
  groupBy,
  value,
  valueLabel,
  hasComparison,
}: GroupedReportChartProps<M>) {
  if (groupBy === ReportDimension.PERIOD) {
    const data = rows.map((row) => ({
      label: row.label,
      current: value(row.metrics),
      previous: row.previous ? value(row.previous) : 0,
    }));
    return (
      <ReportPeriodChart
        data={data}
        series={[
          { key: 'current', label: valueLabel, color: REPORT_CHART_COLORS.primary },
          ...(hasComparison
            ? [
                {
                  key: 'previous' as const,
                  label: 'Periodo de comparación',
                  color: REPORT_CHART_COLORS.neutral,
                },
              ]
            : []),
        ]}
      />
    );
  }

  return (
    <ReportRankingChart
      data={rows
        .filter((row) => !row.isOther)
        .map((row) => ({ label: row.label, value: value(row.metrics) }))}
      valueLabel={valueLabel}
    />
  );
}
