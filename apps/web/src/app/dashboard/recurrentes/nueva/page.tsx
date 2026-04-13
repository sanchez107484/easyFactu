'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, AlertCircle, RefreshCw, Calendar, Building2, Lock, Pencil } from 'lucide-react';
import { InvoiceLineItem } from '@/components/facturas/InvoiceLineItem';
import {
  PaymentDetailsFields,
  type PaymentDetailsValues,
} from '@/components/facturas/PaymentDetailsFields';
import { QuickCreateCustomerModal } from '@/components/clientes/QuickCreateCustomerModal';
import { InvoiceSplitLayout } from '@/components/common/InvoiceSplitLayout';
import { extendedLineSchema, EMPTY_LINE, ExtendedLineData } from '@/lib/invoice-line-types';
import { buildPreviewInvoice } from '@/lib/invoice-helpers';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import {
  useCreateRecurringInvoice,
  useUpdateRecurringInvoice,
  useRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useTenant } from '@/hooks/use-tenant';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import { useInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useInvoiceFormKeyDown } from '@/hooks/use-invoice-form-key-down';
import { useAuthStore } from '@/store/auth-store';
import {
  Frequency,
  PaymentMethod,
  SeriesType,
  Tenant,
  InvoiceDefaults,
  Customer,
} from '@easyfactura/shared-types';
import { FREQUENCY_OPTIONS, PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { cn, resolveUrl } from '@/lib/utils';

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

const formSchema = z
  .object({
    customerId: z.string().min(1, 'Selecciona un cliente'),
    seriesId: z.string().optional().default(''),
    frequency: z.nativeEnum(Frequency),
    dayOfMonth: z.coerce
      .number()
      .min(1, 'Mínimo 1')
      .max(28, 'Máximo 28 (compatible con todos los meses)'),
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
    hasEndDate: z.boolean(),
    endDate: z.string().optional(),
    autoConfirm: z.boolean(),
    irpfPercent: z.coerce.number().min(0).max(30).optional(),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentDetails: paymentDetailsSchema,
    notes: z.string().max(1000).optional(),
    lines: z.array(extendedLineSchema).min(1, 'Añade al menos una línea'),
  })
  .refine(
    (data) => {
      if (!data.hasEndDate || !data.endDate) return true;
      return data.endDate >= data.startDate;
    },
    { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['endDate'] },
  );

type FormData = z.infer<typeof formSchema>;

// ==================== HELPERS ====================

function frequencyLabel(freq: Frequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === freq)?.label ?? freq;
}

function computeFirstRunDate(startDate: string, dayOfMonth: number): Date {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const base = start >= now ? start : now;
  const lastDayBase = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const candidate = new Date(
    base.getFullYear(),
    base.getMonth(),
    Math.min(dayOfMonth, lastDayBase),
  );

  if (candidate < now) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastDayNext = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, lastDayNext));
    return next;
  }

  return candidate;
}

// ==================== NEXT RUN SUMMARY ====================

interface NextRunSummaryProps {
  startDate: string;
  frequency: Frequency;
  dayOfMonth: number;
  hasEndDate: boolean;
  endDate?: string;
}

function NextRunSummary({
  startDate,
  frequency,
  dayOfMonth,
  hasEndDate,
  endDate,
}: NextRunSummaryProps) {
  if (!startDate || !dayOfMonth) return null;

  const firstRun = computeFirstRunDate(startDate, dayOfMonth);
  const fmt = (d: Date | string) =>
    (d instanceof Date ? d : new Date(d)).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary/90">
      <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-medium">Primera generación: {fmt(firstRun)}</p>
        <p className="text-primary/70">
          {frequencyLabel(frequency)} · día {dayOfMonth} de cada período
          {hasEndDate && endDate ? ` · hasta ${fmt(endDate)}` : ' · sin fecha de fin'}
        </p>
      </div>
    </div>
  );
}

// ==================== READ-ONLY FIELD ====================

interface ReadonlyFieldProps {
  label: string;
  value: string;
  icon?: React.ElementType;
}

function ReadonlyField({ label, value, icon: Icon }: ReadonlyFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
        <Lock className="h-3 w-3 text-muted-foreground/50 ml-0.5" />
      </Label>
      <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50 text-sm font-medium text-muted-foreground">
        {value}
      </div>
      <p className="text-[11px] text-muted-foreground/70">No editable después de crear</p>
    </div>
  );
}

// ==================== INNER FORM COMPONENT ====================

interface RecurringInvoiceFormProps {
  defaultValues: FormData;
  editId?: string;
  readonlyCustomer?: { id: string; name: string; nif: string };
  readonlyStartDate?: string;
  readonlySeriesName?: string;
  invoiceDefaults?: InvoiceDefaults | null;
}

function RecurringInvoiceForm({
  defaultValues,
  editId,
  readonlyCustomer,
  readonlyStartDate,
  readonlySeriesName,
  invoiceDefaults,
}: RecurringInvoiceFormProps) {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0]!;
  const isEdit = !!editId;

  const [showQuickClient, setShowQuickClient] = useState(false);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const createMutation = useCreateRecurringInvoice();
  const updateMutation = useUpdateRecurringInvoice();
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({ active: true });
  const { data: defaultTemplate } = useDefaultTemplate();
  const { data: tenantData } = useTenant();
  const { data: seriesData } = useInvoiceSeries(currentYear);
  const handleFormKeyDown = useInvoiceFormKeyDown();

  const customers: Customer[] = customersData?.data ?? [];
  const availableSeries = useMemo(
    () => (seriesData?.data ?? []).filter((s) => s.type === SeriesType.INVOICE),
    [seriesData],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const watchedValues = form.watch();
  const errors = form.formState.errors;
  const hasEndDate = watchedValues.hasEndDate;
  const activePaymentMethod = watchedValues.paymentMethod as PaymentMethod | undefined;

  useEffect(() => {
    if (!pendingCustomerId) return;
    if (customers.some((c) => c.id === pendingCustomerId)) {
      form.setValue('customerId', pendingCustomerId, { shouldValidate: true });
      setPendingCustomerId(null);
    }
  }, [customers, pendingCustomerId, form]);

  const previewInvoice = buildPreviewInvoice(
    {
      customerId: watchedValues.customerId,
      issueDate: today,
      lines: watchedValues.lines,
      discountPercent: watchedValues.discountPercent,
      irpfPercent: watchedValues.irpfPercent,
      paymentMethod: watchedValues.paymentMethod,
      notes: watchedValues.notes,
      paymentDetails: watchedValues.paymentDetails as Record<string, string | undefined>,
    },
    customers,
    null,
  );

  const source = tenantData ?? currentTenant;
  const previewTenant: Tenant | null = source
    ? ({ ...source, logoUrl: resolveUrl(source.logoUrl) ?? null } as Tenant)
    : null;

  const handleSectionClick = useCallback((fieldId: string) => {
    setActiveSection(fieldId);
    const el = document.getElementById(`field-${fieldId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const onInvalid = useCallback(() => {
    toast.error('Revisa los campos obligatorios marcados en rojo');
  }, []);

  const onSubmit = form.handleSubmit(async (data: FormData) => {
    const mappedLines = data.lines.map((line) => ({
      productId: line.productId,
      description: line.description,
      quantity: line._hideQty ? 1 : line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      hideQty: line._hideQty ?? false,
    }));

    const paymentDetailsPayload = data.paymentDetails
      ? ({ ...data.paymentDetails } as Record<string, unknown>)
      : undefined;

    if (isEdit) {
      await updateMutation.mutateAsync({
        id: editId!,
        data: {
          frequency: data.frequency,
          dayOfMonth: data.dayOfMonth,
          endDate: data.hasEndDate && data.endDate ? data.endDate : null,
          autoConfirm: data.autoConfirm,
          irpfPercent: data.irpfPercent ?? null,
          discountPercent: data.discountPercent ?? null,
          paymentMethod: data.paymentMethod ?? null,
          paymentDetails: paymentDetailsPayload ?? null,
          notes: data.notes ?? null,
          lines: mappedLines,
        },
      });
      router.push(`/dashboard/recurrentes/${editId}`);
    } else {
      await createMutation.mutateAsync({
        customerId: data.customerId,
        seriesId: data.seriesId || undefined,
        frequency: data.frequency,
        dayOfMonth: data.dayOfMonth,
        startDate: data.startDate,
        endDate: data.hasEndDate && data.endDate ? data.endDate : undefined,
        autoConfirm: data.autoConfirm,
        irpfPercent: data.irpfPercent || undefined,
        discountPercent: data.discountPercent || undefined,
        paymentMethod: data.paymentMethod || undefined,
        paymentDetails: paymentDetailsPayload,
        notes: data.notes || undefined,
        lines: mappedLines,
      });
      router.push('/dashboard/recurrentes');
    }
  }, onInvalid);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <QuickCreateCustomerModal
        open={showQuickClient}
        onClose={() => setShowQuickClient(false)}
        onCustomerReady={(customer) => {
          setPendingCustomerId(customer.id);
          setShowQuickClient(false);
        }}
      />

      <InvoiceSplitLayout
        backHref="/dashboard/recurrentes"
        headerLeft={
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">
              {isEdit ? 'Editar recurrente' : 'Nueva factura recurrente'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? 'Modifica la configuración. Las facturas ya generadas no se ven afectadas.'
                : 'Se generará automáticamente con la frecuencia que elijas.'}
            </p>
          </div>
        }
        headerRight={
          <>
            <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
              <RefreshCw className="h-3 w-3" />
              {frequencyLabel(watchedValues.frequency)}
            </Badge>
            <div className="w-px h-6 bg-border mx-1 shrink-0" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(isEdit ? `/dashboard/recurrentes/${editId}` : '/dashboard/recurrentes')
              }
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => onSubmit()} disabled={isPending} size="sm">
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear recurrente'}
            </Button>
          </>
        }
        invoice={previewInvoice}
        template={defaultTemplate ?? null}
        tenant={previewTenant}
        activeFieldSection={activeSection}
        onSectionClick={handleSectionClick}
        paymentDetails={watchedValues.paymentDetails as PaymentDetailsValues | undefined}
      >
        <form
          onSubmit={onSubmit}
          onKeyDown={handleFormKeyDown}
          noValidate
          className="px-6 py-5 space-y-5"
        >
          {isEdit && (
            <div className="flex items-start gap-3 rounded-lg border border-proforma-200 bg-proforma-50 dark:border-proforma-800 dark:bg-proforma-950/40 px-4 py-3">
              <Pencil className="h-4 w-4 text-proforma-600 dark:text-proforma-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-proforma-700 dark:text-proforma-300">
                  Editando factura recurrente
                </p>
                <p className="text-xs text-proforma-600/80 dark:text-proforma-400/80 mt-0.5">
                  El cliente, la serie y la fecha de inicio no se pueden cambiar. Las facturas ya
                  generadas no se ven afectadas.
                </p>
              </div>
            </div>
          )}

          {/* ── Datos generales ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Datos generales</CardTitle>
              {!invoiceDefaults && !isEdit && (
                <p className="text-xs text-muted-foreground">
                  ¿Siempre usas los mismos datos?{' '}
                  <a
                    href="/dashboard/ajustes/facturacion"
                    className="text-primary underline underline-offset-2"
                  >
                    Configura tus preferencias
                  </a>{' '}
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
                {isEdit && readonlyCustomer ? (
                  <ReadonlyField
                    label="Cliente"
                    value={`${readonlyCustomer.name} — ${readonlyCustomer.nif}`}
                    icon={Building2}
                  />
                ) : (
                  <>
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
                        <SelectTrigger className={errors.customerId ? 'border-destructive' : ''}>
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
                    {errors.customerId && (
                      <p className="text-sm text-destructive">{errors.customerId.message}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowQuickClient(true)}
                      className="text-sm text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                      + Crear nuevo cliente
                    </button>
                  </>
                )}
              </section>

              {/* Serie */}
              <section id="field-seriesId" className="space-y-2">
                {isEdit ? (
                  <ReadonlyField
                    label="Serie de facturación"
                    value={readonlySeriesName ?? 'Serie por defecto'}
                  />
                ) : (
                  <>
                    <Label>Serie de facturación</Label>
                    <Select
                      value={watchedValues.seriesId || 'none'}
                      onValueChange={(v) =>
                        form.setValue('seriesId', v === 'none' ? '' : v, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Serie por defecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Serie por defecto</SelectItem>
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
                      </SelectContent>
                    </Select>
                  </>
                )}
              </section>

              {/* Método de pago */}
              <section
                id="field-paymentMethod"
                className="space-y-3"
                onFocus={() => setActiveSection('paymentMethod')}
              >
                <Label>Método de pago</Label>
                <Select
                  value={activePaymentMethod ?? 'none'}
                  onValueChange={(v) => {
                    const method = v === 'none' ? undefined : (v as PaymentMethod);
                    form.setValue('paymentMethod', method, { shouldValidate: true });
                    if (v !== defaultValues.paymentMethod) {
                      form.setValue('paymentDetails', {});
                    }
                    if (v === PaymentMethod.BANK_TRANSFER) {
                      const tenant = tenantData ?? currentTenant;
                      if (tenant?.iban && !form.getValues('paymentDetails.iban')) {
                        form.setValue('paymentDetails.iban', tenant.iban, { shouldDirty: true });
                      }
                      if (
                        tenant?.bankAccountHolder &&
                        !form.getValues('paymentDetails.accountHolder')
                      ) {
                        form.setValue('paymentDetails.accountHolder', tenant.bankAccountHolder, {
                          shouldDirty: true,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    tenantBic={(tenantData ?? currentTenant)?.bic ?? undefined}
                  />
                )}
              </section>
            </CardContent>
          </Card>

          {/* ── Líneas de factura ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Líneas de factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div id="field-lines-section" className="space-y-3">
                {errors.lines?.root && (
                  <p className="text-sm text-destructive mb-2">{errors.lines.root.message}</p>
                )}
                {fields.map((field, index) => (
                  <InvoiceLineItem
                    key={field.id}
                    form={form}
                    index={index}
                    totalLines={fields.length}
                    onRemove={() => remove(index)}
                    onDuplicate={() => {
                      append({ ...form.getValues(`lines.${index}`) });
                      setLastAddedIndex(fields.length);
                    }}
                    onMoveUp={() => move(index, index - 1)}
                    onMoveDown={() => move(index, index + 1)}
                    onFocus={() => setActiveSection('lines-section')}
                    autoFocusDescription={index === lastAddedIndex}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  append({ ...EMPTY_LINE });
                  setLastAddedIndex(fields.length);
                }}
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
                    min={0}
                    max={100}
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
                    min={0}
                    max={30}
                    placeholder="0 (15% general)"
                    {...form.register('irpfPercent', {
                      setValueAs: (v) => (v === '' ? undefined : Number(v)),
                    })}
                  />
                </div>
              </section>
            </CardContent>
          </Card>

          {/* ── Programación de repetición ── */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Programación de repetición
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define cuándo y con qué frecuencia se generarán las facturas automáticamente.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <section className="space-y-2">
                  <Label htmlFor="frequency">
                    Frecuencia <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchedValues.frequency}
                    onValueChange={(v) => form.setValue('frequency', v as Frequency)}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                <section className="space-y-2">
                  <Label htmlFor="dayOfMonth">Día de emisión</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min={1}
                    max={28}
                    {...form.register('dayOfMonth')}
                    className={errors.dayOfMonth ? 'border-destructive' : ''}
                  />
                  {errors.dayOfMonth ? (
                    <p className="text-xs text-destructive">{errors.dayOfMonth.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Máx. 28 para compatibilidad con febrero
                    </p>
                  )}
                </section>
              </div>

              {isEdit ? (
                <ReadonlyField
                  label="Fecha de inicio"
                  value={
                    readonlyStartDate
                      ? new Date(readonlyStartDate + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'
                  }
                  icon={Calendar}
                />
              ) : (
                <section className="space-y-2">
                  <Label htmlFor="startDate">
                    Fecha de inicio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register('startDate')}
                    className={cn('max-w-[200px]', errors.startDate ? 'border-destructive' : '')}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
                </section>
              )}

              <div className="flex items-center gap-3">
                <Switch
                  id="hasEndDate"
                  checked={hasEndDate}
                  onCheckedChange={(v) => form.setValue('hasEndDate', v)}
                />
                <Label htmlFor="hasEndDate" className="cursor-pointer font-normal">
                  Establecer fecha de fin
                </Label>
              </div>

              {hasEndDate && (
                <section className="space-y-2">
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register('endDate')}
                    className={cn('max-w-[200px]', errors.endDate ? 'border-destructive' : '')}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate.message}</p>
                  )}
                </section>
              )}

              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="autoConfirm"
                    checked={watchedValues.autoConfirm}
                    onCheckedChange={(v) => form.setValue('autoConfirm', v)}
                  />
                  <div>
                    <Label htmlFor="autoConfirm" className="cursor-pointer">
                      Confirmar automáticamente
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Si está activado, cada factura generada se confirma directamente. Si no,
                      se crea como borrador para que puedas revisarla antes de enviar.
                    </p>
                  </div>
                </div>
              </div>

              <NextRunSummary
                frequency={watchedValues.frequency}
                dayOfMonth={watchedValues.dayOfMonth}
                startDate={isEdit ? (readonlyStartDate ?? today) : watchedValues.startDate}
                hasEndDate={hasEndDate}
                endDate={hasEndDate ? watchedValues.endDate : undefined}
              />
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
                  id="notes"
                  placeholder="Notas que aparecerán en cada factura generada..."
                  rows={3}
                  {...form.register('notes')}
                />
              </section>
            </CardContent>
          </Card>
        </form>
      </InvoiceSplitLayout>
    </>
  );
}

// ==================== PAGE SHELL ====================

export default function NuevaRecurrentePage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const today = new Date().toISOString().split('T')[0]!;

  const { data: editRecurring, isLoading: loadingEdit } = useRecurringInvoice(editId ?? '');
  const { data: invoiceDefaults, isLoading: loadingDefaults } = useInvoiceDefaults();

  if ((editId && loadingEdit) || loadingDefaults) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center flex-col gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <p className="text-muted-foreground animate-pulse">
          {editId ? 'Cargando configuración...' : 'Preparando formulario...'}
        </p>
      </div>
    );
  }

  const defaultValues: FormData = editRecurring
    ? {
        customerId: editRecurring.customerId,
        seriesId: editRecurring.seriesId ?? '',
        frequency: editRecurring.frequency,
        dayOfMonth: editRecurring.dayOfMonth,
        startDate: editRecurring.startDate?.split('T')[0] ?? today,
        hasEndDate: !!editRecurring.endDate,
        endDate: editRecurring.endDate?.split('T')[0] ?? '',
        autoConfirm: editRecurring.autoConfirm,
        irpfPercent: editRecurring.irpfPercent ? Number(editRecurring.irpfPercent) : undefined,
        discountPercent: editRecurring.discountPercent
          ? Number(editRecurring.discountPercent)
          : undefined,
        paymentMethod: (editRecurring.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails: (editRecurring.paymentDetails as Record<string, string | undefined>) ?? {},
        notes: editRecurring.notes ?? '',
        lines: (editRecurring.lines ?? []).map((l) => ({
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
        seriesId: '',
        frequency: Frequency.MONTHLY,
        dayOfMonth: 1,
        startDate: today,
        hasEndDate: false,
        endDate: '',
        autoConfirm: false,
        irpfPercent:
          invoiceDefaults?.irpfPercent != null ? Number(invoiceDefaults.irpfPercent) : undefined,
        discountPercent: undefined,
        paymentMethod: (invoiceDefaults?.paymentMethod as PaymentMethod) ?? undefined,
        paymentDetails:
          (invoiceDefaults?.paymentDetails as Record<string, string | undefined>) ?? {},
        notes: invoiceDefaults?.notes ?? '',
        lines: [{ ...EMPTY_LINE }] as ExtendedLineData[],
      };

  return (
    <RecurringInvoiceForm
      defaultValues={defaultValues}
      editId={editId ?? undefined}
      readonlyCustomer={
        editRecurring?.customer
          ? {
              id: editRecurring.customer.id,
              name: editRecurring.customer.name,
              nif: editRecurring.customer.nif,
            }
          : undefined
      }
      readonlyStartDate={editRecurring?.startDate?.split('T')[0]}
      readonlySeriesName={editRecurring?.series?.name}
      invoiceDefaults={invoiceDefaults ?? null}
    />
  );
}
