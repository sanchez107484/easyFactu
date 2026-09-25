'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Euro,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Wallet,
  PieChart as PieChartIcon,
  Target,
  Sparkles,
  CalendarDays,
  PiggyBank,
  Scale,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { useActivitySummary } from '@/hooks/use-activity-summary';
import { cn, formatCurrency } from '@/lib/utils';
import { PRICING } from '@easyfactura/brand-config';

// ==================== HELPERS ====================

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const Y_TICK_FORMATTER = (v: number) =>
  v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

const TOOLTIP_STYLE = {
  borderRadius: '10px',
  fontSize: '12px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.5)',
  'hsl(var(--primary) / 0.35)',
  'hsl(var(--primary) / 0.2)',
];

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function getProfitMargin(income: number, expense: number): number | null {
  if (income <= 0) return null;
  return Math.round(((income - expense) / income) * 100);
}

// ==================== KPI CARD ====================

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number | null;
  trendGoodWhenUp?: boolean;
  trendLabel?: string;
  icon: React.ElementType;
  iconClassName?: string;
  valueClassName?: string;
  isLoading: boolean;
  href?: string;
}

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendGoodWhenUp = true,
  trendLabel,
  icon: Icon,
  iconClassName = 'bg-primary/10 text-primary',
  valueClassName = '',
  isLoading,
  href,
}: KpiCardProps) {
  const trendPositive = trend !== null && trend !== undefined && trend >= 0;
  const trendIsGood = trendPositive === trendGoodWhenUp;

  const content = (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-md h-full', href && 'cursor-pointer')}>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', iconClassName)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className={cn('text-3xl font-bold tracking-tight tabular-nums mb-1', valueClassName)}>
              {formatCurrency(value)}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>}
            {trend !== null && trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5',
                    trendIsGood
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
                  )}
                >
                  {trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trendPositive ? '+' : ''}{trend}%
                </span>
                {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

// ==================== MAIN CHART CARD ====================

type ChartView = 'mensual' | 'resultado';

const CHART_VIEWS: { value: ChartView; label: string }[] = [
  { value: 'mensual', label: 'Ingresos vs Gastos' },
  { value: 'resultado', label: 'Resultado' },
];

interface MainChartCardProps {
  year: number;
  chartData: Array<{ month: string; ingresos: number; gastos: number }>;
  isLoading: boolean;
}

function MainChartCard({ year, chartData, isLoading }: MainChartCardProps) {
  const [view, setView] = useState<ChartView>('mensual');
  const hasAnyData = chartData.some((d) => d.ingresos > 0 || d.gastos > 0);

  const resultData = chartData.map((d) => ({
    month: d.month,
    valor: d.ingresos - d.gastos,
  }));

  const totalIncome = chartData.reduce((s, d) => s + d.ingresos, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.gastos, 0);

  return (
    <Card className="lg:col-span-3 flex flex-col">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Resumen {year}</CardTitle>
            {!isLoading && hasAnyData && (
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Ingresos: <span className="font-semibold text-foreground">{formatCurrency(totalIncome)}</span></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-muted-foreground">Gastos: <span className="font-semibold text-foreground">{formatCurrency(totalExpense)}</span></span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            {CHART_VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  view === v.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-2 flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-end gap-1.5 h-64">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-md"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        ) : !hasAnyData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium">Sin datos todavía</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registra facturas y gastos para ver tu evolución
              </p>
            </div>
          </div>
        ) : view === 'resultado' ? (
          <div className="relative">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={resultData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="resultGradientPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 76% 40%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(142 76% 40%)" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="resultGradientNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={Y_TICK_FORMATTER}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Resultado']}
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {resultData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.valor >= 0 ? 'url(#resultGradientPos)' : 'url(#resultGradientNeg)'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="expenseGradMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={Y_TICK_FORMATTER}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'ingresos' ? 'Ingresos' : 'Gastos',
                ]}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
              />
              <Bar
                dataKey="gastos"
                fill="url(#expenseGradMain)"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="ingresos"
                fill="url(#incomeGradMain)"
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== EXPENSE BREAKDOWN CARD ====================

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type ViewMode = 'categories' | 'expenses';

interface ExpenseBreakdownCardProps {
  monthlyExpenseCategories: Array<{
    month: string;
    categories: Array<{ categoryId: string; name: string; amount: number }>;
  }>;
  monthlyExpenses: Array<{
    month: string;
    expenses: Array<{
      id: string;
      date: string;
      description: string;
      categoryId: string;
      categoryName: string;
      amount: number;
    }>;
  }>;
  isLoading: boolean;
  year: number;
  chartData: Array<{ month: string; ingresos: number; gastos: number }>;
}

function ExpenseBreakdownCard({ monthlyExpenseCategories, monthlyExpenses, isLoading, year, chartData }: ExpenseBreakdownCardProps) {
  const [period, setPeriod] = useState<string>('YTD');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthOptions = [
    { value: 'YTD', label: `Acumulado ${currentYear}` },
    ...chartData.map((d, i) => ({
      value: d.month,
      label: `${MONTHS_SHORT[i]} ${currentYear}`,
    })),
  ];

  const selectedMonthIndex = period === 'YTD'
    ? -1
    : chartData.findIndex(d => d.month === period);

  const displayCategories = selectedMonthIndex === -1
    ? monthlyExpenseCategories.flatMap(m => m.categories)
        .reduce((acc, cat) => {
          const existing = acc.find(c => c.categoryId === cat.categoryId);
          if (existing) {
            existing.amount += cat.amount;
          } else {
            acc.push({ ...cat });
          }
          return acc;
        }, [] as Array<{ categoryId: string; name: string; amount: number }>)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
    : (monthlyExpenseCategories[selectedMonthIndex]?.categories ?? []);

  const displayExpenses = selectedMonthIndex === -1
    ? monthlyExpenses.flatMap(m => m.expenses)
    : (monthlyExpenses[selectedMonthIndex]?.expenses ?? []);

  const displayTotal = displayCategories.reduce((s, c) => s + c.amount, 0);

  const selectedPeriodLabel = period === 'YTD'
    ? `Total ${currentYear}`
    : monthOptions.find(m => m.value === period)?.label ?? period;

  const isMonthSelected = selectedMonthIndex !== -1;

  const pieData = displayCategories.map((c, i) => ({
    ...c,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    pct: displayTotal > 0 ? Math.round((c.amount / displayTotal) * 100) : 0,
  }));

  let cumulativeAngle = 0;
  const pieSlices = pieData.map((slice) => {
    const angle = (slice.pct / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...slice, startAngle, endAngle: cumulativeAngle };
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Desglose de gastos</CardTitle>
          <div className="flex items-center gap-2">
            {isMonthSelected && (
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('categories')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                    viewMode === 'categories'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Resumen
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('expenses')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                    viewMode === 'expenses'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Detalle
                </button>
              </div>
            )}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        {isLoading ? (
          <div className="flex gap-6">
            <Skeleton className="h-36 w-36 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : displayCategories.length === 0 && displayExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <PieChartIcon className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Sin gastos registrados</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Añade gastos para ver el desglose
            </p>
            <Link href="/dashboard/gastos/nuevo">
              <Button size="sm" variant="outline">
                Añadir gasto
              </Button>
            </Link>
          </div>
        ) : viewMode === 'expenses' && isMonthSelected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {displayExpenses.length} gasto{displayExpenses.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(displayTotal)}</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {displayExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{expense.description}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {expense.categoryName}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(expense.date)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="relative shrink-0">
              <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
                {pieSlices.length > 0 ? pieSlices.map((slice) => {
                  const isHovered = hoveredCategory === slice.categoryId;
                  const radius = isHovered ? 44 : 42;
                  const innerRadius = isHovered ? 26 : 24;
                  const startRad = (slice.startAngle * Math.PI) / 180;
                  const endRad = (slice.endAngle * Math.PI) / 180;
                  const x1 = 50 + radius * Math.cos(startRad);
                  const y1 = 50 + radius * Math.sin(startRad);
                  const x2 = 50 + radius * Math.cos(endRad);
                  const y2 = 50 + radius * Math.sin(endRad);
                  const x3 = 50 + innerRadius * Math.cos(endRad);
                  const y3 = 50 + innerRadius * Math.sin(endRad);
                  const x4 = 50 + innerRadius * Math.cos(startRad);
                  const y4 = 50 + innerRadius * Math.sin(startRad);
                  const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
                  const d = [
                    `M ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                    `L ${x3} ${y3}`,
                    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                    'Z',
                  ].join(' ');
                  return (
                    <path
                      key={slice.categoryId}
                      d={d}
                      fill={slice.color}
                      className="transition-all duration-200 cursor-pointer"
                      style={{ opacity: hoveredCategory && !isHovered ? 0.4 : 1 }}
                      onMouseEnter={() => setHoveredCategory(slice.categoryId)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                }) : (
                  <circle cx="50" cy="50" r="40" fill="hsl(var(--muted))" />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground text-center px-1">{selectedPeriodLabel}</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(displayTotal)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {pieSlices.map((slice) => {
                const isHovered = hoveredCategory === slice.categoryId;
                return (
                  <div
                    key={slice.categoryId}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all cursor-pointer',
                      isHovered && 'bg-muted/70'
                    )}
                    onMouseEnter={() => setHoveredCategory(slice.categoryId)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-sm font-medium truncate flex-1">{slice.name}</span>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(slice.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                      {slice.pct}%
                    </span>
                  </div>
                );
              })}
              {isMonthSelected && displayExpenses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('expenses')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Ver los {displayExpenses.length} gastos de {period}
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== EMPTY STATE ====================

function EmptyState() {
  return (
    <div className="space-y-8 py-8">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Tu actividad te espera</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Empieza a registrar tus facturas y gastos para tener una visión clara de cómo va tu negocio.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard/facturas/nueva?tipo=standard">
              <Button>
                <Euro className="mr-2 h-4 w-4" />
                Crear primera factura
              </Button>
            </Link>
            <Link href="/dashboard/gastos/nuevo">
              <Button variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Añadir gasto
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Registra cada ingreso</h4>
                <p className="text-xs text-muted-foreground">
                  Crea facturas para tus clientes y lleva un control de lo que facturas cada mes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/10">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Controla tus gastos</h4>
                <p className="text-xs text-muted-foreground">
                  Añade tus gastos deducibles para saber cuánto pagas realmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function MiActividadPage() {
  const tenant = useAuthStore((state) => state.currentTenant);
  const now = new Date();

  const { data, isLoading } = useActivitySummary();

  const incomeThisMonth = data?.incomeThisMonth ?? 0;
  const incomeLastMonth = data?.incomeLastMonth ?? 0;
  const incomeThisYear = data?.incomeThisYear ?? 0;
  const expenseThisMonth = data?.expenseThisMonth ?? 0;
  const expenseLastMonth = data?.expenseLastMonth ?? 0;
  const expenseThisYear = data?.expenseThisYear ?? 0;
  const chartData = data?.monthlyChart ?? [];
  const topExpenseCategories = data?.topExpenseCategories ?? [];

  const resultThisMonth = incomeThisMonth - expenseThisMonth;
  const resultLastMonth = incomeLastMonth - expenseLastMonth;
  const resultThisYear = incomeThisYear - expenseThisYear;

  const incomeTrend = pctChange(incomeThisMonth, incomeLastMonth);
  const expenseTrend = pctChange(expenseThisMonth, expenseLastMonth);
  const resultTrend = pctChange(resultThisMonth, resultLastMonth);
  const profitMargin = getProfitMargin(incomeThisMonth, expenseThisMonth);

  const hasAnyActivity = incomeThisYear > 0 || expenseThisYear > 0;

  const prevMonthName = MONTHS_ES[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi actividad</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tenant?.businessName} &middot; {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <CalendarDays className="h-3.5 w-3.5" />
          {MONTHS_ES[now.getMonth()]} {now.getFullYear()}
        </div>
      </div>

      {!isLoading && !hasAnyActivity ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Ingresos"
              value={incomeThisMonth}
              subtitle="Este mes"
              trend={incomeTrend}
              trendGoodWhenUp={true}
              trendLabel={`vs ${prevMonthName}`}
              icon={Euro}
              iconClassName="bg-primary/10 text-primary"
              valueClassName="text-foreground"
              isLoading={isLoading}
              href="/dashboard/facturas"
            />
            <KpiCard
              title="Gastos"
              value={expenseThisMonth}
              subtitle="Este mes"
              trend={expenseTrend}
              trendGoodWhenUp={false}
              trendLabel={`vs ${prevMonthName}`}
              icon={Receipt}
              iconClassName="bg-muted text-muted-foreground"
              valueClassName="text-foreground"
              isLoading={isLoading}
              href="/dashboard/gastos"
            />
            <KpiCard
              title="Resultado"
              value={resultThisMonth}
              subtitle="Este mes"
              trend={resultTrend}
              trendGoodWhenUp={true}
              trendLabel={`vs ${prevMonthName}`}
              icon={resultThisMonth >= 0 ? TrendingUp : TrendingDown}
              iconClassName={resultThisMonth >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}
              valueClassName={resultThisMonth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
              isLoading={isLoading}
            />
            <KpiCard
              title="Acumulado"
              value={resultThisYear}
              subtitle={`${now.getFullYear()}`}
              icon={Scale}
              iconClassName={resultThisYear >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}
              valueClassName={resultThisYear >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <MainChartCard
              year={now.getFullYear()}
              chartData={chartData}
              isLoading={isLoading}
            />
            <ExpenseBreakdownCard
              monthlyExpenseCategories={data?.monthlyExpenseCategories ?? []}
              monthlyExpenses={data?.monthlyExpenses ?? []}
              isLoading={isLoading}
              year={now.getFullYear()}
              chartData={chartData}
            />
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Visión orientativa de tu actividad. No sustituye a un informe contable o fiscal.
              <Link href="/dashboard/gastos" className="underline ml-1">
                Ver gastos
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
