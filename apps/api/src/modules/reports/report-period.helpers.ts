import { ReportComparison, ReportDateRange, ReportTimeGrouping } from '@easyfactura/shared-types';

/** Dates are UTC midnight (parsed from YYYY-MM-DD), so all math uses UTC getters. */
export interface ReportPeriod {
  from: Date;
  to: Date;
}

/** TO_CHAR formats whose output matches the keys produced by listBuckets(). */
export const PERIOD_KEY_SQL_FORMAT: Record<ReportTimeGrouping, string> = {
  [ReportTimeGrouping.MONTH]: 'YYYY-MM',
  [ReportTimeGrouping.QUARTER]: 'YYYY-"Q"Q',
  [ReportTimeGrouping.YEAR]: 'YYYY',
};

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toDateRange({ from, to }: ReportPeriod): ReportDateRange {
  return { fromDate: toIsoDate(from), toDate: toIsoDate(to) };
}

function bucketKey(date: Date, grouping: ReportTimeGrouping): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  switch (grouping) {
    case ReportTimeGrouping.MONTH:
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    case ReportTimeGrouping.QUARTER:
      return `${year}-Q${Math.floor(month / 3) + 1}`;
    case ReportTimeGrouping.YEAR:
      return String(year);
  }
}

/** Every bucket key between both dates (inclusive), so empty buckets still appear. */
export function listBuckets({ from, to }: ReportPeriod, grouping: ReportTimeGrouping): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (cursor <= to) {
    const key = bucketKey(cursor, grouping);
    if (keys[keys.length - 1] !== key) keys.push(key);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

/** "2026-03" → "Mar 2026", "2026-Q1" → "T1 2026", "2026" → "2026". */
export function formatBucketLabel(key: string): string {
  const quarter = key.match(/^(\d{4})-Q(\d)$/);
  if (quarter) return `T${quarter[2]} ${quarter[1]}`;
  const month = key.match(/^(\d{4})-(\d{2})$/);
  if (month) return `${MONTH_LABELS[Number(month[2]) - 1]} ${month[1]}`;
  return key;
}

function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

function isLastDayOfMonth(date: Date): boolean {
  const next = new Date(date);
  next.setUTCDate(date.getUTCDate() + 1);
  return next.getUTCDate() === 1;
}

function monthsSpanned({ from, to }: ReportPeriod): number {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth() + 1
  );
}

function shiftByDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * PREVIOUS_YEAR: same dates one year earlier.
 * PREVIOUS_PERIOD: the immediately preceding period of the same length — whole
 * months when the range covers whole months (Q2 → Q1), otherwise the same day count.
 */
export function getComparisonPeriod(
  period: ReportPeriod,
  comparison: ReportComparison
): ReportPeriod | null {
  switch (comparison) {
    case ReportComparison.NONE:
      return null;
    case ReportComparison.PREVIOUS_YEAR:
      return { from: addMonthsClamped(period.from, -12), to: addMonthsClamped(period.to, -12) };
    case ReportComparison.PREVIOUS_PERIOD:
      return getPreviousPeriod(period);
  }
}

function getPreviousPeriod(period: ReportPeriod): ReportPeriod {
  const coversWholeMonths = period.from.getUTCDate() === 1 && isLastDayOfMonth(period.to);
  if (coversWholeMonths) {
    const months = monthsSpanned(period);
    const from = addMonthsClamped(period.from, -months);
    const to = new Date(Date.UTC(period.from.getUTCFullYear(), period.from.getUTCMonth(), 0));
    return { from, to };
  }
  const days = Math.round((period.to.getTime() - period.from.getTime()) / 86_400_000) + 1;
  return { from: shiftByDays(period.from, -days), to: shiftByDays(period.from, -1) };
}

/**
 * Maps comparison-period bucket keys onto current-period keys by position
 * (1st month ↔ 1st month), so "Mar 2025" lines up with "Mar 2026".
 */
export function buildBucketKeyMap(
  current: ReportPeriod,
  comparison: ReportPeriod,
  grouping: ReportTimeGrouping
): Map<string, string> {
  const currentKeys = listBuckets(current, grouping);
  const comparisonKeys = listBuckets(comparison, grouping);
  return new Map(
    comparisonKeys
      .map((key, index): [string, string | undefined] => [key, currentKeys[index]])
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
}
