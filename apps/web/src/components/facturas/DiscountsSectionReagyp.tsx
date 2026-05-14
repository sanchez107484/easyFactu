'use client';

import { UseFormRegisterReturn } from 'react-hook-form';
import { Info, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DiscountsSectionReagypProps {
  /** Props from form.register('discountPercent', { setValueAs }) */
  discountPercentProps: UseFormRegisterReturn;
  /** Props from form.register('compensacionPercent', { setValueAs }) */
  compensacionPercentProps: UseFormRegisterReturn;
  /** Props from form.register('irpfPercent', { setValueAs }) */
  irpfPercentProps: UseFormRegisterReturn;
  /**
   * True when the selected customer is also in REAGYP (B2B exemption).
   * In that case, compensation = 0 and we show an explanatory alert.
   */
  isCustomerReagyp?: boolean;
  onFocus?: () => void;
}

/**
 * Descuentos y retenciones section for the REAGYP special agricultural regime.
 *
 * REAGYP rules (Arts. 124-134 LIVA):
 * - No IVA applies — the buyer pays a fixed "compensación agraria" instead.
 * - IRPF base = subtotal after discount + compensación agraria (Art. 102.Dos LIVA).
 * - B2B exemption: if both buyer and seller are in REAGYP, compensation = 0.
 */
export function DiscountsSectionReagyp({
  discountPercentProps,
  compensacionPercentProps,
  irpfPercentProps,
  isCustomerReagyp = false,
  onFocus,
}: DiscountsSectionReagypProps) {
  return (
    <div className="space-y-3">
      {/* Regime info banner */}
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          <strong>REAGYP:</strong> Sin IVA — la compensación agraria lo sustituye (Arts. 124-134
          LIVA). La retención IRPF se calcula sobre base imponible + compensación (Art. 102.Dos
          LIVA).
        </span>
      </div>

      {/* B2B exemption alert */}
      {isCustomerReagyp && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            El cliente también está en REAGYP: no aplica compensación agraria (exención B2B, Arts.
            124-134 LIVA). Ponla a 0 o déjala vacía.
          </span>
        </div>
      )}

      <section
        id="field-discountPercent"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        onFocus={onFocus}
      >
        {/* Column 1: Global discount */}
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Descuento global (%)</Label>
          <Input
            id="discountPercent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="0"
            {...discountPercentProps}
          />
        </div>

        {/* Column 2: REAGYP agricultural compensation */}
        <div className="space-y-2">
          <Label htmlFor="compensacionPercent">Comp. agraria REAGYP (%)</Label>
          <Input
            id="compensacionPercent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="0"
            {...compensacionPercentProps}
          />
          <p className="text-[11px] text-muted-foreground leading-tight">
            Sobre base imponible tras descuento.
          </p>
        </div>

        {/* Column 3: IRPF — base is subtotal + compensation in REAGYP */}
        <div className="space-y-2">
          <Label htmlFor="irpfPercent">Retención IRPF (%)</Label>
          <Input
            id="irpfPercent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="0"
            {...irpfPercentProps}
          />
          <p className="text-[11px] text-muted-foreground leading-tight">
            Sobre base + compensación agraria (Art. 102.Dos LIVA).
          </p>
        </div>
      </section>
    </div>
  );
}
