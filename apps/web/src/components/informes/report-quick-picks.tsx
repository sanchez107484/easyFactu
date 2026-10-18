'use client';

import { REPORT_PRESETS, ReportPreset } from '@/lib/report-presets';
import { cn } from '@/lib/utils';

interface ReportQuickPicksProps {
  activePresetId: string | undefined;
  onSelect: (preset: ReportPreset) => void;
}

/** Common questions as one-click reports. */
export function ReportQuickPicks({ activePresetId, onSelect }: ReportQuickPicksProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {REPORT_PRESETS.map((preset) => {
        const Icon = preset.icon;
        const isActive = preset.id === activePresetId;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(preset)}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              isActive
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:border-primary/40 hover:bg-accent',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <span>
              <span className="block text-sm font-medium">{preset.question}</span>
              <span className="block text-xs text-muted-foreground">{preset.answer}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
