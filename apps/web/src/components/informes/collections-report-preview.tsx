import {
  CollectionMetrics,
  CollectionsReport,
  ReportDimension,
  ReportGroupRow,
} from '@easyfactura/shared-types';
import { formatCurrency } from '@/lib/utils';
import { groupedLabelHeader } from '@/lib/report-config';
import { ReportKpiCard, ReportKpiGrid } from './report-kpi-card';
import { ReportSection } from './report-section';
import { GroupedMetricColumn, GroupedReportTable, GroupedRowAction } from './grouped-report-table';
import { GroupedReportChart } from './grouped-report-chart';

const COLLECTION_COLUMNS: GroupedMetricColumn<CollectionMetrics>[] = [
  { header: 'Cobrado', value: (m) => m.amount, format: formatCurrency, isCompared: true },
  { header: 'Nº cobros', value: (m) => m.count, format: String },
];

interface CollectionsReportPreviewProps {
  report: CollectionsReport;
  getRowAction?: (row: ReportGroupRow<unknown>) => GroupedRowAction | undefined;
}

function collectedShare(report: CollectionsReport): string {
  if (report.invoicedGross <= 0) return '—';
  return `${Math.round((report.totals.amount / report.invoicedGross) * 100)} %`;
}

export function CollectionsReportPreview({ report, getRowAction }: CollectionsReportPreviewProps) {
  const { totals, previousTotals, options } = report;
  const groupBy = options.groupBy ?? ReportDimension.PERIOD;

  return (
    <div className="space-y-4">
      <ReportKpiGrid>
        <ReportKpiCard
          label="Cobrado"
          value={formatCurrency(totals.amount)}
          hint="IVA incluido"
          comparison={
            previousTotals ? { current: totals.amount, previous: previousTotals.amount } : undefined
          }
        />
        <ReportKpiCard
          label="Nº de cobros"
          value={String(totals.count)}
          comparison={
            previousTotals ? { current: totals.count, previous: previousTotals.count } : undefined
          }
        />
        <ReportKpiCard
          label="Facturado en el periodo"
          value={formatCurrency(report.invoicedGross)}
          hint="IVA incluido"
        />
        <ReportKpiCard
          label="Cobrado sobre facturado"
          value={collectedShare(report)}
          hint="Incluye cobros de facturas de otros periodos"
        />
      </ReportKpiGrid>

      <ReportSection
        title={`Cobros por ${groupedLabelHeader(options).toLowerCase()}`}
        description="Según la fecha de cobro. Importes con IVA incluido."
      >
        <GroupedReportChart
          rows={report.rows}
          groupBy={groupBy}
          value={(m) => m.amount}
          valueLabel="Cobrado"
          hasComparison={previousTotals !== undefined}
        />
        <GroupedReportTable
          labelHeader={groupedLabelHeader(options)}
          rows={report.rows}
          totals={totals}
          previousTotals={previousTotals}
          columns={COLLECTION_COLUMNS}
          getRowAction={getRowAction}
        />
      </ReportSection>
    </div>
  );
}
