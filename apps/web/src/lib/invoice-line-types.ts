import { z } from 'zod';

// ==================== LINE MODES ====================

export const LINE_MODES = ['custom', 'service', 'product'] as const;
export type LineMode = (typeof LINE_MODES)[number];

export const LINE_MODE_META: Record<LineMode, { label: string; color: string }> = {
  custom: {
    label: 'Libre',
    color:
      'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
  },
  service: {
    label: 'Servicio',
    color:
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-800',
  },
  product: {
    label: 'Producto',
    color:
      'bg-overdue-50 text-overdue-700 border-overdue-200 dark:bg-overdue-950 dark:text-overdue-300 dark:border-overdue-800',
  },
};

// ==================== EXTENDED LINE SCHEMA ====================

export const extendedLineSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  // quantity=0 means "not specified" in Libre mode → hidden in invoice.
  // Negative values are allowed at schema level; non-rectificativa invoices validate > 0 in the form.
  quantity: z.number().default(1),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }),
  /** Per-line discount (0–100). Default 0 = no discount. */
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  productId: z.string().optional(),
  // Frontend-only — stripped before sending to the API
  _mode: z.enum(LINE_MODES).default('custom'),
  /** true when mode=custom and user has not entered a quantity (qty=1 but hidden in invoice) */
  _hideQty: z.boolean().default(true),
  /** 'unit' = user enters Precio/ud (default); 'total' = user enters Total con IVA (unitPrice computed) */
  _priceMode: z.enum(['unit', 'total']).default('unit'),
});

export type ExtendedLineData = z.infer<typeof extendedLineSchema>;

export const EMPTY_LINE: ExtendedLineData = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  taxRate: 21,
  _mode: 'custom',
  _hideQty: true,
  _priceMode: 'total',
};

// ==================== HELPERS ====================

/**
 * Strips frontend-only `_*` fields and normalizes quantity before sending to the API.
 * Computes `hideQty` from the mode and _hideQty flag so it's persisted to the DB.
 */
export function stripLineMetaFields(
  line: ExtendedLineData,
): Omit<ExtendedLineData, '_mode' | '_hideQty' | '_priceMode'> & { hideQty: boolean } {
  const { _mode, _hideQty, _priceMode, ...rest } = line;
  const hideQty =
    _mode === 'service' || (_mode === 'custom' && (_hideQty === true || rest.quantity === 0));
  return {
    ...rest,
    quantity: rest.quantity != null ? rest.quantity : 1,
    hideQty,
  };
}
