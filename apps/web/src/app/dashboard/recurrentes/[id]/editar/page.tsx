'use client';

import { useCallback, useEffect } from 'react';
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import {
  useRecurringInvoice,
  useUpdateRecurringInvoice,
} from '@/hooks/use-recurring-invoices';
import { useCustomers } from '@/hooks/use-customers';
import { useInvoiceSeries } from '@/hooks/use-invoice-series';
import {
  RecurringFrequency,
  PaymentMethod,
  UpdateRecurringInvoiceInput,
} from '@easyfactura/shared-types';
import {
  PAYMENT_METHOD_LABELS,
  TAX_RATE_SELECT_OPTIONS,
} from '@easyfactura/shared-constants';

// ==================== CONSTANTS ====================

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: RecurringFrequency.MONTHLY, label: 'Mensual' },
  { value: RecurringFrequency.BIMONTHLY, label: 'Bimestral' },
  { value: RecurringFrequency.QUARTERLY, label: 'Trimestral' },
  { value: RecurringFrequency.SEMIANNUAL, label: 'Semestral' },
  { value: RecurringFrequency.ANNUAL, label: 'Anual' },
];

// ==================== SCHEMA ====================

const lineSchema = z.object({
  description: z.string().min(2).max(500),
  quantity: z.number({ invalid_type_error: 'Requerido' }).min(0.0001),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }).min(0),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  irpfRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
  name: z.string().min(2).max(200),
  customerId: z.string().uuid('Selecciona un cliente'),
  seriesId: z.string().uuid().optional(),
  frequency: z.nativeEnum(RecurringFrequency),
  dayOfMonth: z.number().int().min(1).max(28),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  maxOccurrences: z.number().int().min(1).optional(),
  lines: z.array(lineSchema).min(1),
  discountPercent: z.number().min(0).max(100).optional(),
  irpfPercent: z.number().min(0).max(100).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().max(1000).optional(),
  dueDays: z.number().int().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

// ==================== PAGE ====================

export default function EditarRecurrentePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const { data: recurring, isLoading } = useRecurringInvoice(id);
  const updateMutation = useUpdateRecurringInvoice(id);
  const { data: customersData } = useCustomers({ limit: 200 });
  const { data: seriesData } = useInvoiceSeries();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: RecurringFrequency.MONTHLY,
      dayOfMonth: 1,
      lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  // Pre-populate form when data loads
  useEffect(() => {
    if (!recurring) return;

    const lines = (recurring.lines as unknown as Array<Record<string, unknown>>).map((line) => ({
      description: String(line['description'] ?? ''),
      quantity: Number(line['quantity'] ?? 1),
      unitPrice: Number(line['unitPrice'] ?? 0),
      taxRate: Number(line['taxRate'] ?? 21),
      irpfRate: line['irpfRate'] != null ? Number(line['irpfRate']) : undefined,
    }));

    reset({
      name: recurring.name,
      customerId: recurring.customerId,
      seriesId: recurring.seriesId ?? undefined,
      frequency: recurring.frequency,
      dayOfMonth: recurring.dayOfMonth,
      startDate: recurring.startDate.split('T')[0],
      endDate: recurring.endDate ? recurring.endDate.split('T')[0] : undefined,
      maxOccurrences: recurring.maxOccurrences ?? undefined,
      lines,
      discountPercent: recurring.discountPercent ?? undefined,
      irpfPercent: recurring.irpfPercent ?? undefined,
      paymentMethod: recurring.paymentMethod ?? undefined,
      notes: recurring.notes ?? undefined,
      dueDays: recurring.dueDays ?? undefined,
    });
  }, [recurring, reset]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      const payload: UpdateRecurringInvoiceInput = {
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

      await updateMutation.mutateAsync(payload);
      router.push(`/dashboard/recurrentes/${id}`);
    },
    [updateMutation, router, id],
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const watchedFrequency = watch('frequency');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/recurrentes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar factura recurrente</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{recurring?.name}</p>
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
              <Input id="name" {...register('name')} className="mt-1" />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerId">Cliente *</Label>
              <Select
                onValueChange={(v) => setValue('customerId', v)}
                value={watch('customerId')}
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
            </div>

            <div>
              <Label>Serie de facturación</Label>
              <Select
                onValueChange={(v) => setValue('seriesId', v === '__default__' ? undefined : v)}
                value={watch('seriesId') ?? '__default__'}
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
                <Label>Frecuencia *</Label>
                <Select
                  onValueChange={(v) => setValue('frequency', v as RecurringFrequency)}
                  value={watchedFrequency}
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
              </div>

              <div>
                <Label>Día del mes (1-28) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  {...register('dayOfMonth', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de inicio *</Label>
                <Input type="date" {...register('startDate')} className="mt-1" />
              </div>
              <div>
                <Label>Fecha de fin (opcional)</Label>
                <Input type="date" {...register('endDate')} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Número máximo de generaciones</Label>
              <Input
                type="number"
                min={1}
                placeholder="Sin límite"
                {...register('maxOccurrences', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Líneas de factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 p-3 border rounded-lg bg-muted/20">
                <div>
                  <Label>Descripción *</Label>
                  <Input
                    {...register(`lines.${index}.description`)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Precio unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>IVA (%)</Label>
                    <Select
                      onValueChange={(v) => setValue(`lines.${index}.taxRate`, Number(v))}
                      value={String(watch(`lines.${index}.taxRate`) ?? 21)}
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

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 21 })}
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
                  value={watch('paymentMethod') ?? '__none__'}
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
              <Textarea {...register('notes')} className="mt-1" rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/recurrentes/${id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
