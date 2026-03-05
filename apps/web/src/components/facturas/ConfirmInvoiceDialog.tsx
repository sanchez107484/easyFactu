'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

// ==================== TYPES ====================

export interface ConfirmInvoiceSummary {
  customerName: string;
  total: number;
}

interface ConfirmInvoiceDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  summary: ConfirmInvoiceSummary;
  invoiceType?: string;
}

// ==================== COMPONENT ====================

export function ConfirmInvoiceDialog({
  open,
  onCancel,
  onConfirm,
  isPending,
  summary,
  invoiceType,
}: ConfirmInvoiceDialogProps) {
  const isProforma = invoiceType === 'proforma';
  const formattedTotal = summary.total.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isProforma ? 'Guardar como proforma' : '¿Confirmar la factura?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {isProforma ? (
                <p>
                  La factura se guardará como <strong>proforma</strong>. No tendrá número fiscal ni
                  validez legal hasta que la conviertas a factura oficial.
                </p>
              ) : (
                <p>
                  Una vez confirmada, la factura se enviará a la <strong>AEAT vía VeriFactu</strong>{' '}
                  y no podrá editarse.
                </p>
              )}

              {/* VeriFactu warnings — only for official invoices */}
              {!isProforma && (
                <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
                    <li>Se generará un registro de alta en VeriFactu con hash encadenado.</li>
                    <li>
                      Se asignará el siguiente número de serie disponible de forma definitiva.
                    </li>
                    <li>
                      No se puede anular directamente: deberás emitir una factura rectificativa.
                    </li>
                  </ul>
                </div>
              )}

              {/* Summary */}
              <div className="p-3 rounded-lg bg-muted text-sm space-y-1.5">
                {!isProforma && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-medium">Se asignará al confirmar</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{summary.customerName}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-base">{formattedTotal}</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending
              ? isProforma
                ? 'Guardando...'
                : 'Confirmando...'
              : isProforma
                ? 'Guardar como proforma'
                : 'Sí, confirmar factura'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
