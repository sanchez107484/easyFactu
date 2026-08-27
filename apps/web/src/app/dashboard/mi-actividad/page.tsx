'use client';

/**
 * Pantalla "Mi actividad" — sección nueva e independiente (Plan PRO).
 *
 * Basada en los mismos componentes y patrones visuales que la pantalla de
 * Inicio (Card, StatCard, chart con toggle de vistas, skeletons, empty
 * states) para que se sienta como una parte nativa de NaFactura.
 *
 * ⚠️ SUPUESTOS SOBRE DATOS — ajustar a tu API real:
 * Este componente asume un hook `useActivitySummary()` que devuelve, para
 * la empresa actual:
 *
 *   {
 *     incomeThisMonth: number;      // facturado este mes
 *     incomeLastMonth: number;
 *     incomeThisYear: number;
 *     expenseThisMonth: number;     // gastos este mes
 *     expenseLastMonth: number;
 *     expenseThisYear: number;
 *     monthlyChart: Array<{ month: string; ingresos: number; gastos: number }>;
 *     topExpenseCategories: Array<{ categoryId: string; name: string; amount: number }>;
 *   }
 *
 * Si tus hooks actuales (`useInvoiceStats`, `useExpenseSummary`) ya cubren
 * parte de esto por separado, la forma más sencilla es crear un hook
 * `useActivitySummary` en el backend/BFF que combine ambos orígenes en una
 * sola llamada (evita дos loading states descoordinados y in-consistencias
 * de fecha/zona horaria entre ingresos y gastos — ver HU-12).
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Euro,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Wallet,
  PieChart as PieChartIcon,
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
} from 'recharts';
import { useActivitySummary } from '@/hooks/use-activity-summary'; // ver nota arriba
import { cn, formatCurrency } from '@/lib/utils';

// ==================== HELPERS ====================

const Y_TICK_FORMATTER = (v: number) =>
  v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  fontSize: '12px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
};

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.75)',
  'hsl(var(--primary) / 0.55)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--muted-foreground) / 0.4)',
];

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ==================== ACTIVITY STAT CARD ====================
// Igual que el StatCard de Inicio, pero con soporte para "resultado"
// (permite colorear en función del signo, no solo de la tendencia).

interface ActivityStatCardProps {
  title: string;
  value: number;
  description?: string;
  icon: React.ElementType;
  isLoading: boolean;
  href?: string;
  trend?: number | null;
  trendLabel?: string;
  trendGoodWhenUp?: boolean;
  emphasis?: 'neutral' | 'positive' | 'negative';
}

function ActivityStatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  href,
  trend,
  trendLabel,
  trendGoodWhenUp = true,
  emphasis = 'neutral',
}: ActivityStatCardProps) {
  const trendPositive = trend !== null && trend !== undefined && trend >= 0;
  const trendIsGood = trendPositive === trendGoodWhenUp;

  const valueColor =
    emphasis === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : emphasis === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-foreground';

  const content = (
    <Card className={cn('transition-all', href && 'hover:shadow-md cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <div className={cn('text-2xl font-bold tracking-tight tabular-nums', valueColor)}>
              {formatCurrency(value)}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {trend !== null && trend !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-md px-1.5 py-0.5',
                    trendIsGood
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
                  )}
                >
                  {trendPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trendPositive ? '+' : ''}
                  {trend}%
                </span>
              )}
              {trendLabel && trend !== null && trend !== undefined && (
                <span className="text-[10px] text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

// ==================== INGRESOS VS GASTOS CHART ====================

interface ActivityChartCardProps {
  year: number;
  chartData: Array<{ month: string; ingresos: number; gastos: number }>;
  isLoading: boolean;
}

function ActivityChartCard({ year, chartData, isLoading }: ActivityChartCardProps) {
  // Si TODOS los meses están a 0 en ambas series, se considera "sin datos"
  // reales (no confundir con un mes puntual a 0, que sí debe mostrarse).
  const hasAnyData = chartData.some((d) => d.ingresos > 0 || d.gastos > 0);

  return (
    <Card className="lg:col-span-3 flex flex-col">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Ingresos y gastos {year}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Ingresos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50" /> Gastos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-4 flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-end gap-1 h-full pb-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        ) : !hasAnyData ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Wallet className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aún no hay actividad este año</p>
            <p className="text-xs text-muted-foreground/60">
              Registra facturas y gastos para ver aquí tu evolución mes a mes
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar
                dataKey="ingresos"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="gastos"
                fill="hsl(var(--muted-foreground) / 0.5)"
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== TOP CATEGORÍAS DE GASTO ====================

interface TopCategoriesCardProps {
  categories: Array<{ categoryId: string; name: string; amount: number }>;
  isLoading: boolean;
}

function TopCategoriesCard({ categories, isLoading }: TopCategoriesCardProps) {
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const top = [...categories].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Gastos por categoría</CardTitle>
          <Link href="/dashboard/gastos">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Ver gastos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PieChartIcon className="h-9 w-9 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">Aún no has registrado gastos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Añade tu primer gasto para ver el desglose por categoría
            </p>
            <Link href="/dashboard/gastos/nuevo" className="mt-3">
              <Button size="sm" variant="outline">
                Añadir gasto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="h-[130px] w-[130px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={top}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={2}
                  >
                    {top.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {top.map((c, i) => {
                const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;
                return (
                  <div key={c.categoryId} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-xs truncate flex-1">{c.name}</span>
                    <span className="text-xs font-medium tabular-nums">
                      {formatCurrency(c.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

  const hasAnyActivity = incomeThisYear > 0 || expenseThisYear > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi actividad</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tenant?.businessName} &middot; Visión sencilla de tus ingresos y gastos
          </p>
        </div>
      </div>

      {/* Empty state general — sin ingresos ni gastos en todo el año */}
      {!isLoading && !hasAnyActivity ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Aún no hay actividad que mostrar</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              En cuanto emitas facturas o registres gastos, aquí verás la evolución de tu negocio
              mes a mes.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <Link href="/dashboard/gastos/nuevo">
                <Button variant="outline" size="sm">
                  Añadir gasto
                </Button>
              </Link>
              <Link href="/dashboard/facturas/nueva?tipo=standard">
                <Button size="sm">Crear factura</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActivityStatCard
              title="Ingresos este mes"
              value={incomeThisMonth}
              description="Facturado"
              icon={Euro}
              isLoading={isLoading}
              href="/dashboard/facturas"
              trend={incomeTrend}
              trendLabel="vs mes anterior"
            />
            <ActivityStatCard
              title="Gastos este mes"
              value={expenseThisMonth}
              description="Registrados"
              icon={Receipt}
              isLoading={isLoading}
              href="/dashboard/gastos"
              trend={expenseTrend}
              trendLabel="vs mes anterior"
              trendGoodWhenUp={false}
            />
            <ActivityStatCard
              title="Resultado este mes"
              value={resultThisMonth}
              description="Ingresos − gastos"
              icon={resultThisMonth >= 0 ? TrendingUp : TrendingDown}
              isLoading={isLoading}
              trend={resultTrend}
              trendLabel="vs mes anterior"
              emphasis={resultThisMonth >= 0 ? 'positive' : 'negative'}
            />
          </div>

          {/* Acumulado anual — fila secundaria, más discreta */}
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="text-muted-foreground">Ingresos {now.getFullYear()}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(incomeThisYear)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="text-muted-foreground">Gastos {now.getFullYear()}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(expenseThisYear)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="text-muted-foreground">Resultado {now.getFullYear()}</span>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  resultThisYear >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {formatCurrency(resultThisYear)}
              </span>
            </div>
          </div>

          {/* Gráfico mensual + top categorías */}
          <div className="grid gap-6 lg:grid-cols-5">
            <ActivityChartCard
              year={now.getFullYear()}
              chartData={chartData}
              isLoading={isLoading}
            />
            <TopCategoriesCard categories={topExpenseCategories} isLoading={isLoading} />
          </div>

          {/* Aviso de terminología — evita que "Resultado" se lea como un dato contable/fiscal */}
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            Esta es una visión orientativa de tu actividad, no un informe contable ni fiscal.
            <Link href="/dashboard/gastos" className="inline-flex items-center gap-0.5 underline">
              Ver todos los gastos <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
