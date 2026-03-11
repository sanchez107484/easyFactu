'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, AlertCircle, Save, Pencil, ClipboardList, X } from 'lucide-react';
import { InvoiceLineItem } from '@/components/facturas/InvoiceLineItem';
import { extendedLineSchema, EMPTY_LINE, ExtendedLineData } from '@/lib/invoice-line-types';
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import { useInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useTenant } from '@/hooks/use-tenant';
import { useAuthStore } from '@/store/auth-store';
import {
  PaymentMethod,
  Customer,
  InvoiceTemplate,
  SeriesType,
  Tenant,
} from '@easyfactura/shared-types';
import { resolveUrl } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { buildPreviewInvoice, buildCreateInput, calculateDueDate } from '@/lib/invoice-helpers';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import { DueDatePicker } from '@/components/facturas/DueDatePicker';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import type { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { QuickCreateCustomerModal } from '@/components/clientes/QuickCreateCustomerModal';
import {
  PaymentDetailsFields,
  PaymentDetailsValues,
} from '@/components/facturas/PaymentDetailsFields';

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
    .optional(),
  paymentDetails: paymentDetailsSchema,
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  lines: z.array(extendedLineSchema).min(1, 'Añade al menos una línea').max(50),
});

type FormData = z.infer<typeof formSchema>;

// ==================== FORM COMPONENT ====================

interface QuoteFormProps {
  defaultValues: FormData;
  editId?: string;
}

function QuoteForm({ defaultValues, editId }: QuoteFormProps) {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const currentYear = new Date().getFullYear();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showQuickClient, setShowQuickClient] = useState(false);

  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const { data: defaultTemplate } = useDefaultTemplate();
  const { data: tenantData } = useTenant();
  const { data: seriesData } = useInvoiceSeries(currentYear);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const customers: Customer[] = customersData?.data ?? [];
  const effectiveTemplate: InvoiceTemplate | null = defaultTemplate ?? null;

  const availableSeries = useMemo(
    () => (seriesData?.data ?? []).filter((s) => s.type === SeriesType.QUOTE),
    [seriesData],
  );

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

  const effectiveSeriesId = watchedValues.seriesId || defaultSeriesId;
  const selectedSeries = availableSeries.find((s) => s.id === effectiveSeriesId) ?? null;
  const previewInvoice = buildPreviewInvoice(watchedValues, customers, selectedSeries);
  const activePaymentMethod = watchedValues.paymentMethod as PaymentMethod | undefined;

  const handlePreviewSectionClick = useCallback((fieldId: string) => {
    setActiveSection(fieldId);
    const el = document.getElementById(`field-${fieldId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const triggerSubmit = () => {
    const submitBtn = document.getElementById('form-submit-trigger');
    if (submitBtn) {
      (submitBtn as HTMLButtonElement).click();
    } else {
      form.handleSubmit(handleSave, onInvalid)();
    }
  };

  const onInvalid = (errors: unknown) => {
    const errs = errors as Record<string, unknown>;
    const missingFields: string[] = [];
    if (errs.customerId) missingFields.push('Cliente');
    if (errs.issueDate) missingFields.push('Fecha');
    if (errs.lines) missingFields.push('Líneas');
    toast.error(
      missingFields.length > 0
        ? `Faltan campos: ${missingFields.join(', ')}`
        : 'Revisa los campos obligatorios marcados en rojo',
    );
  };

  const handleSave = async (data: FormData) => {
    try {
      const base = buildCreateInput({
        ...data,
        seriesId: data.seriesId || defaultSeriesId,
        invoiceType: 'quote',
        templateId: defaultTemplate?.id,
      });
      const input = { ...base, validUntil: data.dueDate || undefined };

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: input });
        router.push(`/dashboard/presupuestos/${editId}`);
      } else {
        const quote = await createMutation.mutateAsync(input);
        router.push(`/dashboard/presupuestos/${quote.id}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const source = tenantData ?? currentTenant;
  const previewTenant: Tenant | null = source
    ? ({ ...source, logoUrl: resolveUrl(source.logoUrl) ?? null } as Tenant)
    : null;

  // ==================== RENDER ====================

  return (
    <>
      <QuickCreateCustomerModal
        open={showQuickClient}
        onClose={() => setShowQuickClient(false)}
        onCustomerReady={(customer) => {
          form.setValue('customerId', customer.id, { shouldValidate: true });
          setShowQuickClient(false);
        }}
      />

      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/presupuestos">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                {editId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {editId
                  ? 'Modifica y guarda los cambios.'
                  : 'El presupuesto se guardará hasta que lo conviertas en factura.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-proforma-200 bg-proforma-50 dark:border-proforma-800 dark:bg-proforma-950/40 px-3 py-1.5 text-proforma-700 dark:text-proforma-400">
              <ClipboardList className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-semibold">Presupuesto</span>
            </div>

            <div className="w-px h-6 bg-border mx-1 shrink-0" />

            <Button size="sm" onClick={triggerSubmit} disabled={isSubmitting}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? 'Guardando...' : 'Guardar presupuesto'}
            </Button>
          </div>
        </div>

        {/* ── Split panel ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT -- Form (60%) */}
          <div className="w-[60%] overflow-y-auto px-6 py-5 space-y-5 border-r">
            {editId && (
              <div className="flex items-start gap-3 rounded-lg border border-proforma-200 bg-proforma-50 dark:border-proforma-800 dark:bg-proforma-950/40 px-4 py-3">
                <Pencil className="h-4 w-4 text-proforma-600 dark:text-proforma-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-proforma-700 dark:text-proforma-300">
                    Editando presupuesto
                  </p>
                  <p className="text-xs text-proforma-600/80 dark:text-proforma-400/80 mt-0.5">
                    Los cambios se guardarán sobre este presupuesto. Cuando el cliente acepte,
                    conviértelo a proforma o factura oficial.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(handleSave, onInvalid)}
              noValidate
              className="space-y-5"
            >
              <button type="submit" id="form-submit-trigger" className="hidden" />

              {/* ── Datos generales ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Datos generales</CardTitle>
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
                    <div className="space-y-2" id="field-dueDate">
                      <Label>Válido hasta</Label>
                      <DueDatePicker
                        issueDate={watchedValues.issueDate}
                        value={watchedValues.dueDate}
                        onChange={(date) => form.setValue('dueDate', date, { shouldDirty: true })}
                        summaryLabel="Válido hasta el"
                        defaultPreset={30}
                      />
                    </div>
                  </section>

                  {/* Serie */}
                  <section
                    id="field-seriesId"
                    className="space-y-2"
                    onFocus={() => setActiveSection('seriesId')}
                  >
                    <Label>Serie de numeración</Label>
                    <Select
                      value={effectiveSeriesId}
                      onValueChange={(v) => form.setValue('seriesId', v, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una serie (opcional)" />
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
                            <span>
                              Se usará la serie <span className="font-mono font-medium">PRE-</span>{' '}
                              automáticamente. Puedes crear una serie personalizada en{' '}
                              <Link
                                href="/dashboard/ajustes/facturacion"
                                className="underline text-primary"
                              >
                                Ajustes
                              </Link>
                              .
                            </span>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Recomendamos usar una serie con prefijo{' '}
                      <span className="font-mono font-medium">PRE-</span> para diferenciar
                      presupuestos de facturas.
                    </p>
                  </section>

                  {/* Método de pago */}
                  <section
                    id="field-paymentMethod"
                    className="space-y-3"
                    onFocus={() => setActiveSection('paymentMethod')}
                  >
                    <div className="flex items-center justify-between">
                      <Label>Método de pago</Label>
                      {activePaymentMethod && (
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue('paymentMethod', undefined, { shouldValidate: true });
                            form.setValue('paymentDetails', {});
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          title="Quitar método de pago"
                        >
                          <X className="h-3 w-3" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
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

              {/* ── Líneas ── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Líneas del presupuesto</CardTitle>
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
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-[0.99]"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir línea
                  </button>
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
                      placeholder="Condiciones, plazos de entrega, observaciones para el cliente..."
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
              template={effectiveTemplate}
              tenant={previewTenant}
              activeFieldSection={activeSection}
              onSectionClick={handlePreviewSectionClick}
              paymentDetails={watchedValues.paymentDetails as PaymentDetails | undefined}
              invoiceType="quote"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== PAGE (shell) ====================

export default function NuevoPresupuestoPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { data: sourceQuote, isLoading: loadingQuote } = useInvoice(editId ?? '', {
    enabled: !!editId,
  });
  const { data: invoiceDefaults, isLoading: loadingDefaults } = useInvoiceDefaults();

  const isLoading = (!!editId && loadingQuote) || loadingDefaults;

  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[60%] p-6 space-y-4 border-r">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="w-[40%] p-4">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const defaultValidUntil = calculateDueDate(new Date(), 30);

  const defaultValues: FormData = sourceQuote
    ? {
        customerId: sourceQuote.customerId ?? '',
        issueDate: sourceQuote.issueDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        dueDate:
          (sourceQuote as unknown as { validUntil?: string }).validUntil?.split('T')[0] ??
          defaultValidUntil,
        seriesId: sourceQuote.seriesId ?? '',
        discountPercent: sourceQuote.discountPercent
          ? Number(sourceQuote.discountPercent)
          : undefined,
        irpfPercent: sourceQuote.irpfPercent ? Number(sourceQuote.irpfPercent) : undefined,
        paymentMethod: (sourceQuote.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails:
          (sourceQuote as unknown as { paymentDetails?: Record<string, string | undefined> })
            .paymentDetails ?? {},
        notes: sourceQuote.notes || undefined,
        lines: (sourceQuote.lines ?? []).map((l) => {
          const qty = Number(l.quantity) || 1;
          // Use the stored hideQty field from the DB (reliable) instead of a heuristic
          const hideQty = l.hideQty ?? false;
          return {
            description: l.description ?? '',
            quantity: qty,
            unitPrice: Number(l.unitPrice) || 0,
            taxRate: Number(l.taxRate) || 0,
            productId: l.productId ?? undefined,
            _mode: (hideQty && !l.productId ? 'service' : 'custom') as 'service' | 'custom',
            _hideQty: hideQty,
          };
        }),
      }
    : {
        customerId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: defaultValidUntil,
        seriesId: '',
        discountPercent: undefined,
        irpfPercent:
          invoiceDefaults?.irpfPercent != null ? Number(invoiceDefaults.irpfPercent) : undefined,
        paymentMethod: (invoiceDefaults?.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails:
          (invoiceDefaults?.paymentDetails as Record<string, string | undefined>) ?? {},
        notes: undefined,
        lines: [{ ...EMPTY_LINE }] as ExtendedLineData[],
      };

  return <QuoteForm defaultValues={defaultValues} editId={editId ?? undefined} />;
}
