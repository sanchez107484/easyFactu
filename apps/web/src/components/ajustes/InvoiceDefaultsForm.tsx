'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useInvoiceDefaults, useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useUpdateTemplate, useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { useTenant, useUpdateTenant } from '@/hooks/use-tenant';
import { InvoiceLayout, PaymentMethod } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import {
  PaymentDetailsFields,
  PaymentDetailsValues,
} from '@/components/facturas/PaymentDetailsFields';
import { Path } from 'react-hook-form';

// ==================== SCHEMA ====================

const defaultsSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  paymentDetails: z
    .object({
      iban: z.string().optional(),
      bic: z.string().optional(),
      accountHolder: z.string().optional(),
      bizumPhone: z.string().optional(),
      paypalEmail: z.string().optional(),
      paymentNote: z.string().max(300, 'Máximo 300 caracteres').optional(),
    })
    .optional()
    .nullable(),
  irpfPercent: z.number().min(0).max(100).optional().nullable(),
  dueDays: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
});

type DefaultsFormData = z.infer<typeof defaultsSchema>;

// ==================== COMPONENT ====================

export function InvoiceDefaultsForm() {
  const { data: defaults, isLoading: loadingDefaults } = useInvoiceDefaults();
  const { data: tenantData } = useTenant();
  const { data: defaultTemplate, isLoading: loadingTemplate } = useDefaultTemplate();
  const updateDefaults = useUpdateInvoiceDefaults();
  const updateTenant = useUpdateTenant();
  const updateTemplate = useUpdateTemplate();

  const form = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsSchema),
    defaultValues: {
      paymentMethod: null,
      paymentDetails: {},
      irpfPercent: null,
      dueDays: null,
      notes: '',
    },
  });

  const [ready, setReady] = useState(false);

  // Efecto 1: inicializa el formulario en cuanto llegan los invoice_defaults
  useEffect(() => {
    if (defaults === undefined) return;
    form.reset({
      paymentMethod: (defaults?.paymentMethod as PaymentMethod | null | undefined) ?? null,
      paymentDetails: (defaults?.paymentDetails as DefaultsFormData['paymentDetails']) ?? {},
      irpfPercent: defaults?.irpfPercent != null ? Number(defaults.irpfPercent) : null,
      dueDays: defaults?.dueDays ?? null,
      notes: defaults?.notes ?? '',
    });
    setReady(true);
  }, [defaults]); // eslint-disable-line react-hooks/exhaustive-deps

  // Efecto 2: una vez el formulario está listo, rellena las notas desde la plantilla
  // si invoice_defaults.notes está vacío (datos históricos no sincronizados)
  useEffect(() => {
    if (!ready || defaultTemplate === undefined) return;
    const templateNotes = defaultTemplate?.layout?.notes?.defaultText ?? null;
    if (!form.getValues('notes') && templateNotes) {
      form.setValue('notes', templateNotes, { shouldDirty: false });
    }
  }, [ready, defaultTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedMethod = form.watch('paymentMethod') as PaymentMethod | null | undefined;
  const watchedPD = form.watch('paymentDetails') as PaymentDetailsValues | null | undefined;
  const watchedDueDays = form.watch('dueDays');

  function onSubmit(data: DefaultsFormData) {
    // Si el método es transferencia, sincronizamos IBAN también en el tenant
    if (
      data.paymentMethod === PaymentMethod.BANK_TRANSFER &&
      (data.paymentDetails?.iban || data.paymentDetails?.accountHolder || data.paymentDetails?.bic)
    ) {
      updateTenant.mutate({
        iban: data.paymentDetails?.iban?.replace(/\s/g, '') ?? undefined,
        bankAccountHolder: data.paymentDetails?.accountHolder ?? undefined,
        bic: data.paymentDetails?.bic?.trim() || undefined,
      });
    }

    updateDefaults.mutate({
      paymentMethod: (data.paymentMethod as PaymentMethod) ?? null,
      paymentDetails: data.paymentDetails ?? null,
      irpfPercent: data.irpfPercent ?? null,
      dueDays: data.dueDays ?? null,
      notes: data.notes || null,
    });

    // Sincronizar las notas con la plantilla PDF predeterminada
    if (defaultTemplate) {
      const currentLayout = defaultTemplate.layout as InvoiceLayout;
      const currentDefaultText = currentLayout.notes?.defaultText ?? null;
      const newNotes = data.notes || null;

      if (currentDefaultText !== newNotes) {
        updateTemplate.mutate({
          id: defaultTemplate.id,
          data: {
            layout: {
              ...currentLayout,
              notes: {
                show: currentLayout.notes?.show !== false,
                showLabel: currentLayout.notes?.showLabel !== false,
                defaultText: newNotes ?? undefined,
              },
            },
          },
        });
      }
    }
  }

  if (loadingDefaults || !ready) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const isPending = updateDefaults.isPending || updateTenant.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Método de pago predeterminado */}
      <div className="space-y-2">
        <Label>Método de pago predeterminado</Label>
        <Select
          key={`pm-${watchedMethod ?? 'none'}-${ready}`}
          defaultValue={watchedMethod ?? 'none'}
          onValueChange={(v) => {
            form.setValue('paymentMethod', v !== 'none' ? (v as PaymentMethod) : null);
            form.setValue('paymentDetails', {});
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sin predeterminado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin predeterminado</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detalles del método de pago */}
      {watchedMethod && (
        <PaymentDetailsFields
          paymentMethod={watchedMethod}
          values={(watchedPD ?? {}) as PaymentDetailsValues}
          onChange={(key, value) =>
            form.setValue(`paymentDetails.${key}` as Path<DefaultsFormData>, value)
          }
          tenantIban={tenantData?.iban ?? undefined}
          tenantAccountHolder={tenantData?.bankAccountHolder ?? undefined}
          tenantBic={tenantData?.bic ?? undefined}
        />
      )}

      {/* Retención IRPF */}
      <div className="space-y-2">
        <Label htmlFor="def-irpf">Retención IRPF por defecto (%)</Label>
        <Input
          id="def-irpf"
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="Sin retención"
          {...form.register('irpfPercent', {
            setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
          })}
        />
        <p className="text-xs text-muted-foreground">
          Introduce 15 para aplicar el 15% de IRPF en cada nueva factura
        </p>
        {form.formState.errors.irpfPercent && (
          <p className="text-xs text-destructive">{form.formState.errors.irpfPercent.message}</p>
        )}
      </div>

      {/* Días de vencimiento */}
      <div className="space-y-2">
        <Label>Días de vencimiento por defecto</Label>
        <Select
          key={`dd-${watchedDueDays ?? 'none'}-${ready}`}
          defaultValue={watchedDueDays != null ? String(watchedDueDays) : 'none'}
          onValueChange={(v) => form.setValue('dueDays', v !== 'none' ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sin vencimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin vencimiento</SelectItem>
            <SelectItem value="15">15 días</SelectItem>
            <SelectItem value="30">30 días</SelectItem>
            <SelectItem value="45">45 días</SelectItem>
            <SelectItem value="60">60 días</SelectItem>
            <SelectItem value="90">90 días</SelectItem>
          </SelectContent>
        </Select>
        {watchedDueDays != null && (
          <p className="text-xs text-muted-foreground">
            La fecha de vencimiento se calculará automáticamente
          </p>
        )}
      </div>

      {/* Notas predeterminadas */}
      <div className="space-y-2">
        <Label htmlFor="def-notes">Notas predeterminadas</Label>
        <Textarea
          id="def-notes"
          rows={2}
          placeholder="Ej: Gracias por su confianza..."
          {...form.register('notes')}
        />
        <p className="text-xs text-muted-foreground">
          Se rellenarán automáticamente en cada nueva factura y se mostrarán en el PDF
        </p>
        {form.formState.errors.notes && (
          <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar preferencias
      </Button>
    </form>
  );
}
