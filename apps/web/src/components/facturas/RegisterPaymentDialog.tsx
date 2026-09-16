'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Coins, SplitSquareHorizontal } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePayment } from '@/hooks/use-invoices';
import { PaymentMethod, PaymentType } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { cn, formatCurrency } from '@/lib/utils';

function buildPaymentSchema(isCreditNote: boolean) {
  return z.object({
    amount: z
      .number({ invalid_type_error: 'El importe es obligatorio' })
      .refine((val) => val !== 0, {
        message: isCreditNote
          ? 'El importe del abono debe ser distinto de 0'
          : 'El importe debe ser mayor que 0',
      })
      .refine((val) => (isCreditNote ? val > 0 : true), {
        message: 'El importe del abono debe ser positivo',
      }),
    paymentDate: z.string().min(1, 'La fecha es obligatoria'),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    notes: z.string().max(500).optional(),
  });
}

type PartialPaymentFormData = z.infer<ReturnType<typeof buildPaymentSchema>>;

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceTotal: number;
  amountPaid: number;
  defaultPaymentMethod?: PaymentMethod | null;
  invoiceNumber?: string | null;
  customerName?: string;
}

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceTotal,
  amountPaid,
  defaultPaymentMethod,
  invoiceNumber,
  customerName,
}: RegisterPaymentDialogProps) {
  const isCreditNote = invoiceTotal < 0;

  const remaining = useMemo(
    () => Math.round((invoiceTotal - amountPaid) * 100) / 100,
    [invoiceTotal, amountPaid],
  );
  const displayRemaining = Math.abs(remaining);

  const schema = useMemo(() => buildPaymentSchema(isCreditNote), [isCreditNote]);

  const createPayment = useCreatePayment();
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.FULL);

  const form = useForm<PartialPaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: displayRemaining,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: defaultPaymentMethod ?? undefined,
      notes: '',
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const newRemaining = Math.abs(Math.round((invoiceTotal - amountPaid) * 100) / 100);
      setPaymentType(PaymentType.FULL);
      form.reset({
        amount: newRemaining,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: defaultPaymentMethod ?? undefined,
        notes: '',
      });
    }
    onOpenChange(isOpen);
  };

  const handlePaymentTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    if (type === PaymentType.FULL) {
      form.setValue('amount', displayRemaining, { shouldValidate: true });
    }
  };

  const toBackendAmount = (displayAmount: number) =>
    isCreditNote ? -Math.abs(displayAmount) : displayAmount;

  const handleFullPayment = () => {
    createPayment.mutate(
      {
        invoiceId,
        data: {
          amount: toBackendAmount(displayRemaining),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: defaultPaymentMethod ?? undefined,
          notes: undefined,
        },
      },
      {
        onSuccess: () => handleOpenChange(false),
      },
    );
  };

  const onSubmitPartial = (data: PartialPaymentFormData) => {
    createPayment.mutate(
      {
        invoiceId,
        data: {
          amount: toBackendAmount(data.amount),
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          notes: data.notes || undefined,
        },
      },
      {
        onSuccess: () => handleOpenChange(false),
      },
    );
  };

  const actionLabel = isCreditNote ? 'abono' : 'cobro';
  const verb = isCreditNote ? 'Abonar' : 'Cobrar';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreditNote ? 'Registrar abono / devolución' : 'Registrar cobro'}
          </DialogTitle>
          <DialogDescription>
            {invoiceNumber && customerName ? (
              <>
                Factura <span className="font-semibold text-foreground">{invoiceNumber}</span> de{' '}
                <span className="font-semibold text-foreground">{customerName}</span>
                {' · '}
              </>
            ) : null}
            Pendiente:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(displayRemaining)}
            </span>
            {' de '}
            <span className="font-semibold text-foreground">
              {formatCurrency(Math.abs(invoiceTotal))}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Payment type toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePaymentTypeChange(PaymentType.FULL)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all',
              paymentType === PaymentType.FULL
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-muted-foreground/40',
            )}
          >
            <Coins
              className={cn(
                'h-4 w-4 shrink-0',
                paymentType === PaymentType.FULL ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  paymentType === PaymentType.FULL ? 'text-primary' : 'text-foreground',
                )}
              >
                {actionLabel === 'abono' ? 'Abono completo' : 'Cobro completo'}
              </p>
              <p className="text-xs text-muted-foreground">{formatCurrency(displayRemaining)}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handlePaymentTypeChange(PaymentType.PARTIAL)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all',
              paymentType === PaymentType.PARTIAL
                ? 'border-proforma-500 bg-proforma-500/5 ring-1 ring-proforma-500'
                : 'border-border hover:border-muted-foreground/40',
            )}
          >
            <SplitSquareHorizontal
              className={cn(
                'h-4 w-4 shrink-0',
                paymentType === PaymentType.PARTIAL ? 'text-proforma-500' : 'text-muted-foreground',
              )}
            />
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  paymentType === PaymentType.PARTIAL
                    ? 'text-proforma-600 dark:text-proforma-400'
                    : 'text-foreground',
                )}
              >
                {actionLabel === 'abono' ? 'Abono parcial' : 'Cobro parcial'}
              </p>
              <p className="text-xs text-muted-foreground">Importe personalizado</p>
            </div>
          </button>
        </div>

        {/* ── Full payment: single-click action ── */}
        {paymentType === PaymentType.FULL && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Se registrará el {actionLabel} completo de{' '}
              <span className="font-semibold text-foreground">
                {formatCurrency(displayRemaining)}
              </span>
              {defaultPaymentMethod
                ? ` mediante ${PAYMENT_METHOD_LABELS[defaultPaymentMethod]}`
                : ''}
              {' con fecha de hoy.'}
            </p>
            <Button
              className="w-full"
              onClick={handleFullPayment}
              disabled={createPayment.isPending}
            >
              {createPayment.isPending
                ? 'Registrando...'
                : `${verb} ${formatCurrency(displayRemaining)}`}
            </Button>
          </div>
        )}

        {/* ── Partial payment: full form ── */}
        {paymentType === PaymentType.PARTIAL && (
          <form onSubmit={form.handleSubmit(onSubmitPartial)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Importe *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={displayRemaining}
                  {...form.register('amount', { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Fecha *</Label>
                <Input id="paymentDate" type="date" {...form.register('paymentDate')} />
                {form.formState.errors.paymentDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.paymentDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select
                value={form.watch('paymentMethod') ?? ''}
                onValueChange={(val) =>
                  form.setValue('paymentMethod', val as PaymentMethod, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre el cobro"
                rows={2}
                {...form.register('notes')}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createPayment.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createPayment.isPending}>
                {createPayment.isPending ? 'Registrando...' : `Registrar ${actionLabel} parcial`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
