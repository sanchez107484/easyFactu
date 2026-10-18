import { ReceivableAgingBucket, ReceivablesReport } from '@easyfactura/shared-types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AGING_BUCKET_LABELS } from '@/lib/report-config';
import { ReportKpiCard, ReportKpiGrid } from './report-kpi-card';
import { REPORT_CHART_COLORS, ReportPeriodChart } from './report-charts';
import { ReportSection } from './report-section';
import { ReceivablesTable } from './receivables-table';

function overdueShare({
  pendingGross,
  overdueGross,
}: ReceivablesReport['totals']): string | undefined {
  if (pendingGross <= 0) return undefined;
  return `${Math.round((overdueGross / pendingGross) * 100)} % del total`;
}

export function ReceivablesReportPreview({ report }: { report: ReceivablesReport }) {
  const { totals } = report;
  const agingData = Object.values(ReceivableAgingBucket).map((bucket) => ({
    label: AGING_BUCKET_LABELS[bucket],
    amount: totals.aging[bucket],
  }));

  return (
    <div className="space-y-4">
      <ReportKpiGrid>
        <ReportKpiCard
          label="Pendiente de cobro"
          value={formatCurrency(totals.pendingGross)}
          hint={`A ${formatDate(report.asOfDate)} · IVA incluido`}
        />
        <ReportKpiCard
          label="Vencido"
          value={formatCurrency(totals.overdueGross)}
          hint={overdueShare(totals)}
          tone={totals.overdueGross > 0 ? 'negative' : 'default'}
        />
        <ReportKpiCard label="Facturas pendientes" value={String(totals.invoicesCount)} />
        <ReportKpiCard label="Clientes que te deben" value={String(totals.customersCount)} />
      </ReportKpiGrid>

      <ReportSection
        title="Antigüedad de la deuda"
        description="Cuánto tiempo llevan vencidas las facturas (desde su fecha de vencimiento o, si no tienen, desde su emisión)."
      >
        <ReportPeriodChart
          data={agingData}
          series={[{ key: 'amount', label: 'Pendiente', color: REPORT_CHART_COLORS.primary }]}
        />
        <ReceivablesTable report={report} />
      </ReportSection>
    </div>
  );
}
