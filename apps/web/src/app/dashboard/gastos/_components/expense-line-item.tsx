'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { round2 } from '@/lib/math';
import { ExpenseCategory } from '@easyfactura/shared-types';
import { TAX_RATE_SELECT_OPTIONS } from '@easyfactura/shared-constants';
import type { ExpenseFormData } from './expense-form';

interface ExpenseLineItemProps {
  form: UseFormReturn<ExpenseFormData>;
  categories: ExpenseCategory[];
  baseAmountRaw: string;
  totalRaw: string;
  onBaseAmountRawChange: (value: string) => void;
  onBaseAmountBlur: () => void;
  onTotalRawChange: (value: string) => void;
  onTotalBlur: () => void;
  onCategoryChange?: (categoryId: string) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function ExpenseLineItem({
  form,
  categories,
  baseAmountRaw,
  totalRaw,
  onBaseAmountRawChange,
  onBaseAmountBlur,
  onTotalRawChange,
  onTotalBlur,
  onCategoryChange,
  isPending = false,
  readOnly = false,
}: ExpenseLineItemProps) {
  const priceMode = form.watch('_priceMode') ?? 'total';
  const isTotalMode = priceMode === 'total';
  const baseAmount = form.watch('baseAmount') || 0;
  const vatRate = form.watch('vatRate') || 0;
  const vatAmount = round2(baseAmount * (vatRate / 100));
  const totalAmount = round2(baseAmount + vatAmount);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  return (
    <div className="rounded-lg border border-primary/10 bg-background/80 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-b border-primary/10">
        <span className="text-xs font-medium text-primary">Gasto</span>
        <div className="flex-1" />
      </div>

      {/* Body */}
      <div className="px-3 pb-3 pt-2.5 space-y-3">
        {/* Description */}
        <div className="space-y-1.5">
          <Textarea
            {...form.register('description')}
            placeholder="Describe el gasto..."
            rows={2}
            className="resize-none text-sm"
            disabled={isPending || readOnly}
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Labels row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Categoría
          </div>
          <div className="w-[100px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Base imponible
          </div>
          <div className="w-[80px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide text-center">
            IVA
          </div>
          <div className="w-[110px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide text-right">
            Total
          </div>
        </div>

        {/* Numbers row */}
        <div className="flex items-center gap-2">
          {/* Category */}
          <div className="flex-1">
            <Select
              value={form.watch('categoryId')}
              onValueChange={(v) => {
                form.setValue('categoryId', v);
                onCategoryChange?.(v);
              }}
              disabled={isPending || readOnly}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-xs text-destructive mt-0.5">{form.formState.errors.categoryId.message}</p>
            )}
          </div>

          {/* Base amount */}
          <div className="w-[100px] relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={baseAmountRaw}
              className="h-9 pr-8 text-sm"
              disabled={isPending || readOnly}
              onChange={(e) => {
                onBaseAmountRawChange(e.target.value);
                const normalized = e.target.value.replace(',', '.');
                const num = parseFloat(normalized);
                if (!isNaN(num) && num >= 0) {
                  form.setValue('baseAmount', num, { shouldValidate: false });
                  const newTotal = round2(num * (1 + vatRate / 100));
                  onTotalRawChange(newTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }
              }}
              onBlur={() => onBaseAmountBlur()}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              €
            </span>
          </div>

          {/* VAT */}
          <div className="w-[80px]">
            <Select
              value={String(form.watch('vatRate') ?? 21)}
              onValueChange={(v) => {
                const newVat = parseFloat(v);
                form.setValue('vatRate', newVat);
                const currentTotal = round2(baseAmount * (1 + newVat / 100));
                onTotalRawChange(currentTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              }}
              disabled={isPending || readOnly}
            >
              <SelectTrigger className="h-9 text-sm justify-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_RATE_SELECT_OPTIONS.map((t) => (
                  <SelectItem key={String(t.value)} value={String(t.value)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total */}
          <div className="w-[110px] relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={totalRaw}
              className="h-9 pr-8 text-sm text-right font-semibold"
              disabled={isPending || readOnly}
              onChange={(e) => {
                onTotalRawChange(e.target.value);
                const raw = e.target.value;
                const normalized = raw.replace(',', '.');
                const num = parseFloat(normalized);
                if (!isNaN(num) && num >= 0) {
                  const calculatedBase = round2(num / (1 + vatRate / 100));
                  form.setValue('baseAmount', calculatedBase, { shouldValidate: true });
                  onBaseAmountRawChange(calculatedBase.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }
              }}
              onBlur={() => onTotalBlur()}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              €
            </span>
          </div>
        </div>

        {/* IVA breakdown */}
        <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
          <span>Base: {formatCurrency(baseAmount)}</span>
          <span>IVA ({vatRate}%): +{formatCurrency(vatAmount)}</span>
        </div>
      </div>
    </div>
  );
}
