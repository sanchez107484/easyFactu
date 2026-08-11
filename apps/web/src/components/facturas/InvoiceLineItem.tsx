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
import { Trash2, Copy, ChevronUp, ChevronDown, BookOpen, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { round2, round4, formatUnitPrice } from '@/lib/math';
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
import { useState, useEffect, useRef } from 'react';
import { Package, Wrench } from 'lucide-react';
import { LineMode, LINE_MODE_META, ExtendedLineData } from '@/lib/invoice-line-types';
import { QuickCreateProductModal } from '@/components/facturas/QuickCreateProductModal';

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
  autoFocusDescription?: boolean;
  /** True when the tenant is in REAGYP regime — IVA does not apply per line. */
  isReagyp?: boolean;
  /** True cuando la factura es rectificativa — permite precios/totales negativos */
  allowNegativePrice?: boolean;
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
  defaultType,
  onSelect,
}: {
  selectedProductId?: string;
  defaultType: ProductType;
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { data } = useProducts({ limit: 500 });
  const products = data?.data ?? [];

  const handleProductCreated = (product: Product) => {
    onSelect(product);
    setShowCreate(false);
  };

  return (
    <>
      <QuickCreateProductModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onProductReady={handleProductCreated}
        defaultType={defaultType}
      />

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
              {products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground/30" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Facturas más rápidas con tu catálogo
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Guarda tus productos y servicios para añadirlos a cualquier factura con un
                      clic, sin tener que repetir nombre, precio e IVA cada vez.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setShowCreate(true);
                    }}
                    className="mt-1 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Crear primer elemento
                  </button>
                </div>
              ) : (
                <>
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
                                {pvp.toLocaleString('es-ES', {
                                  style: 'currency',
                                  currency: 'EUR',
                                })}
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
                </>
              )}
            </CommandList>
            {/* ── Footer: save current line to catalog ── */}
            {products.length > 0 && (
              <div className="border-t p-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setShowCreate(true);
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  Guardar nuevo elemento en el catálogo
                </button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </>
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
  autoFocusDescription = false,
  isReagyp = false,
  allowNegativePrice = false,
}: InvoiceLineItemProps) {
  const line: ExtendedLineData = useWatch({ control: form.control, name: `lines.${index}` }) ?? {};
  const mode: LineMode = line._mode ?? 'custom';
  const priceMode = (line._priceMode ?? 'unit') as 'unit' | 'total';

  // Local raw string for discount input — lets the user type "10.5" or "10,5"
  // without React clobbering the intermediate value on each keystroke.
  const [discountRaw, setDiscountRaw] = useState<string>(() => {
    const v = line.discountPercent;
    return v ? String(v) : '';
  });

  // Local raw string for unit price — shows up to 4 decimal places to the user while
  // the form state stores up to 4 decimal places for back-calculation precision.
  const unitPriceInputRef = useRef<HTMLInputElement>(null);
  // True only when the user has actively typed in the unit price input during this focus session.
  // Prevents onBlur from overwriting form state with the rounded display value on load/navigation.
  const unitPriceIsEditedRef = useRef(false);

  const [unitPriceRaw, setUnitPriceRaw] = useState<string>(() => {
    const v = line.unitPrice;
    return v && (allowNegativePrice ? true : v > 0) ? formatUnitPrice(v) : '';
  });

  // Local raw string for total input — only active when priceMode === 'total'.
  const [totalRaw, setTotalRaw] = useState<string>('');

  // -- Calculations --------------------------------------------------
  const qty = mode === 'service' ? 1 : (line.quantity ?? 0);
  const price = line.unitPrice ?? 0;
  const tax = line.taxRate ?? 21;
  const discount = line.discountPercent ?? 0;
  // Keep full floating-point precision in intermediate steps so that lineTotal is
  // derived from unitPrice's 4-decimal precision rather than a rounded subtotal.
  // e.g. unitPrice=28.9256 → precise=28.9256 → ×1.21 = 34.999976 → round2 = 35.00
  // (rounding at the grossSubtotal step would give 28.93 → ×1.21 = 35.0053 → 35.01)
  const precisePre = qty * price;
  const precise = discount > 0 ? precisePre * (1 - discount / 100) : precisePre;
  // `subtotal` is only used for the display label below the line; always 2 dec.
  const subtotal = round2(precise);
  // In REAGYP, IVA does not apply per line — compensation is at invoice level
  const lineTotal = isReagyp ? subtotal : round2(precise * (1 + tax / 100));

  // -- Mode change ---------------------------------------------------
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

  // -- Price mode toggle (dead code guard — no button, kept for external use) ---------------
  // When qty / discount / tax change while in total mode, keep unitPrice in sync
  useEffect(() => {
    if (priceMode !== 'total') return;
    const t = parseFloat((totalRaw ?? '').replace(',', '.'));
    if (isNaN(t) || (allowNegativePrice ? t === 0 : t <= 0)) return;
    const divisor =
      (mode === 'service' ? 1 : qty || 1) * (1 - discount / 100) * (1 + (isReagyp ? 0 : tax) / 100);
    if (divisor <= 0) return;
    const backCalc = round4(t / divisor);
    form.setValue(`lines.${index}.unitPrice`, backCalc, { shouldValidate: false });
    setUnitPriceRaw(
      round2(backCalc).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, discount, tax, isReagyp, priceMode, totalRaw, mode, index, allowNegativePrice]);

  // Sync unitPriceRaw display when unitPrice is set externally (e.g. catalog import or draft load).
  // Skip when the user is actively typing inside the input.
  useEffect(() => {
    if (document.activeElement === unitPriceInputRef.current) return;
    const v = line.unitPrice ?? 0;
    setUnitPriceRaw(v !== 0 ? formatUnitPrice(v) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.unitPrice, allowNegativePrice]);

  // -- Errors -------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineErrors = (form.formState.errors as any)?.lines?.[index] as
    | Record<string, { message?: string }>
    | undefined;

  const showQtyField = mode === 'product' || mode === 'custom';
  const qtyIsOptional = mode === 'custom';

  return (
    <div className="rounded-lg border bg-background overflow-hidden" onFocus={onFocus}>
      {/* -- Header bar ----------------------------------------------- */}
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

        {/* Catalog button – always visible */}
        <CatalogPicker
          selectedProductId={line.productId}
          defaultType={mode === 'product' ? ProductType.PRODUCT : ProductType.SERVICE}
          onSelect={(product) => {
            const desc = product.description || product.name;
            form.setValue(`lines.${index}.description`, desc, { shouldValidate: true });
            form.setValue(`lines.${index}.unitPrice`, Number(product.unitPrice), {
              shouldValidate: true,
            });
            // In REAGYP, IVA = 0 — compensation applies at invoice level
            form.setValue(`lines.${index}.taxRate`, isReagyp ? 0 : Number(product.taxRate), {
              shouldValidate: true,
            });
            form.setValue(`lines.${index}.productId`, product.id);
            form.setValue(
              `lines.${index}._mode`,
              product.type === ProductType.PRODUCT ? 'product' : 'service',
            );
            // Only lock to 'unit' mode when the catalog product has an actual price.
            // If price is 0, keep the current mode so both unit-price and total inputs
            // remain editable immediately without the user needing to switch modes.
            if (Number(product.unitPrice) > 0) {
              form.setValue(`lines.${index}._priceMode`, 'unit');
            }
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
            title="Duplicar línea"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {totalLines > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Eliminar línea"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* -- Body ----------------------------------------------------- */}
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
          autoFocus={autoFocusDescription}
        />
        {lineErrors?.description && (
          <p className="text-xs text-destructive -mt-1">{lineErrors.description.message}</p>
        )}

        {/* Labels row */}
        <div className="flex items-center gap-2">
          {showQtyField && (
            <div className="w-[96px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Cantidad
            </div>
          )}
          {mode === 'product' && <div className="w-4 shrink-0" />}
          <div className="flex-1 min-w-[100px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Precio/ud.
          </div>
          {!isReagyp && (
            <div className="w-[80px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              IVA
            </div>
          )}
          <div className="w-[90px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Dto. %
          </div>
          <div className="w-[108px] text-[10px] font-medium text-muted-foreground uppercase tracking-wide text-right">
            {priceMode === 'total' ? 'Total c/IVA' : 'Total'}
          </div>
        </div>

        {/* Numbers row */}
        <div className="flex items-center gap-2">
          {/* Qty – hidden for service, optional for custom, required for product */}
          {showQtyField && (
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min={mode === 'product' ? '1' : '0'}
                placeholder="Cant."
                className="w-[96px] text-sm h-9 pr-1"
                data-invoice-qty={index}
                onFocus={(e) => e.target.select()}
                value={
                  mode === 'product'
                    ? line.quantity === 0
                      ? ''
                      : String(line.quantity ?? 1)
                    : line._hideQty
                      ? ''
                      : String(line.quantity ?? '')
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    if (mode === 'product') {
                      // Permite borrar temporalmente — se normaliza en onBlur
                      form.setValue(`lines.${index}.quantity`, 0);
                    } else if (qtyIsOptional) {
                      form.setValue(`lines.${index}.quantity`, 1);
                      form.setValue(`lines.${index}._hideQty`, true);
                    }
                  } else {
                    const num = parseFloat(val);
                    const safeNum = isNaN(num) ? 1 : num;
                    form.setValue(
                      `lines.${index}.quantity`,
                      mode === 'product' ? Math.max(0, safeNum) : safeNum,
                    );
                    form.setValue(`lines.${index}._hideQty`, false);
                  }
                }}
                onBlur={() => {
                  if (mode === 'product') {
                    const qty = form.getValues(`lines.${index}.quantity`) as number;
                    if (!qty || qty < 1) {
                      form.setValue(`lines.${index}.quantity`, 1);
                    }
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

          {/* Unit price — text input showing 2 decimals; internally stores up to 4 decimals
              for precision when back-calculating from total. Entering > 0 switches to 'unit'
              mode; clearing to 0 returns to 'total' mode. */}
          <div className="relative flex-1 min-w-[100px]">
            <Input
              ref={unitPriceInputRef}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className={cn('text-sm h-9 pr-8', priceMode === 'total' && 'text-muted-foreground')}
              value={unitPriceRaw}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const raw = e.target.value;
                const normalized = raw.replace(',', '.');
                unitPriceIsEditedRef.current = true;
                setUnitPriceRaw(raw);
                const num = parseFloat(normalized);
                if (!isNaN(num) && (allowNegativePrice || num >= 0)) {
                  form.setValue(`lines.${index}.unitPrice`, num, { shouldValidate: false });
                  if (num > 0 && priceMode === 'total') {
                    form.setValue(`lines.${index}._priceMode`, 'unit');
                  }
                }
              }}
              onBlur={() => {
                const wasEdited = unitPriceIsEditedRef.current;
                unitPriceIsEditedRef.current = false;

                if (!wasEdited) {
                  // User didn't type anything — normalize display only, preserve form state precision.
                  const formValue = form.getValues(`lines.${index}.unitPrice`) as number;
                  if (allowNegativePrice ? formValue !== 0 : formValue > 0) {
                    setUnitPriceRaw(formatUnitPrice(formValue));
                  }

                  return;
                }

                const normalized = unitPriceRaw.replace(',', '.');
                const num = parseFloat(normalized);
                const isInvalid = isNaN(num) || (allowNegativePrice ? num === 0 : num <= 0);

                if (isInvalid) {
                  setUnitPriceRaw('');
                  form.setValue(`lines.${index}.unitPrice`, 0, { shouldValidate: false });
                  if (priceMode === 'unit') {
                    form.setValue(`lines.${index}._priceMode`, 'total');
                    setTotalRaw('');
                  }
                } else {
                  // User typed a value — normalise display preserving up to 4 decimal
                  // places so the stored precision is visible and the live total stays
                  // exact (e.g. 28,9256 → lineTotal shows 35,00, not 35,01).
                  setUnitPriceRaw(formatUnitPrice(num));
                  form.setValue(`lines.${index}.unitPrice`, num, { shouldValidate: false });
                }
              }}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
              €
            </span>
          </div>

          {lineErrors?.unitPrice && (
            <p className="text-xs text-destructive mt-1">{lineErrors.unitPrice.message}</p>
          )}

          {/* IVA — hidden in REAGYP (Arts. 124-134 LIVA) */}
          {!isReagyp && (
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
          )}

          {/* Discount % */}
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              className="w-[90px] text-sm h-9 pr-5"
              value={discountRaw}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const raw = e.target.value;
                // Allow comma as decimal separator
                const normalized = raw.replace(',', '.');
                setDiscountRaw(raw);
                // Only sync to form when it's a valid number
                if (normalized === '' || normalized === '.') {
                  form.setValue(`lines.${index}.discountPercent`, 0, { shouldValidate: false });
                } else {
                  const num = parseFloat(normalized);
                  if (!isNaN(num)) {
                    form.setValue(
                      `lines.${index}.discountPercent`,
                      Math.min(100, Math.max(0, num)),
                      { shouldValidate: false },
                    );
                  }
                }
              }}
              onBlur={() => {
                // Normalise on exit: strip trailing dot, clamp, update display
                const normalized = discountRaw.replace(',', '.');
                const num = parseFloat(normalized);
                if (isNaN(num) || num <= 0) {
                  setDiscountRaw('');
                  form.setValue(`lines.${index}.discountPercent`, 0, { shouldValidate: false });
                } else {
                  const clamped = Math.min(100, Math.max(0, num));
                  setDiscountRaw(String(clamped));
                  form.setValue(`lines.${index}.discountPercent`, clamped, {
                    shouldValidate: false,
                  });
                }
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
              %
            </span>
          </div>

          {/* Total — always an Input; read-only (calculated) in unit mode, editable in total mode */}
          <div className="relative w-[108px]">
            {priceMode === 'unit' ? (
              <Input
                type="text"
                readOnly
                tabIndex={-1}
                className="text-sm h-9 pr-6 text-right font-semibold bg-transparent border-dashed cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
                value={
                  lineTotal !== 0
                    ? lineTotal.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ''
                }
              />
            ) : (
              <>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="text-sm h-9 pr-6 text-right font-semibold"
                  value={totalRaw}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const normalized = raw.replace(',', '.');
                    setTotalRaw(raw);
                    const t = parseFloat(normalized);
                    if (!isNaN(t) && (allowNegativePrice ? true : t >= 0)) {
                      const divisor =
                        (mode === 'service' ? 1 : qty || 1) *
                        (1 - discount / 100) *
                        (1 + (isReagyp ? 0 : tax) / 100);
                      if (divisor > 0) {
                        const backCalc = round4(t / divisor);
                        form.setValue(`lines.${index}.unitPrice`, backCalc, {
                          shouldValidate: false,
                        });
                        setUnitPriceRaw(formatUnitPrice(backCalc));
                      }
                    }
                  }}
                  onBlur={() => {
                    const normalized = (totalRaw ?? '').replace(',', '.');
                    const num = parseFloat(normalized);
                    if (isNaN(num) || (!allowNegativePrice && num < 0)) {
                      setTotalRaw('');
                      form.setValue(`lines.${index}.unitPrice`, 0, { shouldValidate: false });
                    } else {
                      setTotalRaw(String(round2(num)));
                    }
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                  €
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
