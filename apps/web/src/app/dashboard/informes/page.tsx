'use client';

import { ReportGroupRow } from '@easyfactura/shared-types';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { useReportForm } from '@/hooks/use-report-form';
import { useGenerateReport, useReportPreview } from '@/hooks/use-reports';
import { getDrillDown } from '@/lib/report-drilldown';
import { ReportBuilderCard } from '@/components/informes/report-builder-card';
import { ReportCurrentSummary } from '@/components/informes/report-current-summary';
import { ReportPreview } from '@/components/informes/report-preview';
import { ReportHistoryTable } from '@/components/informes/report-history-table';
import { ReportProLocked } from '@/components/informes/report-pro-locked';

export default function InformesPage() {
  const isPro = useHasProfessionalPlan();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Informes</h1>
        <p className="mt-2 text-muted-foreground">
          Responde a las preguntas de tu negocio en un clic y descárgalas en Excel
        </p>
      </div>
      {isPro ? <ReportsWorkspace /> : <ReportProLocked />}
    </div>
  );
}

function ReportsWorkspace() {
  const form = useReportForm();
  const preview = useReportPreview(form.request);
  const generate = useGenerateReport();

  // Only download what is on screen: no pending edits, no stale placeholder data.
  const isPreviewCurrent =
    Boolean(preview.data) && !preview.isPlaceholderData && !preview.error && !form.isSettling;

  function handleGenerate() {
    if (form.request) generate.mutate(form.request);
  }

  function getRowAction(row: ReportGroupRow<unknown>) {
    const drillDown = getDrillDown(form.draft, row);
    return drillDown && { label: drillDown.label, onSelect: () => form.drillDown(drillDown) };
  }

  return (
    <>
      <ReportBuilderCard form={form} />
      <ReportCurrentSummary
        form={form}
        isUpdating={form.isSettling || preview.isFetching}
        canGenerate={isPreviewCurrent}
        isGenerating={generate.isPending}
        onGenerate={handleGenerate}
      />
      <ReportPreview
        data={preview.data}
        isLoading={preview.isLoading}
        error={preview.error}
        getRowAction={getRowAction}
      />
      <ReportHistoryTable />
    </>
  );
}
