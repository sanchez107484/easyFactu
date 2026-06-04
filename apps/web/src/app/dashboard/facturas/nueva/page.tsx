'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Copy, Pencil } from 'lucide-react';
import { extendedLineSchema, EMPTY_LINE, ExtendedLineData } from '@/lib/invoice-line-types';
import {
  useCreateInvoice,
  useUpdateInvoice,
  useConfirmInvoice,
  useInvoice,
} from '@/hooks/use-invoices';
import { InvoiceLineItem } from '@/components/facturas/InvoiceLineItem';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import { useTenant } from '@/hooks/use-tenant';
import { useInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useAuthStore } from '@/store/auth-store';
import {
  PaymentMethod,
  Customer,
  SharedPoolCustomer,
  InvoiceTemplate,
  SeriesType,
  Tenant,
  InvoiceDefaults,
  Frequency,
  TaxRegime,
} from '@easyfactura/shared-types';
import { EQUIVALENCE_SURCHARGE_RATES } from '@easyfactura/shared-constants';
import { useCustomers, useSharedCustomerPool, useImportFromPool } from '@/hooks/use-customers';
import { resolveUrl } from '@/lib/utils';
import { buildPreviewInvoice, buildCreateInput, calculateDueDate } from '@/lib/invoice-helpers';
import { InvoiceTypeModal, InvoiceTypeOption } from '@/components/facturas/InvoiceTypeModal';
import {
  ConfirmInvoiceDialog,
  type RecurringConfig,
} from '@/components/facturas/ConfirmInvoiceDialog';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { QuickCreateCustomerModal } from '@/components/clientes/QuickCreateCustomerModal';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { SaveAsDefaultBanner } from '@/components/facturas/SaveAsDefaultBanner';
import { useInvoiceFormKeyDown } from '@/hooks/use-invoice-form-key-down';
import { useDebounce } from '@/hooks/use-debounce';
import { InvoiceFormHeader } from './_components/invoice-form-header';
import { InvoiceGeneralDataCard } from './_components/invoice-general-data-card';
import { DiscountsSectionGeneral } from '@/components/facturas/DiscountsSectionGeneral';
import { DiscountsSectionReagyp } from '@/components/facturas/DiscountsSectionReagyp';

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
  compensacionPercent: z.number().min(0).max(100).optional(),
  equivalenceSurchargePercent: z.number().min(0).max(100).optional(),
  paymentMethod: z
    .nativeEnum(PaymentMethod, { invalid_type_error: 'Método de pago no válido' })
    .optional()
    .refine((v): boolean => v !== undefined, { message: 'El método de pago es obligatorio' }),
  paymentDetails: paymentDetailsSchema,
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  lines: z.array(extendedLineSchema).min(1, 'Añade al menos una línea').max(50),
});

type FormData = z.infer<typeof formSchema>;

// ==================== INNER FORM COMPONENT ====================

interface InvoiceFormProps {
  defaultValues: FormData;
  isDuplicate: boolean;
  sourceNumber?: string;
  editDraftId?: string;
  initialInvoiceType?: InvoiceTypeOption;
  invoiceDefaults?: InvoiceDefaults | null;
  initialShowQr?: boolean;
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
  initialShowQr,
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
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [simplifyTable, setSimplifyTable] = useState(false);
  const [showQr, setShowQr] = useState(initialShowQr ?? true);

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

  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    limit: 500,
    active: true,
  });
  const { data: defaultTemplate } = useDefaultTemplate();
  const { data: tenantData } = useTenant();
  const { data: seriesData } = useInvoiceSeries(currentYear);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const confirmMutation = useConfirmInvoice();
  const createRecurringMutation = useCreateRecurringInvoice();

  // ── Agency shared pool ───────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebounce(customerSearch, 400);
  const { data: sharedPool, isLoading: loadingShared } =
    useSharedCustomerPool(debouncedCustomerSearch);
  const importFromPoolMutation = useImportFromPool();

  const handleSelectSharedCustomer = useCallback(
    async (customer: SharedPoolCustomer) => {
      const imported = await importFromPoolMutation.mutateAsync(customer.nif);
      setPendingCustomerId(imported.id);
    },
    [importFromPoolMutation],
  );
  // ─────────────────────────────────────────────────────────────────────────

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
  const selectedCustomer = customers.find((c) => c.id === watchedValues.customerId);

  // REAGYP: compensation applies when tenant is in REAGYP and customer is NOT also in REAGYP
  const tenant = tenantData;
  const showCompensacion = tenant?.taxRegime === TaxRegime.REAGYP;

  // Auto-populate compensacionPercent when the customer or tenant changes.
  // This sets the sensible default but leaves the user free to override it.
  useEffect(() => {
    if (!showCompensacion) return;
    const rate = !selectedCustomer?.isReagyp && tenant?.reaypRate ? Number(tenant.reaypRate) : 0;
    form.setValue('compensacionPercent', rate, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.customerId, tenant?.taxRegime, tenant?.reaypRate]);

  // RE is incompatible with REAGYP
  const equivalenceSurchargeRates =
    selectedCustomer?.hasEquivalenceSurcharge && !showCompensacion
      ? EQUIVALENCE_SURCHARGE_RATES
      : undefined;

  // Auto-populate surchargeRate per line when customer with hasEquivalenceSurcharge is selected.
  // When surcharge is cleared (customer change or REAGYP), reset to 0.
  useEffect(() => {
    const lines = form.getValues('lines');
    if (!lines) return;
    lines.forEach((_, i) => {
      const taxRate = form.getValues(`lines.${i}.taxRate`) as number;
      const rate = equivalenceSurchargeRates ? (EQUIVALENCE_SURCHARGE_RATES[taxRate] ?? 0) : 0;
      form.setValue(`lines.${i}.surchargeRate`, rate, { shouldDirty: false, shouldValidate: false });
    });
    // Reset global override when customer changes
    form.setValue('equivalenceSurchargePercent', undefined, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.customerId, showCompensacion]);

  // Sync global equivalenceSurchargePercent to all per-line surchargeRate when user modifies it
  useEffect(() => {
    const override = watchedValues.equivalenceSurchargePercent;
    if (override == null) return;
    const lines = form.getValues('lines');
    if (!lines) return;
    lines.forEach((_, i) => {
      form.setValue(`lines.${i}.surchargeRate`, override, { shouldDirty: false, shouldValidate: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.equivalenceSurchargePercent]);

  const previewInvoice = buildPreviewInvoice(
    watchedValues,
    customers,
    selectedSeries,
    showCompensacion ? (watchedValues.compensacionPercent ?? 0) : watchedValues.compensacionPercent,
    equivalenceSurchargeRates,
  );
  const activePaymentMethod = watchedValues.paymentMethod as PaymentMethod | undefined;

  // Cuando el listado se actualiza y hay un cliente pendiente de seleccionar, lo seleccionamos.
  useEffect(() => {
    if (!pendingCustomerId) return;
    if (customers.some((c) => c.id === pendingCustomerId)) {
      form.setValue('customerId', pendingCustomerId, { shouldValidate: true });
      setPendingCustomerId(null);
    }
  }, [customers, pendingCustomerId, form]);

  // ── Simplify-table toggle ──────────────────────────────────────────────────
  const linesData = watchedValues.lines ?? [];
  const allLinesSameTax =
    linesData.length > 0 && linesData.every((l) => l.taxRate === linesData[0].taxRate);
  const showSimplifyToggle = linesData.length === 1 || (linesData.length > 1 && allLinesSameTax);

  // Reset when toggle becomes irrelevant (e.g. user adds line with different VAT)
  useEffect(() => {
    if (!showSimplifyToggle) setSimplifyTable(false);
  }, [showSimplifyToggle]);

  // Pre-populate notes from template default when creating a fresh invoice
  useEffect(() => {
    if (isDuplicate || editDraftId) return;
    const templateDefaultText = effectiveTemplate?.layout.notes?.defaultText;
    if (!templateDefaultText) return;
    if (!form.getValues('notes')) {
      form.setValue('notes', templateDefaultText, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveTemplate?.id]);

  // Sync showQr from template default when creating a fresh invoice (no explicit initialShowQr)
  useEffect(() => {
    if (isDuplicate || editDraftId || initialShowQr !== undefined) return;
    const templateDefault = effectiveTemplate?.layout?.footer?.showVerifactuQr ?? true;
    setShowQr(templateDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveTemplate?.id]);

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
            showDiscount: simplifyTable
              ? false
              : (effectiveTemplate.layout.itemsTable.showDiscount ?? false),
          },
          // In the live preview, IRPF is always shown if the user has set a value —
          // the template's showIrpf only controls the final PDF output.
          totals: {
            ...effectiveTemplate.layout.totals,
            showIrpf: true,
          },
          footer: {
            ...effectiveTemplate.layout.footer,
            showVerifactuQr: showQr,
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

  const onInvalid = (errors: FieldErrors<FormData>) => {
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
      const layoutOverride = {
        ...(simplifyTable
          ? {
              itemsTable: {
                showUnitPrice: false,
                showTaxColumn: false,
                showLineTotal: false,
                showDiscount: false,
              },
            }
          : {}),
        footer: { showVerifactuQr: showQr },
      };
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
        const layoutOverride = {
          ...(simplifyTable
            ? {
                itemsTable: {
                  showUnitPrice: false,
                  showTaxColumn: false,
                  showLineTotal: false,
                  showDiscount: false,
                },
              }
            : {}),
          footer: { showVerifactuQr: showQr },
        };
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
      const layoutOverride = {
        ...(simplifyTable
          ? {
              itemsTable: {
                showUnitPrice: false,
                showTaxColumn: false,
                showLineTotal: false,
                showDiscount: false,
              },
            }
          : {}),
        footer: { showVerifactuQr: showQr },
      };
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
        discountPercent: l.discountPercent && l.discountPercent > 0 ? l.discountPercent : undefined,
        taxRate: l.taxRate,
        hideQty: l._hideQty ?? false,
        surchargeRate: l.surchargeRate && l.surchargeRate > 0 ? l.surchargeRate : undefined,
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
          setPendingCustomerId(customer.id);
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

      <div className="-m-6 flex flex-col h-[calc(100%+3rem)]">
        {/* ── Header ── */}
        <InvoiceFormHeader
          editDraftId={editDraftId}
          isProforma={isProforma}
          invoiceType={invoiceType}
          selectedTemplate={selectedTemplate}
          isRecurring={isRecurring}
          recurringFrequency={recurringFrequency}
          isSubmitting={isSubmitting}
          createMutationPending={createMutation.isPending}
          updateMutationPending={updateMutation.isPending}
          onTypeClick={() => setShowTypeModal(true)}
          onToggleRecurring={() => setIsRecurring((v) => !v)}
          onSaveDraft={triggerSubmit}
          onConfirmClick={handleConfirmClick}
        />

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
              <InvoiceGeneralDataCard
                form={form}
                customers={customers}
                loadingCustomers={loadingCustomers}
                sharedPool={sharedPool}
                loadingShared={loadingShared}
                availableSeries={availableSeries}
                effectiveSeriesId={effectiveSeriesId}
                isProforma={isProforma}
                tenantData={tenantData}
                currentTenant={currentTenant}
                invoiceDefaults={invoiceDefaults}
                isDuplicate={isDuplicate}
                editDraftId={editDraftId}
                defaultPaymentMethod={defaultValues.paymentMethod}
                onActiveSection={setActiveSection}
                onCreateCustomer={() => setShowQuickClient(true)}
                onSearchChange={setCustomerSearch}
                onSelectSharedCustomer={handleSelectSharedCustomer}
              />

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
                        isReagyp={showCompensacion}
                        showSurcharge={!!equivalenceSurchargeRates}
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
                  {showCompensacion ? (
                    <DiscountsSectionReagyp
                      discountPercentProps={form.register('discountPercent', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      compensacionPercentProps={form.register('compensacionPercent', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      irpfPercentProps={form.register('irpfPercent', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      isCustomerReagyp={selectedCustomer?.isReagyp ?? false}
                      onFocus={() => setActiveSection('discountPercent')}
                    />
                  ) : (
                    <DiscountsSectionGeneral
                      discountPercentProps={form.register('discountPercent', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      irpfPercentProps={form.register('irpfPercent', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      equivalenceSurchargePercentProps={
                        equivalenceSurchargeRates
                          ? form.register('equivalenceSurchargePercent', {
                              setValueAs: (v) => (v === '' ? undefined : Number(v)),
                            })
                          : undefined
                      }
                      onFocus={() => setActiveSection('discountPercent')}
                    />
                  )}
                </CardContent>
              </Card>

              {/* ── Verificación ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Verificación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-3 py-2.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium leading-tight">Código QR de verificación</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Se incluye en el PDF cuando la factura esté confirmada
                      </p>
                    </div>
                    <Switch
                      checked={showQr}
                      onCheckedChange={setShowQr}
                      aria-label="Mostrar código QR de verificación"
                    />
                  </div>
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
  const preselectedCustomerId = searchParams.get('customerId') ?? '';

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
  const { data: tenantPageData } = useTenant();

  if ((sourceId && loadingSource) || loadingDefaults) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <p className="text-muted-foreground animate-pulse">Cargando datos de la factura...</p>
      </div>
    );
  }

  const defaultValues: FormData = sourceInvoice
    ? {
        customerId: sourceInvoice.customer?.id ?? sourceInvoice.customerId ?? '',
        issueDate: editId
          ? (sourceInvoice.issueDate?.split('T')[0] ?? new Date().toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        dueDate: editId ? (sourceInvoice.dueDate?.split('T')[0] ?? undefined) : undefined,
        seriesId: editId ? (sourceInvoice.series?.id ?? sourceInvoice.seriesId ?? '') : '',
        discountPercent: sourceInvoice.discountPercent
          ? Number(sourceInvoice.discountPercent)
          : undefined,
        irpfPercent: sourceInvoice.irpfPercent ? Number(sourceInvoice.irpfPercent) : undefined,
        compensacionPercent: sourceInvoice.compensacionPercent
          ? Number(sourceInvoice.compensacionPercent)
          : undefined,
        paymentMethod: (sourceInvoice.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails: (sourceInvoice.paymentDetails as Record<string, string | undefined>) ?? {},
        notes: sourceInvoice.notes || undefined,
        lines: (sourceInvoice.lines ?? []).map((l) => ({
          description: l.description ?? '',
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          discountPercent: Number(l.discountPercent) || 0,
          taxRate: Number(l.taxRate) || 0,
          productId: l.productId ?? undefined,
          _mode: l.hideQty ? 'service' : l.productId ? 'product' : 'custom',
          _hideQty: l.hideQty ?? false,
          _priceMode: 'unit',
        })),
      }
    : {
        customerId: preselectedCustomerId,
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
        compensacionPercent:
          tenantPageData?.taxRegime === TaxRegime.REAGYP && tenantPageData.reaypRate != null
            ? Number(tenantPageData.reaypRate)
            : undefined,
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
          ? ((sourceInvoice?.invoiceType as InvoiceTypeOption) ?? undefined)
          : initialTypeFromParam
      }
      invoiceDefaults={invoiceDefaults ?? null}
      initialShowQr={sourceInvoice?.layoutOverride?.footer?.showVerifactuQr ?? undefined}
      showTypeModalOnMount={showTypeModalOnMount}
    />
  );
}
