import { Prisma } from '@prisma/client';

/**
 * Returns a SQL predicate that selects the invoices that count as revenue:
 * - Normal confirmed/sent/paid invoices.
 * - Invoices marked as RECTIFIED whose confirmed rectificatives are **only**
 *   credit notes (DIFFERENCES). Those originals remain economically valid and
 *   must be summed algebraically with their credit notes.
 * - It excludes RECTIFIED invoices that were substituted (SUBSTITUTION), because
 *   the substitute invoice already replaces them in the aggregates.
 */
export function buildRevenueInvoiceFilter(alias: string = 'i'): Prisma.Sql {
  const prefix = alias ? `${alias}.` : '';
  return Prisma.sql`
    (
      ${Prisma.raw(`${prefix}status`)} IN ('CONFIRMED', 'SENT', 'PAID')
      OR (
        ${Prisma.raw(`${prefix}status`)} = 'RECTIFIED'
        AND ${Prisma.raw(`${prefix}superseded_by_substitution_id`)} IS NULL
        AND EXISTS (
          SELECT 1 FROM invoices r
          WHERE r.rectified_invoice_id = ${Prisma.raw(`${prefix}id`)}
            AND r.rectification_type = 'DIFFERENCES'
            AND r.status IN ('CONFIRMED', 'SENT', 'PAID')
        )
        AND NOT EXISTS (
          SELECT 1 FROM invoices r
          WHERE r.rectified_invoice_id = ${Prisma.raw(`${prefix}id`)}
            AND r.rectification_type = 'SUBSTITUTION'
            AND r.status IN ('CONFIRMED', 'SENT', 'PAID')
        )
      )
    )
  `;
}
