'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  REPORT_PERIOD_PRESETS,
  ReportDateRange,
  ReportPeriodPreset,
  getPresetRange,
} from '@/lib/report-periods';
import { ReportHelp } from './report-help';

interface ReportPeriodFieldsProps {
  preset: ReportPeriodPreset;
  range: ReportDateRange;
  onChange: (preset: ReportPeriodPreset, range: ReportDateRange) => void;
  /** Balance reports ask for a single date instead of a period. */
  isSnapshot?: boolean;
}

export function ReportPeriodFields({
  preset,
  range,
  onChange,
  isSnapshot,
}: ReportPeriodFieldsProps) {
  if (isSnapshot) {
    return (
      <SnapshotDateField
        date={range.toDate}
        onChange={(date) => onChange('custom', { fromDate: date, toDate: date })}
      />
    );
  }

  function handlePresetChange(value: string) {
    const option = REPORT_PERIOD_PRESETS.find((preset) => preset.value === value);
    if (!option) return;
    onChange(option.value, getPresetRange(option.value) ?? range);
  }

  function handleDateChange(field: keyof ReportDateRange, value: string) {
    onChange('custom', { ...range, [field]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="report-period">Periodo</Label>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger id="report-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_PERIOD_PRESETS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="report-from">Desde</Label>
        <Input
          id="report-from"
          type="date"
          value={range.fromDate}
          max={range.toDate}
          onChange={(e) => handleDateChange('fromDate', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="report-to">Hasta</Label>
        <Input
          id="report-to"
          type="date"
          value={range.toDate}
          min={range.fromDate}
          onChange={(e) => handleDateChange('toDate', e.target.value)}
        />
      </div>
    </div>
  );
}

function SnapshotDateField({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  return (
    <div className="max-w-xs space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor="report-as-of">Saldo a fecha de</Label>
        <ReportHelp topic="Saldo a fecha de">
          Muestra lo que te debían ese día: facturas emitidas hasta esa fecha que aún no estaban
          cobradas, sea cual sea su fecha de emisión. Por defecto, hoy.
        </ReportHelp>
      </div>
      <Input
        id="report-as-of"
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
