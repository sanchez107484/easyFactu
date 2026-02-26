/**
 * Redondea un número a 2 decimales.
 * Usa Math.round para evitar errores de punto flotante en cálculos de facturas.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
