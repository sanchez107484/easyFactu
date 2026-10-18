'use client';

import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { useReportForm } from '@/hooks/use-report-form';
import { useGenerateReport, useReportPreview } from '@/hooks/use-reports';
import { ReportFormCard } from '@/components/informes/report-form-card';
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
          Analiza tus ingresos, gastos, clientes y artículos y descárgalos en Excel
        </p>
      </div>
      {isPro ? <ReportsWorkspace /> : <ReportProLocked />}
    </div>
  );
}

function ReportsWorkspace() {
  const form = useReportForm();
  const preview = useReportPreview(form.appliedRequest);
  const generate = useGenerateReport();

  function handleGenerate() {
    if (form.appliedRequest) generate.mutate(form.appliedRequest);
  }

  return (
    <>
      <ReportFormCard
        form={form}
        isPreviewLoading={preview.isFetching}
        canGenerate={Boolean(preview.data) && !preview.error}
        isGenerating={generate.isPending}
        onGenerate={handleGenerate}
      />
      <ReportPreview data={preview.data} isLoading={preview.isLoading} error={preview.error} />
      <ReportHistoryTable />
    </>
  );
}
