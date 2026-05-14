'use client';

import { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DiscountsSectionGeneralProps {
  /** Props from form.register('discountPercent', { setValueAs }) */
  discountPercentProps: UseFormRegisterReturn;
  /** Props from form.register('irpfPercent', { setValueAs }) */
  irpfPercentProps: UseFormRegisterReturn;
  onFocus?: () => void;
}

/**
 * Descuentos y retenciones section for the GENERAL tax regime.
 * Shows global discount and IRPF retention.
 */
export function DiscountsSectionGeneral({
  discountPercentProps,
  irpfPercentProps,
  onFocus,
}: DiscountsSectionGeneralProps) {
  return (
    <section
      id="field-discountPercent"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      onFocus={onFocus}
    >
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
      <div className="space-y-2">
        <Label htmlFor="irpfPercent">Retención IRPF (%)</Label>
        <Input
          id="irpfPercent"
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="0 (15% general)"
          {...irpfPercentProps}
        />
      </div>
    </section>
  );
}
