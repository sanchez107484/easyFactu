'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
  const [isRedirecting, setIsRedirecting] = useState(false);

  const activeType = typeSelectable ? selectedType : defaultType;
  const isAbono = activeType === RectificationType.DIFFERENCES;
  const isReagypInvoice = invoice.compensacionPercent != null;
  const hasCustomerRE = invoice.customer?.hasEquivalenceSurcharge === true;
  const showReagypUI = isReagypInvoice || hasCustomerRE;

  useEffect(() => {
    return () => {
      toast.dismiss('rectify-creating');
    };
  }, []);

  const reasonValid = reason.trim().length >= 5;
  const amountNum = amount ? parseFloat(amount) : 0;
  const isSentinel = amount === '+' || amount === '-';
  const amountValid = !isAbono || (!isSentinel && amount.trim() !== '' && !isNaN(amountNum) && amountNum !== 0);
  const isLoading = rectifyMutation.isPending || isRedirecting;
  const canSubmit = reasonValid && amountValid && !isLoading;

  const handleConfirm = async () => {
    if (isSentinel || isNaN(amountNum) || amountNum === 0) return;

    const lines = isAbono
      ? [
          {
            description: 'Ajuste rectificativo - Abonos',
            quantity: 1,
            unitPrice: amountNum,
            taxRate: isReagypInvoice ? 0 : taxRate,
          },
        ]
      : (invoice.lines ?? []).map((l: InvoiceLine) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        }));

    toast.loading('Creando factura rectificativa...', {
      description: isAbono
        ? 'Generando abono por diferencia'
        : 'Generando rectificativa por sustitución',
      id: 'rectify-creating',
    });

    try {
      const rect = await rectifyMutation.mutateAsync({
        id: invoice.id,
        data: { rectificationReason: reason, rectificationType: activeType, lines },
      });
      toast.dismiss('rectify-creating');
      setIsRedirecting(true);
      router.push(`/dashboard/facturas/nueva?edit=${rect.id}`);
    } catch (e: unknown) {
      const existingId = (
        e as { response?: { data?: { existingDraftId?: string } } }
      )?.response?.data?.existingDraftId;
      if (existingId) {
        setIsRedirecting(false);
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
    setIsRedirecting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={isRedirecting ? 'pointer-events-none' : ''}>
        {isRedirecting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-background/95 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium">Creando borrador...</p>
            <p className="text-xs text-muted-foreground mt-1">Redirigiendo al editor</p>
          </div>
        )}
        <AlertDialogHeader>
          <AlertDialogTitle>
            {typeSelectable
              ? 'Emitir factura rectificativa'
              : isAbono
                ? 'Crear Abono'
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
              ? 'Elige el tipo de rectificación: sustitución anula la original y crea una nueva; abono ajusta el importe (devolver o cobrar de más) sin cambiar las líneas.'
              : isAbono
                ? 'Se generará un abono por la diferencia que indiques. La factura original se mantiene vigente.'
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
              isReagyp={showReagypUI}
              compensacionPercent={isReagypInvoice ? invoice.compensacionPercent ?? undefined : undefined}
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
