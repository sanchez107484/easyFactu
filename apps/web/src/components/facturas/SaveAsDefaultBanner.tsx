'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceDefaults, PaymentMethod } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';

interface WatchedFormValues {
  paymentMethod?: string;
  paymentDetails?: {
    iban?: string;
    bic?: string;
    accountHolder?: string;
    bizumPhone?: string;
    paypalEmail?: string;
    paymentNote?: string;
    [key: string]: string | undefined;
  };
  irpfPercent?: number;
}

interface SaveAsDefaultBannerProps {
  watchedValues: WatchedFormValues;
  currentDefaults: InvoiceDefaults | null | undefined;
  isDuplicate: boolean;
  editDraftId?: string;
}

/** Fields relevant to each payment method */
const PAYMENT_DETAIL_FIELDS: Partial<Record<PaymentMethod, string[]>> = {
  [PaymentMethod.BANK_TRANSFER]: ['iban', 'accountHolder', 'bic', 'paymentNote'],
  [PaymentMethod.BIZUM]: ['bizumPhone', 'paymentNote'],
  [PaymentMethod.PAYPAL]: ['paypalEmail', 'paymentNote'],
};

const PAYMENT_DETAIL_LABELS: Record<string, string> = {
  iban: 'IBAN',
  bic: 'BIC/SWIFT',
  accountHolder: 'Titular',
  bizumPhone: 'Teléfono Bizum',
  paypalEmail: 'Email PayPal',
  paymentNote: 'Nota de pago',
};

export function SaveAsDefaultBanner({
  watchedValues,
  currentDefaults,
  isDuplicate,
  editDraftId,
}: SaveAsDefaultBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const updateDefaults = useUpdateInvoiceDefaults();

  const currentMethod = watchedValues.paymentMethod as PaymentMethod | undefined;
  const currentDetails = watchedValues.paymentDetails ?? {};
  const storedDetails = (currentDefaults?.paymentDetails ?? {}) as Record<
    string,
    string | undefined
  >;

  // --- Divergence checks ---
  const paymentMethodDiverges = !!currentMethod && currentMethod !== currentDefaults?.paymentMethod;

  const relevantFields = currentMethod
    ? (PAYMENT_DETAIL_FIELDS[currentMethod] ?? ['paymentNote'])
    : [];
  const divergentDetailFields = relevantFields.filter(
    (field) => !!currentDetails[field] && currentDetails[field] !== storedDetails[field],
  );
  const paymentDetailsDiverge = divergentDetailFields.length > 0;

  const currentIrpf =
    currentDefaults?.irpfPercent != null ? Number(currentDefaults.irpfPercent) : undefined;
  const irpfDiverges =
    watchedValues.irpfPercent !== undefined && watchedValues.irpfPercent !== currentIrpf;

  const hasDivergence = paymentMethodDiverges || paymentDetailsDiverge || irpfDiverges;

  if (!hasDivergence || dismissed || isDuplicate || !!editDraftId) {
    return null;
  }

  // --- Build human-readable label of divergent fields ---
  const divergentParts: string[] = [];
  if (paymentMethodDiverges) {
    const label = PAYMENT_METHOD_LABELS[currentMethod as PaymentMethod] ?? currentMethod;
    divergentParts.push(`Método de pago: ${label}`);
  }
  for (const field of divergentDetailFields) {
    const value = currentDetails[field]!;
    const label = PAYMENT_DETAIL_LABELS[field] ?? field;
    const preview = value.length > 14 ? `${value.substring(0, 14)}…` : value;
    divergentParts.push(`${label}: ${preview}`);
  }
  if (irpfDiverges && watchedValues.irpfPercent !== undefined) {
    divergentParts.push(`IRPF: ${watchedValues.irpfPercent}%`);
  }

  const handleSave = () => {
    const changes: Parameters<typeof updateDefaults.mutate>[0] = {};

    if (paymentMethodDiverges) {
      changes.paymentMethod = currentMethod as PaymentMethod;
    }
    if (paymentDetailsDiverge) {
      // Merge all relevant field values into the stored payment details
      const updatedDetails: Record<string, string | undefined> = { ...storedDetails };
      for (const field of relevantFields) {
        if (currentDetails[field]) {
          updatedDetails[field] = currentDetails[field];
        }
      }
      changes.paymentDetails = updatedDetails;
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
