'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  Copy,
  RotateCcw,
  AlertCircle,
  Building2,
  Banknote,
  FileText,
  Pencil,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react';
import { DownloadInvoiceButton } from '@/components/ui/download-invoice-button';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { getPaymentDetailFields } from '@/lib/payment-method-details';
import {
  useInvoice,
  useConfirmInvoice,
  useUnmarkInvoiceAsPaid,
  useMarkInvoiceAsSent,
  useUnmarkInvoiceAsSent,
  useDeleteInvoice,
  useRectifyInvoice,
  useConvertProformaToOfficial,
  useConvertDraftToProforma,
  useUpdateInvoiceNotes,
} from '@/hooks/use-invoices';
import { ConvertProformaModal } from '@/components/facturas/ConvertProformaModal';
import { ConvertDraftToProformaModal } from '@/components/facturas/ConvertDraftToProformaModal';
import { RegisterPaymentDialog } from '@/components/facturas/RegisterPaymentDialog';
import { InvoiceDetailSkeleton } from '@/components/facturas/InvoiceDetailSkeleton';
import { SectionLabel } from '@/components/common/section-label';
import { InvoiceStatusHero } from './_components/invoice-status-hero';
import { InvoiceLinesCard } from './_components/invoice-lines-card';
import { InvoiceNotesCard } from './_components/invoice-notes-card';
import {
  ConvertToRecurringModal,
  type RecurringSettings,
} from '@/components/facturas/ConvertToRecurringModal';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { InvoiceStatus, PaymentMethod, Tenant, RectificationType } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { INVOICE_STATUS_CONFIG } from '@/components/common/invoice-status-badge';
import { useInvoiceTemplate, useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useAuthStore } from '@/store/auth-store';
import { useTenant } from '@/hooks/use-tenant';
import { resolveUrl, parseNum } from '@/lib/utils';
import { VerifactuQrImage } from '@/components/invoice/VerifactuQrImage';

// ==================== CONSTANTS ====================

// ==================== PAGE ======================================

export default function FacturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const highlightLineId = searchParams.get('highlightLine');

  const [showRectifyDialog, setShowRectifyDialog] = useState(false);
  const [rectifyReason, setRectifyReason] = useState('');
  const [rectificationType, setRectificationType] = useState<RectificationType>(
    RectificationType.SUBSTITUTION
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentTaxRate, setAdjustmentTaxRate] = useState<number>(21);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showConvertToProformaModal, setShowConvertToProformaModal] = useState(false);
  const [showConvertToRecurringModal, setShowConvertToRecurringModal] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingNotesValue, setEditingNotesValue] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const currentTenant = useAuthStore((s) => s.currentTenant);
  const { data: tenantData } = useTenant();

  const { data: invoice, isLoading, error } = useInvoice(id);
  const confirmMutation = useConfirmInvoice();
  const unmarkPaidMutation = useUnmarkInvoiceAsPaid();
  const markSentMutation = useMarkInvoiceAsSent();
  const unmarkSentMutation = useUnmarkInvoiceAsSent();
  const deleteMutation = useDeleteInvoice();
  const rectifyMutation = useRectifyInvoice();
  const convertMutation = useConvertProformaToOfficial();
  const convertToProformaMutation = useConvertDraftToProforma();
  const updateNotesMutation = useUpdateInvoiceNotes();
  const createRecurringMutation = useCreateRecurringInvoice();
  // FIX: useDuplicateInvoice eliminado — duplicar es solo navegar a /nueva?duplicate=ID

  const templateId = invoice?.templateId ?? invoice?.template?.id ?? '';
  const { data: specificTemplate } = useInvoiceTemplate(templateId);
  const { data: defaultTemplate } = useDefaultTemplate();

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
  const handleUnmarkPaid = async () => {
    await unmarkPaidMutation.mutateAsync(id);
  };
  const handleMarkSent = async () => {
    await markSentMutation.mutateAsync(id);
  };
  const handleUnmarkSent = async () => {
    await unmarkSentMutation.mutateAsync(id);
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
        surchargeRate: l.surchargeRate && Number(l.surchargeRate) > 0 ? Number(l.surchargeRate) : undefined,
        hideQty: l.hideQty ?? false,
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
    
    let lines;
    if (rectificationType === RectificationType.SUBSTITUTION) {
      lines = (invoice!.lines ?? []).map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
      }));
    } else {
      // DIFFERENCES: crear línea genérica con el importe de ajuste
      const amount = parseFloat(adjustmentAmount);
      if (isNaN(amount) || amount === 0) return;
      lines = [{
        description: `Ajuste rectificativo - ${rectifyReason}`,
        quantity: 1,
        unitPrice: amount,
        taxRate: adjustmentTaxRate,
      }];
    }
    
    try {
      const rect = await rectifyMutation.mutateAsync({
        id,
        data: {
          rectificationReason: rectifyReason,
          rectificationType,
          lines,
        },
      });
      setShowRectifyDialog(false);
      setAdjustmentAmount('');
      // Redirigir a edición para que el usuario pueda ajustar las líneas
      router.push(`/dashboard/facturas/nueva?edit=${rect.id}`);
    } catch (error) {
      const responseData = (error as { response?: { data?: { existingDraftId?: string } } })?.response?.data;
      if (responseData?.existingDraftId) {
        setShowRectifyDialog(false);
        toast.error('Ya existe un borrador de rectificativa', {
          description: 'Esta factura ya tiene un borrador de factura rectificativa en curso.',
          action: {
            label: 'Ver borrador →',
            onClick: () => router.push(`/dashboard/facturas/nueva?edit=${responseData.existingDraftId}`),
          },
          duration: 8000,
        });
      }
    }
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
  const isPaid = invoice.status === InvoiceStatus.PAID;
  const canRectify = isConfirmed || isSent || isPaid;
  const isProforma = invoice.invoiceType === 'proforma';

  const pdfFileName = [invoice.number, invoice.customer?.name].filter(Boolean).join(' - ');

  const statusCfg = isProforma
    ? INVOICE_STATUS_CONFIG[InvoiceStatus.PROFORMA]
    : (INVOICE_STATUS_CONFIG[invoice.status as InvoiceStatus] ??
      INVOICE_STATUS_CONFIG[InvoiceStatus.DRAFT]);
  const series = invoice.series;

  // When the invoice has no templateId (existing data), fall back to the tenant's default template
  const baseTemplate = specificTemplate ?? defaultTemplate;
  const invoiceLayoutOverride = invoice.layoutOverride;
  const hasAnyOverride = invoiceLayoutOverride?.itemsTable || invoiceLayoutOverride?.footer;
  const template =
    baseTemplate && hasAnyOverride
      ? {
          ...baseTemplate,
          layout: {
            ...baseTemplate.layout,
            ...(invoiceLayoutOverride?.itemsTable
              ? {
                  itemsTable: {
                    ...baseTemplate.layout.itemsTable,
                    ...invoiceLayoutOverride.itemsTable,
                  },
                }
              : {}),
            ...(invoiceLayoutOverride?.footer
              ? {
                  footer: {
                    ...baseTemplate.layout.footer,
                    ...invoiceLayoutOverride.footer,
                  },
                }
              : {}),
          },
        }
      : baseTemplate;

  // In the preview, IRPF is always shown when the invoice has irpfPercent configured —
  // the template's showIrpf only controls the final PDF output.
  const previewTemplate = template
    ? {
        ...template,
        layout: {
          ...template.layout,
          totals: {
            ...template.layout.totals,
            showIrpf: true,
          },
        },
      }
    : null;

  const paymentDetails = invoice.paymentDetails as PaymentDetails | undefined;
  const activePaymentMethod = invoice.paymentMethod ?? null;

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
              Rectificativa {invoice.rectificationType === RectificationType.SUBSTITUTION ? '(Sustitución)' : '(Diferencias)'}
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
              {(!isDraft || isProforma) && (
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
            <InvoiceStatusHero
              invoice={invoice}
              id={id}
              isProforma={isProforma}
              isDraft={isDraft}
              isConfirmed={isConfirmed}
              isSent={isSent}
              isPaid={isPaid}
              pdfFileName={pdfFileName}
              statusCfg={statusCfg}
              series={series}
              confirmPending={confirmMutation.isPending}
              convertPending={convertMutation.isPending}
              convertToProformaPending={convertToProformaMutation.isPending}
              markSentPending={markSentMutation.isPending}
              unmarkSentPending={unmarkSentMutation.isPending}
              unmarkPaidPending={unmarkPaidMutation.isPending}
              onConfirm={handleConfirm}
              onShowConvertModal={() => setShowConvertModal(true)}
              onShowConvertToProformaModal={() => setShowConvertToProformaModal(true)}
              onMarkSent={handleMarkSent}
              onUnmarkSent={handleUnmarkSent}
              onUnmarkPaid={handleUnmarkPaid}
              onShowPaymentDialog={() => setShowPaymentDialog(true)}
              createdByAgency={invoice.createdByAgency}
            />

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

            {/* ZONA A.6 — Información rectificativa */}
            {invoice.isRectificative && invoice.rectificationReason && (
              <div className="rounded-xl border border-rectificativa-200 dark:border-rectificativa-800 bg-rectificativa-50 dark:bg-rectificativa-950/30 px-4 py-3">
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="h-4 w-4 text-rectificativa-600 dark:text-rectificativa-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rectificativa-700 dark:text-rectificativa-300 leading-tight">
                      Factura rectificativa por {invoice.rectificationType === RectificationType.SUBSTITUTION ? 'sustitución' : 'diferencias'}
                    </p>
                    <p className="text-xs text-rectificativa-600 dark:text-rectificativa-400 mt-1">
                      <span className="font-medium">Motivo:</span> {invoice.rectificationReason}
                    </p>
                    {invoice.rectifiedInvoiceId && (
                      <p className="text-xs text-rectificativa-600 dark:text-rectificativa-400 mt-0.5">
                        <span className="font-medium">Rectifica a:</span>{' '}
                        <Link
                          href={`/dashboard/facturas/${invoice.rectifiedInvoiceId}`}
                          className="underline hover:text-rectificativa-700 dark:hover:text-rectificativa-300"
                        >
                          Ver factura original →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ZONA A.7 — Facturas rectificativas emitidas */}
            {invoice.status === InvoiceStatus.RECTIFIED && invoice.rectificativeInvoices && invoice.rectificativeInvoices.length > 0 && (
              <div className="rounded-xl border border-rectificativa-200 dark:border-rectificativa-800 bg-rectificativa-50 dark:bg-rectificativa-950/30 px-4 py-3">
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="h-4 w-4 text-rectificativa-600 dark:text-rectificativa-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rectificativa-700 dark:text-rectificativa-300 leading-tight">
                      Factura{invoice.rectificativeInvoices.length > 1 ? 's' : ''} rectificativa{invoice.rectificativeInvoices.length > 1 ? 's' : ''} emitida{invoice.rectificativeInvoices.length > 1 ? 's' : ''}
                    </p>
                    <div className="mt-2 space-y-1">
                      {invoice.rectificativeInvoices.map((rect) => (
                        <Link
                          key={rect.id}
                          href={`/dashboard/facturas/${rect.id}`}
                          className="block text-xs text-rectificativa-600 dark:text-rectificativa-400 hover:text-rectificativa-700 dark:hover:text-rectificativa-300 underline"
                        >
                          {rect.number ?? 'Borrador'} — {new Date(rect.issueDate).toLocaleDateString('es-ES')} — {rect.rectificationType === RectificationType.SUBSTITUTION ? 'Sustitución' : 'Diferencias'}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ZONA B — Cliente */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Building2}>Cliente</SectionLabel>
              {(() => {
                // Prefer immutable snapshot fields; fall back to live customer relation
                const hasSnapshot = invoice.customerSnapshotNif != null;
                const cName = hasSnapshot ? invoice.customerSnapshotName : invoice.customer?.name;
                const cNif = hasSnapshot ? invoice.customerSnapshotNif : invoice.customer?.nif;
                const cAddress = hasSnapshot
                  ? invoice.customerSnapshotAddress
                  : invoice.customer?.address;
                const cPostalCode = hasSnapshot
                  ? invoice.customerSnapshotPostalCode
                  : invoice.customer?.postalCode;
                const cCity = hasSnapshot ? invoice.customerSnapshotCity : invoice.customer?.city;
                const cProvince = hasSnapshot
                  ? invoice.customerSnapshotProvince
                  : invoice.customer?.province;
                const cEmail = hasSnapshot
                  ? invoice.customerSnapshotEmail
                  : invoice.customer?.email;
                return (
                  <>
                    <p className="font-semibold text-base leading-tight">{cName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{cNif}</p>
                    {cAddress && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {cAddress}
                        {cPostalCode && `, ${cPostalCode}`}
                        {cCity && ` ${cCity}`}
                        {cProvince && ` (${cProvince})`}
                      </p>
                    )}
                    {cEmail && <p className="text-sm text-muted-foreground">{cEmail}</p>}
                  </>
                );
              })()}
            </div>

            {/* ZONA C — Líneas + totales */}
            <InvoiceLinesCard invoice={invoice} template={template} highlightLineId={highlightLineId ?? undefined} />

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
            <InvoiceNotesCard
              notes={invoice.notes}
              isEditing={isEditingNotes}
              editingValue={editingNotesValue}
              isPending={updateNotesMutation.isPending}
              onEditStart={handleStartEditNotes}
              onEditCancel={handleCancelEditNotes}
              onEditChange={setEditingNotesValue}
              onSave={handleSaveNotes}
            />

            {/* VeriFactu */}
            {invoice.verifactuQr && (
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel>Verificación</SectionLabel>
                <div className="flex items-start gap-4 mt-2">
                  <a
                    href={invoice.verifactuQr}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Escanea para verificar esta factura"
                  >
                    <VerifactuQrImage value={invoice.verifactuQr} size={96} />
                  </a>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                      Escanea el código QR para verificar la autenticidad de esta factura.
                    </p>
                    <a
                      href={invoice.verifactuQr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      Abrir enlace de verificación →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          <LiveInvoicePreview
            invoice={invoice}
            template={previewTemplate}
            tenant={(() => {
              const src = tenantData ?? currentTenant;
              return src ? ({ ...src, logoUrl: resolveUrl(src.logoUrl) ?? null } as Tenant) : null;
            })()}
            activeFieldSection={null}
            onSectionClick={() => {}}
            paymentDetails={paymentDetails}
            invoiceType={(invoice as any).invoiceType ?? null}
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
        customerName={invoice.customer?.name ?? '—'}
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
              Se creará una nueva factura rectificativa basada en esta. Indica el tipo y el motivo de
              la rectificación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de rectificación</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRectificationType(RectificationType.SUBSTITUTION)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    rectificationType === RectificationType.SUBSTITUTION
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">Sustitución</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reemplaza la factura original con los importes corregidos
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRectificationType(RectificationType.DIFFERENCES)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    rectificationType === RectificationType.DIFFERENCES
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">Diferencias</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo refleja el ajuste (positivo o negativo) respecto a la original
                  </p>
                </button>
              </div>
            </div>
            {rectificationType === RectificationType.SUBSTITUTION && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Sustitución:</span> Se copiarán las líneas de la factura original. 
                  Podrás modificarlas para reflejar los importes finales corregidos.
                </p>
              </div>
            )}
            {rectificationType === RectificationType.DIFFERENCES && (
              <div className="space-y-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-medium">Diferencias:</span> Indica el importe del ajuste (positivo o negativo). 
                  Se creará una línea con este importe que podrás editar después.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Importe del ajuste (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Ej: -150.00 o 50.00"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      IVA (%)
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={adjustmentTaxRate}
                      onChange={(e) => setAdjustmentTaxRate(Number(e.target.value))}
                    >
                      <option value={0}>0%</option>
                      <option value={4}>4%</option>
                      <option value={10}>10%</option>
                      <option value={21}>21%</option>
                    </select>
                  </div>
                </div>
                {adjustmentAmount && parseFloat(adjustmentAmount) === 0 && (
                  <p className="text-xs text-destructive">
                    El importe del ajuste no puede ser 0€
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo de la rectificación</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Motivo de la rectificación (mínimo 5 caracteres)..."
                value={rectifyReason}
                onChange={(e) => setRectifyReason(e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                {rectifyReason.length > 0 && rectifyReason.length < 5 && (
                  <p className="text-xs text-destructive">
                    El motivo debe tener al menos 5 caracteres
                  </p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {rectifyReason.length}/500
                </p>
              </div>
            </div>
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">Nota:</span> Se creará un borrador de factura rectificativa. 
                La factura original permanecerá intacta hasta que confirmes la rectificativa. 
                Si eliminas el borrador, la original no se verá afectada.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRectifyReason('');
                setRectificationType(RectificationType.SUBSTITUTION);
                setAdjustmentAmount('');
                setAdjustmentTaxRate(21);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRectify}
              disabled={
                rectifyReason.trim().length < 5 ||
                rectifyMutation.isPending ||
                (rectificationType === RectificationType.DIFFERENCES &&
                  (!adjustmentAmount || parseFloat(adjustmentAmount) === 0))
              }
            >
              {rectifyMutation.isPending ? 'Creando...' : 'Crear rectificativa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RegisterPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoiceId={invoice.id}
        invoiceTotal={parseNum(invoice.total)}
        amountPaid={parseNum(invoice.amountPaid)}
        defaultPaymentMethod={invoice.paymentMethod as PaymentMethod | null}
        invoiceNumber={invoice.number}
        customerName={invoice.customer?.name}
      />
    </div>
  );
}
