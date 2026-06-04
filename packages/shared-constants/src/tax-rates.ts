/**
 * Spanish tax rates (IVA)
 */

export const TAX_RATES = {
  STANDARD: 21, // IVA General
  REDUCED: 10, // IVA Reducido
  SUPER_REDUCED: 4, // IVA Superreducido
  EXEMPT: 0, // Exento
  INTRACOMMUNITY: 0, // Intracomunitario (inversión del sujeto pasivo)
} as const;

export const TAX_RATE_OPTIONS = [
  { value: TAX_RATES.STANDARD, label: '21% - IVA General' },
  { value: TAX_RATES.REDUCED, label: '10% - IVA Reducido' },
  { value: TAX_RATES.SUPER_REDUCED, label: '4% - IVA Superreducido' },
  { value: TAX_RATES.EXEMPT, label: '0% - Exento' },
  { value: TAX_RATES.INTRACOMMUNITY, label: '0% - Intracomunitario' },
] as const;

/**
 * IRPF retention rates for professionals
 */
export const IRPF_RATES = {
  DEFAULT: 15, // Retención general profesionales
  NEW_ACTIVITY: 7, // Primeros 3 años de actividad
  EXEMPT: 0, // Sin retención
} as const;

export const IRPF_RATE_OPTIONS = [
  { value: IRPF_RATES.DEFAULT, label: '15% - Retención general' },
  {
    value: IRPF_RATES.NEW_ACTIVITY,
    label: '7% - Nueva actividad (primeros 3 años)',
  },
  { value: IRPF_RATES.EXEMPT, label: '0% - Sin retención' },
] as const;

/**
 * Deduplicated tax rate options for select inputs (product/service pricing).
 * Excludes the INTRACOMMUNITY duplicate — use TAX_RATE_OPTIONS for full list.
 */
export const TAX_RATE_SELECT_OPTIONS = [
  { value: TAX_RATES.STANDARD, label: '21% — IVA General' },
  { value: TAX_RATES.REDUCED, label: '10% — IVA Reducido' },
  { value: TAX_RATES.SUPER_REDUCED, label: '4% — IVA Superreducido' },
  { value: TAX_RATES.EXEMPT, label: '0% — Exento / No sujeto' },
] as const;

/**
 * Valid tax rate values for backend DTO validation.
 * = [0, 4, 10, 21]
 */
export const VALID_TAX_RATES = [
  TAX_RATES.EXEMPT,
  TAX_RATES.SUPER_REDUCED,
  TAX_RATES.REDUCED,
  TAX_RATES.STANDARD,
] as const;

/**
 * Recargo de Equivalencia rates mapped to their corresponding IVA rate.
 * Art. 161 LIVA: recargo que pagan los minoristas en régimen de RE.
 * IVA 21% → RE 5.2% | IVA 10% → RE 1.4% | IVA 4% → RE 0.5% | IVA 0% → RE 0%
 */
export const EQUIVALENCE_SURCHARGE_RATES: Record<number, number> = {
  21: 5.2,
  10: 1.4,
  4: 0.5,
  0: 0,
} as const;
