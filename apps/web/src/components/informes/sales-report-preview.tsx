import {
  ReportDimension,
  ReportGroupRow,
  SalesMetrics,
  SalesReport,
} from '@easyfactura/shared-types';
import { formatCurrency } from '@/lib/utils';
import { ReportKpiCard, ReportKpiGrid } from './report-kpi-card';
import { ReportSection } from './report-section';
import { GroupedMetricColumn, GroupedReportTable, GroupedRowAction } from './grouped-report-table';
import { GroupedReportChart } from './grouped-report-chart';
import { groupedLabelHeader } from '@/lib/report-config';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);

const SALES_COLUMNS: GroupedMetricColumn<SalesMetrics>[] = [
  { header: 'Facturado', value: (m) => m.invoiced, format: formatCurrency, isCompared: true },
  { header: 'Unidades', value: (m) => m.units, format: formatNumber },
  { header: 'Facturas', value: (m) => m.invoicesCount, format: formatNumber },
  { header: 'Precio medio', value: (m) => m.averagePrice, format: formatCurrency },
];

const CUSTOMER_COLUMNS: GroupedMetricColumn<SalesMetrics>[] = [
  { header: 'Gastos imputados', value: (m) => m.expenses, format: formatCurrency },
  { header: 'Margen', value: (m) => m.margin, format: formatCurrency },
  { header: 'Pendiente de cobro', value: (m) => m.pendingGross, format: formatCurrency },
];

function compare(report: SalesReport, pick: (m: SalesMetrics) => number) {
  return report.previousTotals
    ? { current: pick(report.totals), previous: pick(report.previousTotals) }
    : undefined;
}

interface SalesReportPreviewProps {
  report: SalesReport;
  getRowAction?: (row: ReportGroupRow<unknown>) => GroupedRowAction | undefined;
}

export function SalesReportPreview({ report, getRowAction }: SalesReportPreviewProps) {
  const { totals, options } = report;
  const groupBy = options.groupBy ?? ReportDimension.CUSTOMER;
  const columns = report.hasCustomerMetrics
    ? [...SALES_COLUMNS, ...CUSTOMER_COLUMNS]
    : SALES_COLUMNS;
  const showsCustomerHint = groupBy === ReportDimension.CUSTOMER && !report.hasCustomerMetrics;

  return (
    <div className="space-y-4">
      <ReportKpiGrid>
        <ReportKpiCard
          label="Facturado"
          value={formatCurrency(totals.invoiced)}
          hint="Base imponible"
          comparison={compare(report, (m) => m.invoiced)}
        />
        <ReportKpiCard
          label="Facturas"
          value={formatNumber(totals.invoicesCount)}
          comparison={compare(report, (m) => m.invoicesCount)}
        />
        <ReportKpiCard
          label="Unidades"
          value={formatNumber(totals.units)}
          comparison={compare(report, (m) => m.units)}
        />
        {report.hasCustomerMetrics ? (
          <ReportKpiCard
            label="Pendiente de cobro"
            value={formatCurrency(totals.pendingGross ?? 0)}
            hint="Total factura (IVA incl.)"
          />
        ) : (
          <ReportKpiCard label="Precio medio" value={formatCurrency(totals.averagePrice)} />
        )}
      </ReportKpiGrid>

      <ReportSection
        title={`Ventas por ${groupedLabelHeader(options).toLowerCase()}`}
        description={
          showsCustomerHint
            ? 'Margen y cobros solo se muestran al agrupar por cliente sin desglose ni filtros de artículo.'
            : 'Importes en base imponible (sin IVA ni IRPF)'
        }
      >
        <GroupedReportChart
          rows={report.rows}
          groupBy={groupBy}
          value={(m) => m.invoiced}
          valueLabel="Facturado"
          hasComparison={report.previousTotals !== undefined}
        />
        <GroupedReportTable
          labelHeader={groupedLabelHeader(options)}
          rows={report.rows}
          totals={totals}
          previousTotals={report.previousTotals}
          columns={columns}
          getRowAction={getRowAction}
        />
      </ReportSection>
    </div>
  );
}
