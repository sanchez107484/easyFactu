import type { ReportDateRange } from '@easyfactura/shared-types';

export type ReportPeriodPreset =
  | 'current-month'
  | 'previous-month'
  | 'current-quarter'
  | 'previous-quarter'
  | 'current-year'
  | 'previous-year'
  | 'custom';

export type { ReportDateRange };

export const REPORT_PERIOD_PRESETS: { value: ReportPeriodPreset; label: string }[] = [
  { value: 'current-month', label: 'Este mes' },
  { value: 'previous-month', label: 'Mes anterior' },
  { value: 'current-quarter', label: 'Este trimestre' },
  { value: 'previous-quarter', label: 'Trimestre anterior' },
  { value: 'current-year', label: 'Este año' },
  { value: 'previous-year', label: 'Año anterior' },
  { value: 'custom', label: 'Personalizado' },
];

/** Formats a local date as YYYY-MM-DD without the UTC shift of toISOString(). */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function range(from: Date, to: Date): ReportDateRange {
  return { fromDate: toIsoDate(from), toDate: toIsoDate(to) };
}

/** Returns the date range for a preset, or null for 'custom'. */
export function getPresetRange(
  preset: ReportPeriodPreset,
  today: Date = new Date(),
): ReportDateRange | null {
  const year = today.getFullYear();
  const month = today.getMonth();
  const quarterStart = month - (month % 3);

  switch (preset) {
    case 'current-month':
      return range(new Date(year, month, 1), new Date(year, month + 1, 0));
    case 'previous-month':
      return range(new Date(year, month - 1, 1), new Date(year, month, 0));
    case 'current-quarter':
      return range(new Date(year, quarterStart, 1), new Date(year, quarterStart + 3, 0));
    case 'previous-quarter':
      return range(new Date(year, quarterStart - 3, 1), new Date(year, quarterStart, 0));
    case 'current-year':
      return range(new Date(year, 0, 1), new Date(year, 11, 31));
    case 'previous-year':
      return range(new Date(year - 1, 0, 1), new Date(year - 1, 11, 31));
    case 'custom':
      return null;
  }
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/** Date range of a period bucket key: "2026-03" (month), "2026-Q1" (quarter) or "2026" (year). */
export function getBucketRange(key: string): ReportDateRange | null {
  const quarter = key.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) {
    const year = Number(quarter[1]);
    const firstMonth = (Number(quarter[2]) - 1) * 3;
    return range(new Date(year, firstMonth, 1), lastDayOfMonth(year, firstMonth + 2));
  }
  const month = key.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const year = Number(month[1]);
    const monthIndex = Number(month[2]) - 1;
    return range(new Date(year, monthIndex, 1), lastDayOfMonth(year, monthIndex));
  }
  if (/^\d{4}$/.test(key)) {
    const year = Number(key);
    return range(new Date(year, 0, 1), new Date(year, 11, 31));
  }
  return null;
}
