'use client';

import { useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Info } from 'lucide-react';
import { useCreateRecurringInvoice } from '@/hooks/use-recurring-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import {
  RecurringFrequency,
  PaymentMethod,
  CreateRecurringInvoiceInput,
} from '@easyfactura/shared-types';
import {
  PAYMENT_METHOD_LABELS,
  TAX_RATE_SELECT_OPTIONS,
} from '@easyfactura/shared-constants';

// ==================== CONSTANTS ====================

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string; description: string }[] = [
  { value: RecurringFrequency.MONTHLY, label: 'Mensual', description: 'Cada mes' },
  { value: RecurringFrequency.BIMONTHLY, label: 'Bimestral', description: 'Cada 2 meses' },
  { value: RecurringFrequency.QUARTERLY, label: 'Trimestral', description: 'Cada 3 meses' },
  { value: RecurringFrequency.SEMIANNUAL, label: 'Semestral', description: 'Cada 6 meses' },
  { value: RecurringFrequency.ANNUAL, label: 'Anual', description: 'Una vez al año' },
];

const FREQUENCY_MONTHS: Record<RecurringFrequency, number> = {
  [RecurringFrequency.MONTHLY]: 1,
  [RecurringFrequency.BIMONTHLY]: 2,
  [RecurringFrequency.QUARTERLY]: 3,
  [RecurringFrequency.SEMIANNUAL]: 6,
  [RecurringFrequency.ANNUAL]: 12,
};

// ==================== DATE HELPERS ====================

/**
 * BUG-05 FIX: Computes the first run date in UTC (not local time) to match backend behavior.
 *
 * When a user in UTC+2 picks startDate=YYYY-07-01 and dayOfMonth=1:
 * - OLD (local): new Date('YYYY-07-01') → may parse as YYYY-06-30T22:00:00Z → picks wrong day
 * - NEW (UTC):   builds Date.UTC(YYYY, 6, 1) directly → always YYYY-07-01T00:00:00Z
 */
function computeFirstRunDateUTC(
  startDateStr: string,
  frequency: RecurringFrequency,
  dayOfMonth: number,
): string | null {
  if (!startDateStr || !frequency || !dayOfMonth) return null;

  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  if (!yearStr || !monthStr || !dayStr) return null;

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-based
  const months = FREQUENCY_MONTHS[frequency];

  // Build a UTC date at the day-of-month for the start month
  const daysInStartMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(dayOfMonth, daysInStartMonth);
  const startUTC = new Date(Date.UTC(year, month, clampedDay));

  // Parse startDate as UTC reference
  const startDateUTC = new Date(Date.UTC(year, month, parseInt(dayStr, 10)));

  let candidateYear = year;
  let candidateMonth = month;

  if (startUTC > startDateUTC) {
    // The dayOfMonth in the start month is after the startDate → use it
  } else {
    // Advance by one period
    candidateMonth += months;
    candidateYear += Math.floor(candidateMonth / 12);
    candidateMonth = candidateMonth % 12;
  }

  const daysInCandidateMonth = new Date(Date.UTC(candidateYear, candidateMonth + 1, 0)).getUTCDate();
  const finalDay = Math.min(dayOfMonth, daysInCandidateMonth);
  const result = new Date(Date.UTC(candidateYear, candidateMonth, finalDay));

  return result.toISOString().split('T')[0]!;
}

function formatDateDisplay(isoDate: string): string {
  // Parse as UTC to avoid off-by-one from timezone
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// ==================== SCHEMA ====================

const lineSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(500),
  quantity: z.number({ invalid_type_error: 'Requerido' }).min(0.0001, 'Debe ser mayor a 0'),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }).min(0),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  irpfRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  customerId: z.string().uuid('Selecciona un cliente'),
  seriesId: z.string().uuid().optional(),
  frequency: z.nativeEnum(RecurringFrequency),
  dayOfMonth: z.number().int().min(1).max(28),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().optional(),
  maxOccurrences: z.number().int().min(1).optional(),
  lines: z.array(lineSchema).min(1, 'Añade al menos una línea'),
  discountPercent: z.number().min(0).max(100).optional(),
  irpfPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().max(1000).optional(),
  dueDays: z.number().int().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

// ==================== PAGE ====================

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const createMutation = useCreateRecurringInvoice();
  const { data: customersData } = useCustomers({ limit: 200 });
  const { data: seriesData } = useInvoiceSeries();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: RecurringFrequency.MONTHLY,
      dayOfMonth: 1,
      startDate: new Date().toISOString().split('T')[0],
      lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const watchedFrequency = watch('frequency');
  const watchedDayOfMonth = watch('dayOfMonth');
  const watchedStartDate = watch('startDate');

  // BUG-05 FIX: Compute preview in UTC
  const firstRunPreview = computeFirstRunDateUTC(
    watchedStartDate,
    watchedFrequency,
    watchedDayOfMonth,
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      const payload: CreateRecurringInvoiceInput = {
        name: data.name,
        customerId: data.customerId,
        seriesId: data.seriesId || undefined,
        frequency: data.frequency,
        dayOfMonth: data.dayOfMonth,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        maxOccurrences: data.maxOccurrences,
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
        notes: data.notes,
        dueDays: data.dueDays,
      };

      const created = await createMutation.mutateAsync(payload);

      // UX-02 FIX: Redirect to detail page instead of list
      router.push(`/dashboard/recurrentes/${created.id}`);
    },
    [createMutation, router],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/recurrentes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva factura recurrente</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Configura la plantilla y la periodicidad de emisión
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre descriptivo *</Label>
              <Input
                id="name"
                placeholder="Ej: Servicios mensuales Empresa XYZ"
                {...register('name')}
                className="mt-1"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerId">Cliente *</Label>
              <Select
                onValueChange={(v) => setValue('customerId', v)}
                defaultValue=""
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customersData?.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-destructive text-xs mt-1">{errors.customerId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="seriesId">Serie de facturación</Label>
              <Select
                onValueChange={(v) => setValue('seriesId', v === '__default__' ? undefined : v)}
                defaultValue="__default__"
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Serie predeterminada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Serie predeterminada</SelectItem>
                  {seriesData?.data.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.prefix} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Periodicidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frecuencia *</Label>
                <Select
                  onValueChange={(v) => setValue('frequency', v as RecurringFrequency)}
                  defaultValue={RecurringFrequency.MONTHLY}
                >
                  <SelectTrigger className="mt-1">
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
                {errors.frequency && (
                  <p className="text-destructive text-xs mt-1">{errors.frequency.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dayOfMonth">Día del mes (1-28) *</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min={1}
                  max={28}
                  {...register('dayOfMonth', { valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.dayOfMonth && (
                  <p className="text-destructive text-xs mt-1">{errors.dayOfMonth.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha de inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  className="mt-1"
                />
                {errors.startDate && (
                  <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">Fecha de fin (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxOccurrences">Número máximo de generaciones (opcional)</Label>
              <Input
                id="maxOccurrences"
                type="number"
                min={1}
                placeholder="Sin límite"
                {...register('maxOccurrences', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
                className="mt-1"
              />
            </div>

            {/* BUG-05 FIX: Preview computed in UTC */}
            {firstRunPreview && (
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Primera generación:</strong> {formatDateDisplay(firstRunPreview)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Líneas de factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 p-3 border rounded-lg bg-muted/20"
              >
                <div>
                  <Label>Descripción *</Label>
                  <Input
                    placeholder="Descripción del servicio o producto"
                    {...register(`lines.${index}.description`)}
                    className="mt-1"
                  />
                  {errors.lines?.[index]?.description && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.lines[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min={0.0001}
                      step="any"
                      {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Precio unit.</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>IVA (%)</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue(`lines.${index}.taxRate`, Number(v))
                      }
                      defaultValue="21"
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_RATE_SELECT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>IRPF línea (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      placeholder="—"
                      {...register(`lines.${index}.irpfRate`, {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {fields.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar línea
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {errors.lines?.root && (
              <p className="text-destructive text-sm">{errors.lines.root.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({ description: '', quantity: 1, unitPrice: 0, taxRate: 21 })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir línea
            </Button>
          </CardContent>
        </Card>

        {/* Payment & notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pago y notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Método de pago</Label>
                <Select
                  onValueChange={(v) =>
                    setValue('paymentMethod', v === '__none__' ? undefined : (v as PaymentMethod))
                  }
                  defaultValue="__none__"
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin especificar</SelectItem>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Días de vencimiento</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ej: 30"
                  {...register('dueDays', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas que aparecerán en cada factura generada..."
                {...register('notes')}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/recurrentes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Guardando...' : 'Crear factura recurrente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
