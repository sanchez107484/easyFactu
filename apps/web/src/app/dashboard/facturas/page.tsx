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
  Pencil,
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
  useConvertProformaToOfficial,
} from '@/hooks/use-invoices';
import { useSortTable, sortData } from '@/hooks/use-sort-table';
import { InvoiceStatus, PaymentMethod, Invoice } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';
import { SortableHeader } from '@/components/common/sortable-header';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { InvoiceStatusFilterPills } from '@/components/common/invoice-status-filter-pills';
import { EmptyState } from '@/components/common/empty-state';
import { ConvertProformaModal } from '@/components/facturas/ConvertProformaModal';

// ==================== CONSTANTS ====================

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  [PaymentMethod.BANK_TRANSFER]: { label: 'Transferencia', icon: Landmark },
  [PaymentMethod.DIRECT_DEBIT]: { label: 'Domiciliacion', icon: ArrowRightLeft },
  [PaymentMethod.CARD]: { label: 'Tarjeta', icon: CreditCard },
  [PaymentMethod.CASH]: { label: 'Efectivo', icon: Wallet },
  [PaymentMethod.PAYPAL]: { label: 'PayPal', icon: CreditCard },
  BIZUM: { label: 'Bizum', icon: Wallet },
};

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
  if (invoice.status === InvoiceStatus.PROFORMA) return false;
  return new Date(invoice.dueDate) < new Date();
}

function getInvoiceSortValue(invoice: Invoice, key: string): string | number {
  switch (key) {
    case 'number':
      return invoice.number ?? '';
    case 'customer':
      return invoice.customer?.name ?? '';
    case 'issueDate':
      return invoice.issueDate ?? '';
    case 'dueDate':
      return invoice.dueDate ?? '';
    case 'total':
      return Number(invoice.total);
    default:
      return '';
  }
}

// ==================== SUB-COMPONENTS ====================

function PaymentMethodCell({ method }: { method: string | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>;
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');

  const { data, isLoading, error, refetch } = useInvoices({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as InvoiceStatus) : undefined,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const confirmMutation = useConfirmInvoice();
  const paidMutation = useMarkInvoiceAsPaid();
  const deleteMutation = useDeleteInvoice();
  const convertMutation = useConvertProformaToOfficial();

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

  const handleDuplicate = (invoice: Invoice) => {
    router.push(`/dashboard/facturas/nueva?duplicate=${invoice.id}`);
  };

  const rawInvoices = data?.data ?? [];
  const invoices = sortData(rawInvoices, sortKey, sortDir, getInvoiceSortValue);
  const total = data?.meta.total ?? 0;

  if (!isLoading && !error && rawInvoices.length === 0 && !search && statusFilter === 'ALL') {
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
          description="Genera facturas profesionales en segundos. Cumple con VeriFactu automaticamente."
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

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por numero de factura o nombre de cliente..."
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
        <InvoiceStatusFilterPills value={statusFilter} onChange={setStatusFilter} />
      </div>

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
                    <tr>
                      <SortableHeader
                        label="Numero"
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
                        label="Emision"
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
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
                          <td className="px-6 py-3">
                            <Link
                              href={`/dashboard/facturas/${invoice.id}`}
                              className="font-mono text-sm font-medium hover:text-primary transition-colors"
                            >
                              {(invoice as any).invoiceType === 'proforma' ? (
                                <span className="text-muted-foreground font-normal">
                                  {invoice.customer?.name ?? '—'} &mdash; PROFORMA
                                </span>
                              ) : invoice.status === InvoiceStatus.DRAFT ? (
                                <span className="text-muted-foreground font-normal">
                                  {invoice.customer?.name ?? '—'} &mdash; BORRADOR
                                </span>
                              ) : (
                                invoice.number
                              )}
                            </Link>
                            {invoice.isRectificative && (
                              <span className="ml-2 text-[10px] text-muted-foreground bg-muted rounded px-1 py-0.5">
                                rectif.
                              </span>
                            )}
                            {(invoice as any).invoiceType === 'proforma' && (
                              <span className="ml-2 text-[10px] font-medium text-proforma-700 bg-proforma-100 dark:text-proforma-300 dark:bg-proforma-900/40 rounded px-1.5 py-0.5">
                                proforma
                              </span>
                            )}
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
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
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
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <PaymentMethodCell method={invoice.paymentMethod} />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                            {formatCurrency(Number(invoice.total))}
                          </td>
                          <td className="px-4 py-3">
                            <InvoiceStatusBadge
                              status={
                                (invoice as any).invoiceType === 'proforma'
                                  ? InvoiceStatus.PROFORMA
                                  : invoice.status
                              }
                            />
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
                                  <Link href={`/dashboard/facturas/${invoice.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver detalle
                                  </Link>
                                </DropdownMenuItem>
                                {invoice.status === InvoiceStatus.DRAFT && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/facturas/nueva?edit=${invoice.id}`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar borrador
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === InvoiceStatus.DRAFT &&
                                  (invoice as any).invoiceType !== 'proforma' && (
                                    <DropdownMenuItem
                                      onClick={() => confirmMutation.mutate(invoice.id)}
                                      disabled={confirmMutation.isPending}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Confirmar
                                    </DropdownMenuItem>
                                  )}
                                {invoice.status === InvoiceStatus.DRAFT &&
                                  (invoice as any).invoiceType === 'proforma' && (
                                    <DropdownMenuItem onClick={() => setConvertId(invoice.id)}>
                                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                                      Convertir a factura oficial
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

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El borrador se eliminara permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Si, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConvertProformaModal
        open={Boolean(convertId)}
        invoiceCustomerName={rawInvoices.find((inv) => inv.id === convertId)?.customer?.name ?? '—'}
        isPending={convertMutation.isPending}
        onCancel={() => setConvertId(null)}
        onConfirm={handleConvertToOfficial}
      />
    </div>
  );
}
