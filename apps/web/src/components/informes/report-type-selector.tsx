'use client';

import { ReportType } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';
import { REPORT_TYPES, REPORT_TYPE_CONFIG } from './report-type-config';

interface ReportTypeSelectorProps {
  value: ReportType;
  onChange: (type: ReportType) => void;
}

export function ReportTypeSelector({ value, onChange }: ReportTypeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Tipo de informe" className="grid gap-3 sm:grid-cols-3">
      {REPORT_TYPES.map((type) => {
        const { label, description, icon: Icon } = REPORT_TYPE_CONFIG[type];
        const isSelected = type === value;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(type)}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-primary/40 hover:bg-accent',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                isSelected ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
