'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Copy,
  CheckCircle2,
  Coins,
  AlertCircle,
  CreditCard,
  Landmark,
  Wallet,
  ArrowRightLeft,
  CalendarClock,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  useInvoices,
  useConfirmInvoice,
  useMarkInvoiceAsPaid,
  useDeleteInvoice,
} from '@/hooks/use-invoices';
import { InvoiceStatus, PaymentMethod, Invoice } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Borrador',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-50 dark:bg-zinc-900/50',
    border: 'border-zinc-200 dark:border-zinc-800',
    dot: 'bg-zinc-400',
  },
  [InvoiceStatus.CONFIRMED]: {
    label: 'Confirmada',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  [InvoiceStatus.SENT]: {
    label: 'Enviada',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  [InvoiceStatus.PAID]: {
    label: 'Pagada',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  [InvoiceStatus.RECTIFIED]: {
    label: 'Rectificada',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  [PaymentMethod.BANK_TRANSFER]: { label: 'Transferencia', icon: Landmark },
  [PaymentMethod.DIRECT_DEBIT]: { label: 'Domiciliación', icon: ArrowRightLeft },
  [PaymentMethod.CARD]: { label: 'Tarjeta', icon: CreditCard },
  [PaymentMethod.CASH]: { label: 'Efectivo', icon: Wallet },
  [PaymentMethod.PAYPAL]: { label: 'PayPal', icon: CreditCard },
  BIZUM: { label: 'Bizum', icon: Wallet },
};

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: InvoiceStatus.DRAFT, label: 'Borradores' },
  { value: InvoiceStatus.CONFIRMED, label: 'Confirmadas' },
  { value: InvoiceStatus.SENT, label: 'Enviadas' },
  { value: InvoiceStatus.PAID, label: 'Pagadas' },
  { value: InvoiceStatus.RECTIFIED, label: 'Rectificadas' },
];

// ==================== HELPERS ====================

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(invoice: Invoice): boolean {
  if (!invoice.dueDate) return false;
  if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.RECTIFIED)
    return false;
  if (invoice.status === InvoiceStatus.DRAFT) return false;
  return new Date(invoice.dueDate) < new Date();
}

// ==================== SUB-COMPONENTS ====================

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        cfg.bg,
        cfg.border,
        cfg.color,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function PaymentMethodCell({ method }: { method: string | null }) {
  if (!method) return <span className="text-muted-foreground">—</span>;
  const cfg = PAYMENT_METHOD_CONFIG[method];
  if (!cfg) return <span className="text-sm text-muted-foreground">{method}</span>;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {cfg.label}
    </span>
  );
}

// ==================== SORTING ====================

type SortDir = 'asc' | 'desc';

function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
  className,
  align = 'left',
}: {
  label: string;
  sortKey: string;
  currentKey: string;
  direction: SortDir;
  onSort: (key: string) => void;
  className?: string;
  align?: 'left' | 'right';
}) {
  const active = sortKey === currentKey;
  return (
    <th
      className={cn(
        'py-3 font-medium',
        align === 'right' ? 'px-4 text-right' : 'px-4 text-left',
        className,
      )}
    >
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors select-none',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function sortInvoices(list: Invoice[], key: string, dir: SortDir): Invoice[] {
  return [...list].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';
    switch (key) {
      case 'number':
        aVal = a.number ?? '';
        bVal = b.number ?? '';
        break;
      case 'customer':
        aVal = a.customer?.name ?? '';
        bVal = b.customer?.name ?? '';
        break;
      case 'issueDate':
        aVal = a.issueDate ?? '';
        bVal = b.issueDate ?? '';
        break;
      case 'dueDate':
        aVal = a.dueDate ?? '';
        bVal = b.dueDate ?? '';
        break;
      case 'total':
        aVal = Number(a.total);
        bVal = Number(b.total);
        break;
    }
    if (aVal < bVal) return dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  );
}

// ==================== PAGE ====================

export default function FacturasPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>('issueDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const { data, isLoading, error, refetch } = useInvoices({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as InvoiceStatus) : undefined,
    limit: 100,
  });

  const confirmMutation = useConfirmInvoice();
  const paidMutation = useMarkInvoiceAsPaid();
  const deleteMutation = useDeleteInvoice();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleDuplicate = (invoice: Invoice) => {
    router.push(`/dashboard/facturas/nueva?duplicate=${invoice.id}`);
  };

  const invoices = sortInvoices(data?.data ?? [], sortKey, sortDir);
  const total = data?.meta.total ?? 0;

  // ── Empty state (first time, no filters) ──
  if (!isLoading && !error && invoices.length === 0 && !search && statusFilter === 'ALL') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus facturas</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-1">Crea tu primera factura</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Genera facturas profesionales en segundos. Cumple con VeriFactu automáticamente.
            </p>
            <Link href="/dashboard/facturas/nueva">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera factura
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Cargando...' : `${total} factura${total !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de factura o nombre de cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {f.value !== 'ALL' && (
                <span
                  className={cn(
                    'mr-1.5 h-1.5 w-1.5 rounded-full',
                    statusFilter === f.value
                      ? 'bg-primary-foreground'
                      : STATUS_CONFIG[f.value as InvoiceStatus]?.dot,
                  )}
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="font-medium mb-1">Error al cargar las facturas</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Table ── */}
      {!error && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin resultados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay facturas que coincidan con los filtros aplicados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-xs">
                      <SortableHeader
                        label="Número"
                        sortKey="number"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="px-6"
                      />
                      <SortableHeader
                        label="Cliente"
                        sortKey="customer"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Emisión"
                        sortKey="issueDate"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="hidden md:table-cell"
                      />
                      <SortableHeader
                        label="Vencimiento"
                        sortKey="dueDate"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="hidden lg:table-cell"
                      />
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                        Pago
                      </th>
                      <SortableHeader
                        label="Total"
                        sortKey="total"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        align="right"
                      />
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => {
                      const overdue = isOverdue(invoice);
                      return (
                        <tr
                          key={invoice.id}
                          className={cn(
                            'group transition-colors hover:bg-muted/30',
                            overdue &&
                              'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/10 dark:hover:bg-red-950/20',
                          )}
                        >
                          {/* Número */}
                          <td className="px-6 py-3">
                            <Link
                              href={`/dashboard/facturas/${invoice.id}`}
                              className="font-mono text-sm font-medium hover:text-primary transition-colors"
                            >
                              {invoice.number ?? (
                                <span className="text-muted-foreground italic">Borrador</span>
                              )}
                            </Link>
                            {invoice.isRectificative && (
                              <span className="ml-2 text-[10px] text-muted-foreground bg-muted rounded px-1 py-0.5">
                                rectif.
                              </span>
                            )}
                          </td>

                          {/* Cliente */}
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]">
                                {invoice.customer?.name ?? '—'}
                              </p>
                              {invoice.customer?.nif && (
                                <p className="text-xs font-mono text-muted-foreground">
                                  {invoice.customer.nif}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Fecha emisión */}
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
                            {formatDate(invoice.issueDate)}
                          </td>

                          {/* Vencimiento */}
                          <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                            {invoice.dueDate ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-sm',
                                  overdue
                                    ? 'text-red-600 dark:text-red-400 font-medium'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {overdue && <CalendarClock className="h-3.5 w-3.5 shrink-0" />}
                                {formatDate(invoice.dueDate)}
                                {overdue && (
                                  <span className="ml-1 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-semibold px-1.5 py-0.5">
                                    Vencida
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </td>

                          {/* Método de pago */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <PaymentMethodCell method={invoice.paymentMethod} />
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                            {formatCurrency(Number(invoice.total))}
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-3">
                            <StatusBadge status={invoice.status as InvoiceStatus} />
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/facturas/${invoice.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver detalle
                                  </Link>
                                </DropdownMenuItem>
                                {invoice.status === InvoiceStatus.DRAFT && (
                                  <DropdownMenuItem
                                    onClick={() => confirmMutation.mutate(invoice.id)}
                                    disabled={confirmMutation.isPending}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Confirmar
                                  </DropdownMenuItem>
                                )}
                                {(invoice.status === InvoiceStatus.CONFIRMED ||
                                  invoice.status === InvoiceStatus.SENT) && (
                                  <DropdownMenuItem
                                    onClick={() => paidMutation.mutate(invoice.id)}
                                    disabled={paidMutation.isPending}
                                  >
                                    <Coins className="mr-2 h-4 w-4" />
                                    Marcar como pagada
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDuplicate(invoice)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicar
                                </DropdownMenuItem>
                                {invoice.status === InvoiceStatus.DRAFT && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteId(invoice.id)}
                                    >
                                      Eliminar borrador
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Delete dialog ── */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El borrador se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
