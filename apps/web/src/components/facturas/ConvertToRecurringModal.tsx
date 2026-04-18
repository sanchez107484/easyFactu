'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Frequency } from '@easyfactura/shared-types';
import { FREQUENCY_OPTIONS } from '@easyfactura/shared-constants';

// ==================== SCHEMA ====================

const schema = z
  .object({
    frequency: z.nativeEnum(Frequency),
    dayOfMonth: z.coerce
      .number()
      .min(1, 'Mínimo 1')
      .max(28, 'Máximo 28 para compatibilidad con todos los meses'),
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
    hasEndDate: z.boolean(),
    endDate: z.string().optional(),
    autoConfirm: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.hasEndDate || !data.endDate) return true;
      return data.endDate >= data.startDate;
    },
    { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['endDate'] },
  );

export type RecurringSettings = z.infer<typeof schema>;

// ==================== COMPONENT ====================

interface ConvertToRecurringModalProps {
  open: boolean;
  customerName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (settings: RecurringSettings) => void;
}

export function ConvertToRecurringModal({
  open,
  customerName,
  isPending,
  onCancel,
  onConfirm,
}: ConvertToRecurringModalProps) {
  const today = new Date().toISOString().split('T')[0]!;
  const todayDay = new Date().getDate();

  const form = useForm<RecurringSettings>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: Frequency.MONTHLY,
      dayOfMonth: todayDay <= 28 ? todayDay : 28,
      startDate: today,
      hasEndDate: false,
      endDate: '',
      autoConfirm: false,
    },
  });

  const hasEndDate = form.watch('hasEndDate');
  const errors = form.formState.errors;

  const handleSubmit = form.handleSubmit((data) => onConfirm(data));

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>Hacer recurrente</DialogTitle>
          </div>
          <DialogDescription>
            Se creará una factura recurrente para <strong>{customerName}</strong> con los mismos
            datos. Las próximas facturas se generarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select
                value={form.watch('frequency')}
                onValueChange={(v) => form.setValue('frequency', v as Frequency)}
              >
                <SelectTrigger>
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
              <Label htmlFor="modal-dayOfMonth">Día del mes</Label>
              <Input
                id="modal-dayOfMonth"
                type="number"
                min={1}
                max={28}
                {...form.register('dayOfMonth')}
                className={errors.dayOfMonth ? 'border-destructive' : ''}
              />
              {errors.dayOfMonth && (
                <p className="text-xs text-destructive">{errors.dayOfMonth.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-startDate">Primera factura a partir de</Label>
            <Input
              id="modal-startDate"
              type="date"
              {...form.register('startDate')}
              className={errors.startDate ? 'border-destructive' : ''}
            />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="modal-hasEndDate"
              checked={hasEndDate}
              onCheckedChange={(v) => form.setValue('hasEndDate', v)}
            />
            <Label htmlFor="modal-hasEndDate" className="cursor-pointer font-normal">
              Tiene fecha de fin
            </Label>
          </div>

          {hasEndDate && (
            <div className="space-y-2">
              <Label htmlFor="modal-endDate">Fecha de fin</Label>
              <Input
                id="modal-endDate"
                type="date"
                {...form.register('endDate')}
                className={errors.endDate ? 'border-destructive' : ''}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3 flex items-start gap-3">
            <Switch
              id="modal-autoConfirm"
              checked={form.watch('autoConfirm')}
              onCheckedChange={(v) => form.setValue('autoConfirm', v)}
              className="mt-0.5 shrink-0"
            />
            <div>
              <Label htmlFor="modal-autoConfirm" className="cursor-pointer leading-tight">
                Confirmar automáticamente
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Si está desactivado, cada factura generada se crea como borrador para revisarla
                antes de enviar.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Creando...' : 'Hacer recurrente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
