'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  MoreVertical,
  Trash2,
  AlertCircle,
  Building2,
  Calendar,
  CalendarClock,
  Layers,
  Banknote,
  FileText,
  Hash,
  Pencil,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { DownloadInvoiceButton } from '@/components/ui/download-invoice-button';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { getPaymentDetailFields } from '@/lib/payment-method-details';
import {
  useInvoice,
  useDeleteInvoice,
  useUpdateQuoteStatus,
  useConvertQuoteToProforma,
  useConvertQuoteToOfficial,
} from '@/hooks/use-invoices';
import { QuoteAcceptanceStatus, PaymentMethod, Tenant } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { useInvoiceTemplate, useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useAuthStore } from '@/store/auth-store';
import { useTenant } from '@/hooks/use-tenant';
import { cn, resolveUrl } from '@/lib/utils';

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
    label: 'Enviado al cliente',
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

// ==================== HELPERS ====================

function formatCurrency(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(n)) return '—';
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function parseNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'string' ? parseFloat(v) : v;
}

function isQuoteExpired(
  validUntil: string | null | undefined,
  status: QuoteAcceptanceStatus | null | undefined,
): boolean {
  if (!validUntil) return false;
  if (
    status === QuoteAcceptanceStatus.CONVERTED ||
    status === QuoteAcceptanceStatus.ACCEPTED ||
    status === QuoteAcceptanceStatus.REJECTED
  )
    return false;
  return new Date(validUntil) < new Date(new Date().toDateString());
}

// ==================== SUBCOMPONENTS ====================

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function DataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm text-right', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

// ==================== LOADING SKELETON ====================

function QuoteDetailSkeleton() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[60%] p-6 space-y-4 border-r">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="w-[40%] p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function PresupuestoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConvertToProformaDialog, setShowConvertToProformaDialog] = useState(false);
  const [showConvertToOfficialDialog, setShowConvertToOfficialDialog] = useState(false);

  const currentTenant = useAuthStore((s) => s.currentTenant);
  const { data: tenantData } = useTenant();

  const { data: quote, isLoading, error } = useInvoice(id);
  const deleteMutation = useDeleteInvoice();
  const updateStatusMutation = useUpdateQuoteStatus();
  const convertToProformaMutation = useConvertQuoteToProforma();
  const convertToOfficialMutation = useConvertQuoteToOfficial();

  const templateId = (quote as unknown as { templateId?: string })?.templateId ?? '';
  const { data: specificTemplate } = useInvoiceTemplate(templateId);
  const { data: defaultTemplate } = useDefaultTemplate();
  const template = specificTemplate ?? defaultTemplate;

  const paymentDetails = (quote as unknown as { paymentDetails?: PaymentDetails })?.paymentDetails;
  const activePaymentMethod = quote?.paymentMethod as string | null | undefined;

  // ==================== HANDLERS ====================

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/presupuestos');
  };

  const handleUpdateStatus = async (status: QuoteAcceptanceStatus) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const handleConvertToProforma = async () => {
    const newInvoice = await convertToProformaMutation.mutateAsync(id);
    setShowConvertToProformaDialog(false);
    router.push(`/dashboard/facturas/${newInvoice.id}`);
  };

  const handleConvertToOfficial = async () => {
    const newInvoice = await convertToOfficialMutation.mutateAsync(id);
    setShowConvertToOfficialDialog(false);
    router.push(`/dashboard/facturas/nueva?edit=${newInvoice.id}`);
  };

  // ==================== LOADING / ERROR ====================

  if (isLoading) return <QuoteDetailSkeleton />;

  if (error || !quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">No se pudo cargar el presupuesto</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <Link href="/dashboard/presupuestos">
          <Button variant="outline">Volver a presupuestos</Button>
        </Link>
      </div>
    );
  }

  const quoteData = quote as unknown as {
    validUntil?: string;
    quoteAcceptanceStatus?: QuoteAcceptanceStatus;
    convertedToInvoiceId?: string;
  };

  const acceptanceStatus = quoteData.quoteAcceptanceStatus ?? QuoteAcceptanceStatus.PENDING;
  const isConverted = acceptanceStatus === QuoteAcceptanceStatus.CONVERTED;
  const canEdit = !isConverted;
  const canDelete = !isConverted;
  const expired = isQuoteExpired(quoteData.validUntil, acceptanceStatus);

  const statusCfg = QUOTE_ACCEPTANCE_CONFIG[acceptanceStatus];
  const series = (quote as unknown as { series?: { name: string } }).series;
  const pdfFileName = [quote.number, quote.customer?.name].filter(Boolean).join(' - ');

  // The `hideQty` field is stored in the DB and returned by the API for every line.
  // ItemsTableBlock reads it via resolveHideQty — no extra mapping needed here.
  const quoteForPreview = quote;

  // ==================== RENDER ====================

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/presupuestos">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Presupuestos</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">{quote.number ?? 'Sin número'}</span>
          {expired && (
            <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">
              Caducado
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/presupuestos/nueva?edit=${id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar presupuesto
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <DownloadInvoiceButton
                invoiceId={id}
                fileName={pdfFileName}
                variant="ghost"
                size="sm"
                className="w-full justify-start px-2 cursor-pointer font-normal"
              />
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar presupuesto
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Split panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="w-[60%] overflow-y-auto border-r">
          <div className="px-6 py-5 space-y-4">
            {/* ZONA A — Hero de estado */}
            <div className={cn('rounded-xl border p-5', statusCfg.bg, statusCfg.border)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('h-2 w-2 rounded-full', statusCfg.dot)} />
                    <span
                      className={cn(
                        'text-xs font-semibold uppercase tracking-widest',
                        statusCfg.color,
                      )}
                    >
                      {statusCfg.label}
                    </span>
                    {expired && (
                      <span className="text-xs font-semibold uppercase tracking-widest text-destructive">
                        · Caducado
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    {formatCurrency(quote.total)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {formatCurrency(quote.subtotal)} · IVA: {formatCurrency(quote.taxTotal)}
                    {parseNum(quote.irpfPercent) > 0 && (
                      <> · IRPF: −{formatCurrency(quote.irpfTotal)}</>
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/presupuestos/nueva?edit=${id}`)}
                      className="min-w-[160px]"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Editar presupuesto
                    </Button>
                  )}

                  {!isConverted && acceptanceStatus !== QuoteAcceptanceStatus.ACCEPTED && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(QuoteAcceptanceStatus.SENT)}
                      disabled={
                        updateStatusMutation.isPending ||
                        acceptanceStatus === QuoteAcceptanceStatus.SENT
                      }
                      className="min-w-[160px]"
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      {acceptanceStatus === QuoteAcceptanceStatus.SENT
                        ? 'Marcado como enviado'
                        : 'Marcar como enviado'}
                    </Button>
                  )}

                  {!isConverted && acceptanceStatus !== QuoteAcceptanceStatus.ACCEPTED && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(QuoteAcceptanceStatus.ACCEPTED)}
                      disabled={updateStatusMutation.isPending}
                      className="min-w-[160px] text-secondary-700 border-secondary-300 hover:bg-secondary-50 hover:text-secondary-800"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Marcar como aceptado
                    </Button>
                  )}

                  {!isConverted && (
                    <Button
                      size="sm"
                      onClick={() => setShowConvertToProformaDialog(true)}
                      disabled={convertToProformaMutation.isPending}
                      className="min-w-[160px] text-proforma-50 bg-proforma-500 border-proforma-300 hover:bg-proforma-400"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Convertir a proforma
                    </Button>
                  )}

                  {!isConverted && (
                    <Button
                      size="sm"
                      onClick={() => setShowConvertToOfficialDialog(true)}
                      disabled={convertToOfficialMutation.isPending}
                      className="min-w-[160px]"
                    >
                      <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                      Convertir a factura
                    </Button>
                  )}

                  {isConverted && quoteData.convertedToInvoiceId && (
                    <Link href={`/dashboard/facturas/${quoteData.convertedToInvoiceId}`}>
                      <Button size="sm" variant="outline" className="min-w-[160px]">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Ver documento generado
                      </Button>
                    </Link>
                  )}

                  <DownloadInvoiceButton
                    invoiceId={id}
                    fileName={pdfFileName}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-4 mt-4 pt-4 border-t border-current/10">
                {quote.number && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>{quote.number}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Emitido {formatDate(quote.issueDate)}</span>
                </div>
                {quoteData.validUntil && (
                  <div
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      expired ? 'text-destructive font-medium' : 'text-muted-foreground',
                    )}
                  >
                    <CalendarClock className="h-3 w-3" />
                    <span>Válido hasta {formatDate(quoteData.validUntil)}</span>
                  </div>
                )}
                {series && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    <span>{series.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones de estado (solo si no convertido) */}
            {!isConverted && acceptanceStatus !== QuoteAcceptanceStatus.REJECTED && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Estado:</span>
                <Button
                  size="sm"
                  variant={
                    acceptanceStatus === QuoteAcceptanceStatus.PENDING ? 'secondary' : 'outline'
                  }
                  className="h-7 text-xs"
                  onClick={() => handleUpdateStatus(QuoteAcceptanceStatus.PENDING)}
                  disabled={
                    updateStatusMutation.isPending ||
                    acceptanceStatus === QuoteAcceptanceStatus.PENDING
                  }
                >
                  Pendiente
                </Button>
                <Button
                  size="sm"
                  variant={
                    acceptanceStatus === QuoteAcceptanceStatus.SENT ? 'secondary' : 'outline'
                  }
                  className="h-7 text-xs"
                  onClick={() => handleUpdateStatus(QuoteAcceptanceStatus.SENT)}
                  disabled={
                    updateStatusMutation.isPending ||
                    acceptanceStatus === QuoteAcceptanceStatus.SENT
                  }
                >
                  Enviado
                </Button>
                <Button
                  size="sm"
                  variant={
                    acceptanceStatus === QuoteAcceptanceStatus.ACCEPTED ? 'secondary' : 'outline'
                  }
                  className="h-7 text-xs"
                  onClick={() => handleUpdateStatus(QuoteAcceptanceStatus.ACCEPTED)}
                  disabled={
                    updateStatusMutation.isPending ||
                    acceptanceStatus === QuoteAcceptanceStatus.ACCEPTED
                  }
                >
                  Aceptado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleUpdateStatus(QuoteAcceptanceStatus.REJECTED)}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Marcar como rechazado
                </Button>
              </div>
            )}

            {/* ZONA B — Cliente */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Building2}>Cliente</SectionLabel>
              <p className="font-semibold text-base leading-tight">{quote.customer?.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{quote.customer?.nif}</p>
              {quote.customer?.address && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {quote.customer.address}
                  {quote.customer.postalCode && `, ${quote.customer.postalCode}`}
                  {quote.customer.city && ` ${quote.customer.city}`}
                  {quote.customer.province && ` (${quote.customer.province})`}
                </p>
              )}
              {quote.customer?.email && (
                <p className="text-sm text-muted-foreground">{quote.customer.email}</p>
              )}
            </div>

            {/* ZONA C — Líneas + totales */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={FileText}>Líneas del presupuesto</SectionLabel>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
                      Descripción
                    </th>
                    {(quote.lines ?? []).some((l) => !l.hideQty) && (
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                        Cant.
                      </th>
                    )}
                    <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                      Precio
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                      IVA
                    </th>
                    <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(quote.lines ?? []).map((line) => {
                    return (
                      <tr key={line.id}>
                        <td className="py-2.5 pr-4">{line.description}</td>
                        {(quote.lines ?? []).some((l) => !l.hideQty) && (
                          <td className="py-2.5 text-right tabular-nums">
                            {line.hideQty ? '' : parseNum(line.quantity)}
                          </td>
                        )}
                        <td className="py-2.5 text-right tabular-nums">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {parseNum(line.taxRate)}%
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-medium">
                          {formatCurrency(line.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t ml-auto w-64 space-y-1.5">
                <DataRow label="Base imponible" value={formatCurrency(quote.subtotal)} />
                {parseNum(quote.discountPercent) > 0 && (
                  <div className="flex justify-between items-baseline py-1">
                    <span className="text-sm text-secondary-600">
                      Descuento ({quote.discountPercent}%)
                    </span>
                    <span className="text-sm text-secondary-600">
                      −
                      {formatCurrency(
                        (quote as unknown as { discountAmount?: number }).discountAmount ?? 0,
                      )}
                    </span>
                  </div>
                )}
                <DataRow label="IVA" value={formatCurrency(quote.taxTotal)} />
                {parseNum(quote.irpfPercent) > 0 && (
                  <div className="flex justify-between items-baseline py-1">
                    <span className="text-sm text-rectificativa-600">
                      IRPF ({quote.irpfPercent}%)
                    </span>
                    <span className="text-sm text-rectificativa-600">
                      −{formatCurrency(quote.irpfTotal ?? 0)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-baseline py-1">
                  <span className="font-semibold">Total estimado</span>
                  <span className="font-bold text-lg tabular-nums">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* ZONA D — Forma de pago */}
            {activePaymentMethod && (
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel icon={Banknote}>Forma de pago</SectionLabel>
                <p className="font-semibold text-sm mb-2">
                  {PAYMENT_METHOD_LABELS[activePaymentMethod as PaymentMethod] ??
                    activePaymentMethod}
                </p>
                {paymentDetails && (
                  <div className="space-y-1">
                    {getPaymentDetailFields(activePaymentMethod as PaymentMethod).map((field) => {
                      const value = (paymentDetails as Record<string, string | undefined>)[
                        field.key
                      ];
                      if (!value) return null;
                      return (
                        <div key={field.key} className="flex items-baseline gap-2">
                          <span className="text-xs text-muted-foreground w-28 shrink-0">
                            {field.label}
                          </span>
                          {field.type === 'iban' || field.type === 'bic' ? (
                            <span className="font-mono text-sm font-medium tracking-wider">
                              {value}
                            </span>
                          ) : (
                            <span className="text-sm">{value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            {quote.notes && (
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel>Notas</SectionLabel>
                <p className="text-sm text-muted-foreground leading-relaxed">{quote.notes}</p>
              </div>
            )}

            {/* Documento generado (si ya convertido) */}
            {isConverted && quoteData.convertedToInvoiceId && (
              <div className="rounded-xl border bg-invoice-50 dark:bg-invoice-950/40 border-invoice-200 dark:border-invoice-800 p-5">
                <SectionLabel icon={ArrowRightLeft}>Documento generado</SectionLabel>
                <p className="text-sm text-muted-foreground mb-3">
                  Este presupuesto ha sido convertido. Accede al documento generado:
                </p>
                <Link href={`/dashboard/facturas/${quoteData.convertedToInvoiceId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-invoice-700 border-invoice-300 hover:bg-invoice-50"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Ver factura / proforma generada
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          <LiveInvoicePreview
            invoice={quoteForPreview}
            template={template ?? null}
            tenant={(() => {
              const src = tenantData ?? currentTenant;
              return src ? ({ ...src, logoUrl: resolveUrl(src.logoUrl) ?? null } as Tenant) : null;
            })()}
            activeFieldSection={null}
            onSectionClick={() => {}}
            paymentDetails={paymentDetails}
            invoiceType="quote"
          />
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
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
      <AlertDialog open={showConvertToProformaDialog} onOpenChange={setShowConvertToProformaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir a proforma</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará una nueva factura proforma a partir de este presupuesto. El presupuesto
              original quedará marcado como convertido.
              {quote.customer?.name && (
                <>
                  {' '}
                  La proforma se generará para <strong>{quote.customer.name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToProforma}
              disabled={convertToProformaMutation.isPending}
            >
              {convertToProformaMutation.isPending ? 'Convirtiendo...' : 'Convertir a proforma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to official dialog */}
      <AlertDialog open={showConvertToOfficialDialog} onOpenChange={setShowConvertToOfficialDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir a factura oficial</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un borrador de factura oficial a partir de este presupuesto. El presupuesto
              original quedará marcado como convertido. Podrás revisar y confirmar la factura antes
              de emitirla.
              {quote.customer?.name && (
                <>
                  {' '}
                  La factura se generará para <strong>{quote.customer.name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToOfficial}
              disabled={convertToOfficialMutation.isPending}
            >
              {convertToOfficialMutation.isPending ? 'Convirtiendo...' : 'Convertir a factura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
