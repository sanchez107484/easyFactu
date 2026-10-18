import { SummaryReport, SummaryReportBucket, SummaryValues } from '@easyfactura/shared-types';
import { formatCurrency } from '@/lib/utils';
import { ReportKpiCard, ReportKpiGrid } from './report-kpi-card';
import { REPORT_CHART_COLORS, ReportPeriodChart } from './report-charts';
import { ReportSection } from './report-section';
import { ReportTable, ReportTableColumn } from './report-table';
import { ReportVariation } from './report-variation';
import { TIME_GROUPING_LABELS } from './report-type-config';

const FIELDS: { key: keyof SummaryValues; header: string; isHigherBetter: boolean }[] = [
  { key: 'income', header: 'Ingresos', isHigherBetter: true },
  { key: 'expenses', header: 'Gastos', isHigherBetter: false },
  { key: 'result', header: 'Resultado', isHigherBetter: true },
];

function buildColumns(report: SummaryReport): ReportTableColumn<SummaryReportBucket>[] {
  const { totals, previousTotals } = report;
  const columns: ReportTableColumn<SummaryReportBucket>[] = [
    {
      header: TIME_GROUPING_LABELS[report.options.timeGrouping],
      render: (b) => b.label,
      total: 'Total',
    },
  ];
  for (const { key, header, isHigherBetter } of FIELDS) {
    columns.push({
      header,
      align: 'right',
      render: (b) => formatCurrency(b[key]),
      total: formatCurrency(totals[key]),
    });
    if (previousTotals) {
      columns.push({
        header: 'Var.',
        align: 'right',
        render: (b) => (
          <ReportVariation
            current={b[key]}
            previous={b.previous?.[key]}
            isHigherBetter={isHigherBetter}
          />
        ),
        total: (
          <ReportVariation
            current={totals[key]}
            previous={previousTotals[key]}
            isHigherBetter={isHigherBetter}
          />
        ),
      });
    }
  }
  return columns;
}

function comparisonFor(report: SummaryReport, key: keyof SummaryValues, isHigherBetter = true) {
  if (!report.previousTotals) return undefined;
  return { current: report.totals[key], previous: report.previousTotals[key], isHigherBetter };
}

function getMarginLabel(income: number, result: number): string | undefined {
  if (income <= 0) return undefined;
  return `Margen ${Math.round((result / income) * 100)}%`;
}

export function SummaryReportPreview({ report }: { report: SummaryReport }) {
  const { totals } = report;

  return (
    <div className="space-y-4">
      <ReportKpiGrid>
        <ReportKpiCard
          label="Ingresos"
          value={formatCurrency(totals.income)}
          hint={`${totals.invoicesCount} facturas`}
          comparison={comparisonFor(report, 'income')}
        />
        <ReportKpiCard
          label="Gastos"
          value={formatCurrency(totals.expenses)}
          hint={`${totals.expensesCount} gastos`}
          comparison={comparisonFor(report, 'expenses', false)}
        />
        <ReportKpiCard
          label="Resultado"
          value={formatCurrency(totals.result)}
          hint={getMarginLabel(totals.income, totals.result)}
          tone={totals.result >= 0 ? 'positive' : 'negative'}
          comparison={comparisonFor(report, 'result')}
        />
        <ReportKpiCard
          label={`Media por ${TIME_GROUPING_LABELS[report.options.timeGrouping].toLowerCase()}`}
          value={formatCurrency(report.buckets.length ? totals.result / report.buckets.length : 0)}
          hint="Resultado medio"
        />
      </ReportKpiGrid>

      <ReportSection title="Evolución" description="Importes en base imponible (sin IVA ni IRPF)">
        <ReportPeriodChart
          data={report.buckets}
          series={[
            { key: 'income', label: 'Ingresos', color: REPORT_CHART_COLORS.primary },
            { key: 'expenses', label: 'Gastos', color: REPORT_CHART_COLORS.neutral },
          ]}
        />
        <ReportTable
          rows={report.buckets}
          getRowKey={(b) => b.period}
          columns={buildColumns(report)}
        />
      </ReportSection>
    </div>
  );
}
