'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { InvoiceLineItem } from '@/components/facturas/InvoiceLineItem';
import { QuickCreateCustomerModal } from '@/components/clientes/QuickCreateCustomerModal';
import { InvoiceSplitLayout } from '@/components/common/InvoiceSplitLayout';
import { extendedLineSchema, EMPTY_LINE, ExtendedLineData } from '@/lib/invoice-line-types';
import { buildPreviewInvoice } from '@/lib/invoice-helpers';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useTenant } from '@/hooks/use-tenant';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import { useAuthStore } from '@/store/auth-store';
import { Frequency, PaymentMethod, SeriesType, Tenant } from '@easyfactura/shared-types';
import { FREQUENCY_OPTIONS, PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { cn, resolveUrl } from '@/lib/utils';

// ==================== SCHEMA ====================

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

/**
 * Computes the actual first invoice generation date, mirroring backend logic.
 * If dayOfMonth has already passed this month, returns next month's date.
 */
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

function NextRunSummary({
  startDate,
  frequency,
  dayOfMonth,
  hasEndDate,
  endDate,
}: {
  startDate: string;
  frequency: Frequency;
  dayOfMonth: number;
  hasEndDate: boolean;
  endDate?: string;
}) {
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

// ==================== PAGE ====================

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0]!;

  const [showQuickClient, setShowQuickClient] = useState(false);
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const createMutation = useCreateRecurringInvoice();
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({ active: true });
  const { data: defaultTemplate } = useDefaultTemplate();
  const { data: tenantData } = useTenant();
  const { data: seriesData } = useInvoiceSeries(currentYear);

  const customers = customersData?.data ?? [];
  const availableSeries = useMemo(
    () => (seriesData?.data ?? []).filter((s) => s.type === SeriesType.INVOICE),
    [seriesData],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      seriesId: '',
      frequency: Frequency.MONTHLY,
      dayOfMonth: 1,
      startDate: today,
      hasEndDate: false,
      endDate: '',
      autoConfirm: false,
      irpfPercent: undefined,
      discountPercent: undefined,
      paymentMethod: undefined,
      notes: '',
      lines: [{ ...EMPTY_LINE }] as ExtendedLineData[],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const watchedValues = form.watch();
  const errors = form.formState.errors;
  const hasEndDate = watchedValues.hasEndDate;

  // Synthetic preview invoice from recurring form data
  const previewInvoice = buildPreviewInvoice(
    {
      customerId: watchedValues.customerId,
      issueDate: today,
      lines: watchedValues.lines,
      discountPercent: watchedValues.discountPercent,
      irpfPercent: watchedValues.irpfPercent,
      paymentMethod: watchedValues.paymentMethod,
      notes: watchedValues.notes,
    },
    customers,
    null,
  );

  const source = tenantData ?? currentTenant;
  const previewTenant: Tenant | null = source
    ? ({ ...source, logoUrl: resolveUrl(source.logoUrl) ?? null } as Tenant)
    : null;

  const onSubmit = form.handleSubmit(
    async (data: FormData) => {
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
        notes: data.notes || undefined,
        lines: data.lines.map((line) => ({
          productId: line.productId,
          description: line.description,
          quantity: line._hideQty ? 1 : line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          hideQty: line._hideQty ?? false,
        })),
      });
      router.push('/dashboard/recurrentes');
    },
    () => toast.error('Revisa los campos obligatorios marcados en rojo'),
  );

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

      <InvoiceSplitLayout
        backHref="/dashboard/recurrentes"
        headerLeft={
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">
              Nueva factura recurrente
            </h1>
            <p className="text-xs text-muted-foreground">
              Se generará automáticamente con la frecuencia que elijas.
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
              onClick={() => router.push('/dashboard/recurrentes')}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => onSubmit()}
              disabled={createMutation.isPending}
              size="sm"
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear recurrente'}
            </Button>
          </>
        }
        invoice={previewInvoice}
        template={defaultTemplate ?? null}
        tenant={previewTenant}
        activeFieldSection={activeSection}
        onSectionClick={(fieldId) => {
          setActiveSection(fieldId);
          const el = document.getElementById(`field-${fieldId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        <form onSubmit={onSubmit} noValidate className="px-6 py-5 space-y-5">
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
                    onValueChange={(v) => form.setValue('customerId', v, { shouldValidate: true })}
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
              </section>

              {/* Serie */}
              <section id="field-seriesId" className="space-y-2">
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
              </section>

              {/* Método de pago */}
              <section id="field-paymentMethod" className="space-y-2">
                <Label>Método de pago</Label>
                <Select
                  value={watchedValues.paymentMethod ?? 'none'}
                  onValueChange={(v) =>
                    form.setValue('paymentMethod', v === 'none' ? undefined : (v as PaymentMethod))
                  }
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
              </section>
            </CardContent>
          </Card>

          {/* ── Repetición ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                Repetición
              </CardTitle>
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
                  <Label htmlFor="dayOfMonth">Día del mes</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min={1}
                    max={28}
                    {...form.register('dayOfMonth')}
                    className={errors.dayOfMonth ? 'border-destructive' : ''}
                  />
                  {errors.dayOfMonth && (
                    <p className="text-sm text-destructive">{errors.dayOfMonth.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Máx. 28 para compatibilidad con febrero
                  </p>
                </section>
              </div>

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

              <div className="flex items-center gap-3">
                <Switch
                  id="hasEndDate"
                  checked={hasEndDate}
                  onCheckedChange={(v) => form.setValue('hasEndDate', v)}
                />
                <Label htmlFor="hasEndDate" className="cursor-pointer font-normal">
                  Tiene fecha de fin
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
                      Si está desactivado, cada factura se crea como borrador para revisión.
                    </p>
                  </div>
                </div>
              </div>

              <NextRunSummary
                frequency={watchedValues.frequency}
                dayOfMonth={watchedValues.dayOfMonth}
                startDate={watchedValues.startDate}
                hasEndDate={hasEndDate}
                endDate={hasEndDate ? watchedValues.endDate : undefined}
              />
            </CardContent>
          </Card>

          {/* ── Líneas de factura ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Líneas de la factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div id="field-lines-section" className="space-y-3">
                {errors.lines?.root && (
                  <p className="text-sm text-destructive mb-2">{errors.lines.root.message}</p>
                )}
                {fields.map((field, index) => (
                  <InvoiceLineItem
                    key={field.id}
                    form={form as Parameters<typeof InvoiceLineItem>[0]['form']}
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
              <div className="grid grid-cols-2 gap-4">
                <section className="space-y-2">
                  <Label htmlFor="discountPercent">Descuento global (%)</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    placeholder="Ej: 5"
                    {...form.register('discountPercent')}
                  />
                </section>
                <section className="space-y-2">
                  <Label htmlFor="irpfPercent">IRPF (%)</Label>
                  <Input
                    id="irpfPercent"
                    type="number"
                    step="0.01"
                    min={0}
                    max={30}
                    placeholder="Ej: 15"
                    {...form.register('irpfPercent')}
                  />
                </section>
              </div>
            </CardContent>
          </Card>

          {/* ── Notas ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                placeholder="Notas que aparecerán en cada factura generada..."
                rows={3}
                {...form.register('notes')}
              />
            </CardContent>
          </Card>
        </form>
      </InvoiceSplitLayout>
    </>
  );
}
