'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  ClipboardList,
  MoreVertical,
  FileText,
  Pencil,
  ArrowRightLeft,
  CalendarClock,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
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
  useDeleteInvoice,
  useUpdateQuoteStatus,
  useConvertQuoteToProforma,
  useConvertQuoteToOfficial,
} from '@/hooks/use-invoices';
import { useSortTable } from '@/hooks/use-sort-table';
import { InvoiceStatus, QuoteAcceptanceStatus, Invoice } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';
import { SortableHeader } from '@/components/common/sortable-header';
import { EmptyState } from '@/components/common/empty-state';

// ==================== CONSTANTS ====================

const QUOTE_ACCEPTANCE_CONFIG: Record<
  QuoteAcceptanceStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  [QuoteAcceptanceStatus.PENDING]: {
    label: 'Pendiente',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-50 dark:bg-zinc-900/50',
    border: 'border-zinc-200 dark:border-zinc-800',
    dot: 'bg-zinc-400',
  },
  [QuoteAcceptanceStatus.SENT]: {
    label: 'Enviado',
    color: 'text-customer-600 dark:text-customer-400',
    bg: 'bg-customer-50 dark:bg-customer-950/40',
    border: 'border-customer-200 dark:border-customer-800',
    dot: 'bg-customer-500',
  },
  [QuoteAcceptanceStatus.ACCEPTED]: {
    label: 'Aceptado',
    color: 'text-secondary-600 dark:text-secondary-400',
    bg: 'bg-secondary-50 dark:bg-secondary-950/40',
    border: 'border-secondary-200 dark:border-secondary-800',
    dot: 'bg-secondary-500',
  },
  [QuoteAcceptanceStatus.REJECTED]: {
    label: 'Rechazado',
    color: 'text-destructive dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  [QuoteAcceptanceStatus.CONVERTED]: {
    label: 'Convertido',
    color: 'text-invoice-600 dark:text-invoice-400',
    bg: 'bg-invoice-50 dark:bg-invoice-950/40',
    border: 'border-invoice-200 dark:border-invoice-800',
    dot: 'bg-invoice-500',
  },
};

const QUOTE_STATUS_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: QuoteAcceptanceStatus.PENDING, label: 'Pendientes' },
  { value: QuoteAcceptanceStatus.SENT, label: 'Enviados' },
  { value: QuoteAcceptanceStatus.ACCEPTED, label: 'Aceptados' },
  { value: QuoteAcceptanceStatus.REJECTED, label: 'Rechazados' },
  { value: QuoteAcceptanceStatus.CONVERTED, label: 'Convertidos' },
];

// ==================== HELPERS ====================

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(invoice: Invoice): boolean {
  if (!invoice.validUntil) return false;
  if (invoice.quoteAcceptanceStatus === QuoteAcceptanceStatus.CONVERTED) return false;
  if (invoice.quoteAcceptanceStatus === QuoteAcceptanceStatus.ACCEPTED) return false;
  if (invoice.quoteAcceptanceStatus === QuoteAcceptanceStatus.REJECTED) return false;
  return new Date(invoice.validUntil) < new Date();
}

function getQuoteSortValue(invoice: Invoice, key: string): string | number {
  switch (key) {
    case 'number':
      return invoice.number ?? '';
    case 'customer':
      return invoice.customer?.name ?? '';
    case 'issueDate':
      return invoice.issueDate ?? '';
    case 'validUntil':
      return invoice.validUntil ?? '';
    case 'total':
      return Number(invoice.total);
    default:
      return '';
  }
}

// ==================== SUB-COMPONENTS ====================

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
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  );
}

function QuoteAcceptanceBadge({ status }: { status: QuoteAcceptanceStatus | null | undefined }) {
  const cfg = status
    ? QUOTE_ACCEPTANCE_CONFIG[status]
    : QUOTE_ACCEPTANCE_CONFIG[QuoteAcceptanceStatus.PENDING];
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

function StatusFilterPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUOTE_STATUS_FILTERS.map((f) => {
        const active = value === f.value;
        const cfg =
          f.value !== 'ALL' ? QUOTE_ACCEPTANCE_CONFIG[f.value as QuoteAcceptanceStatus] : null;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
            )}
          >
            {cfg && (
              <span
                className={cn(
                  'mr-1.5 h-1.5 w-1.5 rounded-full',
                  active ? 'bg-primary-foreground' : cfg.dot,
                )}
              />
            )}
            {f.label}
          </button>
        );
      })}
      {value !== 'ALL' && (
        <button
          onClick={() => onChange('ALL')}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      )}
    </div>
  );
}

// ==================== PAGE ====================

export default function PresupuestosPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertProformaId, setConvertProformaId] = useState<string | null>(null);
  const [convertOfficialId, setConvertOfficialId] = useState<string | null>(null);

  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir]);

  const { data, isLoading, error, refetch } = useInvoices({
    search: search || undefined,
    status: InvoiceStatus.QUOTE,
    quoteAcceptanceStatus:
      statusFilter !== 'ALL' ? (statusFilter as QuoteAcceptanceStatus) : undefined,
    page,
    limit: 20,
    sortBy: sortKey as 'number' | 'issueDate' | 'total' | 'createdAt' | 'customer' | 'validUntil',
    sortOrder: sortDir,
  });

  const deleteMutation = useDeleteInvoice();
  const updateStatusMutation = useUpdateQuoteStatus();
  const convertToProformaMutation = useConvertQuoteToProforma();
  const convertToOfficialMutation = useConvertQuoteToOfficial();

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleConvertToProforma = async () => {
    if (!convertProformaId) return;
    await convertToProformaMutation.mutateAsync(convertProformaId);
    setConvertProformaId(null);
  };

  const handleConvertToOfficial = async () => {
    if (!convertOfficialId) return;
    await convertToOfficialMutation.mutateAsync(convertOfficialId);
    setConvertOfficialId(null);
  };

  const quotes = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  if (!isLoading && !error && total === 0 && !search && statusFilter === 'ALL') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus presupuestos</p>
          </div>
        </div>
        <EmptyState
          icon={ClipboardList}
          title="Crea tu primer presupuesto"
          description="Envía presupuestos profesionales a tus clientes y conviértelos en facturas con un solo clic."
          action={
            <Link href="/dashboard/presupuestos/nueva">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer presupuesto
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Cargando...' : `${total} presupuesto${total !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        <Link href="/dashboard/presupuestos/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo presupuesto
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o nombre de cliente..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <StatusFilterPills value={statusFilter} onChange={setStatusFilter} />
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="font-medium mb-1">Error al cargar los presupuestos</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin resultados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay presupuestos que coincidan con los filtros aplicados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput('');
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
                    <tr>
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
                        label="Válido hasta"
                        sortKey="validUntil"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        className="hidden lg:table-cell"
                      />
                      <SortableHeader
                        label="Total"
                        sortKey="total"
                        currentKey={sortKey}
                        direction={sortDir}
                        onSort={handleSort}
                        align="right"
                      />
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotes.map((quote) => {
                      const expired = isExpired(quote);
                      const isConverted =
                        quote.quoteAcceptanceStatus === QuoteAcceptanceStatus.CONVERTED;
                      const isEditable = !isConverted;

                      return (
                        <tr
                          key={quote.id}
                          className={cn(
                            'group transition-colors hover:bg-muted/30',
                            expired &&
                              'bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-950/10 dark:hover:bg-orange-950/20',
                          )}
                        >
                          <td className="px-6 py-3">
                            <Link
                              href={`/dashboard/presupuestos/${quote.id}`}
                              className="font-mono text-sm font-medium hover:text-primary transition-colors"
                            >
                              {quote.number ?? (
                                <span className="text-muted-foreground font-normal">
                                  {quote.customer?.name ?? '—'} — PRESUPUESTO
                                </span>
                              )}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]">
                                {quote.customer?.name ?? '-'}
                              </p>
                              {quote.customer?.nif && (
                                <p className="text-xs font-mono text-muted-foreground">
                                  {quote.customer.nif}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
                            {formatDate(quote.issueDate)}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                            {quote.validUntil ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-sm',
                                  expired
                                    ? 'text-orange-600 dark:text-orange-400 font-medium'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {expired && <CalendarClock className="h-3.5 w-3.5 shrink-0" />}
                                {formatDate(quote.validUntil)}
                                {expired && (
                                  <span className="ml-1 rounded-full bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-[10px] font-semibold px-1.5 py-0.5">
                                    Expirado
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                            {formatCurrency(Number(quote.total))}
                          </td>
                          <td className="px-4 py-3">
                            <QuoteAcceptanceBadge status={quote.quoteAcceptanceStatus} />
                          </td>
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
                                  <Link href={`/dashboard/presupuestos/${quote.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver detalle
                                  </Link>
                                </DropdownMenuItem>
                                {isEditable && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/presupuestos/nueva?edit=${quote.id}`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {isEditable &&
                                  quote.quoteAcceptanceStatus !==
                                    QuoteAcceptanceStatus.ACCEPTED && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          id: quote.id,
                                          status: QuoteAcceptanceStatus.ACCEPTED,
                                        })
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Marcar como aceptado
                                    </DropdownMenuItem>
                                  )}
                                {isEditable &&
                                  quote.quoteAcceptanceStatus !==
                                    QuoteAcceptanceStatus.REJECTED && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          id: quote.id,
                                          status: QuoteAcceptanceStatus.REJECTED,
                                        })
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Marcar como rechazado
                                    </DropdownMenuItem>
                                  )}
                                {isEditable && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setConvertProformaId(quote.id)}
                                    >
                                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                                      Convertir a proforma
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setConvertOfficialId(quote.id)}
                                    >
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Convertir a factura
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {isEditable && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteId(quote.id)}
                                    >
                                      Eliminar presupuesto
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

      {/* Pagination */}
      {!error && !isLoading && data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {data.meta.totalPages} &middot; {total} presupuesto
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

      {/* Delete dialog */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto se eliminará permanentemente.
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

      {/* Convert to proforma dialog */}
      <AlertDialog
        open={Boolean(convertProformaId)}
        onOpenChange={(open) => !open && setConvertProformaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Convertir a proforma?</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará una nueva factura proforma con los datos de este presupuesto. El presupuesto
              quedará marcado como convertido y no se podrá modificar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToProforma}
              disabled={convertToProformaMutation.isPending}
            >
              {convertToProformaMutation.isPending ? 'Convirtiendo...' : 'Crear proforma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to official dialog */}
      <AlertDialog
        open={Boolean(convertOfficialId)}
        onOpenChange={(open) => !open && setConvertOfficialId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Convertir a factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un borrador de factura oficial con los datos de este presupuesto. Podrás
              editarlo y confirmarlo cuando esté listo. El presupuesto quedará marcado como
              convertido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToOfficial}
              disabled={convertToOfficialMutation.isPending}
            >
              {convertToOfficialMutation.isPending ? 'Convirtiendo...' : 'Crear factura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
