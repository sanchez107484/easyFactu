'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  Plus,
  User,
  Briefcase,
  Building2,
  Globe,
  TrendingUp,
  Receipt,
  Clock,
} from 'lucide-react';
import { useSortTable, sortData } from '@/hooks/use-sort-table';
import { SortableHeader } from '@/components/common/sortable-header';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { InvoiceStatusFilterPills } from '@/components/common/invoice-status-filter-pills';
import { CustomerType, InvoiceStatus, Customer, Invoice } from '@easyfactura/shared-types';
import { useCustomer, useDeleteCustomer } from '@/hooks/use-customers';
import { useInvoices } from '@/hooks/use-invoices';
import { cn, formatCurrency } from '@/lib/utils';

// ==================== CONSTANTS ====================

const TYPE_CONFIG: Record<
  CustomerType,
  { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }
> = {
  [CustomerType.INDIVIDUAL]: {
    label: 'Particular',
    icon: <User className="h-3.5 w-3.5" />,
    variant: 'outline',
  },
  [CustomerType.SELF_EMPLOYED]: {
    label: 'Autónomo',
    icon: <Briefcase className="h-3.5 w-3.5" />,
    variant: 'secondary',
  },
  [CustomerType.COMPANY]: {
    label: 'Empresa',
    icon: <Building2 className="h-3.5 w-3.5" />,
    variant: 'default',
  },
  [CustomerType.INTRACOMMUNITY]: {
    label: 'Intracomunitario',
    icon: <Globe className="h-3.5 w-3.5" />,
    variant: 'outline',
  },
};

// ==================== SORTING ====================

function getInvoiceSortValue(invoice: Invoice, key: string): string | number {
  switch (key) {
    case 'number':
      return invoice.number ?? '';
    case 'issueDate':
      return invoice.issueDate ?? '';
    case 'total':
      return Number(invoice.total);
    case 'status':
      return invoice.status;
    default:
      return '';
  }
}

// ==================== HELPERS ====================

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildAddress(customer: Customer): string | null {
  const parts = [
    customer.address,
    [customer.postalCode, customer.city].filter(Boolean).join(' '),
    customer.province,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

// ==================== SUB-COMPONENTS ====================

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');
  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');

  const { data: customer, isLoading: loadingCustomer, isError } = useCustomer(id);
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoices({
    customerId: id,
    limit: 100,
  });
  const deleteMutation = useDeleteCustomer();

  const invoices: Invoice[] = invoicesData?.data ?? [];

  const filteredInvoices = sortData(
    invoiceStatusFilter === 'ALL'
      ? invoices
      : invoices.filter((inv) => inv.status === invoiceStatusFilter),
    sortKey,
    sortDir,
    getInvoiceSortValue,
  );

  // ── Stats ──────────────────────────────────────────────
  const totalInvoiced = invoices
    .filter((inv) => inv.status !== InvoiceStatus.DRAFT)
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const paidInvoiced = invoices
    .filter((inv) => inv.status === InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const lastInvoice = invoices
    .slice()
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0];

  // ── Handlers ───────────────────────────────────────────
  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/clientes');
  };

  // ── Loading / error states ─────────────────────────────
  if (loadingCustomer) {
    return (
      <div>
        <PageSkeleton />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Clientes
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No se ha podido cargar la información del cliente.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[customer.type];
  const address = buildAddress(customer);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{customer.name}</h1>
              <Badge variant={typeConfig.variant} className="flex items-center gap-1 shrink-0">
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
              <Badge variant={customer.isActive ? 'default' : 'secondary'} className="shrink-0">
                {customer.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {customer.legalName && (
              <p className="text-sm text-muted-foreground mt-0.5">{customer.legalName}</p>
            )}
            <p className="text-sm font-mono text-muted-foreground mt-0.5">{customer.nif}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 pl-11 sm:pl-0">
          <Link href={`/dashboard/clientes/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </Link>
          <Link href={`/dashboard/facturas/nueva?customerId=${id}`}>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nueva factura
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total facturado"
          value={formatCurrency(totalInvoiced)}
          sub={`${invoices.filter((i) => i.status !== InvoiceStatus.DRAFT).length} facturas emitidas`}
          color="bg-customer-50 text-customer-600 dark:bg-customer-950/50 dark:text-customer-400"
        />
        <StatCard
          icon={Receipt}
          label="Total cobrado"
          value={formatCurrency(paidInvoiced)}
          sub={`${invoices.filter((i) => i.status === InvoiceStatus.PAID).length} facturas pagadas`}
          color="bg-secondary-50 text-secondary-600 dark:bg-secondary-950/50 dark:text-secondary-400"
        />
        <StatCard
          icon={Clock}
          label="Última factura"
          value={lastInvoice ? formatDate(lastInvoice.issueDate) : '—'}
          sub={lastInvoice ? (lastInvoice.number ?? undefined) : 'Sin facturas aún'}
          color="bg-customer-50 text-customer-600 dark:bg-customer-950/50 dark:text-customer-400"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Customer info ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Datos del cliente</CardTitle>
                <Link href={`/dashboard/clientes/${id}/editar`}>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.email && (
                <InfoRow icon={Mail} label="Email">
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                    {customer.email}
                  </a>
                </InfoRow>
              )}

              {customer.phone && (
                <InfoRow icon={Phone} label="Teléfono">
                  <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                    {customer.phone}
                  </a>
                </InfoRow>
              )}

              {address && (
                <InfoRow icon={MapPin} label="Dirección">
                  {address}
                </InfoRow>
              )}

              {!customer.email && !customer.phone && !address && (
                <p className="text-sm text-muted-foreground">Sin datos de contacto.</p>
              )}

              {customer.notes && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      Notas
                    </p>
                    <p className="text-sm whitespace-pre-line">{customer.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <InfoRow icon={Calendar} label="Cliente desde">
                {formatDate(customer.createdAt)}
              </InfoRow>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Invoices ── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Facturas</CardTitle>
                <Link href={`/dashboard/facturas/nueva?customerId=${id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nueva factura
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filter pills */}
              {!loadingInvoices && invoices.length > 0 && (
                <div className="px-6 pt-4 pb-3 border-b">
                  <InvoiceStatusFilterPills
                    value={invoiceStatusFilter}
                    onChange={setInvoiceStatusFilter}
                  />
                </div>
              )}
              {loadingInvoices ? (
                <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4 gap-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20 hidden sm:block" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin facturas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este cliente no tiene facturas todavía.
                  </p>
                  <Link href={`/dashboard/facturas/nueva?customerId=${id}`} className="mt-4">
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Crear primera factura
                    </Button>
                  </Link>
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
                          label="Fecha"
                          sortKey="issueDate"
                          currentKey={sortKey}
                          direction={sortDir}
                          onSort={handleSort}
                          className="hidden sm:table-cell"
                        />
                        <SortableHeader
                          label="Total"
                          sortKey="total"
                          currentKey={sortKey}
                          direction={sortDir}
                          onSort={handleSort}
                          align="right"
                        />
                        <SortableHeader
                          label="Estado"
                          sortKey="status"
                          currentKey={sortKey}
                          direction={sortDir}
                          onSort={handleSort}
                        />
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-sm text-muted-foreground"
                          >
                            No hay facturas con el filtro seleccionado.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr
                            key={invoice.id}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            <td className="px-6 py-3">
                              <Link
                                href={`/dashboard/facturas/${invoice.id}`}
                                className="text-sm font-medium font-mono hover:text-primary transition-colors"
                              >
                                {invoice.number ?? '—'}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                              {formatDate(invoice.issueDate)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                              {formatCurrency(Number(invoice.total))}
                            </td>
                            <td className="px-4 py-3">
                              <InvoiceStatusBadge status={invoice.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link href={`/dashboard/facturas/${invoice.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                >
                                  Ver
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Delete dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará <strong>{customer.name}</strong>{' '}
              permanentemente, pero sus facturas se conservarán.
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
