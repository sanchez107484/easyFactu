'use client';

import { Trash2, Plus, Banknote, ChevronDown, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeletePayment } from '@/hooks/use-invoices';
import type {
  Invoice,
  Payment,
  PaymentMethod as PaymentMethodType,
} from '@easyfactura/shared-types';
import { PaymentStatus } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { formatCurrency, cn, parseNum, formatDateShort } from '@/lib/utils';

interface InvoicePaymentSectionProps {
  invoice: Invoice;
  onRegisterPayment?: () => void;
  showIcon?: boolean;
}

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  [PaymentStatus.PAID]: {
    dot: 'bg-secondary-500',
    text: 'text-secondary-600 dark:text-secondary-400',
  },
  [PaymentStatus.PARTIALLY_PAID]: {
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  [PaymentStatus.UNPAID]: {
    dot: 'bg-zinc-400',
    text: 'text-muted-foreground',
  },
};

/**
 * Compact inline payment indicator for the invoice hero section.
 * Shows payment status + a popover with payment details & register button.
 */
export function InvoicePaymentSection({
  invoice,
  onRegisterPayment,
  showIcon = true,
}: InvoicePaymentSectionProps) {
  const deletePayment = useDeletePayment();

  const total = parseNum(invoice.total);
  const amountPaid = parseNum(invoice.amountPaid);
  const remaining = Math.round((total - amountPaid) * 100) / 100;
  const payments = (invoice.payments ?? []) as Payment[];
  const paymentStatus = (invoice.paymentStatus as PaymentStatus) ?? PaymentStatus.UNPAID;

  const canRegisterPayment =
    invoice.status === 'CONFIRMED' ||
    invoice.status === 'SENT' ||
    (invoice.status === 'PAID' && remaining > 0);

  const style = STATUS_STYLES[paymentStatus] ?? STATUS_STYLES[PaymentStatus.UNPAID];

  const statusLabel =
    paymentStatus === PaymentStatus.PAID
      ? 'Cobrada'
      : paymentStatus === PaymentStatus.PARTIALLY_PAID
        ? `Cobrado ${formatCurrency(amountPaid)} de ${formatCurrency(total)}`
        : 'Pendiente de cobro';

  const hasDetails = payments.length > 0 || canRegisterPayment;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {showIcon && <Banknote className="h-3 w-3 text-muted-foreground" />}
      {hasDetails ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 font-medium hover:underline underline-offset-2 cursor-pointer',
                style.text,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
              {statusLabel}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3 space-y-2">
            {/* Payment list */}
            {payments.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Cobros registrados
                </p>
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium tabular-nums">
                        {formatCurrency(parseNum(payment.amount))}
                      </span>
                      {payment.notes && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              title={payment.notes}
                              className="inline-flex items-center text-muted-foreground/60 hover:text-muted-foreground cursor-help"
                            >
                              <StickyNote className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" className="w-56 p-2.5 text-xs">
                            <p className="font-semibold text-foreground mb-1">Nota del cobro</p>
                            <p className="text-muted-foreground">{payment.notes}</p>
                          </PopoverContent>
                        </Popover>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(payment.paymentDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {payment.paymentMethod && (
                        <span className="text-[10px] text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethodType]}
                        </span>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar cobro</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Eliminar este cobro de {formatCurrency(parseNum(payment.amount))}? El
                              importe cobrado se actualizará automáticamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() =>
                                deletePayment.mutate({
                                  invoiceId: invoice.id,
                                  paymentId: payment.id,
                                })
                              }
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Register payment button */}
            {canRegisterPayment && remaining > 0 && onRegisterPayment && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={onRegisterPayment}
              >
                <Plus className="mr-1 h-3 w-3" />
                Registrar cobro
              </Button>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <span className={cn('inline-flex items-center gap-1 font-medium', style.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
          {statusLabel}
        </span>
      )}
    </div>
  );
}
