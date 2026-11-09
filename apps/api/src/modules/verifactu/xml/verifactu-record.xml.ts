import { InvoiceRecordType, isSimplifiedRecordType } from './invoice-record-type';

/** Prisma Decimal or number: every amount is read through Number(). */
type Amount = { toString(): string } | number;

/** Identifies another invoice inside a record (rectified, replaced or annulled). */
export interface InvoiceReference {
  issuerNif: string;
  number: string;
  issueDate: Date;
}

export interface InvoiceRecordLine {
  subtotal: Amount;
  taxRate: Amount;
  taxAmount: Amount;
  irpfAmount: Amount | null;
  surchargeRate: Amount | null;
  surchargeAmount: Amount | null;
}

export interface InvoiceRecordXmlData {
  issuer: { nif: string; name: string };
  number: string;
  issueDate: Date;
  /** Only when it differs from the issue date. */
  operationDate: Date | null;
  recordType: InvoiceRecordType;
  rectification: {
    /** S = por diferencias, I = por sustitución */
    type: 'S' | 'I';
    rectified: InvoiceReference | null;
  } | null;
  replacedInvoices: InvoiceReference[];
  recipient: { name: string; nif: string | null };
  total: Amount;
  discountAmount: Amount | null;
  irpfTotal: Amount | null;
  compensacionPercent: Amount | null;
  compensacionAmount: Amount | null;
  lines: InvoiceRecordLine[];
  hash: string | null;
  prevHash: string | null;
}

export interface CancellationRecordXmlData {
  issuer: { nif: string; name: string };
  annulled: InvoiceReference;
  hash: string;
  prevHash: string | null;
}

const NAMESPACE =
  'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd';

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** DD-MM-YYYY. Dates are calendar dates (@db.Date, midnight UTC), so UTC getters are used. */
export function formatXmlDate(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function money(value: Amount): string {
  return Number(value).toFixed(2);
}

/** Drops the empty lines left by optional elements so the XML stays readable and testable. */
function compact(lines: string[]): string {
  return lines.filter((line) => line.trim() !== '').join('\n');
}

function envelope(issuer: { nif: string; name: string }, record: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ven:VeriFactu xmlns:ven="${NAMESPACE}">
  <Cabecera>
    <ObligadoEmision>
      <NombreRazon>${escapeXml(issuer.name)}</NombreRazon>
      <NIF>${escapeXml(issuer.nif)}</NIF>
    </ObligadoEmision>
  </Cabecera>
${record}
</ven:VeriFactu>`;
}

function huella(hash: string | null, prevHash: string | null): string {
  return compact([
    '    <Huella>',
    `      <Hash>${hash ?? ''}</Hash>`,
    prevHash ? `      <HashAnterior>${prevHash}</HashAnterior>` : '',
    '    </Huella>',
  ]);
}

function invoiceReference(tag: string, reference: InvoiceReference): string {
  return `      <${tag}>
        <IDEmisorFactura>
          <NIF>${escapeXml(reference.issuerNif)}</NIF>
        </IDEmisorFactura>
        <NumSerieFactura>${escapeXml(reference.number)}</NumSerieFactura>
        <FechaExpedicionFactura>${formatXmlDate(reference.issueDate)}</FechaExpedicionFactura>
      </${tag}>`;
}

function rectificationBlocks(data: InvoiceRecordXmlData): string[] {
  if (!data.rectification) return [];
  const rectified = data.rectification.rectified;
  return [
    `    <TipoRectificativa>${data.rectification.type}</TipoRectificativa>`,
    rectified
      ? `    <FacturasRectificadas>\n${invoiceReference('IDFacturaRectificada', rectified)}\n    </FacturasRectificadas>`
      : '',
  ];
}

function replacedInvoicesBlock(data: InvoiceRecordXmlData): string {
  if (data.recordType !== 'F3' || data.replacedInvoices.length === 0) return '';
  const references = data.replacedInvoices.map((ref) =>
    invoiceReference('IDFacturaSustituida', ref)
  );
  return `    <FacturasSustituidas>\n${references.join('\n')}\n    </FacturasSustituidas>`;
}

/** AEAT expects the absolute amount; the sign of the breakdown tells credit from debit. */
function rectificationAmountBlock(data: InvoiceRecordXmlData): string {
  if (data.rectification?.type !== 'S') return '';
  return `    <ImporteRectificacion>${Math.abs(Number(data.total)).toFixed(2)}</ImporteRectificacion>`;
}

function operationDateBlock(data: InvoiceRecordXmlData): string {
  if (!data.operationDate) return '';
  const operationDate = formatXmlDate(data.operationDate);
  if (operationDate === formatXmlDate(data.issueDate)) return '';
  return `    <FechaOperacion>${operationDate}</FechaOperacion>`;
}

/** F2 and R5 never carry Destinatarios: the recipient of a simplified invoice is not identified. */
function recipientBlock(data: InvoiceRecordXmlData): string {
  if (isSimplifiedRecordType(data.recordType)) return '';
  return compact([
    '    <Destinatarios>',
    '      <IDDestinatario>',
    `        <NombreRazon>${escapeXml(data.recipient.name)}</NombreRazon>`,
    data.recipient.nif ? `        <NIF>${escapeXml(data.recipient.nif)}</NIF>` : '',
    '      </IDDestinatario>',
    '    </Destinatarios>',
  ]);
}

function agrarianBreakdown(data: InvoiceRecordXmlData): string {
  const base = data.lines.reduce((sum, line) => sum + Number(line.subtotal), 0);
  const discountedBase = data.discountAmount ? base - Number(data.discountAmount) : base;
  const compensacionAmount = Number(data.compensacionAmount);
  const irpfAmount = data.irpfTotal ? Number(data.irpfTotal) : 0;
  return compact([
    '      <DetalleDesglose>',
    `        <BaseImponible>${discountedBase.toFixed(2)}</BaseImponible>`,
    `        <TipoImpositivo>${money(data.compensacionPercent ?? 0)}</TipoImpositivo>`,
    `        <CuotaImpuesto>${compensacionAmount.toFixed(2)}</CuotaImpuesto>`,
    irpfAmount !== 0
      ? `        <BaseRetencion>${(discountedBase + compensacionAmount).toFixed(2)}</BaseRetencion>`
      : '',
    irpfAmount !== 0
      ? `        <RetencionSoportada>${irpfAmount.toFixed(2)}</RetencionSoportada>`
      : '',
    '      </DetalleDesglose>',
  ]);
}

interface TaxGroup {
  base: number;
  tax: number;
  irpf: number;
  surchargeAmount: number;
  surchargeRate: number;
}

function groupLinesByTaxRate(lines: InvoiceRecordLine[]): Map<number, TaxGroup> {
  const groups = new Map<number, TaxGroup>();
  for (const line of lines) {
    const rate = Number(line.taxRate);
    const group = groups.get(rate) ?? {
      base: 0,
      tax: 0,
      irpf: 0,
      surchargeAmount: 0,
      surchargeRate: 0,
    };
    const lineSurcharge = Number(line.surchargeAmount ?? 0);
    group.base += Number(line.subtotal);
    group.tax += Number(line.taxAmount);
    group.irpf += Number(line.irpfAmount ?? 0);
    group.surchargeAmount += lineSurcharge;
    if (lineSurcharge !== 0 && group.surchargeRate === 0) {
      group.surchargeRate = Number(line.surchargeRate ?? 0);
    }
    groups.set(rate, group);
  }
  return groups;
}

function taxGroupBreakdown(rate: number, group: TaxGroup): string {
  const hasSurcharge = group.surchargeAmount !== 0;
  return compact([
    '      <DetalleDesglose>',
    `        <BaseImponible>${group.base.toFixed(2)}</BaseImponible>`,
    `        <TipoImpositivo>${rate.toFixed(2)}</TipoImpositivo>`,
    `        <CuotaImpuesto>${group.tax.toFixed(2)}</CuotaImpuesto>`,
    hasSurcharge
      ? `        <RecargoEquivalencia>
          <BaseImponible>${group.base.toFixed(2)}</BaseImponible>
          <TipoImpositivo>${group.surchargeRate.toFixed(2)}</TipoImpositivo>
          <CuotaImpuesto>${group.surchargeAmount.toFixed(2)}</CuotaImpuesto>
        </RecargoEquivalencia>`
      : '',
    group.irpf !== 0 ? `        <BaseRetencion>${group.base.toFixed(2)}</BaseRetencion>` : '',
    group.irpf !== 0
      ? `        <RetencionSoportada>${group.irpf.toFixed(2)}</RetencionSoportada>`
      : '',
    '      </DetalleDesglose>',
  ]);
}

function isAgrarian(data: InvoiceRecordXmlData): boolean {
  return data.compensacionPercent != null && data.compensacionAmount != null;
}

/** REAGYP: one block with the agrarian compensation. Otherwise one block per VAT rate. */
function taxBreakdown(data: InvoiceRecordXmlData): string {
  if (isAgrarian(data)) return agrarianBreakdown(data);
  return [...groupLinesByTaxRate(data.lines).entries()]
    .map(([rate, group]) => taxGroupBreakdown(rate, group))
    .join('\n');
}

/**
 * Registration record (RegistroFactura) of an invoice. Element order follows the AEAT
 * RegistroAlta sequence: type, rectification data, replaced invoices, operation date,
 * recipients, breakdown, total and fingerprint.
 */
export function buildInvoiceRecordXml(data: InvoiceRecordXmlData): string {
  const record = compact([
    '  <RegistroFactura>',
    '    <IDFactura>',
    '      <IDEmisorFactura>',
    `        <NIF>${escapeXml(data.issuer.nif)}</NIF>`,
    '      </IDEmisorFactura>',
    `      <NumSerieFactura>${escapeXml(data.number)}</NumSerieFactura>`,
    `      <FechaExpedicionFactura>${formatXmlDate(data.issueDate)}</FechaExpedicionFactura>`,
    '    </IDFactura>',
    `    <TipoFactura>${data.recordType}</TipoFactura>`,
    ...rectificationBlocks(data),
    replacedInvoicesBlock(data),
    rectificationAmountBlock(data),
    operationDateBlock(data),
    isAgrarian(data) ? '    <ClaveRegimenEspecial>02</ClaveRegimenEspecial>' : '',
    recipientBlock(data),
    '    <Desglose>',
    taxBreakdown(data),
    '    </Desglose>',
    `    <ImporteTotal>${money(data.total)}</ImporteTotal>`,
    huella(data.hash, data.prevHash),
    '  </RegistroFactura>',
  ]);
  return envelope(data.issuer, record);
}

/**
 * Cancellation record (RegistroAnulacion): annuls the registration of an invoice that should
 * not have been issued. It is chained like any other record.
 */
export function buildCancellationRecordXml(data: CancellationRecordXmlData): string {
  const record = compact([
    '  <RegistroAnulacion>',
    '    <IDFactura>',
    `      <IDEmisorFacturaAnulada>${escapeXml(data.annulled.issuerNif)}</IDEmisorFacturaAnulada>`,
    `      <NumSerieFacturaAnulada>${escapeXml(data.annulled.number)}</NumSerieFacturaAnulada>`,
    `      <FechaExpedicionFacturaAnulada>${formatXmlDate(data.annulled.issueDate)}</FechaExpedicionFacturaAnulada>`,
    '    </IDFactura>',
    huella(data.hash, data.prevHash),
    '  </RegistroAnulacion>',
  ]);
  return envelope(data.issuer, record);
}
