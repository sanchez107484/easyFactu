'use client';

import { UseFormRegisterReturn } from 'react-hook-form';
import { Percent, Tag, ScrollText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DiscountsSectionGeneralProps {
  /** Props from form.register('discountPercent', { setValueAs }) */
  discountPercentProps: UseFormRegisterReturn;
  /** Props from form.register('irpfPercent', { setValueAs }) */
  irpfPercentProps: UseFormRegisterReturn;
  /** When true, shows an info-only badge indicating RE is being applied per line. */
  showEquivalenceSurchargeInfo?: boolean;
  onFocus?: () => void;
}

function PercentField({
  id,
  label,
  hint,
  placeholder,
  icon: Icon,
  accent,
  inputProps,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  icon: React.ElementType;
  accent?: string;
  inputProps: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Icon className={cn('h-3.5 w-3.5', accent)} />
        <span>{label}</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder={placeholder}
          className="pr-8 tabular-nums"
          {...inputProps}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          %
        </span>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>}
    </div>
  );
}

function RecargoEquivalenciaInfo() {
  return (
    <div
      className="space-y-1.5 rounded-md border border-amber-200/60 bg-amber-50/50 px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900">
        <Percent className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
        <span>Recargo de equivalencia</span>
      </div>
      <p className="text-[11px] text-amber-900/70 leading-tight">
        Se aplica automáticamente por línea según el tipo de IVA (Art. 161 LIVA). No editable.
      </p>
    </div>
  );
}

/**
 * Descuentos y retenciones section for the GENERAL tax regime.
 * Shows global discount, IRPF retention, and an info-only badge when the customer is
 * subject to Recargo de Equivalencia. The RE rate is fixed by law and computed from
 * each line's taxRate — users can never override it.
 */
export function DiscountsSectionGeneral({
  discountPercentProps,
  irpfPercentProps,
  showEquivalenceSurchargeInfo,
  onFocus,
}: DiscountsSectionGeneralProps) {
  return (
    <section
      id="field-discountPercent"
      className={cn(
        'grid gap-4',
        showEquivalenceSurchargeInfo
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2',
      )}
      onFocus={onFocus}
    >
      <PercentField
        id="discountPercent"
        label="Descuento"
        placeholder="0"
        icon={Tag}
        accent="text-blue-500"
        inputProps={discountPercentProps}
      />
      <PercentField
        id="irpfPercent"
        label="IRPF"
        placeholder="0"
        hint="15% general"
        icon={ScrollText}
        accent="text-rose-500"
        inputProps={irpfPercentProps}
      />
      {showEquivalenceSurchargeInfo && <RecargoEquivalenciaInfo />}
    </section>
  );
}
