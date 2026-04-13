'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  CheckCircle2,
  CreditCard,
  Copy,
  RotateCcw,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Banknote,
  FileText,
  Hash,
  Pencil,
  ArrowRightLeft,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';
import { DownloadInvoiceButton } from '@/components/ui/download-invoice-button';
import { Label } from '@/components/ui/label';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { getPaymentDetailFields } from '@/lib/payment-method-details';
import {
  useInvoice,
  useConfirmInvoice,
  useMarkInvoiceAsPaid,
  useDeleteInvoice,
  useRectifyInvoice,
  useConvertProformaToOfficial,
  useConvertDraftToProforma,
  useUpdateInvoiceNotes,
} from '@/hooks/use-invoices';
import { ConvertProformaModal } from '@/components/facturas/ConvertProformaModal';
import { ConvertDraftToProformaModal } from '@/components/facturas/ConvertDraftToProformaModal';
import {
  ConvertToRecurringModal,
  type RecurringSettings,
} from '@/components/facturas/ConvertToRecurringModal';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { InvoiceStatus, PaymentMethod, Tenant } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { INVOICE_STATUS_CONFIG } from '@/components/common/invoice-status-badge';
import { useInvoiceTemplate, useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useAuthStore } from '@/store/auth-store';
import { useTenant } from '@/hooks/use-tenant';
import { cn, resolveUrl, formatCurrency } from '@/lib/utils';

// ==================== CONSTANTS ====================

// ==================== HELPERS ====================

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

// ==================== SUBCOMPONENTS ====================

function SectionLabel({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) {
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

function InvoiceDetailSkeleton() {
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

export default function FacturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showRectifyDialog, setShowRectifyDialog] = useState(false);
  const [rectifyReason, setRectifyReason] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showConvertToProformaModal, setShowConvertToProformaModal] = useState(false);
  const [showConvertToRecurringModal, setShowConvertToRecurringModal] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingNotesValue, setEditingNotesValue] = useState('');

  const currentTenant = useAuthStore((s) => s.currentTenant);
  const { data: tenantData } = useTenant();

  const { data: invoice, isLoading, error } = useInvoice(id);
  const confirmMutation = useConfirmInvoice();
  const paidMutation = useMarkInvoiceAsPaid();
  const deleteMutation = useDeleteInvoice();
  const rectifyMutation = useRectifyInvoice();
  const convertMutation = useConvertProformaToOfficial();
  const convertToProformaMutation = useConvertDraftToProforma();
  const updateNotesMutation = useUpdateInvoiceNotes();
  const createRecurringMutation = useCreateRecurringInvoice();
  // FIX: useDuplicateInvoice eliminado — duplicar es solo navegar a /nueva?duplicate=ID

  const templateId = (invoice as any)?.templateId ?? (invoice as any)?.template?.id ?? '';
  const { data: specificTemplate } = useInvoiceTemplate(templateId);
  const { data: defaultTemplate } = useDefaultTemplate();
  // When the invoice has no templateId (existing data), fall back to the tenant's default template
  const baseTemplate = specificTemplate ?? defaultTemplate;

  // Apply per-invoice layoutOverride on top of the base template
  const invoiceLayoutOverride = (invoice as any)?.layoutOverride as
    | {
        itemsTable?: Partial<{
          showUnitPrice: boolean;
          showTaxColumn: boolean;
          showLineTotal: boolean;
        }>;
      }
    | null
    | undefined;
  const template =
    baseTemplate && invoiceLayoutOverride?.itemsTable
      ? {
          ...baseTemplate,
          layout: {
            ...baseTemplate.layout,
            itemsTable: {
              ...baseTemplate.layout.itemsTable,
              ...invoiceLayoutOverride.itemsTable,
            },
          },
        }
      : baseTemplate;

  const paymentDetails = (invoice as any)?.paymentDetails as PaymentDetails | undefined;
  const activePaymentMethod = invoice?.paymentMethod as string | null | undefined;

  // ==================== HANDLERS ====================

  const handleStartEditNotes = () => {
    setEditingNotesValue(invoice?.notes ?? '');
    setIsEditingNotes(true);
  };

  const handleCancelEditNotes = () => {
    setIsEditingNotes(false);
    setEditingNotesValue('');
  };

  const handleSaveNotes = async () => {
    await updateNotesMutation.mutateAsync({
      id,
      notes: editingNotesValue.trim() || null,
    });
    setIsEditingNotes(false);
  };

  const handleConfirm = async () => {
    await confirmMutation.mutateAsync(id);
  };
  const handlePaid = async () => {
    await paidMutation.mutateAsync(id);
  };

  // FIX: navegar directamente al formulario de nueva factura con el ID como param
  // No hace falta llamar al backend — useInvoice en NuevaFacturaPage cargará los datos
  const handleDuplicate = () => {
    router.push(`/dashboard/facturas/nueva?duplicate=${id}`);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/facturas');
  };

  const handleConvertToOfficial = async () => {
    const newInvoice = await convertMutation.mutateAsync(id);
    setShowConvertModal(false);
    router.push(`/dashboard/facturas/nueva?edit=${newInvoice.id}`);
  };

  const handleConvertToProforma = async () => {
    await convertToProformaMutation.mutateAsync(id);
    setShowConvertToProformaModal(false);
  };

  const handleConvertToRecurring = async (settings: RecurringSettings) => {
    await createRecurringMutation.mutateAsync({
      customerId: invoice!.customerId!,
      frequency: settings.frequency,
      dayOfMonth: settings.dayOfMonth,
      startDate: settings.startDate,
      endDate: settings.hasEndDate && settings.endDate ? settings.endDate : undefined,
      autoConfirm: settings.autoConfirm,
      lines: (invoice!.lines ?? []).map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        hideQty: (l as any).hideQty ?? false,
      })),
      paymentMethod: invoice!.paymentMethod ?? undefined,
      discountPercent: invoice!.discountPercent ? Number(invoice!.discountPercent) : undefined,
      irpfPercent: invoice!.irpfPercent ? Number(invoice!.irpfPercent) : undefined,
      notes: invoice!.notes ?? undefined,
      sourceInvoiceId: id,
    });
    setShowConvertToRecurringModal(false);
  };

  const handleRectify = async () => {
    if (!rectifyReason.trim()) return;
    const rect = await rectifyMutation.mutateAsync({
      id,
      data: {
        rectificationReason: rectifyReason,
        lines: (invoice!.lines ?? []).map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      },
    });
    setShowRectifyDialog(false);
    router.push(`/dashboard/facturas/${rect.id}`);
  };

  // ==================== LOADING / ERROR ====================

  if (isLoading) return <InvoiceDetailSkeleton />;

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">No se pudo cargar la factura</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <Link href="/dashboard/facturas">
          <Button variant="outline">Volver a facturas</Button>
        </Link>
      </div>
    );
  }

  const isDraft =
    invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.PROFORMA;
  const isConfirmed = invoice.status === InvoiceStatus.CONFIRMED;
  const isSent = invoice.status === InvoiceStatus.SENT;
  const canPay = isConfirmed || isSent;
  const canRectify = isConfirmed || isSent || invoice.status === InvoiceStatus.PAID;
  const isProforma = (invoice as any).invoiceType === 'proforma';

  const pdfFileName = [invoice.number, (invoice as any).customer?.name].filter(Boolean).join(' - ');

  const statusCfg = isProforma
    ? INVOICE_STATUS_CONFIG[InvoiceStatus.PROFORMA]
    : (INVOICE_STATUS_CONFIG[invoice.status as InvoiceStatus] ??
      INVOICE_STATUS_CONFIG[InvoiceStatus.DRAFT]);
  const series = (invoice as any).series;

  // ==================== RENDER ====================

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/facturas">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Facturas</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">
            {isProforma ? 'Proforma' : (invoice.number ?? 'Borrador')}
          </span>
          {invoice.isRectificative && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-rectificativa-100 text-rectificativa-700 dark:bg-rectificativa-950 dark:text-rectificativa-400 font-medium">
              Rectificativa
            </span>
          )}
          {isProforma && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-proforma-100 text-proforma-700 dark:bg-proforma-950 dark:text-proforma-300 font-medium">
              Proforma
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Hacer recurrente — visible para facturas confirmadas */}
          {(isConfirmed || isSent || invoice.status === InvoiceStatus.PAID) && !isProforma && (
            <button
              type="button"
              onClick={() => setShowConvertToRecurringModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <RefreshCw className="h-3 w-3" />
              Hacer recurrente
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar factura
              </DropdownMenuItem>
              {isDraft && (
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/facturas/nueva?edit=${id}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {isProforma ? 'Editar proforma' : 'Editar borrador'}
                </DropdownMenuItem>
              )}
              {isDraft && isProforma && (
                <DropdownMenuItem onClick={() => setShowConvertModal(true)}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convertir a factura oficial
                </DropdownMenuItem>
              )}
              {isDraft && !isProforma && (
                <DropdownMenuItem onClick={() => setShowConvertToProformaModal(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Convertir a proforma
                </DropdownMenuItem>
              )}
              {canRectify && (
                <DropdownMenuItem onClick={() => setShowRectifyDialog(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Emitir rectificativa
                </DropdownMenuItem>
              )}
              {!isDraft && (
                <DropdownMenuItem asChild>
                  <DownloadInvoiceButton
                    invoiceId={id}
                    fileName={pdfFileName}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-2 cursor-pointer font-normal"
                  />
                </DropdownMenuItem>
              )}
              {isDraft && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isProforma ? 'Eliminar proforma' : 'Eliminar borrador'}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {isProforma ? '¿Eliminar proforma?' : '¿Eliminar borrador?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer.{' '}
                          {isProforma ? 'La proforma' : 'El borrador'} será eliminado
                          permanentemente.
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                  </div>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    {formatCurrency(invoice.total)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {formatCurrency(invoice.subtotal)} ·{' '}
                    {(() => {
                      const rates = [...new Set((invoice.lines ?? []).map((l) => l.taxRate))];
                      return rates.length === 1 ? `IVA (${rates[0]}%)` : 'IVA';
                    })()}
                    : {formatCurrency(invoice.taxTotal)}
                    {parseNum(invoice.irpfPercent) > 0 && (
                      <> · IRPF: −{formatCurrency(invoice.irpfTotal)}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/facturas/nueva?edit=${id}`)}
                      className="min-w-[160px]"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {isProforma ? 'Editar proforma' : 'Editar borrador'}
                    </Button>
                  )}
                  {isDraft && isProforma && (
                    <Button
                      size="sm"
                      onClick={() => setShowConvertModal(true)}
                      disabled={convertMutation.isPending}
                      className="min-w-[160px]"
                    >
                      <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                      {convertMutation.isPending ? 'Convirtiendo...' : 'Convertir a oficial'}
                    </Button>
                  )}
                  {isDraft && !isProforma && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowConvertToProformaModal(true)}
                      disabled={convertToProformaMutation.isPending}
                      //className="min-w-[160px] text-proforma-700 border-proforma-300 hover:bg-proforma-50 hover:text-proforma-800"
                      className="min-w-[160px] text-proforma-50 bg-proforma-500 border-proforma-300 hover:bg-proforma-300 hover:text-proforma-800"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      {convertToProformaMutation.isPending
                        ? 'Convirtiendo...'
                        : 'Guardar como proforma'}
                    </Button>
                  )}
                  {isDraft && !isProforma && (
                    <Button
                      size="sm"
                      onClick={handleConfirm}
                      disabled={confirmMutation.isPending}
                      className="min-w-[160px]"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar factura'}
                    </Button>
                  )}
                  {canPay && (
                    <Button
                      size="sm"
                      onClick={handlePaid}
                      disabled={paidMutation.isPending}
                      className="min-w-[140px]"
                    >
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      {paidMutation.isPending ? 'Procesando...' : 'Marcar como pagada'}
                    </Button>
                  )}
                  {!isDraft && (
                    <DownloadInvoiceButton
                      invoiceId={id}
                      fileName={pdfFileName}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-current/10">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>{invoice.number}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Emitida {formatDate(invoice.issueDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Vence {formatDate(invoice.dueDate)}</span>
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

            {/* ZONA A.5 — Vinculada a recurrente */}
            {invoice.recurringInvoiceId && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <RefreshCw className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary leading-tight">
                    Vinculada a factura recurrente
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Esta factura está asociada a una regla de facturación automática
                  </p>
                </div>
                <Link href={`/dashboard/recurrentes/${invoice.recurringInvoiceId}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  >
                    Ver recurrente →
                  </Button>
                </Link>
              </div>
            )}

            {/* ZONA B — Cliente */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Building2}>Cliente</SectionLabel>
              <p className="font-semibold text-base leading-tight">{invoice.customer?.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{invoice.customer?.nif}</p>
              {invoice.customer?.address && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {invoice.customer.address}
                  {invoice.customer.postalCode && `, ${invoice.customer.postalCode}`}
                  {invoice.customer.city && ` ${invoice.customer.city}`}
                  {invoice.customer.province && ` (${invoice.customer.province})`}
                </p>
              )}
              {invoice.customer?.email && (
                <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
              )}
            </div>

            {/* ZONA C — Líneas + totales */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={FileText}>Líneas de factura</SectionLabel>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
                      Descripción
                    </th>
                    {(invoice.lines ?? []).some((l) => !l.hideQty) && (
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                        Cant.
                      </th>
                    )}
                    {(template?.layout.itemsTable.showUnitPrice ?? true) && (
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                        Precio
                      </th>
                    )}
                    {(template?.layout.itemsTable.showTaxColumn ?? true) && (
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-12">
                        IVA
                      </th>
                    )}
                    {(template?.layout.itemsTable.showLineTotal ?? true) && (
                      <th className="text-right pb-2 font-medium text-muted-foreground text-xs w-20">
                        Subtotal
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(invoice.lines ?? []).map((line) => (
                    <tr key={line.id}>
                      <td className="py-2.5 pr-4">{line.description}</td>
                      {(invoice.lines ?? []).some((l) => !l.hideQty) && (
                        <td className="py-2.5 text-right tabular-nums">
                          {line.hideQty ? '' : parseNum(line.quantity)}
                        </td>
                      )}
                      {(template?.layout.itemsTable.showUnitPrice ?? true) && (
                        <td className="py-2.5 text-right tabular-nums">
                          {formatCurrency(line.unitPrice)}
                        </td>
                      )}
                      {(template?.layout.itemsTable.showTaxColumn ?? true) && (
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {parseNum(line.taxRate)}%
                        </td>
                      )}
                      {(template?.layout.itemsTable.showLineTotal ?? true) && (
                        <td className="py-2.5 text-right tabular-nums font-medium">
                          {formatCurrency(line.subtotal)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t ml-auto w-64 space-y-1.5">
                <DataRow label="Base imponible" value={formatCurrency(invoice.subtotal)} />
                {parseNum(invoice.discountPercent) > 0 && (
                  <div className="flex justify-between items-baseline py-1">
                    <span className="text-sm text-secondary-600">
                      Descuento ({invoice.discountPercent}%)
                    </span>
                    <span className="text-sm text-secondary-600">
                      −{formatCurrency(invoice.discountAmount ?? 0)}
                    </span>
                  </div>
                )}
                <DataRow
                  label={(() => {
                    const rates = [...new Set((invoice.lines ?? []).map((l) => l.taxRate))];
                    return rates.length === 1 ? `IVA (${rates[0]}%)` : 'IVA';
                  })()}
                  value={formatCurrency(invoice.taxTotal)}
                />
                {parseNum(invoice.irpfPercent) > 0 && (
                  <div className="flex justify-between items-baseline py-1">
                    <span className="text-sm text-rectificativa-600">
                      IRPF ({invoice.irpfPercent}%)
                    </span>
                    <span className="text-sm text-rectificativa-600">
                      −{formatCurrency(invoice.irpfTotal ?? 0)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-baseline py-1">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg tabular-nums">
                    {formatCurrency(invoice.total)}
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
                    {getPaymentDetailFields(activePaymentMethod as any).map((field) => {
                      const value = (paymentDetails as any)[field.key];
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
                    {activePaymentMethod === PaymentMethod.CASH && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Límite legal: 1.000 € entre empresarios · 2.500 € con particulares
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Notas</SectionLabel>
                {!isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={handleStartEditNotes}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    {invoice.notes ? 'Editar' : 'Añadir nota'}
                  </Button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingNotesValue}
                    onChange={(e) => setEditingNotesValue(e.target.value)}
                    placeholder="Añade una nota visible en la factura..."
                    className="text-sm resize-none"
                    rows={4}
                    maxLength={1000}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {editingNotesValue.length}/1000
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditNotes}
                        disabled={updateNotesMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={updateNotesMutation.isPending}
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {updateNotesMutation.isPending ? 'Guardando...' : 'Guardar nota'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : invoice.notes ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Sin notas</p>
              )}
            </div>

            {/* VeriFactu */}
            {(invoice as any).verifactuQr && (
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel>Verificación VeriFactu</SectionLabel>
                <a
                  href={(invoice as any).verifactuQr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Verificar en la AEAT →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          <LiveInvoicePreview
            invoice={invoice}
            template={template ?? null}
            tenant={(() => {
              const src = tenantData ?? currentTenant;
              return src ? ({ ...src, logoUrl: resolveUrl(src.logoUrl) ?? null } as Tenant) : null;
            })()}
            activeFieldSection={null}
            onSectionClick={() => {}}
            paymentDetails={paymentDetails}
          />
        </div>
      </div>

      <ConvertProformaModal
        open={showConvertModal}
        invoiceCustomerName={invoice.customer?.name ?? '—'}
        isPending={convertMutation.isPending}
        onCancel={() => setShowConvertModal(false)}
        onConfirm={handleConvertToOfficial}
      />

      <ConvertDraftToProformaModal
        open={showConvertToProformaModal}
        invoiceCustomerName={invoice.customer?.name ?? '—'}
        isPending={convertToProformaMutation.isPending}
        onCancel={() => setShowConvertToProformaModal(false)}
        onConfirm={handleConvertToProforma}
      />

      <ConvertToRecurringModal
        open={showConvertToRecurringModal}
        customerName={(invoice as any).customer?.name ?? '—'}
        isPending={createRecurringMutation.isPending}
        onCancel={() => setShowConvertToRecurringModal(false)}
        onConfirm={handleConvertToRecurring}
      />

      {/* Rectify dialog */}
      <AlertDialog open={showRectifyDialog} onOpenChange={setShowRectifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emitir factura rectificativa</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará una nueva factura rectificativa basada en esta. Indica el motivo de la
              rectificación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Motivo de la rectificación (mínimo 5 caracteres)..."
              value={rectifyReason}
              onChange={(e) => setRectifyReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRectifyReason('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRectify}
              disabled={rectifyReason.trim().length < 5 || rectifyMutation.isPending}
            >
              {rectifyMutation.isPending ? 'Creando...' : 'Crear rectificativa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
