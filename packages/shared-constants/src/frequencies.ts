import { Frequency } from '@easyfactura/shared-types';

export { Frequency };

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  [Frequency.MONTHLY]: 'Mensual',
  [Frequency.QUARTERLY]: 'Trimestral',
  [Frequency.SEMIANNUAL]: 'Semestral',
  [Frequency.ANNUAL]: 'Anual',
};

export const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({
  value: value as Frequency,
  label,
}));

/**
 * Returns the next run date based on frequency and day of month.
 * Uses pure UTC arithmetic to avoid timezone-related off-by-one errors
 * when the server runs in a non-UTC timezone (e.g. Europe/Madrid).
 */
export function getNextRunDate(baseDate: Date, frequency: Frequency, dayOfMonth: number): Date {
  let nextYear = baseDate.getUTCFullYear();
  let nextMonth = baseDate.getUTCMonth(); // 0-indexed

  switch (frequency) {
    case Frequency.MONTHLY:
      nextMonth += 1;
      break;
    case Frequency.QUARTERLY:
      nextMonth += 3;
      break;
    case Frequency.SEMIANNUAL:
      nextMonth += 6;
      break;
    case Frequency.ANNUAL:
      nextYear += 1;
      break;
  }

  // Normalize month overflow (e.g. month 13 → year+1, month 1)
  nextYear += Math.floor(nextMonth / 12);
  nextMonth = ((nextMonth % 12) + 12) % 12;

  // Clamp dayOfMonth to the last day of the resulting month
  const lastDayOfMonth = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(nextYear, nextMonth, Math.min(dayOfMonth, lastDayOfMonth)));
}
