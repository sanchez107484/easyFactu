'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

/** Same pairing as "Mi actividad": main series in brand color, secondary in neutral gray. */
export const REPORT_CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  neutral: 'hsl(var(--muted-foreground))',
} as const;

const TOOLTIP_STYLE = {
  borderRadius: '10px',
  fontSize: '12px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
};

const AXIS_TICK = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' };

const compactAmount = (value: number) =>
  Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value);

const tooltipAmount = (value: number | string) => formatCurrency(Number(value));

export interface ReportChartSeries<T> {
  key: keyof T & string;
  label: string;
  color: string;
}

interface ReportPeriodChartProps<T extends { label: string }> {
  data: T[];
  series: ReportChartSeries<T>[];
}

/** Vertical bars over time buckets (month / quarter / year), amounts in €. */
export function ReportPeriodChart<T extends { label: string }>({
  data,
  series,
}: ReportPeriodChartProps<T>) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={compactAmount}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number | string, name: string) => [tooltipAmount(value), name]}
          />
          {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ReportRankingChartProps {
  data: { label: string; value: number }[];
  valueLabel: string;
  /** Only the top entries are charted; the table below holds the rest. */
  limit?: number;
}

const truncateLabel = (label: string) => (label.length > 22 ? `${label.slice(0, 21)}…` : label);

export function ReportRankingChart({ data, valueLabel, limit = 10 }: ReportRankingChartProps) {
  const topEntries = data.filter((entry) => entry.value > 0).slice(0, limit);
  if (topEntries.length === 0) return null;

  return (
    <div className="w-full" style={{ height: Math.max(160, topEntries.length * 34 + 32) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topEntries}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tickFormatter={compactAmount}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tickFormatter={truncateLabel}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number | string) => [tooltipAmount(value), valueLabel]}
          />
          <Bar
            dataKey="value"
            name={valueLabel}
            fill={REPORT_CHART_COLORS.primary}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
