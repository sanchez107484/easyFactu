'use client';

import { useMemo } from 'react';
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
  Users,
  Plus,
  ArrowUpRight,
  Package,
  UserPlus,
  FilePlus,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  Zap,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInvoices, useAllInvoices } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { Invoice, InvoiceStatus } from '@easyfactura/shared-types';
import { INVOICE_STATUS_CONFIG } from '@/components/common/invoice-status-badge';
import { cn, formatCurrency } from '@/lib/utils';

// ==================== HELPERS ====================

const MONTH_LABELS = [
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
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 14) return 'Buenos dias';
  if (hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

// ==================== STATS COMPUTATION ====================

/**
 * Calcula todos los KPIs del dashboard a partir del conjunto completo de facturas.
 * - billedThisMonth: suma de facturas activas emitidas en el mes/año actual
 * - pendingCollection: suma de facturas CONFIRMED o SENT (sin filtro de fecha — pueden ser de cualquier año)
 * - invoicesThisMonth: número de facturas activas emitidas este mes
 * - chartData: facturación mensual del año en curso
 */
function computeStats(invoices: Invoice[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Mes anterior (cruza año si es enero)
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth();

  const activeStatuses = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PAID];
  const pendingStatuses = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT];

  let billedThisMonth = 0;
  let billedLastMonth = 0;
  let pendingCollection = 0;
  let invoicesThisMonth = 0;
  const monthlyTotals = Array.from({ length: 12 }, () => 0);

  for (const inv of invoices) {
    const issueDate = new Date(inv.issueDate);
    const invYear = issueDate.getFullYear();
    const invMonth = issueDate.getMonth();
    const total = Number(inv.total) || 0;

    // Pendiente de cobro: cualquier año, solo CONFIRMED y SENT
    if (pendingStatuses.includes(inv.status)) {
      pendingCollection += total;
    }

    // Activas (confirmadas + enviadas + cobradas)
    if (activeStatuses.includes(inv.status)) {
      // Facturado este mes
      if (invYear === currentYear && invMonth === currentMonth) {
        billedThisMonth += total;
        invoicesThisMonth++;
      }
      // Facturado el mes pasado
      if (invYear === lastMonthYear && invMonth === lastMonth) {
        billedLastMonth += total;
      }
      // Gráfica: solo año en curso
      if (invYear === currentYear) {
        monthlyTotals[invMonth] += total;
      }
    }
  }

  const chartData = MONTH_LABELS.map((month, i) => ({
    month,
    importe: Math.round(monthlyTotals[i] * 100) / 100,
  }));

  return { billedThisMonth, billedLastMonth, pendingCollection, invoicesThisMonth, chartData };
}

// ==================== STAT CARD ====================

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  isLoading: boolean;
  href?: string;
}

function StatCard({ title, value, description, icon: Icon, isLoading, href }: StatCardProps) {
  const content = (
    <Card className={cn('transition-all', href && 'hover:shadow-md cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
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

// ==================== PAGE ====================

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.currentTenant);
  const { completedSteps, isBannerDismissed, dismissBanner } = useOnboardingStore();

  const now = new Date();

  // Todas las facturas del tenant (paginando automáticamente) para KPIs precisos
  const { data: allInvoices = [], isLoading: loadingInvoices } = useAllInvoices();

  // Últimas 6 facturas para la lista reciente (query independiente, rápida)
  const { data: recentData, isLoading: loadingRecent } = useInvoices({
    limit: 6,
    sortBy: 'issueDate',
    sortOrder: 'desc',
  });

  const { data: customersData, isLoading: loadingCustomers } = useCustomers({ limit: 1 });
  const { data: productsData, isLoading: loadingProducts } = useProducts({ limit: 1 });

  const recentInvoices = recentData?.data ?? [];
  const totalCustomers = customersData?.meta?.total ?? 0;
  const totalProducts = productsData?.meta?.total ?? 0;

  const { billedThisMonth, billedLastMonth, pendingCollection, invoicesThisMonth, chartData } =
    useMemo(() => computeStats(allInvoices), [allInvoices]);

  const isLoadingStats = loadingInvoices;
  const isStillLoading = loadingInvoices || loadingCustomers || loadingProducts;
  const hasAnyData = allInvoices.length > 0 || totalCustomers > 0 || totalProducts > 0;

  return (
    <div className="space-y-6">
      {/* Setup banner — shown until setupCompleted is true in the database */}
      {!tenant?.setupCompleted && !isBannerDismissed && (
        <SetupBanner completedSteps={completedSteps} onDismiss={dismissBanner} />
      )}

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
        <Link href="/dashboard/facturas/nueva?tipo=standard">
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
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">Anadir cliente</p>
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
          />
          <StatCard
            title={`Facturado en ${MONTH_LABELS[(now.getMonth() + 11) % 12]}`}
            value={formatCurrency(billedLastMonth)}
            description="Mes anterior"
            icon={CalendarDays}
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
            title="Clientes"
            value={loadingCustomers ? '...' : String(totalCustomers)}
            description="En tu cartera"
            icon={Users}
            isLoading={loadingCustomers}
            href="/dashboard/clientes"
          />
          <StatCard
            title="Catalogo"
            value={loadingProducts ? '...' : String(totalProducts)}
            description="Productos y servicios"
            icon={Package}
            isLoading={loadingProducts}
            href="/dashboard/productos"
          />
        </div>
      )}

      {/* Grafica + Ultimas facturas */}
      {(isStillLoading || hasAnyData) && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Grafica mensual */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Facturacion {now.getFullYear()}</CardTitle>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Confirmadas, enviadas y cobradas
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-end gap-1 h-[220px] pb-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ height: `${30 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
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
                    <Bar
                      dataKey="importe"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Ultimas facturas */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
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
            <CardContent className="p-0">
              {loadingRecent ? (
                <div className="space-y-px">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold font-mono">
                                {invoice.number}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5 py-0 h-4 font-normal',
                                  statusCfg?.color,
                                  statusCfg?.bg,
                                  statusCfg?.border,
                                )}
                              >
                                {statusCfg?.label ?? invoice.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {invoice.customer?.name ?? '—'}
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
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
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
      {!isLoadingStats && !loadingCustomers && !loadingProducts && !hasAnyData && (
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
                  Anadir cliente
                </Button>
              </Link>
              <Link href="/dashboard/productos/nuevo">
                <Button variant="outline" size="sm">
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  Anadir producto
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
