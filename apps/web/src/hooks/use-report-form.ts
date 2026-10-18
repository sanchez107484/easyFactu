'use client';

import { useMemo, useState } from 'react';
import { ReportType } from '@easyfactura/shared-types';
import { useDebounce } from '@/hooks/use-debounce';
import { ReportDateRange, ReportPeriodPreset, getPresetRange } from '@/lib/report-periods';
import {
  ReportDraft,
  ReportFilterFields,
  ReportOptionFields,
  buildRequest,
  defaultOptions,
  isRangeValid,
  isSameConfiguration,
  sanitizeDraft,
  todayRange,
} from '@/lib/report-draft';
import { REPORT_TYPE_CONFIG } from '@/lib/report-config';
import { ReportFilterChip, removeFilterValue } from '@/lib/report-description';
import { ReportDrillDown } from '@/lib/report-drilldown';
import { REPORT_PRESETS, ReportPreset } from '@/lib/report-presets';

const DEFAULT_PRESET: ReportPeriodPreset = 'current-year';
const AUTO_APPLY_DELAY_MS = 400;

function defaultRange(): ReportDateRange {
  return getPresetRange(DEFAULT_PRESET) ?? { fromDate: '', toDate: '' };
}

function initialDraft(): ReportDraft {
  const preset = REPORT_PRESETS[0];
  return {
    type: preset?.type ?? ReportType.SUMMARY,
    preset: DEFAULT_PRESET,
    range: defaultRange(),
    options: preset?.options ?? defaultOptions(ReportType.SUMMARY),
    filters: preset?.filters ?? {},
    labels: {},
  };
}

/**
 * Snapshot reports (receivables) use one date — today by default. Leaving them
 * restores a normal period so the user doesn't end up with a one-day range.
 */
function withPeriodFor(draft: ReportDraft, previousType: ReportType): ReportDraft {
  const isSnapshot = REPORT_TYPE_CONFIG[draft.type].isSnapshot === true;
  const wasSnapshot = REPORT_TYPE_CONFIG[previousType].isSnapshot === true;
  if (isSnapshot && !wasSnapshot) return { ...draft, preset: 'custom', range: todayRange() };
  if (!isSnapshot && wasSnapshot)
    return { ...draft, preset: DEFAULT_PRESET, range: defaultRange() };
  return draft;
}

/**
 * Report builder state. Every change re-runs the preview automatically after a
 * short debounce; drill-downs keep a stack so the user can go back.
 */
export function useReportForm() {
  const [draft, setDraft] = useState<ReportDraft>(initialDraft);
  const [previousDrafts, setPreviousDrafts] = useState<ReportDraft[]>([]);

  const request = useMemo(() => buildRequest(draft), [draft]);
  const debouncedRequest = useDebounce(request, AUTO_APPLY_DELAY_MS);
  const activePresetId = REPORT_PRESETS.find((preset) => isSameConfiguration(preset, draft))?.id;

  function update(change: (current: ReportDraft) => ReportDraft) {
    setDraft((current) => sanitizeDraft(change(current)));
  }

  return {
    draft,
    /** The request the preview and the Excel use (null while the dates are invalid). */
    request: isRangeValid(debouncedRequest) ? debouncedRequest : null,
    isRangeValid: isRangeValid(draft.range),
    isSettling: request !== debouncedRequest,
    activePresetId,
    canGoBack: previousDrafts.length > 0,

    setType: (type: ReportType) =>
      update((d) =>
        withPeriodFor(
          {
            ...d,
            type,
            options: {
              ...defaultOptions(type),
              timeGrouping: d.options.timeGrouping,
              comparison: d.options.comparison,
            },
            filters: {},
          },
          d.type,
        ),
      ),
    setPeriod: (preset: ReportPeriodPreset, range: ReportDateRange) =>
      update((d) => ({ ...d, preset, range })),
    setOptions: (options: ReportOptionFields) => update((d) => ({ ...d, options })),
    setFilters: (filters: ReportFilterFields, labels: Record<string, string> = {}) =>
      update((d) => ({ ...d, filters, labels: { ...d.labels, ...labels } })),
    removeFilter: (chip: Pick<ReportFilterChip, 'key' | 'value'>) =>
      update((d) => ({ ...d, filters: removeFilterValue(d.filters, chip) })),
    clearFilters: () => update((d) => ({ ...d, filters: {} })),

    applyPreset: (preset: ReportPreset) => {
      setPreviousDrafts([]);
      update((d) => {
        const presetRange = preset.period ? getPresetRange(preset.period) : null;
        const next: ReportDraft = {
          ...d,
          type: preset.type,
          options: preset.options,
          filters: preset.filters,
          ...(preset.period && presetRange ? { preset: preset.period, range: presetRange } : {}),
        };
        return withPeriodFor(next, d.type);
      });
    },
    drillDown: (drillDown: ReportDrillDown) => {
      setPreviousDrafts((stack) => [...stack, draft]);
      setDraft(sanitizeDraft(drillDown.apply(draft)));
    },
    goBack: () => {
      const previous = previousDrafts[previousDrafts.length - 1];
      if (!previous) return;
      setPreviousDrafts((stack) => stack.slice(0, -1));
      setDraft(previous);
    },
  };
}

export type ReportForm = ReturnType<typeof useReportForm>;
