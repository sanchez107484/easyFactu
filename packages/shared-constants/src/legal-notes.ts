/**
 * Mandatory legal mentions for intra-EU B2B invoices (Ley 37/1992 del IVA,
 * Directiva 2006/112/CE and art. 6.1 of the Reglamento de facturación).
 *
 * Single source of truth: the invoice form inserts these texts and the public
 * guide shows them, so what we publish is exactly what the app writes.
 */
export const INTRACOMMUNITY_LEGAL_NOTES = {
  /** Intra-EU supply of goods to a VAT-registered business */
  GOODS:
    'Entrega intracomunitaria exenta de IVA según el artículo 25 de la Ley 37/1992 y el artículo 138 de la Directiva 2006/112/CE.',
  /** B2B services to a business established in another EU member state */
  SERVICES:
    'Operación no sujeta a IVA en España (artículo 69 de la Ley 37/1992). Inversión del sujeto pasivo según el artículo 196 de la Directiva 2006/112/CE.',
} as const;

export type IntracommunityLegalNoteKind = keyof typeof INTRACOMMUNITY_LEGAL_NOTES;
