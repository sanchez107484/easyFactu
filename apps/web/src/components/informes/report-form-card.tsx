'use client';

import { Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportForm } from '@/hooks/use-report-form';
import { ReportTypeSelector } from './report-type-selector';
import { ReportPeriodFields } from './report-period-fields';
import { ReportTypeFilters } from './report-type-filters';
import { ReportOptionsFields } from './report-options-fields';

interface ReportFormCardProps {
  form: ReportForm;
  isPreviewLoading: boolean;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function ReportFormCard({
  form,
  isPreviewLoading,
  canGenerate,
  isGenerating,
  onGenerate,
}: ReportFormCardProps) {
  const { draft } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo informe</CardTitle>
        <CardDescription>
          Elige el tipo de informe, cómo agruparlo y el periodo. Revisa la vista previa y descárgalo
          en Excel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ReportTypeSelector value={draft.type} onChange={form.setType} />
        <ReportPeriodFields preset={draft.preset} range={draft.range} onChange={form.setPeriod} />
        <ReportOptionsFields type={draft.type} options={draft.options} onChange={form.setOptions} />
        <ReportTypeFilters type={draft.type} filters={draft.filters} onChange={form.setFilters} />

        {!form.isRangeValid && (
          <p className="text-sm text-destructive">
            La fecha de inicio debe ser anterior a la de fin.
          </p>
        )}
        {form.isRangeValid && form.isDirty && (
          <p className="text-sm text-muted-foreground">
            Has cambiado los filtros. Pulsa «Ver informe» para aplicarlos antes de descargar.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={form.apply}
            disabled={!form.isRangeValid || isPreviewLoading}
            className="gap-2"
          >
            {isPreviewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Ver informe
          </Button>
          <Button
            onClick={onGenerate}
            disabled={!canGenerate || form.isDirty || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Descargar Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
