'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  RectificationType,
  type Invoice,
  type InvoiceLine,
} from '@easyfactura/shared-types';
import { useRectifyInvoice } from '@/hooks/use-invoices';
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
import {
  InvoiceSummary,
  RectifyTypeSelector,
  SubstitutionBody,
  AbonoBody,
  ReasonField,
  RectifyFooterNote,
} from './RectifyInvoiceDialogSections';

interface RectifyInvoiceDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice: Invoice;
  defaultType: RectificationType;
  /**
   * Si true, muestra un selector de tipo (Sustitución / Abono) dentro del modal
   * y permite al usuario cambiar entre ambos antes de confirmar. Usado cuando
   * se abre desde el menú de la página de detalle. Default: false.
   */
  typeSelectable?: boolean;
}

/**
 * Modal reutilizable para crear facturas rectificativas.
 * El cuerpo cambia según el tipo:
 *   - SUBSTITUCIÓN: nº líneas + total unidades
 *   - DIFFERENCES (abono): input de importe + selector IVA
 * Tras crear el borrador, redirige al editor con `?edit={rect.id}`.
 */
export function RectifyInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  defaultType,
  typeSelectable = false,
}: RectifyInvoiceDialogProps) {
  const router = useRouter();
  const rectifyMutation = useRectifyInvoice();
  const [selectedType, setSelectedType] = useState<RectificationType>(defaultType);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(21);

  const activeType = typeSelectable ? selectedType : defaultType;
  const isAbono = activeType === RectificationType.DIFFERENCES;

  const reasonValid = reason.trim().length >= 5;
  const amountValid = !isAbono || (amount.trim() !== '' && parseFloat(amount) !== 0);
  const canSubmit = reasonValid && amountValid && !rectifyMutation.isPending;

  const handleConfirm = async () => {
    const lines = isAbono
      ? [
          {
            description: 'Ajuste rectificativo - Abonos',
            quantity: 1,
            unitPrice: parseFloat(amount),
            taxRate,
          },
        ]
      : (invoice.lines ?? []).map((l: InvoiceLine) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        }));

    try {
      const rect = await rectifyMutation.mutateAsync({
        id: invoice.id,
        data: { rectificationReason: reason, rectificationType: activeType, lines },
      });
      onOpenChange(false);
      router.push(`/dashboard/facturas/nueva?edit=${rect.id}`);
    } catch (e: unknown) {
      const existingId = (
        e as { response?: { data?: { existingDraftId?: string } } }
      )?.response?.data?.existingDraftId;
      if (existingId) {
        onOpenChange(false);
        toast.error('Ya existe un borrador de rectificativa', {
          description: 'Esta factura ya tiene un borrador de factura rectificativa en curso.',
          action: {
            label: 'Ver borrador →',
            onClick: () => router.push(`/dashboard/facturas/nueva?edit=${existingId}`),
          },
          duration: 8000,
        });
      }
    }
  };

  const resetState = () => {
    setReason('');
    setAmount('');
    setSelectedType(defaultType);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {typeSelectable
              ? 'Emitir factura rectificativa'
              : isAbono
                ? 'Crear Abono / Devolución'
                : 'Crear Rectificativa por Sustitución'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vas a rectificar la factura{' '}
            <strong>
              {invoice.number ?? 'BORRADOR'} de{' '}
              {invoice.customer?.name ?? invoice.customerSnapshotName ?? '—'}
            </strong>
            .{' '}
            {typeSelectable
              ? 'Indica el tipo y el motivo de la rectificación.'
              : isAbono
                ? 'Se generará un abono por la diferencia que indiques a continuación.'
                : 'Se generará una factura que anula y reemplaza por completo a la original.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <InvoiceSummary invoice={invoice} />
          {typeSelectable && (
            <RectifyTypeSelector value={selectedType} onChange={setSelectedType} />
          )}
          {isAbono ? (
            <AbonoBody
              amount={amount}
              onAmountChange={setAmount}
              taxRate={taxRate}
              onTaxRateChange={setTaxRate}
            />
          ) : (
            <SubstitutionBody invoice={invoice} />
          )}
          <ReasonField value={reason} onChange={setReason} isAbono={isAbono} />
          <RectifyFooterNote />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={resetState}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={!canSubmit} onClick={handleConfirm}>
            {rectifyMutation.isPending
              ? 'Creando...'
              : typeSelectable
                ? 'Crear rectificativa'
                : 'Crear borrador'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
