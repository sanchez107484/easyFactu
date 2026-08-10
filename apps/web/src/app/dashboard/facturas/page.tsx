'use client';

import { useState, useEffect, Fragment } from 'react';
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
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Users,
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
  useInvoice,
  useConfirmInvoice,
  useUnmarkInvoiceAsPaid,
  useMarkInvoiceAsSent,
  useUnmarkInvoiceAsSent,
  useDeleteInvoice,
  useConvertProformaToOfficial,
  usePrefetchInvoice,
} from '@/hooks/use-invoices';
import { useSortTable } from '@/hooks/use-sort-table';
import { useDownloadInvoicePdf } from '@/hooks/use-download-invoice-pdf';
import {
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  Invoice,
  QueryInvoicesInput,
  InvoiceWithMatchedLines,
} from '@easyfactura/shared-types';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';
import { SortableHeader } from '@/components/common/sortable-header';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import {
  InvoiceStatusFilterPills,
  PaymentStatusFilterPills,
} from '@/components/common/invoice-status-filter-pills';
import { EmptyState } from '@/components/common/empty-state';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCustomers } from '@/hooks/use-customers';
import { ConvertProformaModal } from '@/components/facturas/ConvertProformaModal';
import { InvoicePaymentSection } from '@/components/facturas/InvoicePaymentSection';
import { RegisterPaymentDialog } from '@/components/facturas/RegisterPaymentDialog';
import { DownloadInvoiceButton } from '@/components/ui/download-invoice-button';

// ==================== TYPES ====================

interface ActionTarget {
  id: string;
  number: string | null;
  customerName: string;
  total: number;
  isProforma?: boolean;
}

interface PaymentTarget {
  id: string;
  number: string | null;
  customerName: string;
  total: number;
  amountPaid: number;
  paymentMethod?: string | null;
}

// ==================== HELPERS ====================

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
          <Skeleton className="h-5 w-24 rounded-full hidden sm:block" />
          <Skeleton className="h-7 w-24 rounded hidden md:block" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  );
}

function LineSearchResultRow({
  result,
  onViewInvoice,
  onViewLine,
}: {
  result: InvoiceWithMatchedLines;
  onViewInvoice: () => void;
  onViewLine: (lineId: string) => void;
}) {
  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onViewInvoice}
            className="text-sm font-medium text-primary hover:underline truncate"
          >
            {result.number ?? 'Borrador'}
          </button>
          <Badge variant="outline" className="text-xs shrink-0">
            {result.status}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDateShort(result.issueDate)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {result.customer.name}
          <span className="text-xs ml-1">({result.customer.nif})</span>
        </div>
      </div>
      <div className="space-y-1.5 ml-1">
        {(result.matchedLines ?? []).map((line) => (
          <button
            key={line.id}
            onClick={() => onViewLine(line.id)}
            className="w-full flex items-center gap-3 rounded-md border bg-background p-2.5 text-sm hover:border-primary hover:ring-1 hover:ring-primary transition-colors cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{line.description}</p>
              {line.product && (
                <p className="text-xs text-muted-foreground truncate">
                  {line.product.name}
                  {line.product.reference && (
                    <span className="ml-1">· Ref: {line.product.reference}</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
              <span>{Number(line.quantity)} uds</span>
              <span className="font-medium text-foreground">
                {formatCurrency(Number(line.unitPrice))}/ud
              </span>
              <span className="font-medium">{formatCurrency(Number(line.lineTotal))}</span>
            </div>
          </button>
        ))}
      </div>
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
  const isProforma = invoice.invoiceType === 'proforma';

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
        className="h-7 text-xs px-3 whitespace-nowrap border-product-300 text-product-700 hover:bg-product-50 hover:border-product-400 dark:border-product-700 dark:text-product-400 dark:hover:bg-product-950/30"
        onClick={onRequestPaid}
      >
        <Coins className="h-3.5 w-3.5 mr-1.5" />
        Registrar cobro
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

function InvoiceLinesExpansion({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(invoiceId);

  if (isLoading) {
    return (
      <div className="px-6 py-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  const lines = invoice?.lines ?? [];

  if (lines.length === 0) {
    return (
      <p className="px-6 py-4 text-sm text-muted-foreground">
        Sin líneas
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
              Descripción
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              Cant.
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              Precio/ud
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              Dto.
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              IVA
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {lines.map((line) => (
            <tr
              key={line.id}
              onClick={() => router.push(`/dashboard/facturas/${invoiceId}?highlightLine=${line.id}`)}
              className="hover:bg-muted/20 cursor-pointer transition-colors"
            >
              <td className="px-4 py-2 max-w-[280px] truncate">{line.description}</td>
              <td className="px-4 py-2 text-right tabular-nums">{line.quantity}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatCurrency(Number(line.unitPrice))}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {line.discountPercent ? `${line.discountPercent}%` : '—'}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{line.taxRate}%</td>
              <td className="px-4 py-2 text-right tabular-nums font-medium">
                {formatCurrency(Number(line.lineTotal))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== MOBILE CARD ROW ====================

interface InvoiceCardRowProps {
  invoice: Invoice;
  onConfirm: () => void;
  onRegisterPayment: () => void;
  onConvert: () => void;
  onDelete: () => void;
  onMarkSent: () => void;
  onUnmarkSent: () => void;
  onUnmarkPaid: () => void;
}

function InvoiceCardRow({
  invoice,
  onConfirm,
  onRegisterPayment,
  onConvert,
  onDelete,
  onMarkSent,
  onUnmarkSent,
  onUnmarkPaid,
}: InvoiceCardRowProps) {
  const router = useRouter();
  const overdue = isOverdue(invoice);
  const isProforma = invoice.invoiceType === 'proforma';
  const { download, isLoading: downloadLoading } = useDownloadInvoicePdf({
    invoiceId: invoice.id,
  });

  return (
    <div
      className={cn('px-4 py-3.5 space-y-2', overdue && 'bg-overdue-50/50 dark:bg-overdue-950/10')}
    >
      {/* Fila 1: número + badges + menú */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/facturas/${invoice.id}`}
            className="font-mono text-sm font-semibold hover:text-primary transition-colors"
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
            {invoice.createdByAgency && (
              <span
                className="text-[10px] font-medium text-agency-700 bg-agency-100 dark:text-agency-300 dark:bg-agency-900/40 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5"
                title={`Creada por ${invoice.createdByAgency.agencyName} · ${invoice.createdByAgency.userName}`}
              >
                <Building2 className="h-2.5 w-2.5" />
                asesoría
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
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
              <DropdownMenuItem onClick={onConfirm}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar factura
              </DropdownMenuItem>
            )}
            {invoice.status === InvoiceStatus.DRAFT && isProforma && (
              <DropdownMenuItem onClick={onConvert}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Convertir a factura oficial
              </DropdownMenuItem>
            )}
            {invoice.status === InvoiceStatus.CONFIRMED && (
              <DropdownMenuItem onClick={onMarkSent}>
                <Send className="mr-2 h-4 w-4" />
                Marcar como enviada
              </DropdownMenuItem>
            )}
            {invoice.status === InvoiceStatus.SENT && (
              <DropdownMenuItem onClick={onUnmarkSent}>
                <Undo2 className="mr-2 h-4 w-4" />
                Deshacer envío
              </DropdownMenuItem>
            )}
            {invoice.status === InvoiceStatus.PAID && (
              <DropdownMenuItem onClick={onUnmarkPaid}>
                <Undo2 className="mr-2 h-4 w-4" />
                Deshacer pago
              </DropdownMenuItem>
            )}
            {invoice.number && (
              <DropdownMenuItem onClick={download} disabled={downloadLoading}>
                <Download className="mr-2 h-4 w-4" />
                {downloadLoading ? 'Generando PDF...' : 'Descargar PDF'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/facturas/nueva?duplicate=${invoice.id}`)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            {(invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.PROFORMA) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  {isProforma ? 'Eliminar proforma' : 'Eliminar borrador'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Fila 2: cliente */}
      <p className="text-sm font-medium truncate">
        {invoice.customerSnapshotName ?? invoice.customer?.name ?? '-'}
      </p>

      {/* Fila 3: fecha + estado + importe */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateShort(invoice.issueDate)}
          </span>
          {overdue && (
            <span className="rounded-full bg-overdue-100 dark:bg-overdue-900/50 border border-overdue-200 dark:border-overdue-800 text-overdue-600 dark:text-overdue-400 text-[10px] font-semibold px-1.5 py-0.5">
              Vencida
            </span>
          )}
          <InvoiceStatusBadge status={isProforma ? InvoiceStatus.PROFORMA : invoice.status} />
        </div>
        <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
          {formatCurrency(Number(invoice.total))}
        </span>
      </div>

      {/* Fila 4: acción rápida */}
      <QuickActionButton
        invoice={invoice}
        onRequestConfirm={onConfirm}
        onRequestPaid={onRegisterPayment}
        onRequestConvert={onConvert}
      />
    </div>
  );
}

// ==================== PAGE ====================

export default function FacturasPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [searchLines, setSearchLines] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Dialog targets
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ActionTarget | null>(null);
  const [paidTarget, setPaidTarget] = useState<PaymentTarget | null>(null);

  const { sortKey, sortDir, handleSort } = useSortTable('issueDate', 'desc');

  const { data: customersData } = useCustomers({ limit: 500 }, { staleTime: 60_000 });
  const customers = customersData?.data ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paymentStatusFilter, sortKey, sortDir, fromDate, toDate, searchLines, customerId]);

  const { data, isLoading, error, refetch } = useInvoices({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as InvoiceStatus) : undefined,
    paymentStatus:
      paymentStatusFilter !== 'ALL' ? (paymentStatusFilter as PaymentStatus) : undefined,
    customerId: customerId || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    limit: 10,
    sortBy: sortKey as QueryInvoicesInput['sortBy'],
    sortOrder: sortDir,
    searchLines: searchLines && !!search ? true : undefined,
  });

  const confirmMutation = useConfirmInvoice();
  const unmarkPaidMutation = useUnmarkInvoiceAsPaid();
  const markSentMutation = useMarkInvoiceAsSent();
  const unmarkSentMutation = useUnmarkInvoiceAsSent();
  const deleteMutation = useDeleteInvoice();
  const convertMutation = useConvertProformaToOfficial();
  const prefetchInvoice = usePrefetchInvoice();

  const handleConfirmInvoice = async () => {
    if (!confirmTarget) return;
    await confirmMutation.mutateAsync(confirmTarget.id);
    setConfirmTarget(null);
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

  const invoices = (data?.data ?? []) as Invoice[];
  const lineResults = (data?.data ?? []) as unknown as InvoiceWithMatchedLines[];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const hasActiveFilters =
    !!searchInput ||
    statusFilter !== 'ALL' ||
    paymentStatusFilter !== 'ALL' ||
    !!fromDate ||
    !!toDate ||
    !!customerId;

  const advancedFilterCount =
    (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (customerId ? 1 : 0);

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
    <div className="space-y-5 pb-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              placeholder={
                searchLines
                  ? 'Buscar en líneas: producto, descripción...'
                  : 'Buscar por nº factura, cliente o NIF...'
              }
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
            variant={showAdvancedFilters || advancedFilterCount > 0 ? 'secondary' : 'outline'}
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className={cn('shrink-0 gap-1.5', advancedFilterCount > 0 && 'ring-2 ring-primary ring-offset-1')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Filtros</span>
            {advancedFilterCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1 text-xs">
                {advancedFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="search-lines-toggle"
            checked={searchLines}
            onCheckedChange={setSearchLines}
          />
          <Label
            htmlFor="search-lines-toggle"
            className="text-sm cursor-pointer select-none"
          >
            Buscar en líneas de factura
          </Label>
          {searchLines && (
            <Badge variant="secondary" className="text-xs">
              Modo líneas
            </Badge>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Filtros avanzados
              </span>
              {advancedFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setCustomerId('');
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Limpiar todo
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Cliente
                </Label>
                <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerComboOpen}
                      className={cn(
                        'w-full justify-between font-normal h-8 text-sm',
                        !selectedCustomer && 'text-muted-foreground',
                      )}
                    >
                      <span className="truncate">
                        {selectedCustomer ? `${selectedCustomer.name}` : 'Todos los clientes'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command
                      filter={(value, search) => {
                        const normalize = (s: string) =>
                          s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        return normalize(value).includes(normalize(search)) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="Buscar cliente..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="todos-los-clientes"
                            onSelect={() => {
                              setCustomerId('');
                              setCustomerComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 shrink-0',
                                !customerId ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            Todos los clientes
                          </CommandItem>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.nif}`}
                              onSelect={() => {
                                setCustomerId(c.id);
                                setCustomerComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4 shrink-0',
                                  customerId === c.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span className="truncate">{c.name}</span>
                              <span className="ml-1 text-muted-foreground text-xs shrink-0">
                                {c.nif}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
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

              <div>
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
            </div>
          </div>
        )}

        <InvoiceStatusFilterPills value={statusFilter} onChange={setStatusFilter} />
        <PaymentStatusFilterPills value={paymentStatusFilter} onChange={setPaymentStatusFilter} />
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
            ) : searchLines && search ? (
              lineResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin resultados en líneas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No se encontraron líneas que coincidan con la búsqueda.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchInput('');
                      setSearchLines(false);
                    }}
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {lineResults.map((result) => (
                    <LineSearchResultRow
                      key={result.id}
                      result={result}
                      onViewInvoice={() => router.push(`/dashboard/facturas/${result.id}`)}
                      onViewLine={(lineId) => router.push(`/dashboard/facturas/${result.id}?highlightLine=${lineId}`)}
                    />
                  ))}
                </div>
              )
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
                    setCustomerId('');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <>
                {/* Vista en tarjeta — pantallas pequeñas (< sm) */}
                <div className="divide-y sm:hidden">
                  {invoices.map((invoice) => {
                    const isProforma = invoice.invoiceType === 'proforma';
                    const isExpanded = expandedInvoiceId === invoice.id;
                    return (
                      <Fragment key={invoice.id}>
                        <div>
                          <div className="flex items-center px-2 pt-2">
                            <button
                              onClick={() =>
                                setExpandedInvoiceId(isExpanded ? null : invoice.id)
                              }
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title={isExpanded ? 'Ocultar líneas' : 'Ver líneas'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <InvoiceCardRow
                            invoice={invoice}
                            onConfirm={() =>
                              setConfirmTarget({
                                id: invoice.id,
                                number: invoice.number,
                                customerName: invoice.customer?.name ?? '—',
                                total: Number(invoice.total),
                                isProforma,
                              })
                            }
                            onRegisterPayment={() =>
                              setPaidTarget({
                                id: invoice.id,
                                number: invoice.number,
                                customerName: invoice.customer?.name ?? '—',
                                total: Number(invoice.total),
                                amountPaid: Number(invoice.amountPaid ?? 0),
                                paymentMethod: invoice.paymentMethod,
                              })
                            }
                            onConvert={() => setConvertId(invoice.id)}
                            onDelete={() => setDeleteId(invoice.id)}
                            onMarkSent={() => markSentMutation.mutate(invoice.id)}
                            onUnmarkSent={() => unmarkSentMutation.mutate(invoice.id)}
                            onUnmarkPaid={() => unmarkPaidMutation.mutate(invoice.id)}
                          />
                        </div>
                        {isExpanded && (
                          <div className="border-t bg-muted/10">
                            <InvoiceLinesExpansion invoiceId={invoice.id} />
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
                {/* Vista en tabla — sm en adelante */}
                <div className="overflow-x-auto hidden sm:block">
                  <table className="w-full">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="w-9 px-2 py-3" />
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                          Cobro
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
                        const isProforma = invoice.invoiceType === 'proforma';
                        const isExpanded = expandedInvoiceId === invoice.id;
                        return (
                          <Fragment key={invoice.id}>
                          <tr
                            onMouseEnter={() => prefetchInvoice(invoice.id)}
                            className={cn(
                              'group transition-colors hover:bg-muted/30',
                              overdue &&
                                'bg-overdue-50/50 hover:bg-overdue-50 dark:bg-overdue-950/10 dark:hover:bg-overdue-950/20',
                            )}
                          >
                            {/* Expand toggle */}
                            <td className="px-2 py-3">
                              <button
                                onClick={() =>
                                  setExpandedInvoiceId(isExpanded ? null : invoice.id)
                                }
                                className="p-1 rounded hover:bg-muted transition-colors"
                                title={isExpanded ? 'Ocultar líneas' : 'Ver líneas'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </td>
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
                                {invoice.createdByAgency && (
                                  <span
                                    className="text-[10px] font-medium text-agency-700 bg-agency-100 dark:text-agency-300 dark:bg-agency-900/40 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5"
                                    title={`Creada por ${invoice.createdByAgency.agencyName} · ${invoice.createdByAgency.userName}`}
                                  >
                                    <Building2 className="h-2.5 w-2.5" />
                                    asesoría
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[180px]">
                                  {invoice.customerSnapshotName ?? invoice.customer?.name ?? '-'}
                                </p>
                                {(invoice.customerSnapshotNif ?? invoice.customer?.nif) && (
                                  <p className="text-xs font-mono text-muted-foreground">
                                    {invoice.customerSnapshotNif ?? invoice.customer?.nif}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                              {formatDateShort(invoice.issueDate)}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                              {invoice.dueDate ? (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 text-sm',
                                    overdue
                                      ? 'text-overdue-600 dark:text-overdue-400 font-medium'
                                      : 'text-muted-foreground',
                                  )}
                                >
                                  {overdue && <CalendarClock className="h-3.5 w-3.5 shrink-0" />}
                                  {formatDateShort(invoice.dueDate)}
                                  {overdue && (
                                    <span className="ml-1 rounded-full bg-overdue-100 dark:bg-overdue-900/50 border border-overdue-200 dark:border-overdue-800 text-overdue-600 dark:text-overdue-400 text-[10px] font-semibold px-1.5 py-0.5">
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
                            {/* Cobro */}
                            <td className="px-4 py-3 hidden sm:table-cell">
                              {invoice.status !== InvoiceStatus.DRAFT &&
                              invoice.status !== InvoiceStatus.PROFORMA ? (
                                <InvoicePaymentSection
                                  invoice={invoice}
                                  showIcon={false}
                                  onRegisterPayment={() =>
                                    setPaidTarget({
                                      id: invoice.id,
                                      number: invoice.number,
                                      customerName: invoice.customer?.name ?? '—',
                                      total: Number(invoice.total),
                                      amountPaid: Number(invoice.amountPaid ?? 0),
                                      paymentMethod: invoice.paymentMethod,
                                    })
                                  }
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
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
                                    amountPaid: Number(invoice.amountPaid ?? 0),
                                    paymentMethod: invoice.paymentMethod,
                                  })
                                }
                                onRequestConvert={() => setConvertId(invoice.id)}
                              />
                            </td>
                            {/* Menú ⋮ */}
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
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
                                  {(invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.PROFORMA) && (
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
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="bg-muted/10 p-0 border-b">
                                <InvoiceLinesExpansion invoiceId={invoice.id} />
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">
                  Página {page} de {totalPages} · {total} facturas
                </span>
                <div className="flex gap-1.5">
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
              <AlertTriangle className="h-5 w-5 text-proforma-500" />
              ¿Confirmar factura?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Vas a confirmar la factura de <strong>{confirmTarget?.customerName}</strong> por{' '}
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
            <AlertDialogAction onClick={handleConfirmInvoice} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? 'Confirmando...' : 'Sí, confirmar factura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Register Payment Dialog ── */}
      {paidTarget && (
        <RegisterPaymentDialog
          open={Boolean(paidTarget)}
          onOpenChange={(open) => !open && setPaidTarget(null)}
          invoiceId={paidTarget.id}
          invoiceTotal={paidTarget.total}
          amountPaid={paidTarget.amountPaid}
          defaultPaymentMethod={paidTarget.paymentMethod as PaymentMethod | null}
          invoiceNumber={paidTarget.number}
          customerName={paidTarget.customerName}
        />
      )}

      {/* ── Delete Dialog ── */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {invoices.find((inv) => inv.id === deleteId)?.invoiceType === 'proforma'
                ? '¿Eliminar proforma?'
                : '¿Eliminar borrador?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {invoices.find((inv) => inv.id === deleteId)?.invoiceType === 'proforma'
                ? 'Esta acción no se puede deshacer. La proforma se eliminará permanentemente.'
                : 'Esta acción no se puede deshacer. El borrador se eliminará permanentemente.'}
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
