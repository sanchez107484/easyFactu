'use client';

import { ArrowLeft, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ReportForm } from '@/hooks/use-report-form';
import { describeReport, getFilterChips } from '@/lib/report-description';

interface ReportCurrentSummaryProps {
  form: ReportForm;
  isUpdating: boolean;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

/** "You are looking at…": plain-language description, active filters and actions. */
export function ReportCurrentSummary({
  form,
  isUpdating,
  canGenerate,
  isGenerating,
  onGenerate,
}: ReportCurrentSummaryProps) {
  const chips = getFilterChips(form.draft);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-sm" aria-live="polite">
          <span className="font-medium">Estás viendo: </span>
          {form.isRangeValid ? describeReport(form.draft) : 'revisa las fechas del periodo.'}
          {isUpdating && (
            <Loader2
              className="ml-2 inline h-3.5 w-3.5 animate-spin text-muted-foreground"
              aria-label="Actualizando"
            />
          )}
        </p>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <Badge
                key={`${chip.key}:${chip.value}`}
                variant="secondary"
                className="gap-1 pr-1 font-normal"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => form.removeFilter(chip)}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {chips.length > 1 && (
              <button
                type="button"
                onClick={form.clearFilters}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Quitar todos
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {form.canGoBack && (
          <Button variant="outline" onClick={form.goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        )}
        <Button onClick={onGenerate} disabled={!canGenerate || isGenerating} className="gap-2">
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Descargar Excel
        </Button>
      </div>
    </div>
  );
}
