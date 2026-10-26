/**
 * Market price ranges for VeriFactu-ready invoicing software, shown on /precios.
 *
 * Comparative pricing claims must be dated and sourced. Review every quarter:
 * update the ranges, `checkedAt` and the source, never edit the prose alone.
 */
export interface MarketPriceRange {
  tier: string;
  range: string;
  description: string;
}

export const VERIFACTU_MARKET_PRICES = {
  checkedAt: { iso: '2026-10-26', label: 'octubre de 2026' },
  /** Overall span of `ranges`, used in the answer sentence. */
  overallRange: 'entre 6,60 y 20 €/mes',
  ranges: [
    {
      tier: 'Planes de entrada',
      range: '6,60 – 17 €/mes',
      description:
        'Facturación básica para autónomos. Billin, Holded, Contasimple, Anfix y Quipu tienen planes en esta franja.',
    },
    {
      tier: 'Planes completos',
      range: '12,50 – 20 €/mes',
      description: 'Añaden gastos, más usuarios, informes o contabilidad.',
    },
  ] satisfies MarketPriceRange[],
  note: 'Precios en pago anual y sin IVA. Algunos proveedores aplican promociones temporales o reservan funciones a planes superiores: compara siempre en la web de cada uno.',
  source: {
    name: 'Economía 3, "¿Cuál es el mejor programa de facturación para autónomos en 2026?" (25 de agosto de 2026)',
    url: 'https://economia3.com/2026/08/25/759877-cual-es-el-mejor-programa-de-facturacion-para-autonomos-en-2026/',
  },
} as const;
