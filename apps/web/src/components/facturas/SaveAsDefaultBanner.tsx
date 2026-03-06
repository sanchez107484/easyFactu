'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceDefaults, PaymentMethod } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';

interface WatchedFormValues {
  paymentMethod?: string;
  paymentDetails?: { iban?: string; [key: string]: string | undefined };
  irpfPercent?: number;
}

interface SaveAsDefaultBannerProps {
  watchedValues: WatchedFormValues;
  currentDefaults: InvoiceDefaults | null | undefined;
  isDuplicate: boolean;
  editDraftId?: string;
}

export function SaveAsDefaultBanner({
  watchedValues,
  currentDefaults,
  isDuplicate,
  editDraftId,
}: SaveAsDefaultBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const updateDefaults = useUpdateInvoiceDefaults();

  // --- Divergence checks ---
  const paymentMethodDiverges =
    !!watchedValues.paymentMethod && watchedValues.paymentMethod !== currentDefaults?.paymentMethod;

  const ibanDiverges =
    watchedValues.paymentMethod === PaymentMethod.BANK_TRANSFER &&
    !!watchedValues.paymentDetails?.iban &&
    watchedValues.paymentDetails.iban !== currentDefaults?.paymentDetails?.iban;

  const currentIrpf =
    currentDefaults?.irpfPercent != null ? Number(currentDefaults.irpfPercent) : undefined;
  const irpfDiverges =
    watchedValues.irpfPercent !== undefined && watchedValues.irpfPercent !== currentIrpf;

  const hasDivergence = paymentMethodDiverges || ibanDiverges || irpfDiverges;

  if (!hasDivergence || dismissed || isDuplicate || !!editDraftId) {
    return null;
  }

  // --- Build human-readable label of divergent fields ---
  const divergentParts: string[] = [];
  if (paymentMethodDiverges) {
    const label =
      PAYMENT_METHOD_LABELS[watchedValues.paymentMethod as PaymentMethod] ??
      watchedValues.paymentMethod;
    divergentParts.push(`Método de pago: ${label}`);
  }
  if (ibanDiverges && watchedValues.paymentDetails?.iban) {
    const iban = watchedValues.paymentDetails.iban;
    const preview = iban.length > 12 ? `${iban.substring(0, 12)}...` : iban;
    divergentParts.push(`IBAN: ${preview}`);
  }
  if (irpfDiverges && watchedValues.irpfPercent !== undefined) {
    divergentParts.push(`IRPF: ${watchedValues.irpfPercent}%`);
  }

  const handleSave = () => {
    const changes: Parameters<typeof updateDefaults.mutate>[0] = {};

    if (paymentMethodDiverges) {
      changes.paymentMethod = watchedValues.paymentMethod as PaymentMethod;
    }
    if (ibanDiverges) {
      changes.paymentDetails = {
        ...(currentDefaults?.paymentDetails ?? {}),
        iban: watchedValues.paymentDetails!.iban!,
      };
    }
    if (irpfDiverges) {
      changes.irpfPercent = watchedValues.irpfPercent ?? null;
    }

    updateDefaults.mutate(changes, {
      onSuccess: () => setDismissed(true),
    });
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-4 py-3">
      <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-green-700 dark:text-green-300">
          ¿Guardar estos datos para futuras facturas?
        </p>
        <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
          {divergentParts.join(' · ')}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300"
          onClick={handleSave}
          disabled={updateDefaults.isPending}
        >
          Guardar como predeterminado
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-green-600 hover:bg-green-100 dark:text-green-400"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Ahora no</span>
        </Button>
      </div>
    </div>
  );
}
