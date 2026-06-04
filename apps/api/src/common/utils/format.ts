/**
 * Formats a numeric amount as Spanish currency string.
 * Uses decimal style with explicit grouping to guarantee thousands separator
 * regardless of Node.js ICU build (e.g. 1542.5 → "1.542,50 €").
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (isNaN(n)) return '0,00\u00A0€';
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(n) + '\u00A0€'
  );
}

/**
 * Formats a unit price with 2–4 decimal places (no trailing zeros beyond 2).
 * Used for the Precio/ud column in invoice PDFs.
 * Examples: 35.02 → "35,02 €" | 35.024 → "35,024 €" | 35.0245 → "35,0245 €"
 */
export function formatUnitPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (isNaN(n)) return '0,00\u00A0€';
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
      useGrouping: true,
    }).format(n) + '\u00A0€'
  );
}
