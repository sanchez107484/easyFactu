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
  { value: TAX_RATES.STANDARD, label: "21% - IVA General" },
  { value: TAX_RATES.REDUCED, label: "10% - IVA Reducido" },
  { value: TAX_RATES.SUPER_REDUCED, label: "4% - IVA Superreducido" },
  { value: TAX_RATES.EXEMPT, label: "0% - Exento" },
  { value: TAX_RATES.INTRACOMMUNITY, label: "0% - Intracomunitario" },
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
  { value: IRPF_RATES.DEFAULT, label: "15% - Retención general" },
  {
    value: IRPF_RATES.NEW_ACTIVITY,
    label: "7% - Nueva actividad (primeros 3 años)",
  },
  { value: IRPF_RATES.EXEMPT, label: "0% - Sin retención" },
] as const;
