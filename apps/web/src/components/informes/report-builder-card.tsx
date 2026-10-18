'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportForm } from '@/hooks/use-report-form';
import { REPORT_TYPE_CONFIG } from '@/lib/report-config';
import { cn } from '@/lib/utils';
import { ReportQuickPicks } from './report-quick-picks';
import { ReportPeriodFields } from './report-period-fields';
import { ReportAdvancedOptions } from './report-advanced-options';

/** Simple mode (questions + period) with an expandable advanced mode. */
export function ReportBuilderCard({ form }: { form: ReportForm }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { draft } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Qué quieres saber?</CardTitle>
        <CardDescription>
          Elige una pregunta y el periodo. El informe se actualiza solo y puedes descargarlo en
          Excel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ReportQuickPicks activePresetId={form.activePresetId} onSelect={form.applyPreset} />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <ReportPeriodFields
              preset={draft.preset}
              range={draft.range}
              onChange={form.setPeriod}
              isSnapshot={REPORT_TYPE_CONFIG[draft.type].isSnapshot}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsAdvancedOpen((open) => !open)}
            aria-expanded={isAdvancedOpen}
            aria-controls="report-advanced-options"
            className="gap-2 self-start lg:self-auto"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Personalizar informe
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isAdvancedOpen && 'rotate-180')}
            />
          </Button>
        </div>
        {!form.isRangeValid && (
          <p className="text-sm text-destructive">
            La fecha de inicio debe ser anterior a la de fin.
          </p>
        )}

        {isAdvancedOpen && (
          <div id="report-advanced-options">
            <ReportAdvancedOptions form={form} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
