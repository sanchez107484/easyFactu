import { ExpenseMetrics, ExpensesReport, ReportDimension } from '@easyfactura/shared-types';
import { formatCurrency } from '@/lib/utils';
import { ReportKpiCard, ReportKpiGrid } from './report-kpi-card';
import { ReportSection } from './report-section';
import { GroupedMetricColumn, GroupedReportTable } from './grouped-report-table';
import { GroupedReportChart } from './grouped-report-chart';
import { groupedLabelHeader } from './report-type-config';

const EXPENSE_COLUMNS: GroupedMetricColumn<ExpenseMetrics>[] = [
  {
    header: 'Importe',
    value: (m) => m.amount,
    format: formatCurrency,
    isCompared: true,
    isHigherBetter: false,
  },
  { header: 'Nº gastos', value: (m) => m.count, format: String },
];

export function ExpensesReportPreview({ report }: { report: ExpensesReport }) {
  const { totals, previousTotals, options } = report;
  const groupBy = options.groupBy ?? ReportDimension.CATEGORY;
  const topGroup =
    groupBy === ReportDimension.PERIOD ? undefined : report.rows.find((row) => !row.isOther);

  return (
    <div className="space-y-4">
      <ReportKpiGrid>
        <ReportKpiCard
          label="Total gastos"
          value={formatCurrency(totals.amount)}
          hint="Base imponible"
          comparison={
            previousTotals
              ? { current: totals.amount, previous: previousTotals.amount, isHigherBetter: false }
              : undefined
          }
        />
        <ReportKpiCard
          label="Nº de gastos"
          value={String(totals.count)}
          comparison={
            previousTotals
              ? { current: totals.count, previous: previousTotals.count, isHigherBetter: false }
              : undefined
          }
        />
        <ReportKpiCard
          label="Gasto medio"
          value={formatCurrency(totals.count ? totals.amount / totals.count : 0)}
        />
        <ReportKpiCard
          label="Principal"
          value={topGroup?.label ?? '—'}
          hint={topGroup ? formatCurrency(topGroup.metrics.amount) : undefined}
        />
      </ReportKpiGrid>

      <ReportSection
        title={`Gastos por ${groupedLabelHeader(options).toLowerCase()}`}
        description="Importes en base imponible (sin IVA)"
      >
        <GroupedReportChart
          rows={report.rows}
          groupBy={groupBy}
          value={(m) => m.amount}
          valueLabel="Gastos"
          hasComparison={previousTotals !== undefined}
        />
        <GroupedReportTable
          labelHeader={groupedLabelHeader(options)}
          rows={report.rows}
          totals={totals}
          previousTotals={previousTotals}
          columns={EXPENSE_COLUMNS}
        />
      </ReportSection>
    </div>
  );
}
