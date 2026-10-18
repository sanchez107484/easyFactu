'use client';

import { useState } from 'react';
import {
  ReportComparison,
  ReportDimension,
  ReportRequest,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';
import { ReportDateRange, ReportPeriodPreset, getPresetRange } from '@/lib/report-periods';
import { REPORT_TYPE_CONFIG } from '@/components/informes/report-type-config';

export type ReportFilterFields = Pick<
  ReportRequest,
  | 'customerIds'
  | 'productIds'
  | 'seriesCodes'
  | 'paymentStatuses'
  | 'productType'
  | 'categoryIds'
  | 'supplierIds'
>;

export interface ReportOptionFields {
  timeGrouping: ReportTimeGrouping;
  comparison: ReportComparison;
  groupBy?: ReportDimension;
  breakdownBy?: ReportDimension;
  topN?: number;
}

interface ReportFormDraft {
  type: ReportType;
  preset: ReportPeriodPreset;
  range: ReportDateRange;
  options: ReportOptionFields;
  filters: ReportFilterFields;
}

const DEFAULT_PRESET: ReportPeriodPreset = 'current-year';

function defaultOptions(type: ReportType): ReportOptionFields {
  return {
    timeGrouping: ReportTimeGrouping.MONTH,
    comparison: ReportComparison.NONE,
    groupBy: REPORT_TYPE_CONFIG[type].defaultGroupBy,
  };
}

/** Drops empty filter arrays so the request (and the dirty check) stays canonical. */
function compactFilters(filters: ReportFilterFields): ReportFilterFields {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined,
    ),
  );
}

function buildRequest(draft: ReportFormDraft): ReportRequest {
  return { type: draft.type, ...draft.range, ...draft.options, ...compactFilters(draft.filters) };
}

/**
 * Keeps the editable draft separate from the applied request, so the preview
 * (and the Excel generated from it) only change when the user clicks "Ver informe".
 */
export function useReportForm() {
  const [draft, setDraft] = useState<ReportFormDraft>(() => ({
    type: ReportType.SUMMARY,
    preset: DEFAULT_PRESET,
    range: getPresetRange(DEFAULT_PRESET) ?? { fromDate: '', toDate: '' },
    options: defaultOptions(ReportType.SUMMARY),
    filters: {},
  }));
  const [appliedRequest, setAppliedRequest] = useState<ReportRequest>(() => buildRequest(draft));

  const isRangeValid =
    Boolean(draft.range.fromDate) &&
    Boolean(draft.range.toDate) &&
    draft.range.fromDate <= draft.range.toDate;
  const isDirty = JSON.stringify(buildRequest(draft)) !== JSON.stringify(appliedRequest);

  return {
    draft,
    appliedRequest,
    isRangeValid,
    isDirty,
    setType: (type: ReportType) =>
      setDraft((d) => ({ ...d, type, options: defaultOptions(type), filters: {} })),
    setPeriod: (preset: ReportPeriodPreset, range: ReportDateRange) =>
      setDraft((d) => ({ ...d, preset, range })),
    setOptions: (options: ReportOptionFields) => setDraft((d) => ({ ...d, options })),
    setFilters: (filters: ReportFilterFields) => setDraft((d) => ({ ...d, filters })),
    apply: () => setAppliedRequest(buildRequest(draft)),
  };
}

export type ReportForm = ReturnType<typeof useReportForm>;
