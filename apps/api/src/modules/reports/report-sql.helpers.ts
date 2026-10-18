import { Prisma } from '@prisma/client';

/** Invoice tax base after the invoice-level discount (sin IVA/IRPF). Requires alias `i`. */
export const INVOICE_NET_BASE_SQL = Prisma.sql`(i.subtotal - COALESCE(i.discount_amount, 0))`;

/**
 * Line tax base with the invoice-level discount prorated across lines, so the sum
 * of lines matches INVOICE_NET_BASE_SQL. Requires aliases `l` (line) and `i` (invoice).
 */
export const LINE_NET_BASE_SQL = Prisma.sql`(
  l.subtotal * CASE
    WHEN i.subtotal = 0 THEN 1
    ELSE 1 - COALESCE(i.discount_amount, 0) / i.subtotal
  END
)`;

/** Hard cap for first-level groups — keeps preview payloads and Excel files bounded. */
export const MAX_GROUPS = 1000;

/** Hard cap for all grouped rows (groups × breakdown) returned by one query. */
export const MAX_GROUPED_ROWS = 20_000;

export function toAmount(value: string | number | bigint | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

export function toCount(value: bigint | number | null | undefined): number {
  return Number(value ?? 0);
}

export function sqlInList(values: readonly string[]): Prisma.Sql {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`));
}
