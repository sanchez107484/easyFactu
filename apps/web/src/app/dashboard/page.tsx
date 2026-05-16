'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/hooks/use-onboarding';
import { useTenant } from '@/hooks/use-tenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Euro,
  Clock,
  Plus,
  ArrowUpRight,
  Package,
  UserPlus,
  FilePlus,
  ChevronRight,
  ClipboardList,
  Zap,
  X,
  TrendingUp,
  TrendingDown,
  CircleCheck,
  CalendarDays,
  Receipt,
  BarChart2,
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
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { useInvoices, useInvoiceStats } from '@/hooks/use-invoices';
import { InvoiceStatus } from '@easyfactura/shared-types';
import { INVOICE_STATUS_CONFIG } from '@/components/common/invoice-status-badge';
import { cn, formatCurrency } from '@/lib/utils';
import { InvitationCards } from '@/components/common/invitation-alert';

// ==================== HELPERS ====================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 14) return 'Buenos dias';
  if (hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

// ==================== STAT CARD ====================

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  isLoading: boolean;
  href?: string;
  trend?: number | null;
  trendLabel?: string;
  trendGoodWhenUp?: boolean;
  alert?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  href,
  trend,
  trendLabel,
  trendGoodWhenUp = true,
  alert,
}: StatCardProps) {
  const trendPositive = trend !== null && trend !== undefined && trend >= 0;
  const trendIsGood = trendPositive === trendGoodWhenUp;

  const content = (
    <Card
      className={cn(
        'transition-all',
        href && 'hover:shadow-md cursor-pointer',
        alert && 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pt-5 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center',
            alert ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10',
          )}
        >
          <Icon
            className={cn('h-4 w-4', alert ? 'text-amber-600 dark:text-amber-400' : 'text-primary')}
          />
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
            <div className="text-2xl font-bold tracking-tight">{value}</div>
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

// ==================== SETUP BANNER ====================

const SETUP_STEPS = ['Tipo de cuenta', 'Datos fiscales', 'Serie de facturas', 'Preferencias'];

interface SetupBannerProps {
  completedSteps: number[];
  onDismiss: () => void;
}

function SetupBanner({ completedSteps, onDismiss }: SetupBannerProps) {
  const doneCount = completedSteps.length;
  const totalSteps = SETUP_STEPS.length;
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  return (
    <div className="relative rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-5">
      <button
        onClick={onDismiss}
        aria-label="Cerrar"
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Zap className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Completa la configuración de tu cuenta</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura tus datos fiscales para emitir facturas válidas con VeriFactu.
          </p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {doneCount} de {totalSteps}
            </span>
          </div>

          {/* Step pills */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SETUP_STEPS.map((label, i) => {
              const stepNumber = i + 1;
              const done = completedSteps.includes(stepNumber);
              return (
                <span
                  key={stepNumber}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done && <ChevronRight className="h-3 w-3 -rotate-90" />}
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        <Link href="/dashboard/onboarding" className="shrink-0">
          <Button size="sm" className="gap-1.5">
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ==================== BILLING CHART CARD ====================

type ChartView = 'mensual' | 'acumulado' | 'trimestral' | 'comparativa';

const CHART_VIEWS: { value: ChartView; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'acumulado', label: 'Acumulado' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'comparativa', label: 'vs Año anterior' },
];

const Y_TICK_FORMATTER = (v: number) =>
  v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  fontSize: '12px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--background))',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-muted-foreground/40',
  PROFORMA: 'bg-amber-400',
  CONFIRMED: 'bg-sky-500',
  SENT: 'bg-violet-500',
  PAID: 'bg-emerald-500',
  CANCELLED: 'bg-red-400',
  QUOTE: 'bg-orange-400',
};

interface BillingChartCardProps {
  year: number;
  chartData: Array<{ month: string; importe: number }>;
  chartDataPrevYear: Array<{ month: string; importe: number }>;
  isLoading: boolean;
}

function BillingChartCard({
  year,
  chartData,
  chartDataPrevYear,
  isLoading,
}: BillingChartCardProps) {
  const [view, setView] = useState<ChartView>('mensual');

  const cumulativeData = chartData.reduce<Array<{ month: string; importe: number }>>(
    (acc, d, i) => {
      const prev = acc[i - 1]?.importe ?? 0;
      acc.push({ month: d.month, importe: Math.round((prev + d.importe) * 100) / 100 });
      return acc;
    },
    [],
  );

  const quarterlyData = [
    { label: 'T1', importe: chartData.slice(0, 3).reduce((s, d) => s + d.importe, 0) },
    { label: 'T2', importe: chartData.slice(3, 6).reduce((s, d) => s + d.importe, 0) },
    { label: 'T3', importe: chartData.slice(6, 9).reduce((s, d) => s + d.importe, 0) },
    { label: 'T4', importe: chartData.slice(9, 12).reduce((s, d) => s + d.importe, 0) },
  ];

  const filledMonths = chartData.filter((d) => d.importe > 0);
  const monthlyAvg =
    filledMonths.length > 0
      ? Math.round(filledMonths.reduce((s, d) => s + d.importe, 0) / filledMonths.length)
      : 0;

  // Merge current + prev year for comparativa view
  const comparativaData = chartData.map((d, i) => ({
    month: d.month,
    esteAnio: d.importe,
    anioAnterior: chartDataPrevYear[i]?.importe ?? 0,
  }));

  const hasPrevYearData = chartDataPrevYear.some((d) => d.importe > 0);

  return (
    <Card className="lg:col-span-3 flex flex-col">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">Facturación {year}</CardTitle>
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
        ) : view === 'acumulado' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                formatter={(value: number) => [formatCurrency(value), 'Acumulado YTD']}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area
                type="monotone"
                dataKey="importe"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gradAcumulado)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : view === 'comparativa' ? (
          hasPrevYearData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                    name === 'esteAnio' ? String(year) : String(year - 1),
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar
                  dataKey="anioAnterior"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.3}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="esteAnio"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <BarChart2 className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin datos del año anterior</p>
              <p className="text-xs text-muted-foreground/60">
                {year - 1} no tiene facturas registradas
              </p>
            </div>
          )
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={view === 'trimestral' ? quarterlyData : chartData}
              margin={{
                top: 4,
                right: view === 'mensual' && monthlyAvg > 0 ? 8 : 4,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey={view === 'trimestral' ? 'label' : 'month'}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={Y_TICK_FORMATTER}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Facturado']}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar
                dataKey="importe"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={view === 'trimestral' ? 80 : 40}
              />
              {view === 'mensual' && monthlyAvg > 0 && (
                <ReferenceLine
                  y={monthlyAvg}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  label={{
                    value: `Ø ${Y_TICK_FORMATTER(monthlyAvg)}`,
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                    dy: -6,
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== PAGE ====================

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.currentTenant);
  const { completedSteps, isBannerDismissed, dismissBanner } = useOnboardingStore();

  const now = new Date();

  const { data: stats, isLoading: loadingInvoices } = useInvoiceStats();

  // Últimas 6 facturas para la lista reciente (query independiente, rápida)
  const { data: recentData, isLoading: loadingRecent } = useInvoices({
    limit: 6,
    sortBy: 'issueDate',
    sortOrder: 'desc',
  });

  const recentInvoices = recentData?.data ?? [];
  const totalCustomers = stats?.totalCustomers ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;

  const billedThisMonth = stats?.billedThisMonth ?? 0;
  const billedLastMonth = stats?.billedLastMonth ?? 0;
  const pendingCollection = stats?.pendingCollection ?? 0;
  const invoicesThisMonth = stats?.invoicesThisMonth ?? 0;
  const collectedThisMonth = stats?.collectedThisMonth ?? 0;
  const vatThisQuarter = stats?.vatThisQuarter ?? 0;
  const chartData = stats?.monthlyChart ?? [];
  const chartDataPrevYear = stats?.monthlyChartPrevYear ?? [];

  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const vatDescription = `T${currentQuarter} ${now.getFullYear()} · Modelo 303`;

  // YTD: sum monthly chart up to (and including) the current month
  const billedThisYear = chartData
    .slice(0, now.getMonth() + 1)
    .reduce((sum, d) => sum + d.importe, 0);

  const YTD_MONTHS = [
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
  const ytdDescription = `Ene – ${YTD_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const MONTH_NAMES_FULL = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ] as const;
  const prevMonthName = MONTH_NAMES_FULL[now.getMonth() === 0 ? 11 : now.getMonth() - 1]!;

  const monthTrend =
    billedLastMonth > 0
      ? Math.round(((billedThisMonth - billedLastMonth) / billedLastMonth) * 100)
      : null;

  const isLoadingStats = loadingInvoices;
  const isStillLoading = loadingInvoices || loadingRecent;
  const hasAnyData = (recentData?.meta?.total ?? 0) > 0 || totalCustomers > 0 || totalProducts > 0;

  return (
    <div className="space-y-6">
      {/* Setup banner — shown until setupCompleted is true in the database */}
      {!tenant?.setupCompleted && !isBannerDismissed && (
        <SetupBanner completedSteps={completedSteps} onDismiss={dismissBanner} />
      )}

      {/* Pending agency invitations */}
      <InvitationCards />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.firstName ?? 'usuario'} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tenant?.businessName} &middot;{' '}
            {now.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* Acciones rapidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Link href="/dashboard/facturas/nueva?tipo=standard">
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <FilePlus className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Nueva factura</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Factura estandar</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/facturas/nueva?tipo=proforma">
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-proforma-400/50 hover:bg-proforma-50 dark:hover:bg-proforma-950/20 transition-all cursor-pointer h-full">
            <div className="h-9 w-9 rounded-lg bg-proforma-100 dark:bg-proforma-900/30 flex items-center justify-center shrink-0 group-hover:bg-proforma-200 dark:group-hover:bg-proforma-900/50 transition-colors">
              <ClipboardList className="h-4 w-4 text-proforma-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Proforma</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                Presupuesto previo
              </p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/facturas">
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-rectificativa-400/50 hover:bg-rectificativa-50 dark:hover:bg-rectificativa-950/20 transition-all cursor-pointer h-full">
            <div className="h-9 w-9 rounded-lg bg-rectificativa-100 dark:bg-rectificativa-900/30 flex items-center justify-center shrink-0 group-hover:bg-rectificativa-200 dark:group-hover:bg-rectificativa-900/50 transition-colors">
              <FileText className="h-4 w-4 text-rectificativa-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Rectificativa</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Corregir factura</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/clientes/nuevo">
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-customer-400/50 hover:bg-customer-50 dark:hover:bg-customer-950/20 transition-all cursor-pointer h-full">
            <div className="h-9 w-9 rounded-lg bg-customer-100 dark:bg-customer-900/30 flex items-center justify-center shrink-0 group-hover:bg-customer-200 dark:group-hover:bg-customer-900/50 transition-colors">
              <UserPlus className="h-4 w-4 text-customer-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Nuevo cliente</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Añadir cliente</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/productos/nuevo">
          <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-product-400/50 hover:bg-product-50 dark:hover:bg-product-950/20 transition-all cursor-pointer h-full">
            <div className="h-9 w-9 rounded-lg bg-product-100 dark:bg-product-900/30 flex items-center justify-center shrink-0 group-hover:bg-product-200 dark:group-hover:bg-product-900/50 transition-colors">
              <Package className="h-4 w-4 text-product-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Nuevo producto</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">O servicio</p>
            </div>
          </div>
        </Link>
      </div>

      {/* KPIs */}
      {(isStillLoading || hasAnyData) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Facturado este mes"
            value={formatCurrency(billedThisMonth)}
            description={`${invoicesThisMonth} factura${invoicesThisMonth !== 1 ? 's' : ''} emitida${invoicesThisMonth !== 1 ? 's' : ''}`}
            icon={Euro}
            isLoading={isLoadingStats}
            href="/dashboard/facturas"
            trend={monthTrend}
            trendLabel={`vs ${prevMonthName}`}
          />
          <StatCard
            title="Cobrado este mes"
            value={formatCurrency(collectedThisMonth)}
            description="Pagos registrados"
            icon={CircleCheck}
            isLoading={isLoadingStats}
            href="/dashboard/facturas"
          />
          <StatCard
            title="Pendiente de cobro"
            value={formatCurrency(pendingCollection)}
            description="Confirmadas y enviadas"
            icon={Clock}
            isLoading={isLoadingStats}
            href="/dashboard/facturas"
          />
          <StatCard
            title="Acumulado anual"
            value={formatCurrency(billedThisYear)}
            description={ytdDescription}
            icon={CalendarDays}
            isLoading={isLoadingStats}
            href="/dashboard/facturas"
          />
          <StatCard
            title="IVA devengado (trimestre)"
            value={formatCurrency(vatThisQuarter)}
            description={vatDescription}
            icon={Receipt}
            isLoading={isLoadingStats}
            href="/dashboard/facturas"
          />
        </div>
      )}

      {/* Grafica + Ultimas facturas */}
      {(isStillLoading || hasAnyData) && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Grafica mensual */}
          <BillingChartCard
            year={now.getFullYear()}
            chartData={chartData}
            chartDataPrevYear={chartDataPrevYear}
            isLoading={isLoadingStats}
          />

          {/* Ultimas facturas */}
          <Card className="lg:col-span-2">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Ultimas facturas</CardTitle>
                <Link href="/dashboard/facturas">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    Ver todas
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              {loadingRecent ? (
                <div className="space-y-px">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">Sin facturas aun</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crea tu primera factura para empezar
                  </p>
                  <Link href="/dashboard/facturas/nueva?tipo=standard" className="mt-3">
                    <Button size="sm" variant="outline">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Crear factura
                    </Button>
                  </Link>
                </div>
              ) : (
                <div>
                  {recentInvoices.map((invoice) => {
                    const statusCfg = INVOICE_STATUS_CONFIG[invoice.status as InvoiceStatus];
                    return (
                      <Link key={invoice.id} href={`/dashboard/facturas/${invoice.id}`}>
                        <div className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/40 transition-colors border-b last:border-b-0">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0 mt-px',
                              STATUS_DOT[invoice.status] ?? 'bg-muted-foreground/40',
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {invoice.customer?.name ?? '—'}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5 py-0 h-4 font-normal shrink-0',
                                  statusCfg?.color,
                                  statusCfg?.bg,
                                  statusCfg?.border,
                                )}
                              >
                                {statusCfg?.label ?? invoice.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {invoice.number ??
                                (invoice.invoiceType === 'proforma' ? 'Proforma' : 'Borrador')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold tabular-nums">
                              {formatCurrency(Number(invoice.total))}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(invoice.issueDate).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state primer uso */}
      {!isStillLoading && !hasAnyData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Empieza a facturar</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Configura tus clientes, productos y lanza tu primera factura en minutos.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <Link href="/dashboard/clientes/nuevo">
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Añadir cliente
                </Button>
              </Link>
              <Link href="/dashboard/productos/nuevo">
                <Button variant="outline" size="sm">
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  Añadir producto
                </Button>
              </Link>
              <Link href="/dashboard/facturas/nueva?tipo=standard">
                <Button size="sm">
                  <FilePlus className="mr-1.5 h-3.5 w-3.5" />
                  Primera factura
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
