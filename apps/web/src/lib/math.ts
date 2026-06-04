/**
 * Redondea un número a 2 decimales.
 * Usa Math.round para evitar errores de punto flotante en cálculos de facturas.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Redondea un número a 4 decimales.
 * Se usa al calcular precio/ud desde el total para evitar errores de redondeo
 * en el round-trip: total → precio/ud → total.
 * Ejemplo: 35€ / 1.21 = 28.9256 → 28.9256 × 1.21 = 35.00 ✓
 */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Formatea un precio/ud para mostrar al usuario con entre 2 y 4 decimales.
 * Muestra los decimales necesarios sin ceros finales más allá de 2.
 * Ejemplos: 35.02 → "35,02" | 35.024 → "35,024" | 35.0245 → "35,0245"
 * El símbolo € NO se incluye (se muestra por separado en la UI).
 */
export function formatUnitPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (isNaN(n)) return '0,00';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
    useGrouping: true,
  }).format(n);
}

/**
 * Igual que formatUnitPrice pero con símbolo € al final.
 * Para usar en tablas de detalles y preview donde sí se necesita la unidad.
 */
export function formatUnitPriceCurrency(value: number | string | null | undefined): string {
  return formatUnitPrice(value) + '\u00A0€';
}
