'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ActivateProDialog } from '@/components/ui/activate-pro-dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Receipt,
  AlertCircle,
  AlertTriangle,
  X,
  Euro,
  Calendar,
  Filter,
  ReceiptText,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Repeat,
  Check,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Tag,
  Building2,
  FileText,
  Download,
  Trash,
  CheckCircle2,
  Copy,
  Gift,
  Sparkles,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Expense,
  ExpenseCategory,
  Supplier,
  Customer,
  QueryExpensesInput,
  PlanCycle,
} from '@easyfactura/shared-types';
import {
  useExpenses,
  useDeleteExpense,
  usePrefetchExpense,
  useExpenseSummary,
} from '@/hooks/use-expenses';
import { useRecurringExpenses } from '@/hooks/use-recurring-expenses';
import { ExpenseCard } from '@/components/gastos/expense-card';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { useSortTable } from '@/hooks/use-sort-table';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { useCurrentSubscription, useChangePlan } from '@/hooks/use-subscription';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/common/empty-state';
import { PRICING } from '@easyfactura/brand-config';
import { cn, formatCurrency, getCategoryColorFromName, getCategoryColorHsl } from '@/lib/utils';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  });
}

const MONTHS_ES = [
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

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number | null;
  icon: React.ElementType;
  iconClassName?: string;
  valueClassName?: string;
  isLoading: boolean;
}

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconClassName = 'bg-primary/10 text-primary',
  valueClassName = '',
  isLoading,
}: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
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
              <div
                className={cn(
                  'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                  iconClassName,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div
              className={cn('text-3xl font-bold tracking-tight tabular-nums mb-1', valueClassName)}
            >
              {formatCurrency(value)}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== null && trend !== undefined && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5',
                    trend >= 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
                  )}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend >= 0 ? '+' : ''}
                  {trend}%
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SpendingChart({
  monthlyData,
  isLoading,
}: {
  monthlyData: Array<{ month: string; amount: number }>;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Últimos meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 flex items-end gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-md"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Gastos']}
                contentStyle={{
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                }}
              />
              <Bar
                dataKey="amount"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({
  categories,
  isLoading,
}: {
  categories: Array<{ name: string; amount: number; color: string }>;
  isLoading: boolean;
}) {
  const total = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          Por categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Sin categorías</div>
        ) : (
          <div className="space-y-2">
            {categories.slice(0, 5).map((cat, i) => {
              const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
              return (
                <div key={cat.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm truncate flex-1">{cat.name}</span>
                  <span className="text-sm font-medium tabular-nums shrink-0">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DeleteDialogProps {
  expense: Expense | null;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteExpenseDialog({
  expenses,
  open,
  onCancel,
  onConfirm,
  isPending,
}: {
  expenses: Expense[];
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const count = expenses.length;
  const total = expenses.reduce((s, e) => s + Number(e.totalAmount), 0);
  const preview = expenses.slice(0, 3);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            Eliminar {count} gasto{count !== 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Se eliminarán{' '}
                <strong>
                  {count} gasto{count !== 1 ? 's' : ''}
                </strong>{' '}
                de un total de <strong className="text-foreground">{formatCurrency(total)}</strong>.
              </p>
              {preview.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Gastos a eliminar:
                  </p>
                  {preview.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-4">
                      <span className="text-sm truncate flex-1">{e.description}</span>
                      <span className="text-sm font-medium tabular-nums shrink-0">
                        {formatCurrency(e.totalAmount)}
                      </span>
                    </div>
                  ))}
                  {count > 3 && (
                    <p className="text-[11px] text-muted-foreground pt-1">
                      y {count - 3} gasto{count - 3 !== 1 ? 's' : ''} más...
                    </p>
                  )}
                </div>
              )}
              <p className="font-semibold text-amber-600 dark:text-amber-400 text-sm">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ExpenseDetailDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
}

function ExpenseDetailDialog({ expense, onClose, onEdit }: ExpenseDetailDialogProps) {
  if (!expense) return null;

  return (
    <Dialog open={!!expense} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            {expense.description}
            {expense.recurringExpense?.id && <Repeat className="h-4 w-4 text-primary shrink-0" />}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha</p>
              <p className="text-sm font-medium">{formatDate(expense.date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(expense.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Categoría</p>
              <Badge variant="outline">{expense.category?.name ?? 'Sin categoría'}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Proveedor</p>
              <p className="text-sm">{expense.supplier?.name ?? '—'}</p>
            </div>
            {expense.baseAmount !== undefined && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Base imponible</p>
                  <p className="text-sm">{formatCurrency(expense.baseAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">IVA ({expense.vatRate}%)</p>
                  <p className="text-sm">{formatCurrency(expense.vatAmount)}</p>
                </div>
              </>
            )}
            {expense.client && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Cliente asociado</p>
                <p className="text-sm">{expense.client.name}</p>
              </div>
            )}
            {expense.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{expense.notes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/dashboard/gastos/${expense.id}`}>
                Ver detalle
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MonthGroupProps {
  month: string;
  year: number;
  expenses: Expense[];
  onDelete: (expense: Expense) => void;
  onView: (expense: Expense) => void;
  onDuplicate: (expense: Expense) => void;
  canWrite: boolean;
  onPrefetch: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

function MonthGroup({
  month,
  year,
  expenses,
  onDelete,
  onView,
  onDuplicate,
  canWrite,
  onPrefetch,
  selectedIds,
  onToggleSelect,
}: MonthGroupProps) {
  const total = expenses.reduce((s, e) => s + Number(e.totalAmount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">
            {month} {year}
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 border border-primary/20 text-primary">
            {expenses.length} Gasto{expenses.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-2">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onDelete={onDelete}
            onView={onView}
            onDuplicate={onDuplicate}
            canWrite={canWrite}
            onPrefetch={onPrefetch}
            isSelected={selectedIds.has(expense.id)}
            onToggleSelect={() => onToggleSelect(expense.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BulkActionsBar({
  selectedCount,
  onDeleteClick,
}: {
  selectedCount: number;
  onDeleteClick: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-full px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-2 pr-3 border-r">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>
      </div>
      <Button variant="destructive" size="sm" onClick={onDeleteClick} className="gap-2">
        <Trash className="h-4 w-4" />
        Eliminar
      </Button>
    </div>
  );
}

function FilterChips({
  search,
  categoryFilter,
  supplierFilter,
  clientFilter,
  fromDate,
  toDate,
  onClearSearch,
  onClearCategory,
  onClearSupplier,
  onClearClient,
  onClearDates,
}: {
  search: string;
  categoryFilter: string;
  supplierFilter: string;
  clientFilter: string;
  fromDate: string;
  toDate: string;
  onClearSearch: () => void;
  onClearCategory: () => void;
  onClearSupplier: () => void;
  onClearClient: () => void;
  onClearDates: () => void;
}) {
  const chips: Array<{ label: string; onClear: () => void }> = [];

  if (search) chips.push({ label: `Búsqueda: "${search}"`, onClear: onClearSearch });
  if (categoryFilter !== 'ALL') chips.push({ label: `Categoría`, onClear: onClearCategory });
  if (supplierFilter !== 'ALL') chips.push({ label: `Proveedor`, onClear: onClearSupplier });
  if (clientFilter !== 'ALL') chips.push({ label: `Cliente`, onClear: onClearClient });
  if (fromDate || toDate) {
    const label =
      fromDate && toDate
        ? `${fromDate} - ${toDate}`
        : fromDate
          ? `Desde ${fromDate}`
          : `Hasta ${toDate}`;
    chips.push({ label, onClear: onClearDates });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

function UpgradeBanner({ isEmpty, isFreePlan }: { isEmpty: boolean; isFreePlan: boolean }) {
  const proPrice = PRICING.pro.monthly.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const proAnnualPrice = PRICING.pro.annualMonthly.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const annualSaving = PRICING.pro.annualSaving.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [showProModal, setShowProModal] = useState(false);
  const changePlan = useChangePlan();
  const queryClient = useQueryClient();

  const handleActivatePro = async () => {
    try {
      await changePlan.mutateAsync('PROFESSIONAL_FREE');
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      setShowProModal(false);
      window.location.reload();
    } catch {
      // Error is handled by the mutation
    }
  };

  const basicFeatures = [
    { icon: Zap, text: 'VeriFactu' },
    { icon: FileText, text: 'Facturas ilimitadas' },
    { icon: Users, text: 'Clientes y productos ilimitados' },
    { icon: Receipt, text: 'Presupuestos y proformas' },
    { icon: ArrowUpRight, text: 'Rectificativas y abonos' },
    { icon: Repeat, text: 'Facturación recurrente' },
    { icon: BarChart3, text: 'Plantillas personalizadas' },
    { icon: Check, text: 'Tu asesor tiene tus facturas siempre al día' },
  ];

  const proExclusiveFeatures = [
    { icon: ReceiptText, text: 'Gestión avanzada de gastos' },
    { icon: TrendingUp, text: 'Análisis de rentabilidad' },
    { icon: Building2, text: 'Gestión de proveedores' },
    { icon: PiggyBank, text: 'Lectura inteligente de gastos', badge: 'Pronto' },
    { icon: Sparkles, text: 'Automatizaciones con IA', badge: 'Pronto' },
    { icon: BarChart3, text: 'Informes profesionales en segundos', badge: 'Pronto' },
    { icon: CheckCircle2, text: 'Soporte prioritario' },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)/5,transparent_50%)]" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 gap-1"
              >
                <Zap className="h-3 w-3" />
                Plan PRO
              </Badge>
              {isFreePlan && (
                <Badge className="bg-green-500 text-white border-green-600 gap-1 animate-pulse">
                  <Gift className="h-3 w-3" />
                  Gratis hasta 2027
                </Badge>
              )}
            </div>

            <h3 className="text-2xl font-bold mb-2">
              {isEmpty
                ? 'Gestiona tus gastos como un profesional'
                : 'Lleva la gestión de gastos al siguiente nivel'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl">
              {isEmpty
                ? 'Optimiza tu IRPF, reduce workload y automatiza tu facturación. Todo listo para tu próxima declaración.'
                : 'Accede a herramientas avanzadas que te ahorran tiempo y te ayudan a tomar mejores decisiones financieras.'}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background/80 rounded-xl p-4 border border-muted/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold">Ya incluido en tu plan</span>
                </div>
                <ul className="space-y-2.5">
                  {basicFeatures.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 relative">
                <div className="absolute -top-2.5 left-4">
                  <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 h-5">
                    ★ Solo en PRO
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Características PRO</span>
                </div>
                <ul className="space-y-2.5">
                  {proExclusiveFeatures.map(({ icon: Icon, text, badge }) => (
                    <li key={text} className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">{text}</span>
                      {badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] px-1.5 py-0 h-4 text-muted-foreground"
                        >
                          {badge}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
              {isFreePlan ? (
                <>
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" onClick={() => setShowProModal(true)}>
                    <Gift className="h-5 w-5" />
                    Activar PRO gratuito hasta 2027
                  </Button>
                  <Link
                    href="/dashboard/ajustes/plan"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Ver detalle de planes
                    <ArrowRight className="h-4 w-4 inline ml-1" />
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/ajustes/plan">
                    <Button size="lg" className="gap-2">
                      Pasar a PRO
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{proAnnualPrice}€/mes</span>{' '}
                    facturado anualmente
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 w-full lg:w-56">
            <div className="bg-background rounded-2xl p-5 border border-primary/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
                <div className="relative text-center">
                <p className="text-xs text-muted-foreground mb-2">Precio PRO</p>
                <div className="mb-2 relative">
                  <span className="text-3xl font-bold text-muted-foreground relative z-10">{proPrice}€</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent rotate-[-6deg] shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                  </span>
                </div>
                <div className="flex justify-center mb-3">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
                    AHORA GRATIS
                  </span>
                </div>
                <div className="h-px bg-border my-3" />
                <div className="space-y-1.5 mb-4">
                  <p className="text-sm font-medium text-green-600">Ahorra {annualSaving}€/año</p>
                  <p className="text-xs text-muted-foreground">facturando anualmente</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    {proAnnualPrice}€/mes facturado anualmente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivateProDialog
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onActivate={handleActivatePro}
        isPending={changePlan.isPending}
      />
    </div>
  );
}

export default function GastosPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expensesToDelete, setExpensesToDelete] = useState<Expense[]>([]);
  const { sortKey, sortDir, handleSort } = useSortTable('date', 'desc');

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, categoryFilter, supplierFilter, clientFilter, fromDate, toDate, sortKey, sortDir]);

  useEffect(() => {
    if (!filtersExpanded) return;
    const hasFilters =
      search ||
      categoryFilter !== 'ALL' ||
      supplierFilter !== 'ALL' ||
      clientFilter !== 'ALL' ||
      fromDate ||
      toDate;
    if (!hasFilters) setFiltersExpanded(false);
  }, [search, categoryFilter, supplierFilter, clientFilter, fromDate, toDate]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map((e) => e.id)));
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Fecha',
      'Concepto',
      'Categoría',
      'Proveedor',
      'Base',
      'IVA (%)',
      'IVA (€)',
      'Total',
    ];
    const rows = expenses
      .filter((e) => selectedIds.has(e.id))
      .map((e) => [
        e.date,
        e.description,
        e.category?.name ?? '',
        e.supplier?.name ?? '',
        e.baseAmount?.toString() ?? '',
        e.vatRate?.toString() ?? '',
        e.vatAmount?.toString() ?? '',
        e.totalAmount.toString(),
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { data, isLoading, error, refetch } = useExpenses({
    search: search || undefined,
    categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    supplierId: supplierFilter !== 'ALL' ? supplierFilter : undefined,
    clientId: clientFilter !== 'ALL' ? clientFilter : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sortBy: sortKey as QueryExpensesInput['sortBy'],
    sortOrder: sortDir,
    page,
    limit: 20,
  });

  const { data: recurringData, isLoading: isRecurringLoading } = useRecurringExpenses({ limit: 1 });
  const hasRecurringExpenses = (recurringData?.meta?.total ?? 0) > 0;

  const { data: summaryData, isLoading: isSummaryLoading } = useExpenseSummary();
  const { data: categoriesData } = useExpenseCategories();
  const { data: suppliersData } = useSuppliers({ limit: 500 });
  const { data: customersData } = useCustomers({ limit: 500 });
  const deleteMutation = useDeleteExpense();
  const prefetchExpense = usePrefetchExpense();
  const { data: subscription } = useCurrentSubscription();

  const expenses = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const categories = categoriesData ?? [];
  const suppliers = suppliersData?.data ?? [];
  const customers = customersData?.data ?? [];
  const canWrite = useHasProfessionalPlan();
  const isFreePlan = subscription?.plan?.cycle === PlanCycle.FREE;

  const isFiltered =
    searchInput.trim().length > 0 ||
    categoryFilter !== 'ALL' ||
    supplierFilter !== 'ALL' ||
    clientFilter !== 'ALL' ||
    fromDate !== '' ||
    toDate !== '';

  const monthlyChartData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthName = MONTHS_ES[date.getMonth()];
      const year = date.getFullYear();
      const key = `${monthName} ${year}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(expense.totalAmount));
    });
    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .slice(0, 6)
      .reverse();
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const catName = expense.category?.name ?? 'Sin categoría';
      categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + Number(expense.totalAmount));
    });
    const sorted = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return sorted.map(([name, amount], i) => ({
      name,
      amount,
      color: getCategoryColorHsl(name),
    }));
  }, [expenses]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    const sorted = [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    sorted.forEach((expense) => {
      const date = new Date(expense.date);
      const monthName = MONTHS_ES[date.getMonth()];
      const year = date.getFullYear();
      const key = `${monthName} ${year}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(expense);
    });
    return Array.from(groups.entries()).map(([monthYear, monthExpenses]) => {
      const year = parseInt(monthYear.split(' ')[1] ?? '0');
      const month = monthYear.split(' ')[0];
      return { month, year, expenses: monthExpenses };
    });
  }, [expenses]);

  const handleDeleteConfirm = async () => {
    for (const exp of expensesToDelete) {
      await deleteMutation.mutateAsync(exp.id);
    }
    setExpensesToDelete([]);
    setSelectedIds(new Set());
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Error al cargar los gastos.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && !error && total === 0 && !isFiltered) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Registra los gastos de tu actividad
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canWrite && (
                <Link href="/dashboard/gastos/recurrentes">
                  <Button variant="outline">
                    <Repeat className="mr-2 h-4 w-4" />
                    Recurrentes
                    {hasRecurringExpenses && (
                      <Badge variant="secondary" className="ml-2">
                        {recurringData?.meta.total}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
              {canWrite && (
                <Link href="/dashboard/gastos/nuevo">
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo gasto
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 px-5 py-4 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-primary/60 font-semibold uppercase tracking-wider">
                  Este mes
                </p>
                {isSummaryLoading ? (
                  <Skeleton className="h-5 w-24 mt-0.5" />
                ) : (
                  <p className="text-xl font-bold tabular-nums">
                    {formatCurrency(summaryData?.monthTotal ?? 0)}
                  </p>
                )}
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Euro className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] text-amber-600/60 dark:text-amber-400/60 font-semibold uppercase tracking-wider">
                  Este año
                </p>
                {isSummaryLoading ? (
                  <Skeleton className="h-5 w-24 mt-0.5" />
                ) : (
                  <p className="text-xl font-bold tabular-nums">
                    {formatCurrency(summaryData?.yearTotal ?? 0)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {!canWrite ? (
          <UpgradeBanner isEmpty={true} isFreePlan={isFreePlan} />
        ) : hasRecurringExpenses ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Repeat className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tienes gastos recurrentes</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Tienes {recurringData?.meta.total} gasto{recurringData!.meta.total !== 1 ? 's' : ''} recurrente{recurringData!.meta.total !== 1 ? 's' : ''} configurado{recurringData!.meta.total !== 1 ? 's' : ''}, pero aún no se han generado gastos. Pulsa "Generar" para crear los gastos reales.
              </p>
              <Link href="/dashboard/gastos/recurrentes">
                <Button size="lg">
                  <Repeat className="mr-2 h-4 w-4" />
                  Ver gastos recurrentes
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Añade tu primer gasto"
            description="Registra tus gastos para tener una visión completa de tu actividad."
            action={
              <Link href="/dashboard/gastos/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer gasto
                </Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  return (
    <>
      <DeleteExpenseDialog
        expenses={expensesToDelete}
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setExpensesToDelete([]);
        }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />

      <ExpenseDetailDialog
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onEdit={(exp) => {
          setSelectedExpense(null);
          window.location.href = `/dashboard/gastos/${exp.id}`;
        }}
      />

      <div className="space-y-4 pb-6">
        {!canWrite && <UpgradeBanner isEmpty={false} isFreePlan={isFreePlan} />}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${total} gasto${total !== 1 ? 's' : ''}`
                  )}
                </span>
                <div className="flex items-center gap-4 px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/10">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] text-primary/60 font-medium">MES</span>
                    {isSummaryLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(summaryData?.monthTotal ?? 0)}
                      </span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-1.5">
                    <Euro className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] text-amber-600/60 dark:text-amber-400/60 font-medium">
                      AÑO
                    </span>
                    {isSummaryLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(summaryData?.yearTotal ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canWrite && (
                <Link href="/dashboard/gastos/recurrentes">
                  <Button variant="outline">
                    <Repeat className="mr-2 h-4 w-4" />
                    Recurrentes
                    {hasRecurringExpenses && (
                      <Badge variant="secondary" className="ml-2">
                        {recurringData?.meta.total}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
              {canWrite && (
                <Link href="/dashboard/gastos/nuevo">
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo gasto
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {expenses.length > 0 && (
          <div>
            <button
              onClick={() => setStatsExpanded(!statsExpanded)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {statsExpanded ? 'Ocultar' : 'Ver'} estadísticas
              {statsExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {statsExpanded && monthlyChartData.length > 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <SpendingChart monthlyData={monthlyChartData} isLoading={isLoading} />
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        Por categoría
                      </span>
                    </div>
                    {isLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-4 w-full" />
                        ))}
                      </div>
                    ) : categoryBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin datos</p>
                    ) : (
                      <div className="space-y-1.5">
                        {categoryBreakdown.slice(0, 3).map((cat, i) => (
                          <div key={cat.name} className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs truncate flex-1">{cat.name}</span>
                            <span className="text-xs font-medium tabular-nums">
                              {formatCurrency(cat.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-start">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      <Search className="h-3.5 w-3.5 inline-block mr-1" />
                      Buscar
                    </label>
                    <div className="relative h-9">
                      <Input
                        placeholder="Concepto o proveedor..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full h-9"
                      />
                      {search && (
                        <button
                          onClick={() => setSearchInput('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className={cn(
                      'flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg border transition-colors self-end shrink-0',
                      filtersExpanded
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filtros
                    {filtersExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {filtersExpanded && (
                <>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Categoría
                      </label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas</SelectItem>
                          {categories.map((category: ExpenseCategory) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Proveedor
                      </label>
                      <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos</SelectItem>
                          {suppliers.map((supplier: Supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Cliente
                      </label>
                      <Select value={clientFilter} onValueChange={setClientFilter}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos</SelectItem>
                          {customers.map((customer: Customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        <Calendar className="h-3.5 w-3.5 inline-block mr-1" />
                        Rango de fechas
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-36"
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-36"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Mes
                      </label>
                      <div className="flex gap-1">
                        {[
                          { label: 'Ene', month: 0 },
                          { label: 'Feb', month: 1 },
                          { label: 'Mar', month: 2 },
                          { label: 'Abr', month: 3 },
                          { label: 'May', month: 4 },
                          { label: 'Jun', month: 5 },
                          { label: 'Jul', month: 6 },
                          { label: 'Ago', month: 7 },
                          { label: 'Sep', month: 8 },
                          { label: 'Oct', month: 9 },
                          { label: 'Nov', month: 10 },
                          { label: 'Dic', month: 11 },
                        ].map(({ label, month }) => {
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          const firstDay = new Date(currentYear, month, 1);
                          const lastDay = new Date(currentYear, month + 1, 0);
                          const isActive =
                            fromDate === firstDay.toISOString().split('T')[0] &&
                            toDate === lastDay.toISOString().split('T')[0];

                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => {
                                if (isActive) {
                                  setFromDate('');
                                  setToDate('');
                                } else {
                                  setFromDate(firstDay.toISOString().split('T')[0]);
                                  setToDate(lastDay.toISOString().split('T')[0]);
                                }
                              }}
                              className={cn(
                                'h-8 px-2 text-xs font-medium rounded transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <FilterChips
                search={searchInput}
                categoryFilter={categoryFilter}
                supplierFilter={supplierFilter}
                clientFilter={clientFilter}
                fromDate={fromDate}
                toDate={toDate}
                onClearSearch={() => setSearchInput('')}
                onClearCategory={() => setCategoryFilter('ALL')}
                onClearSupplier={() => setSupplierFilter('ALL')}
                onClearClient={() => setClientFilter('ALL')}
                onClearDates={() => {
                  setFromDate('');
                  setToDate('');
                }}
              />

              {isFiltered && !isLoading && (
                <p className="text-xs text-muted-foreground">
                  {total} gasto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Sin resultados</p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay gastos que coincidan con los filtros aplicados.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchInput('');
                  setCategoryFilter('ALL');
                  setSupplierFilter('ALL');
                  setClientFilter('ALL');
                  setFromDate('');
                  setToDate('');
                }}
              >
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all',
                    viewMode === 'cards'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Receipt className="h-4 w-4 inline-block mr-2" />
                  Tarjetas
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all',
                    viewMode === 'table'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <FileText className="h-4 w-4 inline-block mr-2" />
                  Tabla
                </button>
              </div>
            </div>

            {viewMode === 'cards' ? (
              <div className="space-y-6">
                {groupedExpenses.map(({ month, year, expenses }) => (
                  <MonthGroup
                    key={`${month}-${year}`}
                    month={month}
                    year={year}
                    expenses={expenses}
                    onDelete={(exp) => {
                      setExpensesToDelete([exp]);
                      setDeleteDialogOpen(true);
                    }}
                    onView={setSelectedExpense}
                    onDuplicate={(expense) =>
                      router.push(`/dashboard/gastos/nuevo?duplicate=${expense.id}`)
                    }
                    canWrite={canWrite}
                    onPrefetch={prefetchExpense}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            {canWrite && (
                              <Checkbox
                                checked={
                                  selectedIds.size === expenses.length && expenses.length > 0
                                }
                                onCheckedChange={toggleSelectAll}
                              />
                            )}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                            Concepto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                            Categoría
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                            Proveedor
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                            Total
                          </th>
                          <th className="px-4 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.map((expense) => (
                          <tr
                            key={expense.id}
                            className={cn(
                              'hover:bg-muted/30 transition-colors',
                              selectedIds.has(expense.id) && 'bg-primary/5',
                            )}
                          >
                            <td className="px-4 py-3">
                              {canWrite && (
                                <Checkbox
                                  checked={selectedIds.has(expense.id)}
                                  onCheckedChange={() => toggleSelect(expense.id)}
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                              {formatDateShort(expense.date)}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/dashboard/gastos/${expense.id}`}
                                className="font-medium hover:underline hover:text-primary"
                              >
                                {expense.description}
                              </Link>
                              {expense.recurringExpense?.id && (
                                <Repeat className="inline ml-1.5 h-3.5 w-3.5 text-primary align-middle" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">{expense.category?.name ?? '—'}</td>
                            <td className="px-4 py-3 text-sm">{expense.supplier?.name ?? '—'}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                              {formatCurrency(expense.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {canWrite ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/dashboard/gastos/${expense.id}`}
                                        className="flex items-center"
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/gastos/nuevo?duplicate=${expense.id}`,
                                        )
                                      }
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setExpensesToDelete([expense]);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                                  <Link href={`/dashboard/gastos/${expense.id}`}>Ver</Link>
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/30 font-semibold">
                          <td className="px-4 py-3">
                            <Checkbox checked={false} disabled />
                          </td>
                          <td className="px-4 py-3 text-sm" colSpan={3}>
                            Total ({expenses.length} gasto{expenses.length !== 1 ? 's' : ''})
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(
                              expenses.reduce((s, e) => s + Number(e.totalAmount), 0),
                            )}
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!error && !isLoading && data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {page} de {data.meta.totalPages} · {total} gasto
              {total !== 1 ? 's' : ''} en total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.meta.totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onDeleteClick={() => {
              setExpensesToDelete(expenses.filter((e) => selectedIds.has(e.id)));
              setDeleteDialogOpen(true);
            }}
          />
        )}
      </div>
    </>
  );
}
