'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
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
import { ArrowLeft, Plus, Trash2, CalendarClock, Info } from 'lucide-react';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import {
  PaymentMethod,
  RecurringFrequency,
  CreateRecurringInvoiceInput,
} from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS, VALID_TAX_RATES } from '@easyfactura/shared-constants';
import { cn } from '@/lib/utils';

// ==================== CONSTANTS ====================

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string; description: string }[] = [
  { value: RecurringFrequency.WEEKLY, label: 'Semanal', description: 'Cada 7 días' },
  { value: RecurringFrequency.BIWEEKLY, label: 'Quincenal', description: 'Cada 14 días' },
  { value: RecurringFrequency.MONTHLY, label: 'Mensual', description: 'Una vez al mes' },
  { value: RecurringFrequency.QUARTERLY, label: 'Trimestral', description: 'Cada 3 meses' },
  { value: RecurringFrequency.YEARLY, label: 'Anual', description: 'Una vez al año' },
];

// ==================== SCHEMA ====================

const lineSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  quantity: z
    .number({ invalid_type_error: 'Requerido' })
    .min(0.0001, 'Debe ser mayor que 0'),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }).min(0),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  irpfRate: z.number().min(0).max(100).optional(),
});

const formSchema = z.object({
  customerId: z.string().min(1, 'Selecciona un cliente'),
  seriesId: z.string().optional(),
  frequency: z.nativeEnum(RecurringFrequency),
  dayOfMonth: z
    .number({ invalid_type_error: 'Requerido' })
    .int()
    .min(1, 'Mínimo día 1')
    .max(28, 'Máximo día 28'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().optional(),
  maxOccurrences: z.number().int().min(1).optional(),
  description: z.string().max(200).optional(),
  lines: z.array(lineSchema).min(1, 'Añade al menos una línea').max(50),
  discountPercent: z.number().min(0).max(100).optional(),
  irpfPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().max(1000).optional(),
  dueDays: z.number().int().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

// ==================== HELPERS ====================

/**
 * BUG-05 fix: Compute first run date in UTC so preview matches server behavior.
 *
 * The backend uses UTC exclusively when computing nextRunDate via computeNextRunDate().
 * If we used the local Date constructor here (e.g. new Date(startDate)) the displayed
 * preview would be one day off for users in UTC+2 timezones because
 * new Date('2025-06-01') is interpreted as midnight UTC but getDate/getMonth returns
 * the LOCAL (UTC+2) equivalent.
 */
function computeFirstRunDateUTC(
  frequency: RecurringFrequency,
  dayOfMonth: number,
  startDateStr: string,
): string {
  if (!startDateStr) return '';

  const safeDay = Math.min(dayOfMonth, 28);
  const [yearStr, monthStr] = startDateStr.split('-');
  if (!yearStr || !monthStr) return '';

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  // Candidate: same month as startDate, on the target day (all UTC)
  let candidateTs = Date.UTC(year, month, safeDay);
  const refTs = Date.UTC(year, month, parseInt(startDateStr.split('-')[2] ?? '1', 10));

  if (candidateTs <= refTs) {
    // Advance by one period
    const c = new Date(candidateTs);
    const cy = c.getUTCFullYear();
    const cm = c.getUTCMonth();
    const cd = c.getUTCDate();

    switch (frequency) {
      case RecurringFrequency.WEEKLY:
        candidateTs = Date.UTC(cy, cm, cd + 7);
        break;
      case RecurringFrequency.BIWEEKLY:
        candidateTs = Date.UTC(cy, cm, cd + 14);
        break;
      case RecurringFrequency.MONTHLY:
        candidateTs = Date.UTC(cy, cm + 1, cd);
        break;
      case RecurringFrequency.QUARTERLY:
        candidateTs = Date.UTC(cy, cm + 3, cd);
        break;
      case RecurringFrequency.YEARLY:
        candidateTs = Date.UTC(cy + 1, cm, cd);
        break;
    }
  }

  const d = new Date(candidateTs);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function todayISOString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

// ==================== PAGE ====================

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const createMutation = useCreateRecurringInvoice();

  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ active: true });
  const { data: seriesData, isLoading: isLoadingSeries } = useInvoiceSeries();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: RecurringFrequency.MONTHLY,
      dayOfMonth: 1,
      startDate: todayISOString(),
      lines: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 21,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });

  const watchFrequency = form.watch('frequency');
  const watchDayOfMonth = form.watch('dayOfMonth');
  const watchStartDate = form.watch('startDate');

  // BUG-05 fix: preview uses UTC-based computation
  const firstRunPreview = useMemo(
    () => computeFirstRunDateUTC(watchFrequency, watchDayOfMonth ?? 1, watchStartDate ?? ''),
    [watchFrequency, watchDayOfMonth, watchStartDate],
  );

  async function onSubmit(data: FormData) {
    const input: CreateRecurringInvoiceInput = {
      customerId: data.customerId,
      seriesId: data.seriesId || undefined,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      maxOccurrences: data.maxOccurrences,
      description: data.description || undefined,
      lines: data.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        irpfRate: l.irpfRate,
      })),
      discountPercent: data.discountPercent,
      irpfPercent: data.irpfPercent,
      paymentMethod: data.paymentMethod,
      notes: data.notes || undefined,
      dueDays: data.dueDays,
    };

    const created = await createMutation.mutateAsync(input);
    // UX-02: Redirect to detail, not list
    router.push(`/dashboard/recurrentes/${created.id}`);
  }

  const isLoading = isLoadingCustomers || isLoadingSeries;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/recurrentes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Nueva factura recurrente</h1>
          <p className="text-sm text-muted-foreground">
            Configura la factura que se generará automáticamente
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client & Series */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente y serie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('customerId')}
                onValueChange={(v) => form.setValue('customerId', v)}
              >
                <SelectTrigger id="customerId" className={cn(form.formState.errors.customerId && 'border-destructive')}>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customersData?.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.nif}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && (
                <p className="text-xs text-destructive">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seriesId">Serie de facturación</Label>
              <Select
                value={form.watch('seriesId') ?? ''}
                onValueChange={(v) => form.setValue('seriesId', v || undefined)}
              >
                <SelectTrigger id="seriesId">
                  <SelectValue placeholder="Serie por defecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Serie por defecto</SelectItem>
                  {seriesData?.data.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.prefix} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                placeholder="Ej: Servicio mensual de mantenimiento"
                {...form.register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Programación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">
                  Frecuencia <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('frequency')}
                  onValueChange={(v) => form.setValue('frequency', v as RecurringFrequency)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">
                  Día del mes <span className="text-destructive">*</span>
                  <span className="ml-1 text-xs text-muted-foreground">(máx. 28)</span>
                </Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min={1}
                  max={28}
                  {...form.register('dayOfMonth', { valueAsNumber: true })}
                  className={cn(form.formState.errors.dayOfMonth && 'border-destructive')}
                />
                {form.formState.errors.dayOfMonth && (
                  <p className="text-xs text-destructive">{form.formState.errors.dayOfMonth.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Fecha de inicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register('startDate')}
                  className={cn(form.formState.errors.startDate && 'border-destructive')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de fin (opcional)</Label>
                <Input id="endDate" type="date" {...form.register('endDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOccurrences">Número máximo de generaciones (opcional)</Label>
              <Input
                id="maxOccurrences"
                type="number"
                min={1}
                placeholder="Sin límite"
                {...form.register('maxOccurrences', { valueAsNumber: true })}
              />
            </div>

            {/* Preview */}
            {firstRunPreview && (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm">
                <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-blue-700 dark:text-blue-300">
                  <strong>Primera generación:</strong> {firstRunPreview}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Líneas de factura</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: '', quantity: 1, unitPrice: 0, taxRate: 21 })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir línea
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-start border rounded-md p-3"
              >
                {/* Description */}
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs">Descripción</Label>
                  <Input
                    placeholder="Descripción del servicio o producto"
                    {...form.register(`lines.${index}.description`)}
                    className={cn(
                      form.formState.errors.lines?.[index]?.description && 'border-destructive',
                    )}
                  />
                </div>
                {/* Quantity */}
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min={0.0001}
                    {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                {/* Unit Price */}
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">P. unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </div>
                {/* Tax Rate */}
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">IVA (%)</Label>
                  <Select
                    value={String(form.watch(`lines.${index}.taxRate`))}
                    onValueChange={(v) =>
                      form.setValue(`lines.${index}.taxRate`, Number(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_TAX_RATES.map((rate) => (
                        <SelectItem key={rate} value={String(rate)}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Remove */}
                <div className="col-span-12 sm:col-span-1 flex items-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {form.formState.errors.lines?.message && (
              <p className="text-xs text-destructive">{form.formState.errors.lines.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pago y configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de pago</Label>
                <Select
                  value={form.watch('paymentMethod') ?? ''}
                  onValueChange={(v) =>
                    form.setValue('paymentMethod', (v || undefined) as PaymentMethod | undefined)
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin especificar</SelectItem>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDays">Días de vencimiento</Label>
                <Input
                  id="dueDays"
                  type="number"
                  min={0}
                  placeholder="Sin vencimiento"
                  {...form.register('dueDays', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="irpfPercent">IRPF global (%)</Label>
                <Input
                  id="irpfPercent"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="0"
                  {...form.register('irpfPercent', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPercent">Descuento global (%)</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="0"
                  {...form.register('discountPercent', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas que aparecerán en cada factura generada"
                {...form.register('notes')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/recurrentes">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            <CalendarClock className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creando…' : 'Crear factura recurrente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
