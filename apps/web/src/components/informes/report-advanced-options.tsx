'use client';

import { ReportType } from '@easyfactura/shared-types';
import type { ReportForm } from '@/hooks/use-report-form';
import { REPORT_TYPE_CONFIG } from '@/lib/report-config';
import { supportsMarginSort } from '@/lib/report-draft';
import { ReportTypeSelector } from './report-type-selector';
import { ReportOptionsFields } from './report-options-fields';
import { ReportTypeFilters } from './report-type-filters';

interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

function AdvancedSection({ title, hint, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** "Personalizar informe": everything beyond the quick questions. */
export function ReportAdvancedOptions({ form }: { form: ReportForm }) {
  const { draft } = form;
  const hasFilters = draft.type !== ReportType.SUMMARY;
  const hasOptions = !REPORT_TYPE_CONFIG[draft.type].isSnapshot;

  return (
    <div className="space-y-6 rounded-lg border bg-muted/30 p-4">
      <AdvancedSection title="1. ¿Qué quieres analizar?">
        <ReportTypeSelector value={draft.type} onChange={form.setType} />
      </AdvancedSection>
      {hasOptions && (
        <AdvancedSection title="2. ¿Cómo lo quieres ver?">
          <ReportOptionsFields
            type={draft.type}
            options={draft.options}
            onChange={form.setOptions}
            canSortByMargin={supportsMarginSort(draft)}
          />
        </AdvancedSection>
      )}
      {hasFilters && (
        <AdvancedSection
          title={`${hasOptions ? 3 : 2}. ¿Quieres limitarlo? (opcional)`}
          hint="Si no eliges nada en un filtro, se incluye todo."
        >
          <ReportTypeFilters type={draft.type} filters={draft.filters} onChange={form.setFilters} />
        </AdvancedSection>
      )}
    </div>
  );
}
