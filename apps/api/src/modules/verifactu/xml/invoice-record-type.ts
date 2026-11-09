/**
 * VeriFactu invoice types (TipoFactura, AEAT L2 list):
 * - F1: complete invoice (art. 6, 7.2 and 7.3 RD 1619/2012).
 * - F2: simplified invoice and invoice without recipient identification (art. 6.1.d).
 * - F3: invoice issued in replacement of declared simplified invoices (canje, art. 15).
 * - R1–R4: rectificative of a complete invoice (R4 = "resto", used for every web rectificative).
 * - R5: rectificative of a simplified invoice.
 */
export type InvoiceRecordType = 'F1' | 'F2' | 'F3' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export interface RecordTypeSource {
  invoiceType: string;
  isRectificative: boolean;
  rectifiedInvoice: { invoiceType: string } | null;
  /** Simplified invoices this one replaces (only an F3 has them). */
  exchangedInvoiceCount: number;
}

const SIMPLIFIED = 'simplified';

/** True for records that never identify the recipient in VeriFactu (F2 and R5). */
export function isSimplifiedRecordType(recordType: InvoiceRecordType): boolean {
  return recordType === 'F2' || recordType === 'R5';
}

export function resolveInvoiceRecordType(source: RecordTypeSource): InvoiceRecordType {
  if (source.isRectificative) {
    const rectifiesSimplified =
      source.invoiceType === SIMPLIFIED || source.rectifiedInvoice?.invoiceType === SIMPLIFIED;
    return rectifiesSimplified ? 'R5' : 'R4';
  }
  if (source.exchangedInvoiceCount > 0) return 'F3';
  return source.invoiceType === SIMPLIFIED ? 'F2' : 'F1';
}
