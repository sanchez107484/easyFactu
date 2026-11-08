/**
 * Exact decimal helpers for amounts the integrations API receives as text ("35.00").
 * Values are scaled integers (bigint) so no floating point is involved until the
 * amounts are handed to the invoice calculation.
 */

/** "1.5" with scale 4 → 15000n. The input must already match a decimal pattern. */
export function parseScaled(value: string, scale: number): bigint {
  const [integerPart = '0', fractionPart = ''] = value.trim().split('.');
  const paddedFraction = fractionPart.padEnd(scale, '0').slice(0, scale);
  return BigInt(integerPart) * 10n ** BigInt(scale) + BigInt(paddedFraction || '0');
}

/** 15000n with scale 4 → 1.5 (number, for the existing calculation service). */
export function scaledToNumber(value: bigint, scale: number): number {
  return Number(value) / 10 ** scale;
}

/** Division of non-negative integers rounded half up. */
export function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n || numerator < 0n) {
    throw new RangeError(
      'divideHalfUp expects a non-negative numerator and a positive denominator'
    );
  }
  return (numerator * 2n + denominator) / (denominator * 2n);
}

/** Euros (number with at most 2 decimals, as returned by the calculation service) to integer cents. */
export function toCents(euros: number): bigint {
  return BigInt(Math.round(euros * 100));
}

/** Contract format for money: string with exactly two decimals. */
export function formatMoney(euros: number | { toString(): string }): string {
  return Number(euros.toString()).toFixed(2);
}
