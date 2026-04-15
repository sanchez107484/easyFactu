'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface MonthlyChartDataPoint {
  month: string;
  importe: number;
}

interface MonthlyChartProps {
  data: MonthlyChartDataPoint[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Facturado']}
          contentStyle={{
            borderRadius: '8px',
            fontSize: '12px',
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
          }}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Bar dataKey="importe" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
