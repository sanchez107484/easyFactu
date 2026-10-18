'use client';

import {
  ReportComparison,
  ReportDimension,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';
import { REPORT_TOP_N_OPTIONS } from '@easyfactura/shared-constants';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReportOptionFields } from '@/hooks/use-report-form';
import {
  COMPARISON_LABELS,
  REPORT_TYPE_CONFIG,
  TIME_GROUPING_LABELS,
  getDimensionLabel,
} from './report-type-config';

const NONE_VALUE = '__none__';
const ALL_VALUE = 'all';

interface ReportOptionsFieldsProps {
  type: ReportType;
  options: ReportOptionFields;
  onChange: (options: ReportOptionFields) => void;
}

interface OptionSelectProps {
  id: string;
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function OptionSelect({ id, label, value, items, onChange }: OptionSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function pickEnum<T extends string>(values: T[], value: string): T | undefined {
  return values.find((candidate) => candidate === value);
}

export function ReportOptionsFields({ type, options, onChange }: ReportOptionsFieldsProps) {
  const { dimensions } = REPORT_TYPE_CONFIG[type];
  const { timeGrouping, groupBy, breakdownBy } = options;
  const dimensionItems = dimensions.map((d) => ({
    value: d,
    label: getDimensionLabel(d, timeGrouping),
  }));
  const isGrouped = dimensions.length > 0 && groupBy !== undefined;

  function setGroupBy(value: string) {
    const nextGroupBy = pickEnum(dimensions, value);
    // A breakdown equal to the new grouping is invalid — drop it.
    const nextBreakdown = breakdownBy === nextGroupBy ? undefined : breakdownBy;
    onChange({ ...options, groupBy: nextGroupBy, breakdownBy: nextBreakdown });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {isGrouped && (
        <>
          <OptionSelect
            id="report-group-by"
            label="Agrupar por"
            value={groupBy}
            items={dimensionItems}
            onChange={setGroupBy}
          />
          <OptionSelect
            id="report-breakdown-by"
            label="Desglosar por"
            value={breakdownBy ?? NONE_VALUE}
            items={[
              { value: NONE_VALUE, label: 'Sin desglose' },
              ...dimensionItems.filter((d) => d.value !== groupBy),
            ]}
            onChange={(value) => onChange({ ...options, breakdownBy: pickEnum(dimensions, value) })}
          />
        </>
      )}
      <OptionSelect
        id="report-time-grouping"
        label="Agrupación temporal"
        value={timeGrouping}
        items={Object.values(ReportTimeGrouping).map((g) => ({
          value: g,
          label: TIME_GROUPING_LABELS[g],
        }))}
        onChange={(value) =>
          onChange({
            ...options,
            timeGrouping: pickEnum(Object.values(ReportTimeGrouping), value) ?? timeGrouping,
          })
        }
      />
      <OptionSelect
        id="report-comparison"
        label="Comparar con"
        value={options.comparison}
        items={Object.values(ReportComparison).map((c) => ({
          value: c,
          label: COMPARISON_LABELS[c],
        }))}
        onChange={(value) =>
          onChange({
            ...options,
            comparison: pickEnum(Object.values(ReportComparison), value) ?? options.comparison,
          })
        }
      />
      {isGrouped && groupBy !== ReportDimension.PERIOD && (
        <OptionSelect
          id="report-top-n"
          label="Mostrar"
          value={options.topN ? String(options.topN) : ALL_VALUE}
          items={[
            { value: ALL_VALUE, label: 'Todos' },
            ...REPORT_TOP_N_OPTIONS.map((n) => ({ value: String(n), label: `Los ${n} primeros` })),
          ]}
          onChange={(value) =>
            onChange({ ...options, topN: value === ALL_VALUE ? undefined : Number(value) })
          }
        />
      )}
    </div>
  );
}
