import { InvoiceStatus, Prisma, RectificationType } from '@prisma/client';

/**
 * How many substitutions (made from NovaFactura) the API follows from an invoice the ERP
 * issued. A substitute of a substitute of a substitute is already far beyond real use.
 */
const SUBSTITUTION_DEPTH = 3;

/**
 * Invoices the integrations API exposes: the ones the ERP issued (externalRef) and the
 * substitutes (rectificativa por sustitución) issued from NovaFactura for them, so the
 * ERP can read, download and deliver the invoice that replaces one of its sales.
 */
export function apiVisibleInvoiceWhere(depth = SUBSTITUTION_DEPTH): Prisma.InvoiceWhereInput {
  const issuedByErp: Prisma.InvoiceWhereInput = { externalRef: { not: null } };
  if (depth === 0) return issuedByErp;
  return {
    OR: [
      issuedByErp,
      {
        isRectificative: true,
        rectificationType: RectificationType.SUBSTITUTION,
        rectifiedInvoice: apiVisibleInvoiceWhere(depth - 1),
      },
    ],
  };
}

/** Confirmed substitute that replaces an invoice (it is then RECTIFIED). */
export const SUBSTITUTED_BY_SELECT = {
  where: {
    rectificationType: RectificationType.SUBSTITUTION,
    status: { not: InvoiceStatus.DRAFT },
  },
  select: { id: true },
  orderBy: { createdAt: 'desc' },
  take: 1,
} satisfies Prisma.Invoice$rectificativeInvoicesArgs;

/**
 * Original invoice data the response needs: its type (record type R4/R5) and the sale
 * reference up the substitution chain (same depth as apiVisibleInvoiceWhere).
 */
export const RECTIFIED_INVOICE_CHAIN_SELECT = {
  select: {
    invoiceType: true,
    externalRef: true,
    rectifiedInvoice: {
      select: {
        externalRef: true,
        rectifiedInvoice: { select: { externalRef: true } },
      },
    },
  },
} satisfies Prisma.InvoiceDefaultArgs;

export interface RectifiedInvoiceLink {
  externalRef: string | null;
  rectifiedInvoice?: RectifiedInvoiceLink | null;
}

/** The sale reference of an invoice, or that of the ERP invoice its substitution chain replaces. */
export function resolveSaleExternalRef(invoice: RectifiedInvoiceLink): string {
  let current: RectifiedInvoiceLink | null | undefined = invoice;
  while (current) {
    if (current.externalRef) return current.externalRef;
    current = current.rectifiedInvoice;
  }
  return '';
}
