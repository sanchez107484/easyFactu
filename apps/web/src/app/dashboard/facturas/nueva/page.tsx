'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Save,
  CheckCircle,
  Copy,
  Pencil,
  ChevronDown,
  FileText,
  FileCheck,
  FileClock,
  LayoutTemplate,
  RefreshCw,
} from 'lucide-react';
import { InvoiceLineItem } from '@/components/facturas/InvoiceLineItem';
import { extendedLineSchema, EMPTY_LINE, ExtendedLineData } from '@/lib/invoice-line-types';
import {
  useCreateInvoice,
  useUpdateInvoice,
  useConfirmInvoice,
  useInvoice,
} from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import { useTenant } from '@/hooks/use-tenant';
import { useInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useAuthStore } from '@/store/auth-store';
import {
  PaymentMethod,
  Customer,
  InvoiceTemplate,
  SeriesType,
  Tenant,
  InvoiceDefaults,
  Frequency,
} from '@easyfactura/shared-types';
import { cn, resolveUrl } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS, FREQUENCY_OPTIONS } from '@easyfactura/shared-constants';
import { buildPreviewInvoice, buildCreateInput, calculateDueDate } from '@/lib/invoice-helpers';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import { InvoiceTypeModal, InvoiceTypeOption } from '@/components/facturas/InvoiceTypeModal';
import {
  ConfirmInvoiceDialog,
  type RecurringConfig,
} from '@/components/facturas/ConfirmInvoiceDialog';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { QuickCreateCustomerModal } from '@/components/clientes/QuickCreateCustomerModal';
import { DueDatePicker } from '@/components/facturas/DueDatePicker';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import {
  PaymentDetailsFields,
  PaymentDetailsValues,
} from '@/components/facturas/PaymentDetailsFields';
import { SaveAsDefaultBanner } from '@/components/facturas/SaveAsDefaultBanner';
import { Switch } from '@/components/ui/switch';
import { useInvoiceFormKeyDown } from '@/hooks/use-invoice-form-key-down';

// ==================== CONSTANTS ====================

const INVOICE_TYPE_CONFIG: Record<
  Exclude<InvoiceTypeOption, 'template'>,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    hoverBorder: string;
    icon: React.ReactNode;
  }
> = {
  standard: {
    label: 'Factura ordinaria',
    description: 'Oficial con número fiscal',
    color: 'text-invoice-700 dark:text-invoice-400',
    bg: 'bg-invoice-50 dark:bg-invoice-950/40',
    border: 'border-invoice-200 dark:border-invoice-700',
    hoverBorder: 'hover:border-invoice-400 dark:hover:border-invoice-500',
    icon: <FileCheck className="h-4 w-4" />,
  },
  proforma: {
    label: 'Factura proforma',
    description: 'Sin número hasta su conversión',
    color: 'text-proforma-700 dark:text-proforma-400',
    bg: 'bg-proforma-50 dark:bg-proforma-950/40',
    border: 'border-proforma-200 dark:border-proforma-700',
    hoverBorder: 'hover:border-proforma-400 dark:hover:border-proforma-500',
    icon: <FileClock className="h-4 w-4" />,
  },
  simplified: {
    label: 'Factura simplificada',
    description: 'Para operaciones de menor importe',
    color: 'text-invoice-700 dark:text-invoice-400',
    bg: 'bg-invoice-50 dark:bg-invoice-950/40',
    border: 'border-invoice-200 dark:border-invoice-700',
    hoverBorder: 'hover:border-invoice-400 dark:hover:border-invoice-500',
    icon: <FileText className="h-4 w-4" />,
  },
};

// ==================== SCHEMA ====================

const paymentDetailsSchema = z
  .object({
    iban: z.string().optional(),
    bic: z.string().optional(),
    accountHolder: z.string().optional(),
    bizumPhone: z.string().optional(),
    paypalEmail: z.string().optional(),
    paymentNote: z.string().max(300, 'Máximo 300 caracteres').optional(),
  })
  .optional();

const formSchema = z.object({
  customerId: z.string().min(1, 'Selecciona un cliente'),
  issueDate: z.string().min(1, 'La fecha es obligatoria'),
  dueDate: z.string().optional(),
  seriesId: z.string().optional().default(''),
  discountPercent: z.number().min(0).max(100).optional(),
  irpfPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z
    .nativeEnum(PaymentMethod, { invalid_type_error: 'Método de pago no válido' })
    .optional()
    .refine((v): boolean => v !== undefined, { message: 'El método de pago es obligatorio' }),
  paymentDetails: paymentDetailsSchema,
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  lines: z.array(extendedLineSchema).min(1, 'Añade al menos una línea').max(50),
});

type FormData = z.infer<typeof formSchema>;

// ==================== INVOICE TYPE BADGE ====================

interface InvoiceTypeBadgeProps {
  invoiceType: InvoiceTypeOption;
  selectedTemplate: InvoiceTemplate | null;
  onClick: () => void;
}

function InvoiceTypeBadge({ invoiceType, selectedTemplate, onClick }: InvoiceTypeBadgeProps) {
  const isTemplate = invoiceType === 'template';
  const config = isTemplate
    ? null
    : INVOICE_TYPE_CONFIG[invoiceType as Exclude<InvoiceTypeOption, 'template'>];

  const colorClass = isTemplate ? 'text-purple-700 dark:text-purple-400' : config!.color;
  const bgClass = isTemplate ? 'bg-purple-50 dark:bg-purple-950/40' : config!.bg;
  const borderClass = isTemplate
    ? 'border-purple-200 dark:border-purple-700 hover:border-purple-400'
    : `${config!.border} ${config!.hoverBorder}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group flex items-center gap-2.5 rounded-lg border px-3 py-1.5
        transition-all duration-150 hover:shadow-sm active:scale-[0.98] cursor-pointer
        ${colorClass} ${bgClass} ${borderClass}
      `}
    >
      <span className="shrink-0">
        {isTemplate ? <LayoutTemplate className="h-4 w-4" /> : config!.icon}
      </span>
      <div className="text-left min-w-0">
        <div className="text-xs font-semibold leading-tight whitespace-nowrap">
          {isTemplate && selectedTemplate ? `Plantilla: ${selectedTemplate.name}` : config?.label}
        </div>
        <div className="text-[10px] opacity-60 leading-tight hidden sm:block whitespace-nowrap">
          {isTemplate ? 'Plantilla personalizada' : config?.description}
        </div>
      </div>
      <ChevronDown className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity shrink-0 ml-0.5" />
    </button>
  );
}

// ==================== INNER FORM COMPONENT ====================

interface InvoiceFormProps {
  defaultValues: FormData;
  isDuplicate: boolean;
  sourceNumber?: string;
  editDraftId?: string;
  initialInvoiceType?: InvoiceTypeOption;
  invoiceDefaults?: InvoiceDefaults | null;
  /** Abre el modal de selección de tipo al montar (cuando la URL no trae ?tipo=) */
  showTypeModalOnMount?: boolean;
}

function InvoiceForm({
  defaultValues,
  isDuplicate,
  sourceNumber,
  editDraftId,
  initialInvoiceType,
  invoiceDefaults,
  showTypeModalOnMount = false,
}: InvoiceFormProps) {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const currentYear = new Date().getFullYear();

  const [invoiceType, setInvoiceType] = useState<InvoiceTypeOption>(
    initialInvoiceType ?? 'standard',
  );
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(showTypeModalOnMount);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(editDraftId ?? null);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [simplifyTable, setSimplifyTable] = useState(false);

  // ── Recurring option (subtle toggle) ──
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<Frequency>(Frequency.MONTHLY);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(1);
  const [recurringStartDate, setRecurringStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]!,
  );
  const [recurringHasEndDate, setRecurringHasEndDate] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');
  const [recurringAutoConfirm, setRecurringAutoConfirm] = useState(false);

  const isProforma = invoiceType === 'proforma';

  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const { data: defaultTemplate } = useDefaultTemplate();
  const { data: tenantData } = useTenant();
  const { data: seriesData } = useInvoiceSeries(currentYear);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const confirmMutation = useConfirmInvoice();
  const createRecurringMutation = useCreateRecurringInvoice();

  const customers: Customer[] = customersData?.data ?? [];
  const effectiveTemplate: InvoiceTemplate | null = selectedTemplate ?? defaultTemplate ?? null;

  const availableSeries = useMemo(
    () => (isProforma ? [] : (seriesData?.data ?? []).filter((s) => s.type === SeriesType.INVOICE)),
    [isProforma, seriesData],
  );

  // Serie por defecto: la marcada como default o la primera. Fallback sin efectos ni refs.
  const defaultSeriesId = useMemo(
    () => (availableSeries.find((s) => s.isDefault) ?? availableSeries[0])?.id ?? '',
    [availableSeries],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);

  const handleAddLine = () => {
    append({ ...EMPTY_LINE });
    setLastAddedIndex(fields.length);
  };

  const handleDuplicateLine = (index: number) => {
    const line = form.getValues(`lines.${index}`);
    append({ ...line });
    setLastAddedIndex(fields.length);
  };

  const watchedValues = form.watch();

  // El seriesId efectivo: lo que haya seleccionado el usuario, o el por defecto
  const effectiveSeriesId = watchedValues.seriesId || defaultSeriesId;
  const selectedSeries = availableSeries.find((s) => s.id === effectiveSeriesId) ?? null;
  const previewInvoice = buildPreviewInvoice(watchedValues, customers, selectedSeries);
  const selectedCustomer = customers.find((c) => c.id === watchedValues.customerId);
  const activePaymentMethod = watchedValues.paymentMethod as PaymentMethod | undefined;

  // ── Simplify-table toggle ──────────────────────────────────────────────────
  const linesData = watchedValues.lines ?? [];
  const allLinesSameTax =
    linesData.length > 0 && linesData.every((l) => l.taxRate === linesData[0].taxRate);
  const showSimplifyToggle = linesData.length === 1 || (linesData.length > 1 && allLinesSameTax);

  // Reset when toggle becomes irrelevant (e.g. user adds line with different VAT)
  useEffect(() => {
    if (!showSimplifyToggle) setSimplifyTable(false);
  }, [showSimplifyToggle]);

  const previewTemplate: typeof effectiveTemplate = effectiveTemplate
    ? {
        ...effectiveTemplate,
        layout: {
          ...effectiveTemplate.layout,
          itemsTable: {
            ...effectiveTemplate.layout.itemsTable,
            showUnitPrice: simplifyTable
              ? false
              : (effectiveTemplate.layout.itemsTable.showUnitPrice ?? true),
            showTaxColumn: simplifyTable
              ? false
              : (effectiveTemplate.layout.itemsTable.showTaxColumn ?? true),
            showLineTotal: simplifyTable
              ? false
              : (effectiveTemplate.layout.itemsTable.showLineTotal ?? true),
          },
        },
      }
    : null;

  // ==================== HANDLERS ====================

  const handleTypeSelect = useCallback((type: InvoiceTypeOption, template?: InvoiceTemplate) => {
    setInvoiceType(type);
    setSelectedTemplate(type === 'template' && template ? template : null);
    setShowTypeModal(false);
  }, []);

  const handlePreviewSectionClick = useCallback((fieldId: string) => {
    setActiveSection(fieldId);
    const el = document.getElementById(`field-${fieldId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleFormKeyDown = useInvoiceFormKeyDown();

  const triggerSubmit = () => {
    const submitBtn = document.getElementById('form-submit-trigger');
    if (submitBtn) {
      (submitBtn as HTMLButtonElement).click();
    } else {
      form.handleSubmit(handleSaveDraft, onInvalid)();
    }
  };

  const onInvalid = (errors: any) => {
    const missingFields: string[] = [];
    if (errors.customerId) missingFields.push('Cliente');
    if (errors.paymentMethod) missingFields.push('Método de pago');
    if (errors.issueDate) missingFields.push('Fecha');
    if (errors.lines) missingFields.push('Líneas de factura');
    toast.error(
      missingFields.length > 0
        ? `Faltan campos: ${missingFields.join(', ')}`
        : 'Revisa los campos obligatorios marcados en rojo',
    );
  };

  const handleSaveDraft = async (data: FormData) => {
    try {
      const layoutOverride = simplifyTable
        ? { itemsTable: { showUnitPrice: false, showTaxColumn: false, showLineTotal: false } }
        : undefined;
      const input = buildCreateInput({
        ...data,
        seriesId: data.seriesId || defaultSeriesId,
        invoiceType: invoiceType ?? 'standard',
        templateId: defaultTemplate?.id,
        layoutOverride,
      });
      if (editDraftId) {
        await updateMutation.mutateAsync({ id: editDraftId, data: input });
        await createRecurringFromForm(data);
        router.push(`/dashboard/facturas/${editDraftId}`);
      } else {
        const invoice = await createMutation.mutateAsync(input);
        await createRecurringFromForm(data);
        router.push(`/dashboard/facturas/${invoice.id}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Rellena todos los campos obligatorios antes de confirmar.');
      return;
    }
    if (!isProforma && !effectiveSeriesId) {
      toast.error('Selecciona una serie de facturación.');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmDialogConfirm = async () => {
    const data = form.getValues();
    const resolvedData = { ...data, seriesId: data.seriesId || defaultSeriesId };

    if (isProforma) {
      try {
        const layoutOverride = simplifyTable
          ? { itemsTable: { showUnitPrice: false, showTaxColumn: false, showLineTotal: false } }
          : undefined;
        const input = buildCreateInput({
          ...resolvedData,
          invoiceType: 'proforma',
          templateId: defaultTemplate?.id,
          layoutOverride,
        });
        if (editDraftId) {
          await updateMutation.mutateAsync({ id: editDraftId, data: input });
          setShowConfirmDialog(false);
          router.push(`/dashboard/facturas/${editDraftId}`);
        } else {
          const draft = await createMutation.mutateAsync(input);
          setShowConfirmDialog(false);
          router.push(`/dashboard/facturas/${draft.id}`);
        }
      } catch (error) {
        console.error(error);
      }
      return;
    }

    let draftId = pendingDraftId;
    try {
      const layoutOverride = simplifyTable
        ? { itemsTable: { showUnitPrice: false, showTaxColumn: false, showLineTotal: false } }
        : undefined;
      const input = buildCreateInput({
        ...resolvedData,
        invoiceType: invoiceType ?? 'standard',
        templateId: defaultTemplate?.id,
        layoutOverride,
      });
      if (editDraftId) {
        await updateMutation.mutateAsync({ id: editDraftId, data: input });
        await confirmMutation.mutateAsync(editDraftId);
        await createRecurringFromForm(resolvedData);
        setShowConfirmDialog(false);
        router.push(`/dashboard/facturas/${editDraftId}`);
      } else {
        if (!draftId) {
          const draft = await createMutation.mutateAsync(input);
          draftId = draft.id;
          setPendingDraftId(draftId);
        }
        if (draftId) {
          await confirmMutation.mutateAsync(draftId);
          await createRecurringFromForm(resolvedData);
          setShowConfirmDialog(false);
          router.push(`/dashboard/facturas/${draftId}`);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || confirmMutation.isPending;

  // Creates the recurring template from the current form state (no-op if isRecurring is false)
  const createRecurringFromForm = async (data: FormData) => {
    if (!isRecurring) return;
    await createRecurringMutation.mutateAsync({
      customerId: data.customerId,
      frequency: recurringFrequency,
      dayOfMonth: recurringDayOfMonth,
      startDate: recurringStartDate,
      endDate: recurringHasEndDate && recurringEndDate ? recurringEndDate : undefined,
      autoConfirm: recurringAutoConfirm,
      lines: data.lines.map((l) => ({
        description: l.description,
        quantity: l._hideQty ? 1 : l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        hideQty: l._hideQty ?? false,
      })),
      paymentMethod: data.paymentMethod,
      discountPercent: data.discountPercent,
      irpfPercent: data.irpfPercent,
      notes: data.notes,
    });
  };

  const source = tenantData ?? currentTenant;
  const previewTenant: Tenant | null = source
    ? ({ ...source, logoUrl: resolveUrl(source.logoUrl) ?? null } as Tenant)
    : null;

  // ==================== RENDER ====================

  return (
    <>
      <InvoiceTypeModal
        open={showTypeModal}
        onSelect={handleTypeSelect}
        onClose={() => setShowTypeModal(false)}
      />

      <QuickCreateCustomerModal
        open={showQuickClient}
        onClose={() => setShowQuickClient(false)}
        onCustomerReady={(customer) => {
          form.setValue('customerId', customer.id, { shouldValidate: true });
          setShowQuickClient(false);
        }}
      />

      <ConfirmInvoiceDialog
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmDialogConfirm}
        isPending={isSubmitting}
        invoiceType={invoiceType}
        summary={{
          customerName: selectedCustomer?.name ?? '---',
          total: previewInvoice.total,
        }}
        recurringConfig={
          !isProforma
            ? ({
                isRecurring,
                onToggle: setIsRecurring,
                frequency: recurringFrequency,
                onFrequencyChange: setRecurringFrequency,
                dayOfMonth: recurringDayOfMonth,
                onDayOfMonthChange: setRecurringDayOfMonth,
                startDate: recurringStartDate,
                onStartDateChange: setRecurringStartDate,
                hasEndDate: recurringHasEndDate,
                onHasEndDateChange: setRecurringHasEndDate,
                endDate: recurringEndDate,
                onEndDateChange: setRecurringEndDate,
                autoConfirm: recurringAutoConfirm,
                onAutoConfirmChange: setRecurringAutoConfirm,
              } satisfies RecurringConfig)
            : undefined
        }
      />

      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/facturas">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                {editDraftId
                  ? isProforma
                    ? 'Editar proforma'
                    : 'Editar borrador'
                  : 'Nueva factura'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {editDraftId
                  ? 'Modifica y guarda o confirma como definitiva.'
                  : 'Guardada como borrador hasta que la confirmes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de tipo — llamativo y clicable */}
            <InvoiceTypeBadge
              invoiceType={invoiceType}
              selectedTemplate={selectedTemplate}
              onClick={() => setShowTypeModal(true)}
            />

            {/* Repetir toggle — sólo en facturas no proforma */}
            {!isProforma && (
              <button
                type="button"
                onClick={() => setIsRecurring((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  isRecurring
                    ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
                    : 'border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground',
                )}
              >
                <RefreshCw className="h-3 w-3" />
                {isRecurring
                  ? (FREQUENCY_OPTIONS.find((o) => o.value === recurringFrequency)?.label ??
                    'Recurrente')
                  : 'Repetir'}
              </button>
            )}

            <div className="w-px h-6 bg-border mx-1 shrink-0" />

            <Button variant="outline" size="sm" onClick={triggerSubmit} disabled={isSubmitting}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : 'Guardar borrador'}
            </Button>
            <Button size="sm" onClick={handleConfirmClick} disabled={isSubmitting}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              {isProforma ? 'Guardar proforma' : 'Confirmar factura'}
            </Button>
          </div>
        </div>

        {/* ── Split panel ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT -- Form (60%) */}
          <div className="w-[60%] overflow-y-auto px-6 py-5 space-y-5 border-r">
            {isDuplicate && sourceNumber && (
              <div className="flex items-start gap-3 rounded-lg border border-invoice-200 bg-invoice-50 dark:border-invoice-800 dark:bg-invoice-950/40 px-4 py-3">
                <Copy className="h-4 w-4 text-invoice-600 dark:text-invoice-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-invoice-700 dark:text-invoice-300">
                    Duplicando factura {sourceNumber}
                  </p>
                  <p className="text-xs text-invoice-600/80 dark:text-invoice-400/80 mt-0.5">
                    Los datos se han copiado de la factura original. La fecha de emisión se ha
                    actualizado a hoy. Revisa y confirma antes de guardar.
                  </p>
                </div>
              </div>
            )}
            {editDraftId && (
              <div className="flex items-start gap-3 rounded-lg border border-proforma-200 bg-proforma-50 dark:border-proforma-800 dark:bg-proforma-950/40 px-4 py-3">
                <Pencil className="h-4 w-4 text-proforma-600 dark:text-proforma-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-proforma-700 dark:text-proforma-300">
                    {isProforma ? 'Editando factura proforma' : 'Editando borrador'}
                  </p>
                  <p className="text-xs text-proforma-600/80 dark:text-proforma-400/80 mt-0.5">
                    {isProforma
                      ? 'Los cambios se guardarán sobre esta proforma. Cuando el cliente acepte, conviértela a factura oficial.'
                      : 'Los cambios se guardarán sobre este borrador. Puedes confirmarlo cuando esté listo.'}
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(handleSaveDraft, onInvalid)}
              onKeyDown={handleFormKeyDown}
              noValidate
              className="space-y-5"
            >
              <button type="submit" id="form-submit-trigger" className="hidden" />

              {/* ── Datos generales ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Datos generales</CardTitle>
                  {!invoiceDefaults && !isDuplicate && !editDraftId && (
                    <p className="text-xs text-muted-foreground">
                      ¿Siempre usas los mismos datos?{' '}
                      <Link
                        href="/dashboard/ajustes/facturacion"
                        className="text-primary underline underline-offset-2"
                      >
                        Configura tus preferencias
                      </Link>{' '}
                      para ahorrar tiempo.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cliente */}
                  <section
                    id="field-customerId"
                    className="space-y-2"
                    onFocus={() => setActiveSection('customerId')}
                  >
                    <Label>
                      Cliente <span className="text-destructive">*</span>
                    </Label>
                    {loadingCustomers ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={watchedValues.customerId || ''}
                        onValueChange={(v) =>
                          form.setValue('customerId', v, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              No tienes clientes activos. Crea uno primero.
                            </div>
                          )}
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {c.nif}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {form.formState.errors.customerId && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.customerId.message}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowQuickClient(true)}
                      className="text-sm text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                      + Crear nuevo cliente
                    </button>
                  </section>

                  {/* Fechas */}
                  <section
                    id="field-issueDate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onFocus={() => setActiveSection('issueDate')}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">
                        Fecha emisión <span className="text-destructive">*</span>
                      </Label>
                      <Input id="issueDate" type="date" {...form.register('issueDate')} />
                      {form.formState.errors.issueDate && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.issueDate.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha vencimiento</Label>
                      <DueDatePicker
                        issueDate={watchedValues.issueDate}
                        value={watchedValues.dueDate}
                        onChange={(date) => form.setValue('dueDate', date, { shouldDirty: true })}
                      />
                    </div>
                  </section>

                  {/* Serie de facturación */}
                  {!isProforma && (
                    <section
                      id="field-seriesId"
                      className="space-y-2"
                      onFocus={() => setActiveSection('seriesId')}
                    >
                      <Label>
                        Serie de facturación <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={effectiveSeriesId}
                        onValueChange={(v) => form.setValue('seriesId', v, { shouldDirty: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una serie" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSeries.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                              {' — '}
                              <span className="font-mono text-xs">
                                {formatSeriesPreview(s.prefix, s.year, s.nextNumber)}
                              </span>
                              {s.isDefault && (
                                <span className="ml-1 text-[10px] text-primary">(por defecto)</span>
                              )}
                            </SelectItem>
                          ))}
                          {availableSeries.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              No hay series activas.{' '}
                              <Link
                                href="/dashboard/ajustes/facturacion"
                                className="underline text-primary"
                              >
                                Crea una en ajustes
                              </Link>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </section>
                  )}

                  {/* Método de pago */}
                  <section
                    id="field-paymentMethod"
                    className="space-y-3"
                    onFocus={() => setActiveSection('paymentMethod')}
                  >
                    <Label>
                      Método de pago <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={activePaymentMethod || ''}
                      onValueChange={(v) => {
                        form.setValue('paymentMethod', v as PaymentMethod, {
                          shouldValidate: true,
                        });
                        if (v !== defaultValues.paymentMethod) {
                          form.setValue('paymentDetails', {});
                        }
                        if (v === PaymentMethod.BANK_TRANSFER) {
                          const tenant = tenantData ?? currentTenant;
                          if (tenant?.iban && !form.getValues('paymentDetails.iban')) {
                            form.setValue('paymentDetails.iban', tenant.iban, {
                              shouldDirty: true,
                            });
                          }
                          if (
                            tenant?.bankAccountHolder &&
                            !form.getValues('paymentDetails.accountHolder')
                          ) {
                            form.setValue(
                              'paymentDetails.accountHolder',
                              tenant.bankAccountHolder,
                              { shouldDirty: true },
                            );
                          }
                        }
                      }}
                    >
                      <SelectTrigger
                        className={form.formState.errors.paymentMethod ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.paymentMethod.message}
                      </p>
                    )}
                    {activePaymentMethod && (
                      <PaymentDetailsFields
                        paymentMethod={activePaymentMethod}
                        values={(watchedValues.paymentDetails ?? {}) as PaymentDetailsValues}
                        onChange={(key, value) =>
                          form.setValue(
                            `paymentDetails.${key}` as `paymentDetails.${keyof PaymentDetailsValues}`,
                            value,
                            { shouldDirty: true },
                          )
                        }
                        tenantIban={(tenantData ?? currentTenant)?.iban ?? undefined}
                        tenantAccountHolder={
                          (tenantData ?? currentTenant)?.bankAccountHolder ?? undefined
                        }
                      />
                    )}
                  </section>
                </CardContent>
              </Card>

              {/* ── Banner: guardar como predeterminado ── */}
              <SaveAsDefaultBanner
                watchedValues={watchedValues}
                currentDefaults={invoiceDefaults}
                isDuplicate={isDuplicate}
                editDraftId={editDraftId}
              />

              {/* ── Líneas de factura ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Líneas de factura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div id="field-lines-section" className="space-y-3">
                    {form.formState.errors.lines?.root && (
                      <p className="text-sm text-destructive mb-2">
                        {form.formState.errors.lines.root.message}
                      </p>
                    )}
                    {fields.map((field, index) => (
                      <InvoiceLineItem
                        key={field.id}
                        form={form}
                        index={index}
                        totalLines={fields.length}
                        onRemove={() => remove(index)}
                        onDuplicate={() => handleDuplicateLine(index)}
                        onMoveUp={() => swap(index, index - 1)}
                        onMoveDown={() => swap(index, index + 1)}
                        onFocus={() => setActiveSection('lines-section')}
                        autoFocusDescription={index === lastAddedIndex}
                      />
                    ))}
                  </div>
                  {/* ── Add line button — at the bottom for easy access ── */}
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-[0.99]"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir línea
                  </button>

                  {/* ── Simplify toggle ── */}
                  {showSimplifyToggle && (
                    <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-3 py-2.5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium leading-tight">
                          Simplificar tabla en la factura
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Oculta precio unitario, % IVA y total por línea (el desglose de totales
                          siempre aparece)
                        </p>
                      </div>
                      <Switch
                        checked={simplifyTable}
                        onCheckedChange={setSimplifyTable}
                        aria-label="Simplificar tabla de líneas"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Descuentos y retenciones ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Descuentos y retenciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <section
                    id="field-discountPercent"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onFocus={() => setActiveSection('discountPercent')}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="discountPercent">Descuento global (%)</Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...form.register('discountPercent', {
                          setValueAs: (v) => (v === '' ? undefined : Number(v)),
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="irpfPercent">Retención IRPF (%)</Label>
                      <Input
                        id="irpfPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0 (15% general)"
                        {...form.register('irpfPercent', {
                          setValueAs: (v) => (v === '' ? undefined : Number(v)),
                        })}
                      />
                    </div>
                  </section>
                </CardContent>
              </Card>

              {/* ── Notas ── */}
              <Card className="mb-5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <section id="field-notes" onFocus={() => setActiveSection('notes')}>
                    <Textarea
                      {...form.register('notes')}
                      placeholder="Información adicional para el cliente..."
                      rows={3}
                    />
                  </section>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* RIGHT -- Live preview (40%) */}
          <div className="w-[40%] flex flex-col overflow-hidden">
            <LiveInvoicePreview
              invoice={previewInvoice}
              template={previewTemplate}
              tenant={previewTenant}
              activeFieldSection={activeSection}
              onSectionClick={handlePreviewSectionClick}
              paymentDetails={watchedValues.paymentDetails as PaymentDetails | undefined}
              invoiceType={invoiceType}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== PAGE (shell) ====================

const VALID_INVOICE_TYPES: InvoiceTypeOption[] = ['standard', 'proforma', 'simplified'];

export default function NuevaFacturaPage() {
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const editId = searchParams.get('edit');
  const tipoParam = searchParams.get('tipo');

  // Si hay ?tipo= válido lo usamos directamente
  const initialTypeFromParam = VALID_INVOICE_TYPES.includes(tipoParam as InvoiceTypeOption)
    ? (tipoParam as InvoiceTypeOption)
    : undefined;

  // Sin ?tipo=, sin edición ni duplicado → abrir modal de selección al montar
  const showTypeModalOnMount = !initialTypeFromParam && !editId && !duplicateId;

  const sourceId = duplicateId ?? editId;

  const { data: sourceInvoice, isLoading: loadingSource } = useInvoice(sourceId ?? '', {
    enabled: !!sourceId,
  });

  const { data: invoiceDefaults, isLoading: loadingDefaults } = useInvoiceDefaults();

  if ((sourceId && loadingSource) || loadingDefaults) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center flex-col gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <p className="text-muted-foreground animate-pulse">Cargando datos de la factura...</p>
      </div>
    );
  }

  const defaultValues: FormData = sourceInvoice
    ? {
        customerId: sourceInvoice.customerId ?? '',
        issueDate: editId
          ? (sourceInvoice.issueDate?.split('T')[0] ?? new Date().toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        dueDate: editId ? (sourceInvoice.dueDate?.split('T')[0] ?? undefined) : undefined,
        seriesId: editId ? (sourceInvoice.seriesId ?? '') : '',
        discountPercent: sourceInvoice.discountPercent
          ? Number(sourceInvoice.discountPercent)
          : undefined,
        irpfPercent: sourceInvoice.irpfPercent ? Number(sourceInvoice.irpfPercent) : undefined,
        paymentMethod: (sourceInvoice.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails: (sourceInvoice as any).paymentDetails ?? {},
        notes: sourceInvoice.notes || undefined,
        lines: (sourceInvoice.lines ?? []).map((l) => ({
          description: l.description ?? '',
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
          productId: l.productId ?? undefined,
          _mode: (l.hideQty && !l.productId ? 'service' : 'custom') as 'service' | 'custom',
          _hideQty: l.hideQty ?? false,
        })),
      }
    : {
        customerId: '',
        paymentMethod: (invoiceDefaults?.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails:
          (invoiceDefaults?.paymentDetails as Record<string, string | undefined>) ?? {},
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: invoiceDefaults?.dueDays
          ? calculateDueDate(new Date(), invoiceDefaults.dueDays)
          : undefined,
        seriesId: '',
        discountPercent: undefined,
        irpfPercent:
          invoiceDefaults?.irpfPercent != null ? Number(invoiceDefaults.irpfPercent) : undefined,
        notes: invoiceDefaults?.notes ?? undefined,
        lines: [{ ...EMPTY_LINE }] as ExtendedLineData[],
      };

  return (
    <InvoiceForm
      defaultValues={defaultValues}
      isDuplicate={!!duplicateId}
      sourceNumber={sourceInvoice?.number ?? undefined}
      editDraftId={editId ?? undefined}
      initialInvoiceType={
        editId
          ? (((sourceInvoice as any)?.invoiceType as InvoiceTypeOption) ?? undefined)
          : initialTypeFromParam
      }
      invoiceDefaults={invoiceDefaults ?? null}
      showTypeModalOnMount={showTypeModalOnMount}
    />
  );
}
