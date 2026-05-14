'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pause,
  Play,
  Pencil,
  Trash2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
  MoreVertical,
  Hash,
  Banknote,
  TicketCheck,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  useRecurringInvoice,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useDeleteRecurringInvoice,
  useRecurringInvoiceGeneratedInvoices,
  useGenerateRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import { GenerateNowDialog } from '@/components/recurrentes/generate-now-dialog';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { useAuthStore } from '@/store/auth-store';
import { useTenant } from '@/hooks/use-tenant';
import { InvoiceSplitLayout } from '@/components/common/InvoiceSplitLayout';
import {
  InvoiceStatus,
  PaymentMethod,
  RecurringStatus,
  Tenant,
  TaxRegime,
  type RecurringInvoice,
  type Invoice,
} from '@easyfactura/shared-types';
import { FREQUENCY_LABELS, PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { cn, formatCurrency, formatDate, resolveUrl } from '@/lib/utils';
import { SectionLabel } from '@/components/common/section-label';
import { DataRow } from '@/components/common/data-row';
import { round2 } from '@/lib/math';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ==================== CONSTANTS ====================

const RECURRING_STATUS_CONFIG = {
  [RecurringStatus.ACTIVE]: {
    label: 'Activa',
    dot: 'bg-product-500',
    color: 'text-product-700 dark:text-product-400',
    bg: 'bg-product-50 dark:bg-product-950/30',
    border: 'border-product-200 dark:border-product-900',
  },
  [RecurringStatus.PAUSED]: {
    label: 'Pausada',
    dot: 'bg-proforma-500',
    color: 'text-proforma-700 dark:text-proforma-400',
    bg: 'bg-proforma-50 dark:bg-proforma-950/30',
    border: 'border-proforma-200 dark:border-proforma-900',
  },
  [RecurringStatus.COMPLETED]: {
    label: 'Completada',
    dot: 'bg-neutral-400',
    color: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-50 dark:bg-neutral-900/30',
    border: 'border-neutral-200 dark:border-neutral-800',
  },
};

// ==================== HELPERS ====================

function buildRecurringPreviewInvoice(
  recurring: RecurringInvoice,
  tenant?: Tenant | null,
): Invoice {
  const today = new Date().toISOString();
  const lines = recurring.lines ?? [];

  const subtotal = round2(
    lines.reduce((acc, l) => acc + round2(Number(l.quantity) * Number(l.unitPrice)), 0),
  );

  const discountAmount = recurring.discountPercent
    ? round2(subtotal * (Number(recurring.discountPercent) / 100))
    : 0;
  const subtotalAfterDiscount = round2(subtotal - discountAmount);
  const discFactor = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;

  // REAGYP: apply compensation when tenant is in REAGYP and customer is not also REAGYP
  const isReagyp =
    tenant?.taxRegime === TaxRegime.REAGYP &&
    !(recurring.customer as { isReagyp?: boolean } | null)?.isReagyp &&
    !!tenant?.reaypRate;
  const compensacionPercent = isReagyp ? Number(tenant!.reaypRate) : 0;
  const compensacionAmount = isReagyp
    ? round2(subtotalAfterDiscount * (compensacionPercent / 100))
    : 0;

  const taxTotal = isReagyp
    ? 0
    : round2(
        lines.reduce((acc, l) => {
          const base = round2(Number(l.quantity) * Number(l.unitPrice));
          return acc + round2(base * discFactor * (Number(l.taxRate) / 100));
        }, 0),
      );

  // For REAGYP, IRPF base includes compensation (Art. 102.Dos LIVA)
  const irpfBase = isReagyp
    ? round2(subtotalAfterDiscount + compensacionAmount)
    : subtotalAfterDiscount;
  const irpfTotal = recurring.irpfPercent
    ? round2(irpfBase * (Number(recurring.irpfPercent) / 100))
    : null;

  const total = round2(subtotalAfterDiscount + taxTotal + compensacionAmount - (irpfTotal ?? 0));

  return {
    id: 'preview',
    tenantId: recurring.tenantId,
    seriesId: recurring.seriesId ?? '',
    customerId: recurring.customerId,
    number: '---',
    issueDate: today.split('T')[0],
    dueDate: null,
    status: InvoiceStatus.DRAFT,
    subtotal,
    discountPercent: recurring.discountPercent,
    discountAmount,
    taxTotal,
    irpfPercent: recurring.irpfPercent,
    irpfTotal,
    compensacionPercent: isReagyp ? compensacionPercent : null,
    compensacionAmount: isReagyp ? compensacionAmount : null,
    total,
    paymentMethod: recurring.paymentMethod ?? null,
    paymentDetails: recurring.paymentDetails ?? null,
    notes: recurring.notes ?? null,
    pdfUrl: null,
    verifactuHash: null,
    verifactuPrevHash: null,
    verifactuStatus: null,
    verifactuQr: null,
    verifactuSentAt: null,
    verifactuResponse: null,
    isRectificative: false,
    rectifiedInvoiceId: null,
    rectificationReason: null,
    createdAt: today,
    updatedAt: today,
    customer: recurring.customer,
    series: recurring.series,
    lines: lines.map((l, i) => {
      const qty = Number(l.quantity);
      const price = Number(l.unitPrice);
      const sub = round2(qty * price);
      const tax = round2(sub * (Number(l.taxRate) / 100));
      return {
        id: `preview-${i}`,
        tenantId: recurring.tenantId,
        invoiceId: 'preview',
        productId: l.productId ?? null,
        description: l.description,
        quantity: qty,
        unitPrice: price,
        subtotal: sub,
        taxRate: Number(l.taxRate),
        taxAmount: tax,
        lineTotal: round2(sub + tax),
        hideQty: l.hideQty,
        sortOrder: i,
        createdAt: today,
        updatedAt: today,
      };
    }),
  } as Invoice;
}

// ==================== LOADING SKELETON ====================

function RecurrenteDetailSkeleton() {
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
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="w-[40%] p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function RecurrenteDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const currentTenant = useAuthStore((s) => s.currentTenant);
  const { data: tenantData } = useTenant();
  const { data: defaultTemplate } = useDefaultTemplate();

  const { data: recurring, isLoading, error } = useRecurringInvoice(id);
  const { data: generatedInvoices, isLoading: loadingGenerated } =
    useRecurringInvoiceGeneratedInvoices(id);
  const pauseMutation = usePauseRecurringInvoice();
  const resumeMutation = useResumeRecurringInvoice();
  const deleteMutation = useDeleteRecurringInvoice();
  const generateMutation = useGenerateRecurringInvoice();

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push('/dashboard/recurrentes'),
    });
  };

  const previewInvoice = useMemo(
    () => (recurring ? buildRecurringPreviewInvoice(recurring, tenantData ?? currentTenant) : null),
    [recurring, tenantData, currentTenant],
  );

  const previewTenant = useMemo((): Tenant | null => {
    const src = tenantData ?? currentTenant;
    return src ? ({ ...src, logoUrl: resolveUrl(src.logoUrl) ?? null } as Tenant) : null;
  }, [tenantData, currentTenant]);

  if (isLoading) return <RecurrenteDetailSkeleton />;

  if (error || !recurring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">No se pudo cargar la factura recurrente</p>
        <Link href="/dashboard/recurrentes">
          <Button variant="outline">Volver a recurrentes</Button>
        </Link>
      </div>
    );
  }

  const isActive = recurring.status === RecurringStatus.ACTIVE;
  const isPaused = recurring.status === RecurringStatus.PAUSED;
  const isCompleted = recurring.status === RecurringStatus.COMPLETED;
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const isOverdue = isActive && new Date(recurring.nextRunDate) < todayUtc;
  const statusCfg =
    RECURRING_STATUS_CONFIG[recurring.status as RecurringStatus] ??
    RECURRING_STATUS_CONFIG[RecurringStatus.ACTIVE];
  const lines = recurring.lines ?? [];
  const generatedCount =
    (recurring as RecurringInvoice & { _count?: { generatedInvoices: number } })._count
      ?.generatedInvoices ?? null;

  // Use values already computed by buildRecurringPreviewInvoice to avoid duplication
  const subtotal = previewInvoice!.subtotal;
  const discountAmount = previewInvoice!.discountAmount ?? 0;
  const taxTotal = previewInvoice!.taxTotal;
  const irpfTotal = previewInvoice!.irpfTotal;
  const total = previewInvoice!.total;

  return (
    <>
      <InvoiceSplitLayout
        backHref="/dashboard/recurrentes"
        headerLeft={
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Recurrentes</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium">{recurring.customer?.name ?? '—'}</span>
          </div>
        }
        headerRight={
          <>
            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/recurrentes/nueva?edit=${id}`)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
            )}
            {!isCompleted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowGenerateDialog(true)}
                disabled={generateMutation.isPending}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {generateMutation.isPending ? 'Generando...' : 'Generar ahora'}
              </Button>
            )}
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => pauseMutation.mutate(id)}
                disabled={pauseMutation.isPending}
              >
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                {pauseMutation.isPending ? 'Pausando...' : 'Pausar'}
              </Button>
            )}
            {isPaused && (
              <Button
                size="sm"
                onClick={() => resumeMutation.mutate(id)}
                disabled={resumeMutation.isPending}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {resumeMutation.isPending ? 'Reactivando...' : 'Reactivar'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isCompleted && (
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/recurrentes/nueva?edit=${id}`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        invoice={previewInvoice!}
        template={defaultTemplate ?? null}
        tenant={previewTenant}
        invoiceType={null}
      >
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
                  {recurring.createdByAgency && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-agency-700 bg-agency-100 dark:text-agency-300 dark:bg-agency-900/40 rounded px-1.5 py-0.5"
                      title={`${recurring.createdByAgency.agencyName} · ${recurring.createdByAgency.userName}`}
                    >
                      <Building2 className="h-2.5 w-2.5" />
                      asesoría
                    </span>
                  )}
                </div>
                {!isCompleted ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">Próxima generación</p>
                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {formatDate(recurring.nextRunDate)}
                    </p>
                    {isOverdue && (
                      <div className="flex items-center gap-1.5 mt-2 text-proforma-600 dark:text-proforma-400 text-xs font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Atrasada — pendiente en el siguiente ciclo del planificador
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-3xl font-bold tracking-tight">Finalizada</p>
                )}
              </div>
              {generatedCount !== null && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {generatedCount} factura{generatedCount !== 1 ? 's' : ''} generada
                    {generatedCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-current/10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>{FREQUENCY_LABELS[recurring.frequency]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span>Día {recurring.dayOfMonth} de cada período</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Desde {formatDate(recurring.startDate)}</span>
              </div>
            </div>
          </div>

          {/* Aviso: régimen REAGYP activo pero plantilla creada con IVA */}
          {(() => {
            const tenantIsReagyp = (tenantData ?? currentTenant)?.taxRegime === TaxRegime.REAGYP;
            const linesHaveIva = (recurring.lines ?? []).some((l) => Number(l.taxRate) > 0);
            if (!tenantIsReagyp || !linesHaveIva) return null;
            return (
              <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 leading-tight">
                    Plantilla creada con régimen general
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                    Tu empresa está ahora en el Régimen Especial Agrario (REAGYP). Las facturas que
                    se generen a partir de esta plantilla aplicarán automáticamente la compensación
                    agraria y no incluirán IVA, independientemente de los porcentajes guardados en
                    las líneas. Edita la plantilla para actualizar los datos.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ZONA B — Cliente */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={Building2}>Cliente</SectionLabel>
            <p className="font-semibold text-base leading-tight">{recurring.customer?.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{recurring.customer?.nif}</p>
            {recurring.customer?.address && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {recurring.customer.address}
                {recurring.customer.postalCode && `, ${recurring.customer.postalCode}`}
                {recurring.customer.city && ` ${recurring.customer.city}`}
                {recurring.customer.province && ` (${recurring.customer.province})`}
              </p>
            )}
            {recurring.customer?.email && (
              <p className="text-sm text-muted-foreground">{recurring.customer.email}</p>
            )}
          </div>

          {/* ZONA C — Líneas + totales */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={FileText}>Líneas de factura</SectionLabel>
            {(() => {
              const isReagyp = previewInvoice!.compensacionPercent != null;
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
                        Descripción
                      </th>
                      {lines.some((l) => !l.hideQty) && (
                        <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                          Cant.
                        </th>
                      )}
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                        Precio
                      </th>
                      {!isReagyp && (
                        <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                          IVA
                        </th>
                      )}
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lines.map((line, i) => {
                      const sub = round2(Number(line.quantity) * Number(line.unitPrice));
                      return (
                        <tr key={i}>
                          <td className="py-2.5 pr-4">{line.description}</td>
                          {lines.some((l) => !l.hideQty) && (
                            <td className="py-2.5 text-right tabular-nums">
                              {line.hideQty ? '' : Number(line.quantity)}
                            </td>
                          )}
                          <td className="py-2.5 text-right tabular-nums">
                            {formatCurrency(Number(line.unitPrice))}
                          </td>
                          {!isReagyp && (
                            <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                              {Number(line.taxRate)}%
                            </td>
                          )}
                          <td className="py-2.5 text-right tabular-nums font-medium">
                            {formatCurrency(sub)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            <div className="mt-4 pt-4 border-t ml-auto w-64 space-y-1.5">
              <DataRow label="Base imponible" value={formatCurrency(subtotal)} />
              {recurring.discountPercent && Number(recurring.discountPercent) > 0 && (
                <div className="flex justify-between items-baseline py-1">
                  <span className="text-sm text-secondary-600">
                    Descuento ({recurring.discountPercent}%)
                  </span>
                  <span className="text-sm text-secondary-600">
                    −{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              {previewInvoice!.compensacionPercent != null ? (
                <div className="flex justify-between items-baseline py-1">
                  <span className="text-sm">
                    Compensación agraria ({previewInvoice!.compensacionPercent}%)
                  </span>
                  <span className="text-sm tabular-nums">
                    +{formatCurrency(previewInvoice!.compensacionAmount ?? 0)}
                  </span>
                </div>
              ) : (
                <DataRow label="IVA" value={formatCurrency(taxTotal)} />
              )}
              {recurring.irpfPercent && Number(recurring.irpfPercent) > 0 && (
                <div className="flex justify-between items-baseline py-1">
                  <span className="text-sm text-rectificativa-600">
                    IRPF ({recurring.irpfPercent}%)
                  </span>
                  <span className="text-sm text-rectificativa-600">
                    −{formatCurrency(irpfTotal ?? 0)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-baseline py-1">
                <span className="font-semibold">Total estimado</span>
                <span className="font-bold text-lg tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* ZONA D — Configuración */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={RefreshCw}>Configuración de repetición</SectionLabel>
            <div className="space-y-0">
              <DataRow label="Frecuencia" value={FREQUENCY_LABELS[recurring.frequency]} />
              <DataRow label="Día del mes" value={`${recurring.dayOfMonth}`} />
              <DataRow label="Fecha de inicio" value={formatDate(recurring.startDate)} />
              <DataRow
                label="Fecha de fin"
                value={recurring.endDate ? formatDate(recurring.endDate) : 'Sin fecha de fin'}
              />
              <DataRow
                label="Confirmación"
                value={recurring.autoConfirm ? 'Automática' : 'Manual (borrador)'}
              />
              {recurring.irpfPercent && Number(recurring.irpfPercent) > 0 && (
                <DataRow label="IRPF" value={`${recurring.irpfPercent}%`} />
              )}
              {recurring.discountPercent && Number(recurring.discountPercent) > 0 && (
                <DataRow label="Descuento global" value={`${recurring.discountPercent}%`} />
              )}
            </div>
          </div>

          {/* ZONA E — Forma de pago */}
          {recurring.paymentMethod && (
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Banknote}>Forma de pago</SectionLabel>
              <p className="font-semibold text-sm">
                {PAYMENT_METHOD_LABELS[recurring.paymentMethod as PaymentMethod] ??
                  recurring.paymentMethod}
              </p>
            </div>
          )}

          {/* ZONA F — Notas */}
          {recurring.notes && (
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel>Notas</SectionLabel>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {recurring.notes}
              </p>
            </div>
          )}

          {/* ZONA G — Facturas generadas */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={TicketCheck}>Facturas generadas</SectionLabel>
            {loadingGenerated ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : !generatedInvoices?.length ? (
              <p className="text-sm text-muted-foreground">
                Todavía no se ha generado ninguna factura.
              </p>
            ) : (
              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {generatedInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/dashboard/facturas/${inv.id}`}
                    className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">{inv.number ?? 'Borrador'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(inv.issueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <InvoiceStatusBadge status={inv.status} />
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(Number(inv.total))}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </InvoiceSplitLayout>

      {/* Generate now confirmation dialog */}
      <GenerateNowDialog
        open={showGenerateDialog}
        isPending={generateMutation.isPending}
        onOpenChange={setShowGenerateDialog}
        onConfirm={() => {
          setShowGenerateDialog(false);
          generateMutation.mutate(id);
        }}
      />

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará esta configuración de recurrencia. Las facturas ya generadas no se verán
              afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
