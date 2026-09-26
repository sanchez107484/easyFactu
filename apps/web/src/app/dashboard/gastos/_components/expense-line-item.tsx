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
import { Receipt, Euro, Percent, Calculator } from 'lucide-react';
import { ExpenseCategory } from '@easyfactura/shared-types';
import { TAX_RATE_SELECT_OPTIONS } from '@easyfactura/shared-constants';
import { round2 } from '@/lib/math';
import { cn } from '@/lib/utils';
import type { ExpenseFormData } from './expense-form';

interface ExpenseLineItemProps {
  form: UseFormReturn<ExpenseFormData>;
  categories: ExpenseCategory[];
  baseAmountRaw: string;
  totalRaw: string;
  isTotalMode: boolean;
  onBaseAmountRawChange: (value: string) => void;
  onBaseAmountBlur: () => void;
  onTotalRawChange: (value: string) => void;
  onTotalBlur: () => void;
  onIsTotalModeChange: (value: boolean) => void;
  onCategoryChange?: (categoryId: string) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function ExpenseLineItem({
  form,
  categories,
  baseAmountRaw,
  totalRaw,
  isTotalMode,
  onBaseAmountRawChange,
  onBaseAmountBlur,
  onTotalRawChange,
  onTotalBlur,
  onIsTotalModeChange,
  onCategoryChange,
  isPending = false,
  readOnly = false,
}: ExpenseLineItemProps) {
  const baseAmount = form.watch('baseAmount') || 0;
  const vatRate = form.watch('vatRate') || 0;
  const vatAmount = round2(baseAmount * (vatRate / 100));
  const totalAmount = round2(baseAmount + vatAmount);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  };

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
          <div className="w-[120px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Categoría
          </div>
          <div className={cn("flex-1 text-[10px] font-medium uppercase tracking-wide", isTotalMode ? "text-muted-foreground/50" : "text-muted-foreground")}>
            {isTotalMode ? "Base (calculada)" : "Base imponible"}
          </div>
          <div className="w-[100px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide text-center">
            IVA
          </div>
          <div className="w-[110px] flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => !readOnly && !isPending && onIsTotalModeChange(!isTotalMode)}
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide text-right transition-colors",
                isTotalMode ? "text-primary" : "text-muted-foreground/50",
                !readOnly && !isPending && "hover:text-primary cursor-pointer"
              )}
              disabled={isPending || readOnly}
            >
              {isTotalMode ? "Total" : "Total (calc.)"}
            </button>
            {!readOnly && !isPending && (
              <div className="h-3.5 w-5 rounded-full bg-primary/20 flex items-center justify-center ml-1">
                <div className={cn("h-2 w-2 rounded-full transition-transform", isTotalMode ? "bg-primary translate-x-1" : "bg-primary/40 -translate-x-1")} />
              </div>
            )}
          </div>
        </div>

        {/* Numbers row */}
        <div className="flex items-center gap-2">
          {/* Category */}
          <div className="w-[120px]">
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
          <div className="flex-1 relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={isTotalMode ? formatCurrency(baseAmount) : baseAmountRaw}
              className={cn("h-9 pr-8 text-sm", isTotalMode && "bg-muted/30 border-dashed cursor-default")}
              disabled={isPending || readOnly || isTotalMode}
              onChange={(e) => !isTotalMode && onBaseAmountRawChange(e.target.value)}
              onBlur={() => !isTotalMode && onBaseAmountBlur()}
              readOnly={isTotalMode}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              €
            </span>
          </div>

          {/* VAT */}
          <div className="w-[100px]">
            <Select
              value={String(form.watch('vatRate') ?? 21)}
              onValueChange={(v) => form.setValue('vatRate', parseFloat(v))}
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
              value={isTotalMode ? totalRaw : formatCurrency(totalAmount)}
              className={cn("h-9 pr-8 text-sm text-right font-semibold", !isTotalMode && "bg-transparent border-dashed cursor-default")}
              disabled={isPending || readOnly || !isTotalMode}
              onChange={(e) => isTotalMode && onTotalRawChange(e.target.value)}
              onBlur={() => isTotalMode && onTotalBlur()}
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
