'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowRightLeft,
  CalendarClock,
  X,
  Pencil,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
  Send,
  Undo2,
  Download,
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
  useUnmarkInvoiceAsPaid,
  useMarkInvoiceAsSent,
  useUnmarkInvoiceAsSent,
  useDeleteInvoice,
  useConvertProformaToOfficial,
} from '@/hooks/use-invoices';
import { useSortTable } from '@/hooks/use-sort-table';
import { useDownloadInvoicePdf } from '@/hooks/use-download-invoice-pdf';
import { InvoiceStatus, Invoice } from '@easyfactura/shared-types';
import { cn, formatCurrency } from '@/lib/utils';
import { SortableHeader } from '@/components/common/sortable-header';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { InvoiceStatusFilterPills } from '@/components/common/invoice-status-filter-pills';
import { EmptyState } from '@/components/common/empty-state';
import { ConvertProformaModal } from '@/components/facturas/ConvertProformaModal';
import { DownloadInvoiceButton } from '@/components/ui/download-invoice-button';

// ==================== TYPES ====================

interface ActionTarget {
  id: string;
  number: string | null;
  customerName: string;
  total: number;
  isProforma?: boolean;
}

// ==================== HELPERS ====================

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
  if (invoice.status === InvoiceStatus.PROFORMA) return false;
  return new Date(invoice.dueDate) < new Date();
}

// ==================== SUB-COMPONENTS ====================

function TableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20 hidden sm:block" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded hidden md:block" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  );
}

interface QuickActionButtonProps {
  invoice: Invoice;
  onRequestConfirm: () => void;
  onRequestPaid: () => void;
  onRequestConvert: () => void;
}

function QuickActionButton({
  invoice,
  onRequestConfirm,
  onRequestPaid,
  onRequestConvert,
}: QuickActionButtonProps) {
  const isProforma = (invoice as any).invoiceType === 'proforma';

  if (invoice.status === InvoiceStatus.DRAFT && !isProforma) {
    return (
      <Button size="sm" className="h-7 text-xs px-3 whitespace-nowrap" onClick={onRequestConfirm}>
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Confirmar
      </Button>
    );
  }

  if (invoice.status === InvoiceStatus.DRAFT && isProforma) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs px-3 whitespace-nowrap"
        onClick={onRequestConvert}
      >
        <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
        Convertir
      </Button>
    );
  }

  if (invoice.status === InvoiceStatus.CONFIRMED || invoice.status === InvoiceStatus.SENT) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs px-3 whitespace-nowrap border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        onClick={onRequestPaid}
      >
        <Coins className="h-3.5 w-3.5 mr-1.5" />
        Cobrada
      </Button>
    );
  }

  // spacer to keep column alignment
  return <div className="h-7 w-[88px]" />;
}

function DownloadDropdownItem({ invoiceId }: { invoiceId: string }) {
  const { download, isLoading } = useDownloadInvoicePdf({ invoiceId });
  return (
    <DropdownMenuItem onClick={download} disabled={isLoading}>
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? 'Generando PDF...' : 'Descargar PDF'}
    </DropdownMenuItem>
  );
}

// ==================== PAGE ====================

export default function FacturasPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dialog targets
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ActionTarget | null>(null);
  const [paidTarget, setPaidTarget] = useState<ActionTarget | null>(null);

  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir, fromDate, toDate]);

  const { data, isLoading, error, refetch } = useInvoices({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as InvoiceStatus) : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    limit: 20,
    sortBy: sortKey,
    sortOrder: sortDir,
  });

  const confirmMutation = useConfirmInvoice();
  const paidMutation = useMarkInvoiceAsPaid();
  const unmarkPaidMutation = useUnmarkInvoiceAsPaid();
  const markSentMutation = useMarkInvoiceAsSent();
  const unmarkSentMutation = useUnmarkInvoiceAsSent();
  const deleteMutation = useDeleteInvoice();
  const convertMutation = useConvertProformaToOfficial();

  const handleConfirmInvoice = async () => {
    if (!confirmTarget) return;
    await confirmMutation.mutateAsync(confirmTarget.id);
    setConfirmTarget(null);
  };

  const handleMarkAsPaid = async () => {
    if (!paidTarget) return;
    await paidMutation.mutateAsync(paidTarget.id);
    setPaidTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleConvertToOfficial = async () => {
    if (!convertId) return;
    await convertMutation.mutateAsync(convertId);
    setConvertId(null);
  };

  const invoices = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const hasActiveFilters = !!searchInput || statusFilter !== 'ALL' || !!fromDate || !!toDate;

  if (!isLoading && !error && total === 0 && !hasActiveFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus facturas</p>
          </div>
        </div>
        <EmptyState
          icon={FileText}
          title="Crea tu primera factura"
          description="Genera facturas profesionales en segundos. Cumple con VeriFactu automáticamente."
          action={
            <Link href="/dashboard/facturas/nueva">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera factura
              </Button>
            </Link>
          }
        />
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nº factura, cliente o NIF..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9"
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
          <Button
            variant={showDateFilter || fromDate || toDate ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowDateFilter((v) => !v)}
            title="Filtrar por fechas"
            className={cn('shrink-0', (fromDate || toDate) && 'ring-2 ring-primary ring-offset-1')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showDateFilter && (
          <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex-1">
              <Label htmlFor="from-date" className="text-xs text-muted-foreground mb-1.5 block">
                Desde
              </Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="to-date" className="text-xs text-muted-foreground mb-1.5 block">
                Hasta
              </Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        )}

        <InvoiceStatusFilterPills value={statusFilter} onChange={setStatusFilter} />
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
                    setSearchInput('');
                    setStatusFilter('ALL');
                    setFromDate('');
                    setToDate('');
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
                        className="hidden sm:table-cell"
                      />
                      <SortableHeader
                        label="Vencimiento"
                        sortKey="dueDate"
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                        Acción rápida
                      </th>
                      <th className="px-4 py-3 w-9" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => {
                      const overdue = isOverdue(invoice);
                      const isProforma = (invoice as any).invoiceType === 'proforma';
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
                              {invoice.number ?? (isProforma ? 'PROFORMA' : 'BORRADOR')}
                            </Link>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {invoice.isRectificative && (
                                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1 py-0.5">
                                  rectif.
                                </span>
                              )}
                              {invoice.recurringInvoiceId && (
                                <span className="text-[10px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  recurrente
                                </span>
                              )}
                              {isProforma && (
                                <span className="text-[10px] font-medium text-proforma-700 bg-proforma-100 dark:text-proforma-300 dark:bg-proforma-900/40 rounded px-1.5 py-0.5">
                                  proforma
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]">
                                {invoice.customer?.name ?? '-'}
                              </p>
                              {invoice.customer?.nif && (
                                <p className="text-xs font-mono text-muted-foreground">
                                  {invoice.customer.nif}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                            {formatDate(invoice.issueDate)}
                          </td>
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
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          {/* Total */}
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                            {formatCurrency(Number(invoice.total))}
                          </td>
                          {/* Estado */}
                          <td className="px-4 py-3">
                            <InvoiceStatusBadge
                              status={isProforma ? InvoiceStatus.PROFORMA : invoice.status}
                            />
                          </td>
                          {/* Acción rápida */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <QuickActionButton
                              invoice={invoice}
                              onRequestConfirm={() =>
                                setConfirmTarget({
                                  id: invoice.id,
                                  number: invoice.number,
                                  customerName: invoice.customer?.name ?? '—',
                                  total: Number(invoice.total),
                                  isProforma,
                                })
                              }
                              onRequestPaid={() =>
                                setPaidTarget({
                                  id: invoice.id,
                                  number: invoice.number,
                                  customerName: invoice.customer?.name ?? '—',
                                  total: Number(invoice.total),
                                })
                              }
                              onRequestConvert={() => setConvertId(invoice.id)}
                            />
                          </td>
                          {/* Menú ⋮ */}
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
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/facturas/nueva?edit=${invoice.id}`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      {isProforma ? 'Editar proforma' : 'Editar borrador'}
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === InvoiceStatus.DRAFT && !isProforma && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setConfirmTarget({
                                        id: invoice.id,
                                        number: invoice.number,
                                        customerName: invoice.customer?.name ?? '—',
                                        total: Number(invoice.total),
                                      })
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Confirmar factura
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === InvoiceStatus.DRAFT && isProforma && (
                                    <DropdownMenuItem onClick={() => setConvertId(invoice.id)}>
                                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                                      Convertir a factura oficial
                                    </DropdownMenuItem>
                                  )}
                                {invoice.status === InvoiceStatus.CONFIRMED && (
                                  <DropdownMenuItem
                                    onClick={() => markSentMutation.mutate(invoice.id)}
                                    disabled={markSentMutation.isPending}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Marcar como enviada
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === InvoiceStatus.SENT && (
                                  <DropdownMenuItem
                                    onClick={() => unmarkSentMutation.mutate(invoice.id)}
                                    disabled={unmarkSentMutation.isPending}
                                  >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Deshacer envío
                                  </DropdownMenuItem>
                                )}
                                {(invoice.status === InvoiceStatus.CONFIRMED ||
                                  invoice.status === InvoiceStatus.SENT) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setPaidTarget({
                                        id: invoice.id,
                                        number: invoice.number,
                                        customerName: invoice.customer?.name ?? '—',
                                        total: Number(invoice.total),
                                      })
                                    }
                                  >
                                    <Coins className="mr-2 h-4 w-4" />
                                    Marcar como cobrada
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === InvoiceStatus.PAID && (
                                  <DropdownMenuItem
                                    onClick={() => unmarkPaidMutation.mutate(invoice.id)}
                                    disabled={unmarkPaidMutation.isPending}
                                  >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Deshacer pago
                                  </DropdownMenuItem>
                                )}
                                {invoice.number && (
                                  <DownloadDropdownItem invoiceId={invoice.id} />
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/facturas/nueva?duplicate=${invoice.id}`,
                                    )
                                  }
                                >
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
                                      {isProforma ? 'Eliminar proforma' : 'Eliminar borrador'}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages} · {total} facturas
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Confirm Invoice Dialog ── */}
      <AlertDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Confirmar factura?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Vas a confirmar la factura de{' '}
                  <strong>{confirmTarget?.customerName}</strong> por{' '}
                  <strong>{formatCurrency(confirmTarget?.total ?? 0)}</strong>.
                </p>
                <p className="text-sm">
                  Esta acción es <strong>irreversible</strong>. La factura quedará sellada y se
                  registrará en VeriFactu ante la AEAT.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmInvoice}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? 'Confirmando...' : 'Sí, confirmar factura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Mark as Paid Dialog ── */}
      <AlertDialog
        open={Boolean(paidTarget)}
        onOpenChange={(open) => !open && setPaidTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como cobrada?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  La factura{' '}
                  <strong>{paidTarget?.number ?? 'seleccionada'}</strong> de{' '}
                  <strong>{paidTarget?.customerName}</strong> por{' '}
                  <strong>{formatCurrency(paidTarget?.total ?? 0)}</strong> se marcará como
                  cobrada.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsPaid}
              disabled={paidMutation.isPending}
            >
              {paidMutation.isPending ? 'Guardando...' : 'Sí, cobrada'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Dialog ── */}
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

      <ConvertProformaModal
        open={Boolean(convertId)}
        invoiceCustomerName={invoices.find((inv) => inv.id === convertId)?.customer?.name ?? '—'}
        isPending={convertMutation.isPending}
        onCancel={() => setConvertId(null)}
        onConfirm={handleConvertToOfficial}
      />
    </div>
  );
}
