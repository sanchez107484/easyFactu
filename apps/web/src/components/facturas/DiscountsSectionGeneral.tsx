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
  /** Props from form.register('equivalenceSurchargePercent', { setValueAs }) — optional, shown when customer has RE */
  equivalenceSurchargePercentProps?: UseFormRegisterReturn;
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

/**
 * Descuentos y retenciones section for the GENERAL tax regime.
 * Shows global discount, IRPF retention, and optionally Recargo de Equivalencia.
 */
export function DiscountsSectionGeneral({
  discountPercentProps,
  irpfPercentProps,
  equivalenceSurchargePercentProps,
  onFocus,
}: DiscountsSectionGeneralProps) {
  return (
    <section
      id="field-discountPercent"
      className={cn(
        'grid gap-4',
        equivalenceSurchargePercentProps
          ? 'grid-cols-1 sm:grid-cols-3'
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
      {equivalenceSurchargePercentProps && (
        <PercentField
          id="equivalenceSurchargePercent"
          label="Recargo equivalencia"
          placeholder="Auto"
          hint="Global · sobrescribe las líneas"
          icon={Percent}
          accent="text-amber-500"
          inputProps={equivalenceSurchargePercentProps}
        />
      )}
    </section>
  );
}
