'use client';

import { z } from 'zod';
import type { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { formatSeriesPreview } from '@easyfactura/shared-validators';

export const invoiceSeriesEditSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  prefix: z.string().min(1, 'El prefijo es obligatorio').max(20, 'Máximo 20 caracteres'),
  isDefault: z.boolean().optional(),
  nextNumber: z
    .number()
    .int()
    .min(1, 'El número inicial debe ser al menos 1')
    .optional()
    .or(z.nan().transform(() => undefined)),
});

export type InvoiceSeriesEditValues = z.infer<typeof invoiceSeriesEditSchema>;

interface InvoiceSeriesFormFieldsProps {
  form: UseFormReturn<InvoiceSeriesEditValues>;
  year: number;
  showIsDefault?: boolean;
  showNextNumber?: boolean;
}

export function InvoiceSeriesFormFields({
  form,
  year,
  showIsDefault = true,
  showNextNumber = false,
}: InvoiceSeriesFormFieldsProps) {
  const watchedPrefix = form.watch('prefix');
  const watchedNextNumber = form.watch('nextNumber');
  const startAt = watchedNextNumber && !isNaN(watchedNextNumber) ? watchedNextNumber : 1;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="series-name">Nombre descriptivo *</Label>
        <Input id="series-name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="series-prefix">Prefijo de numeración *</Label>
        <Input id="series-prefix" placeholder={`F${year}-`} {...form.register('prefix')} />
        {watchedPrefix ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Ej:{' '}
            <span className="font-mono">{formatSeriesPreview(watchedPrefix, year, startAt)}</span>
            {', '}
            <span className="font-mono">
              {formatSeriesPreview(watchedPrefix, year, startAt + 1)}
            </span>
            ...
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Escribe un prefijo para ver cómo quedarán las facturas
          </p>
        )}
        {form.formState.errors.prefix && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.prefix.message}</p>
        )}
      </div>

      {showNextNumber && (
        <div>
          <Label htmlFor="series-nextNumber">Número inicial</Label>
          <Input
            id="series-nextNumber"
            type="number"
            min={1}
            placeholder="1"
            {...form.register('nextNumber', { valueAsNumber: true })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Útil si ya has emitido facturas este año y quieres continuar desde ese número
          </p>
          {form.formState.errors.nextNumber && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.nextNumber.message}
            </p>
          )}
        </div>
      )}

      {showIsDefault && (
        <div className="flex items-center gap-3">
          <Switch
            id="series-isDefault"
            checked={form.watch('isDefault') ?? false}
            onCheckedChange={(v) => form.setValue('isDefault', v)}
          />
          <Label htmlFor="series-isDefault" className="cursor-pointer">
            Usar como serie por defecto
          </Label>
        </div>
      )}
    </div>
  );
}
