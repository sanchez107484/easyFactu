'use client';

import {
  ReportComparison,
  ReportDimension,
  ReportSortBy,
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
import type { ReportOptionFields } from '@/lib/report-draft';
import {
  COMPARISON_LABELS,
  REPORT_TYPE_CONFIG,
  SORT_LABELS,
  TIME_GROUPING_LABELS,
  getDimensionLabel,
} from '@/lib/report-config';
import { ReportHelp } from './report-help';

const NONE_VALUE = '__none__';
const ALL_VALUE = 'all';

interface ReportOptionsFieldsProps {
  type: ReportType;
  options: ReportOptionFields;
  onChange: (options: ReportOptionFields) => void;
  /** Margin only exists per whole customer (no product breakdown or filters). */
  canSortByMargin: boolean;
}

interface OptionSelectProps {
  id: string;
  label: string;
  help: React.ReactNode;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function OptionSelect({ id, label, help, value, items, onChange }: OptionSelectProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <ReportHelp topic={label}>{help}</ReportHelp>
      </div>
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

const TIME_GROUPING_ITEMS = Object.values(ReportTimeGrouping).map((g) => ({
  value: g,
  label: TIME_GROUPING_LABELS[g],
}));

const COMPARISON_ITEMS = Object.values(ReportComparison).map((c) => ({
  value: c,
  label: COMPARISON_LABELS[c],
}));

const TOP_N_ITEMS = [
  { value: ALL_VALUE, label: 'Todos' },
  ...REPORT_TOP_N_OPTIONS.map((n) => ({ value: String(n), label: `Los ${n} primeros` })),
];

export function ReportOptionsFields({
  type,
  options,
  onChange,
  canSortByMargin,
}: ReportOptionsFieldsProps) {
  const { dimensions, sortOptions, supportsComparison } = REPORT_TYPE_CONFIG[type];
  const sortItems = sortOptions
    .filter((sort) => sort !== ReportSortBy.MARGIN || canSortByMargin)
    .map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {isGrouped && (
        <>
          <OptionSelect
            id="report-group-by"
            label="Ver por"
            help="Cada fila del informe será un elemento de lo que elijas. Por ejemplo, «Cliente» muestra una fila por cliente."
            value={groupBy}
            items={dimensionItems}
            onChange={setGroupBy}
          />
          <OptionSelect
            id="report-breakdown-by"
            label="Y dentro de cada uno"
            help="Añade un segundo nivel de detalle. Por ejemplo: ver por cliente y, dentro de cada cliente, sus artículos. Pulsa una fila del informe para desplegarla."
            value={breakdownBy ?? NONE_VALUE}
            items={[
              { value: NONE_VALUE, label: 'Sin detalle' },
              ...dimensionItems.filter((d) => d.value !== groupBy),
            ]}
            onChange={(value) => onChange({ ...options, breakdownBy: pickEnum(dimensions, value) })}
          />
        </>
      )}
      <OptionSelect
        id="report-time-grouping"
        label="Periodos de"
        help="Cuando el informe muestra la evolución en el tiempo, agrupa los datos por meses, trimestres o años."
        value={timeGrouping}
        items={TIME_GROUPING_ITEMS}
        onChange={(value) =>
          onChange({
            ...options,
            timeGrouping: pickEnum(Object.values(ReportTimeGrouping), value) ?? timeGrouping,
          })
        }
      />
      {supportsComparison && (
        <OptionSelect
          id="report-comparison"
          label="Comparar con"
          help="Muestra cuánto ha cambiado cada cifra (en %) frente a otro periodo. Por ejemplo, este trimestre frente al mismo trimestre del año pasado."
          value={options.comparison}
          items={COMPARISON_ITEMS}
          onChange={(value) =>
            onChange({
              ...options,
              comparison: pickEnum(Object.values(ReportComparison), value) ?? options.comparison,
            })
          }
        />
      )}
      {isGrouped && groupBy !== ReportDimension.PERIOD && (
        <OptionSelect
          id="report-top-n"
          label="Cuántos mostrar"
          help="Muestra solo los primeros (los que más facturan o gastan) y suma el resto en una fila «Otros»."
          value={options.topN ? String(options.topN) : ALL_VALUE}
          items={TOP_N_ITEMS}
          onChange={(value) =>
            onChange({ ...options, topN: value === ALL_VALUE ? undefined : Number(value) })
          }
        />
      )}
      {isGrouped && groupBy !== ReportDimension.PERIOD && sortItems.length > 1 && (
        <OptionSelect
          id="report-sort-by"
          label="Ordenar por"
          help="Decide qué cuenta para estar arriba (y entre los primeros). Por ejemplo, ordenar clientes por margen muestra primero los más rentables."
          value={options.sortBy ?? ReportSortBy.AMOUNT}
          items={sortItems}
          onChange={(value) => {
            const sortBy = pickEnum(sortOptions, value);
            onChange({ ...options, sortBy: sortBy === ReportSortBy.AMOUNT ? undefined : sortBy });
          }}
        />
      )}
    </div>
  );
}
