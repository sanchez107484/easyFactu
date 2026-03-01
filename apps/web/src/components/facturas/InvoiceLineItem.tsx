'use client';

import { UseFormReturn, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Copy, ChevronUp, ChevronDown, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { round2 } from '@/lib/math';
import { useProducts } from '@/hooks/use-products';
import { Product, ProductType } from '@easyfactura/shared-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useState } from 'react';
import { Package, Wrench } from 'lucide-react';
import { LineMode, LINE_MODE_META, ExtendedLineData } from '@/lib/invoice-line-types';

// ==================== TYPES ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormWithLines = UseFormReturn<any>;

interface InvoiceLineItemProps {
  form: AnyFormWithLines;
  index: number;
  totalLines: number;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onFocus: () => void;
}

// ==================== CONSTANTS ====================

const MODES: LineMode[] = ['custom', 'service', 'product'];

const TAX_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '4', label: '4%' },
  { value: '10', label: '10%' },
  { value: '21', label: '21%' },
];

// ==================== INLINE CATALOG PICKER ====================

function CatalogPicker({
  selectedProductId,
  onSelect,
}: {
  selectedProductId?: string;
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data } = useProducts({ limit: 100 });
  const products = data?.data ?? [];

  if (products.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all shrink-0',
            selectedProductId
              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10',
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          {selectedProductId ? 'Cambia del catálogo' : 'Del catálogo'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="bottom">
        <Command>
          <CommandInput placeholder="Buscar en catálogo..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => {
                const Icon = product.type === ProductType.PRODUCT ? Package : Wrench;
                const pvp = Number(product.unitPrice) * (1 + Number(product.taxRate) / 100);
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.reference ?? ''}`}
                    onSelect={() => {
                      onSelect(product);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 py-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{product.name}</span>
                        <span className="text-xs font-semibold text-primary shrink-0">
                          {pvp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      {product.reference && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {product.reference}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ==================== MAIN COMPONENT ====================

export function InvoiceLineItem({
  form,
  index,
  totalLines,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus,
}: InvoiceLineItemProps) {
  const line: ExtendedLineData = useWatch({ control: form.control, name: `lines.${index}` }) ?? {};
  const mode: LineMode = line._mode ?? 'custom';

  // â”€â”€ Calculations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const qty = mode === 'service' ? 1 : (line.quantity ?? 0);
  const price = line.unitPrice ?? 0;
  const tax = line.taxRate ?? 21;
  const subtotal = round2(qty * price);
  const lineTotal = round2(subtotal * (1 + tax / 100));

  // â”€â”€ Mode change â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleModeChange = (newMode: LineMode) => {
    form.setValue(`lines.${index}._mode`, newMode);
    if (newMode === 'service') {
      form.setValue(`lines.${index}.quantity`, 1);
      form.setValue(`lines.${index}._hideQty`, true);
    }
    if (newMode === 'custom') {
      form.setValue(`lines.${index}._hideQty`, true);
    }
    if (newMode === 'product') {
      form.setValue(`lines.${index}._hideQty`, false);
      const currentQty = form.getValues(`lines.${index}.quantity`) as number;
      if (!currentQty || currentQty < 1) {
        form.setValue(`lines.${index}.quantity`, 1);
      }
    }
    if (newMode !== 'product') {
      form.setValue(`lines.${index}.productId`, undefined);
    }
  };

  // â”€â”€ Errors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineErrors = (form.formState.errors as any)?.lines?.[index] as
    | Record<string, { message?: string }>
    | undefined;

  const showQtyField = mode === 'product' || mode === 'custom';
  const qtyIsOptional = mode === 'custom';

  return (
    <div className="rounded-lg border bg-background overflow-hidden" onFocus={onFocus}>
      {/* â”€â”€ Header bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b">
        {/* Line number */}
        <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 select-none">
          {index + 1}
        </span>

        {/* Mode pills */}
        <div className="flex gap-1">
          {MODES.map((m) => {
            const meta = LINE_MODE_META[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all',
                  mode === m
                    ? meta.color
                    : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground',
                )}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Catalog button â€” always visible */}
        <CatalogPicker
          selectedProductId={line.productId}
          onSelect={(product) => {
            const desc = product.description
              ? `${product.name}\n${product.description}`
              : product.name;
            form.setValue(`lines.${index}.description`, desc, { shouldValidate: true });
            form.setValue(`lines.${index}.unitPrice`, Number(product.unitPrice), {
              shouldValidate: true,
            });
            form.setValue(`lines.${index}.taxRate`, Number(product.taxRate), {
              shouldValidate: true,
            });
            form.setValue(`lines.${index}.productId`, product.id);
            form.setValue(
              `lines.${index}._mode`,
              product.type === ProductType.PRODUCT ? 'product' : 'service',
            );
            if (product.type === ProductType.PRODUCT) {
              form.setValue(`lines.${index}._hideQty`, false);
            }
          }}
        />

        {/* Reorder / duplicate / delete */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            title="Subir"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalLines - 1}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            title="Bajar"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Duplicar lÃ­nea"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {totalLines > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Eliminar lÃ­nea"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-3 pb-3 pt-2.5 space-y-2">
        {/* Description */}
        <Textarea
          {...form.register(`lines.${index}.description`)}
          placeholder={
            mode === 'service'
              ? 'Describe el servicio prestado...'
              : mode === 'product'
                ? 'Nombre y descripción del producto...'
                : 'Describe el concepto facturado...'
          }
          rows={2}
          className="resize-none text-sm"
        />
        {lineErrors?.description && (
          <p className="text-xs text-destructive -mt-1">{lineErrors.description.message}</p>
        )}

        {/* Numbers row */}
        <div className="flex items-center gap-2">
          {/* Qty â€” hidden for service, optional for custom, required for product */}
          {showQtyField && (
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min={mode === 'product' ? '1' : '0'}
                placeholder="Cant."
                className="w-[96px] text-sm h-9 pr-1"
                value={
                  mode === 'product'
                    ? (line.quantity ?? 1)
                    : line._hideQty
                      ? ''
                      : (line.quantity ?? '')
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    if (qtyIsOptional) {
                      // Modo libre: campo vacío = sin cantidad (ocultar en factura)
                      form.setValue(`lines.${index}.quantity`, 1);
                      form.setValue(`lines.${index}._hideQty`, true);
                    }
                    // Modo producto: no permitir vacío
                  } else {
                    const num = parseFloat(val);
                    form.setValue(
                      `lines.${index}.quantity`,
                      mode === 'product' ? Math.max(1, num || 1) : num || 1,
                    );
                    form.setValue(`lines.${index}._hideQty`, false);
                  }
                }}
              />
              {qtyIsOptional && (
                <span className="absolute -top-1.5 right-0 text-[9px] text-muted-foreground/60 font-normal">
                  opc.
                </span>
              )}
            </div>
          )}

          {/* Separator for product */}
          {mode === 'product' && (
            <span className="text-muted-foreground text-sm select-none">×</span>
          )}

          {/* Unit price */}
          <div className="relative flex-1 min-w-[100px]">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="text-sm h-9 pr-8"
              {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
              €
            </span>
          </div>

          {/* IVA */}
          <Select
            value={String(line.taxRate ?? 21)}
            onValueChange={(v) =>
              form.setValue(`lines.${index}.taxRate`, parseFloat(v), { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-[80px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Total */}
          <div className="text-sm font-semibold tabular-nums text-right min-w-[72px]">
            {lineTotal > 0
              ? lineTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
