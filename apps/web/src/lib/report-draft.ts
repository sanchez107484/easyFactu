import {
  ReportComparison,
  ReportDimension,
  ReportRequest,
  ReportSortBy,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';
import { ReportDateRange, ReportPeriodPreset } from './report-periods';
import { REPORT_TYPE_CONFIG } from './report-config';

export type ReportFilterFields = Pick<
  ReportRequest,
  | 'customerIds'
  | 'productIds'
  | 'seriesCodes'
  | 'paymentStatuses'
  | 'productType'
  | 'categoryIds'
  | 'supplierIds'
  | 'paymentMethods'
>;

export type ReportFilterKey = keyof ReportFilterFields;

export interface ReportOptionFields {
  timeGrouping: ReportTimeGrouping;
  comparison: ReportComparison;
  groupBy?: ReportDimension;
  breakdownBy?: ReportDimension;
  topN?: number;
  sortBy?: ReportSortBy;
}

/** Everything the report builder edits. `labels` maps selected ids → display names. */
export interface ReportDraft {
  type: ReportType;
  preset: ReportPeriodPreset;
  range: ReportDateRange;
  options: ReportOptionFields;
  filters: ReportFilterFields;
  labels: Record<string, string>;
}

export function defaultOptions(type: ReportType): ReportOptionFields {
  return {
    timeGrouping: ReportTimeGrouping.MONTH,
    comparison: ReportComparison.NONE,
    groupBy: REPORT_TYPE_CONFIG[type].defaultGroupBy,
  };
}

/** Drops empty filter values so the request stays canonical (and comparable). */
export function compactFilters(filters: ReportFilterFields): ReportFilterFields {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined,
    ),
  );
}

export function buildRequest(draft: ReportDraft): ReportRequest {
  return { type: draft.type, ...draft.range, ...draft.options, ...compactFilters(draft.filters) };
}

export function isRangeValid({ fromDate, toDate }: ReportDateRange): boolean {
  return Boolean(fromDate) && Boolean(toDate) && fromDate <= toDate;
}

/** Order-independent key that ignores undefined values and empty arrays. */
export function canonicalKey(value: object): string {
  const entries = Object.entries(value)
    .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== undefined))
    .map(([k, v]): [string, unknown] => [k, Array.isArray(v) ? [...v].sort() : v])
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

type ReportConfiguration = Pick<ReportDraft, 'type' | 'options' | 'filters'>;

/** Same report configuration (ignoring the period and labels)? */
export function isSameConfiguration(a: ReportConfiguration, b: ReportConfiguration): boolean {
  return (
    a.type === b.type &&
    canonicalKey(a.options) === canonicalKey(b.options) &&
    canonicalKey(a.filters) === canonicalKey(b.filters)
  );
}

/** Margin is invoice-level: only when every row is a whole customer. */
export function supportsMarginSort({ type, options, filters }: ReportDraft): boolean {
  return (
    type === ReportType.SALES &&
    options.groupBy === ReportDimension.CUSTOMER &&
    options.breakdownBy !== ReportDimension.PRODUCT &&
    !filters.productIds?.length &&
    !filters.productType
  );
}

/** Balance reports use a single date: today unless the user picks another one. */
export function todayRange(): ReportDateRange {
  return singleDayRange(new Date());
}

function singleDayRange(date: Date): ReportDateRange {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return { fromDate: iso, toDate: iso };
}

/**
 * Drops option combinations the API would reject, so the auto-applied preview
 * never errors after an innocent change (e.g. adding a product filter while
 * sorting by margin).
 */
export function sanitizeDraft(draft: ReportDraft): ReportDraft {
  const config = REPORT_TYPE_CONFIG[draft.type];
  const isByPeriod = draft.options.groupBy === ReportDimension.PERIOD;
  const isMarginInvalid =
    draft.options.sortBy === ReportSortBy.MARGIN && !supportsMarginSort(draft);

  return {
    ...draft,
    options: {
      ...draft.options,
      comparison: config.supportsComparison ? draft.options.comparison : ReportComparison.NONE,
      topN: isByPeriod ? undefined : draft.options.topN,
      sortBy: isByPeriod || isMarginInvalid ? undefined : draft.options.sortBy,
    },
  };
}
