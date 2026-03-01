import { z } from 'zod';

// ==================== LINE MODES ====================

export const LINE_MODES = ['custom', 'service', 'product'] as const;
export type LineMode = (typeof LINE_MODES)[number];

export const LINE_MODE_META: Record<LineMode, { label: string; color: string }> = {
  custom: {
    label: 'Libre',
    color:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  service: {
    label: 'Servicio',
    color:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  product: {
    label: 'Producto',
    color:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  },
};

// ==================== EXTENDED LINE SCHEMA ====================

export const extendedLineSchema = z.object({
  description: z.string().min(2, 'Mínimo 2 caracteres').max(500, 'Máximo 500 caracteres'),
  // quantity=0 means "not specified" in Libre mode → sent as 1 to API, hidden in invoice
  quantity: z.number().min(0).default(1),
  unitPrice: z.number({ invalid_type_error: 'Requerido' }).min(0, 'No puede ser negativo'),
  taxRate: z.number({ invalid_type_error: 'Requerido' }),
  productId: z.string().optional(),
  // Frontend-only — stripped before sending to the API
  _mode: z.enum(LINE_MODES).default('custom'),
  /** true when mode=custom and user has not entered a quantity (qty=1 but hidden in invoice) */
  _hideQty: z.boolean().default(true),
});

export type ExtendedLineData = z.infer<typeof extendedLineSchema>;

export const EMPTY_LINE: ExtendedLineData = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxRate: 21,
  _mode: 'custom',
  _hideQty: true,
};

// ==================== HELPERS ====================

/**
 * Strips frontend-only `_*` fields and normalizes quantity before sending to the API.
 * When _hideQty is true (Libre without count), quantity is sent as 1.
 */
export function stripLineMetaFields(
  line: ExtendedLineData,
): Omit<ExtendedLineData, '_mode' | '_hideQty'> {
  const { _mode, _hideQty, ...rest } = line;
  void _mode;
  void _hideQty;
  return {
    ...rest,
    quantity: rest.quantity > 0 ? rest.quantity : 1,
  };
}
