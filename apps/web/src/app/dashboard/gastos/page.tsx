'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Receipt,
  AlertCircle,
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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Expense, ExpenseCategory, Supplier, Customer, QueryExpensesInput } from '@easyfactura/shared-types';
import {
  useExpenses,
  useDeleteExpense,
  usePrefetchExpense,
  useExpenseSummary,
} from '@/hooks/use-expenses';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { useSortTable } from '@/hooks/use-sort-table';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { EmptyState } from '@/components/common/empty-state';
import { PRICING } from '@easyfactura/brand-config';
import { cn, formatCurrency, getBadgeColor } from '@/lib/utils';

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 40%)',
  'hsl(38 92% 50%)',
  'hsl(280 65% 60%)',
  'hsl(200 98% 40%)',
  'hsl(0 84% 60%)',
];

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

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

function KpiCard({ title, value, subtitle, trend, icon: Icon, iconClassName = 'bg-primary/10 text-primary', valueClassName = '', isLoading }: KpiCardProps) {
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
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', iconClassName)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className={cn('text-3xl font-bold tracking-tight tabular-nums mb-1', valueClassName)}>
              {formatCurrency(value)}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== null && trend !== undefined && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5',
                    trend >= 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  )}
                >
                  {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend >= 0 ? '+' : ''}{trend}%
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

function SpendingChart({ monthlyData, isLoading }: { monthlyData: Array<{ month: string; amount: number }>, isLoading: boolean }) {
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
              <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${30 + Math.random() * 60}%` }} />
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
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={28} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({ categories, isLoading }: { categories: Array<{ name: string; amount: number; color: string }>, isLoading: boolean }) {
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
          <div className="py-6 text-center text-sm text-muted-foreground">
            Sin categorías
          </div>
        ) : (
          <div className="space-y-2">
            {categories.slice(0, 5).map((cat, i) => {
              const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
              return (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm truncate flex-1">{cat.name}</span>
                  <span className="text-sm font-medium tabular-nums shrink-0">{formatCurrency(cat.amount)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{pct}%</span>
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

function DeleteDialog({ expense, onCancel, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <AlertDialog open={!!expense}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el gasto <strong>{expense?.description}</strong> permanentemente. Esta acción no se puede deshacer.
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
            {isPending ? 'Eliminando...' : 'Eliminar gasto'}
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
          <DialogTitle className="text-lg">{expense.description}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fecha</p>
              <p className="text-sm font-medium">{formatDate(expense.date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(expense.totalAmount)}</p>
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
            <Button className="flex-1" onClick={() => { onClose(); onEdit(expense); }}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (expense: Expense) => void;
  onView: (expense: Expense) => void;
  canWrite: boolean;
  onPrefetch: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function ExpenseCard({ expense, onDelete, onView, canWrite, onPrefetch, isSelected, onToggleSelect }: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'group border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all bg-card',
        isSelected && 'border-primary bg-primary/5'
      )}
      onMouseEnter={() => onPrefetch(expense.id)}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="mt-1 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium truncate">{expense.description}</h3>
            <span className="text-lg font-bold tabular-nums text-primary shrink-0">
              {formatCurrency(expense.totalAmount)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(expense.date)}
            </span>
            {expense.category && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Tag className="h-3 w-3" />
                {expense.category.name}
              </Badge>
            )}
            {expense.supplier && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {expense.supplier.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onView(expense)}>
            <FileText className="h-4 w-4" />
          </Button>
          {canWrite && (
            <>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                <Link href={`/dashboard/gastos/${expense.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/gastos/${expense.id}`} className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(expense)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
          {expense.baseAmount !== undefined && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-muted-foreground">Base:</span>
                <span className="ml-2">{formatCurrency(expense.baseAmount)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">IVA ({expense.vatRate}%):</span>
                <span className="ml-2">{formatCurrency(expense.vatAmount)}</span>
              </div>
            </div>
          )}
          {expense.client && (
            <div>
              <span className="text-xs text-muted-foreground">Cliente:</span>
              <span className="ml-2">{expense.client.name}</span>
            </div>
          )}
          {expense.notes && (
            <div>
              <span className="text-xs text-muted-foreground">Notas:</span>
              <p className="mt-1 text-xs">{expense.notes}</p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-2 pt-2 border-t flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            Menos detalles
            <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Más detalles
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
    </div>
  );
}

interface MonthGroupProps {
  month: string;
  year: number;
  expenses: Expense[];
  onDelete: (expense: Expense) => void;
  onView: (expense: Expense) => void;
  canWrite: boolean;
  onPrefetch: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

function MonthGroup({ month, year, expenses, onDelete, onView, canWrite, onPrefetch, selectedIds, onToggleSelect }: MonthGroupProps) {
  const total = expenses.reduce((s, e) => s + e.totalAmount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{month} {year}</h2>
          <Badge variant="secondary">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</Badge>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
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

function BulkActionsBar({ selectedCount, onDelete, onExport }: { selectedCount: number; onDelete: () => void; onExport: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-full px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-2 pr-3 border-r">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
        <Download className="h-4 w-4" />
        Exportar
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete} className="gap-2">
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
    const label = fromDate && toDate ? `${fromDate} - ${toDate}` : fromDate ? `Desde ${fromDate}` : `Hasta ${toDate}`;
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

function UpgradeBanner({ isEmpty }: { isEmpty: boolean }) {
  const proPrice = PRICING.pro.monthly;
  const proAnnualPrice = PRICING.pro.annualMonthly;
  const annualSaving = PRICING.pro.annualSaving;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)/5,transparent_50%)]" />
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                <Zap className="h-3 w-3" />
                Plan PRO
              </Badge>
              <span className="text-xs text-muted-foreground">Solo {proPrice}€/mes</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isEmpty
                ? 'Empieza a controlar tus gastos'
                : 'Desbloquea toda la potencia de Gestión de Gastos'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-lg">
              {isEmpty
                ? 'Registra cada gasto deducible y optimiza tu IRPF. Todo preparado para tu declaración trimestral.'
                : 'Con el plan PRO puedes añadir, editar y eliminar gastos. Sin límites.'}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {[
                { icon: ReceiptText, text: 'Gastos deducibles de IRPF' },
                { icon: PiggyBank, text: 'Control total de tu fiscalité' },
                { icon: TrendingUp, text: 'Análisis de rentabilidad' },
                { icon: Check, text: 'Sin límite de registros' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard/ajustes/plan">
                <Button>
                  Pasar a PRO
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{proAnnualPrice}€/mes</span>{' '}
                facturado anualmente · Ahorra {annualSaving}€
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-background/80 rounded-xl border border-primary/10 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Precio PRO</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{proPrice}</span>
              <span className="text-muted-foreground">€</span>
            </div>
            <p className="text-sm text-muted-foreground">/mes</p>
            <div className="mt-2 text-xs text-center">
              <span className="text-green-600 font-medium">Ahorra {annualSaving}€/año</span>
              <p className="text-muted-foreground">con facturación anual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GastosPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { sortKey, sortDir, handleSort } = useSortTable('date', 'desc');

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, categoryFilter, supplierFilter, clientFilter, fromDate, toDate, sortKey, sortDir]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
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
      setSelectedIds(new Set(expenses.map(e => e.id)));
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Concepto', 'Categoría', 'Proveedor', 'Base', 'IVA (%)', 'IVA (€)', 'Total'];
    const rows = expenses
      .filter(e => selectedIds.has(e.id))
      .map(e => [
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
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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

  const { data: summaryData, isLoading: isSummaryLoading } = useExpenseSummary();
  const { data: categoriesData } = useExpenseCategories();
  const { data: suppliersData } = useSuppliers({ limit: 500 });
  const { data: customersData } = useCustomers({ limit: 500 });
  const deleteMutation = useDeleteExpense();
  const prefetchExpense = usePrefetchExpense();

  const expenses = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const categories = categoriesData ?? [];
  const suppliers = suppliersData?.data ?? [];
  const customers = customersData?.data ?? [];
  const canWrite = useHasProfessionalPlan();

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
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + expense.totalAmount);
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
      categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + expense.totalAmount);
    });
    const sorted = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return sorted.map(([name, amount], i) => ({
      name,
      amount,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [expenses]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    if (!expenseToDelete) return;
    await deleteMutation.mutateAsync(expenseToDelete.id);
    setExpenseToDelete(null);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
            <p className="text-sm text-muted-foreground">Registra los gastos de tu actividad</p>
          </div>
          {canWrite && (
            <Link href="/dashboard/gastos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo gasto
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Este mes" value={summaryData?.monthTotal ?? 0} icon={Calendar} isLoading={isSummaryLoading} />
          <KpiCard title="Este año" value={summaryData?.yearTotal ?? 0} icon={Euro} isLoading={isSummaryLoading} />
        </div>

        {!canWrite ? (
          <UpgradeBanner isEmpty={true} />
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
      <DeleteDialog
        expense={expenseToDelete}
        onCancel={() => setExpenseToDelete(null)}
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

      <div className="space-y-6 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${total} gasto${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expenses.length > 0 && (
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            )}
            {canWrite && (
              <Link href="/dashboard/gastos/recurrentes">
                <Button variant="outline">
                  <Repeat className="mr-2 h-4 w-4" />
                  Recurrentes
                </Button>
              </Link>
            )}
            {canWrite && (
              <Link href="/dashboard/gastos/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo gasto
                </Button>
              </Link>
            )}
          </div>
        </div>

        {!canWrite && <UpgradeBanner isEmpty={false} />}

        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Este mes</p>
                    {isSummaryLoading ? (
                      <Skeleton className="h-8 w-28 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold tabular-nums">{formatCurrency(summaryData?.monthTotal ?? 0)}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Euro className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Este año</p>
                    {isSummaryLoading ? (
                      <Skeleton className="h-8 w-28 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold tabular-nums">{formatCurrency(summaryData?.yearTotal ?? 0)}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1">
            <SpendingChart monthlyData={monthlyChartData} isLoading={isLoading} />
          </div>

          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Por categoría</span>
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
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs truncate flex-1">{cat.name}</span>
                      <span className="text-xs font-medium tabular-nums">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    <Search className="h-3.5 w-3.5 inline-block mr-1" />
                    Buscar
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Concepto o proveedor..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full"
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

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoría</label>
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
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Proveedor</label>
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
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cliente</label>
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
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mes</label>
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
                      const isActive = fromDate === firstDay.toISOString().split('T')[0] &&
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
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

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
                onClearDates={() => { setFromDate(''); setToDate(''); }}
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
                      : 'text-muted-foreground hover:text-foreground'
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
                      : 'text-muted-foreground hover:text-foreground'
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
                    onDelete={setExpenseToDelete}
                    onView={setSelectedExpense}
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
                            <Checkbox
                              checked={selectedIds.size === expenses.length && expenses.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Concepto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Categoría</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Proveedor</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total</th>
                          <th className="px-4 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses.map((expense) => (
                          <tr key={expense.id} className={cn('hover:bg-muted/30 transition-colors', selectedIds.has(expense.id) && 'bg-primary/5')}>
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedIds.has(expense.id)}
                                onCheckedChange={() => toggleSelect(expense.id)}
                              />
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
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {expense.category?.name ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {expense.supplier?.name ?? '—'}
                            </td>
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
                                      <Link href={`/dashboard/gastos/${expense.id}`} className="flex items-center">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setExpenseToDelete(expense)}
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
                            <Checkbox
                              checked={false}
                              disabled
                            />
                          </td>
                          <td className="px-4 py-3 text-sm" colSpan={3}>
                            Total ({expenses.length} gasto{expenses.length !== 1 ? 's' : ''})
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(expenses.reduce((s, e) => s + e.totalAmount, 0))}
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
            onDelete={handleBulkDelete}
            onExport={exportToCSV}
          />
        )}
      </div>
    </>
  );
}
