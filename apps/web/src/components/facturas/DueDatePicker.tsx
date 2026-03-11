'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const PRESETS = [
  { label: '15', days: 15 },
  { label: '30', days: 30 },
  { label: '45', days: 45 },
  { label: '60', days: 60 },
  { label: '90', days: 90 },
] as const;

// ==================== HELPERS ====================

function addDays(dateStr: string, days: number): string {
  // Use noon to avoid DST edge cases
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function detectInitialPreset(issueDate: string, value: string): number | null {
  for (const { days } of PRESETS) {
    if (issueDate && addDays(issueDate, days) === value) return days;
  }
  return null;
}

// ==================== PROPS ====================

interface DueDatePickerProps {
  issueDate: string;
  value: string | undefined;
  onChange: (date: string | undefined) => void;
  /** Label shown in the summary line under the chips. Defaults to "Vence el" */
  summaryLabel?: string;
  /** Preset that should be active by default on first render when no value is set */
  defaultPreset?: number;
}

// ==================== COMPONENT ====================

export function DueDatePicker({
  issueDate,
  value,
  onChange,
  summaryLabel = 'Vence el',
  defaultPreset,
}: DueDatePickerProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [activePreset, setActivePreset] = useState<number | null>(() => {
    if (value) return detectInitialPreset(issueDate, value);
    return defaultPreset ?? null;
  });

  const [showCustomInput, setShowCustomInput] = useState<boolean>(() => {
    if (!value) return false;
    return detectInitialPreset(issueDate, value) === null;
  });

  const dateInputRef = useRef<HTMLInputElement>(null);
  // Prevent the effect from firing on the very first render (initial load / edit mode)
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    // When issueDate changes and a preset is active, recalculate the due date
    if (activePreset !== null && issueDate) {
      onChangeRef.current(addDays(issueDate, activePreset));
    }
  }, [issueDate, activePreset]);

  const handlePresetClick = (days: number) => {
    if (activePreset === days) {
      // Toggle off
      setActivePreset(null);
      onChange(undefined);
    } else {
      setActivePreset(days);
      setShowCustomInput(false);
      if (issueDate) onChange(addDays(issueDate, days));
    }
  };

  const handleCustomClick = () => {
    setActivePreset(null);
    setShowCustomInput(true);
    setTimeout(() => {
      dateInputRef.current?.focus();
      // showPicker() is not available in all browsers; fail silently
      dateInputRef.current?.showPicker?.();
    }, 50);
  };

  const handleClear = () => {
    setActivePreset(null);
    setShowCustomInput(false);
    onChange(undefined);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || undefined);
  };

  return (
    <div className="space-y-2">
      {/* ── Preset chips + custom button ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESETS.map(({ label, days }) => (
          <button
            key={days}
            type="button"
            onClick={() => handlePresetClick(days)}
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-150 whitespace-nowrap tracking-wide',
              activePreset === days
                ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.04]'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/50',
            )}
          >
            +{label}d
          </button>
        ))}

        {/* Custom date button */}
        <button
          type="button"
          onClick={handleCustomClick}
          title="Elegir fecha personalizada"
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-150',
            showCustomInput
              ? 'bg-primary/10 text-primary border-primary/40 shadow-sm'
              : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/50',
          )}
        >
          <CalendarDays className="h-3 w-3" />
          <span>Otra</span>
        </button>

        {/* Clear button – only show when a preset is active (custom input has its own X) */}
        {value && !showCustomInput && (
          <button
            type="button"
            onClick={handleClear}
            title="Quitar fecha de vencimiento"
            className="flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── Custom date input (shown on demand) ── */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <input
            ref={dateInputRef}
            type="date"
            value={value ?? ''}
            min={issueDate}
            onChange={handleCustomChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={handleClear}
            title="Quitar fecha de vencimiento"
            className="flex items-center justify-center h-9 w-9 shrink-0 rounded-md border border-input text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Selected date summary ── */}
      {value && (
        <p className="text-xs text-muted-foreground leading-none">
          {summaryLabel}{' '}
          <span className="font-medium text-foreground">{formatDateSpanish(value)}</span>
        </p>
      )}
    </div>
  );
}
