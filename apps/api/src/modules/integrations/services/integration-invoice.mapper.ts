import { InvoiceStatus, Prisma, VerifactuStatus } from '@prisma/client';
import { resolveInvoiceRecordType } from '../../verifactu/xml/invoice-record-type';
import {
  InvoiceCancellationResponse,
  IntegrationInvoiceResponse,
  IssuedInvoiceStatus,
  RegistrationErrorResponse,
  RegistrationStatus,
  TaxBreakdownResponse,
} from '../dto/integration-responses.dto';
import { formatMoney, toCents } from '../utils/decimal';

/** Only the columns the contract exposes; never the customer NIF or other personal data. */
export const INTEGRATION_INVOICE_SELECT = {
  id: true,
  externalRef: true,
  number: true,
  invoiceType: true,
  status: true,
  issueDate: true,
  operationDate: true,
  isRectificative: true,
  rectifiedInvoiceId: true,
  rectifiedInvoice: { select: { invoiceType: true } },
  exchangedByInvoiceId: true,
  exchangedInvoices: { select: { id: true }, orderBy: { issueDate: 'asc' } },
  cancellation: { select: { reason: true, createdAt: true, verifactuStatus: true } },
  subtotal: true,
  discountAmount: true,
  taxTotal: true,
  total: true,
  hash: true,
  verifactuQr: true,
  verifactuStatus: true,
  paymentStatus: true,
  amountPaid: true,
  lines: { select: { taxRate: true, subtotal: true, taxAmount: true } },
} satisfies Prisma.InvoiceSelect;

export type IntegrationInvoiceRow = Prisma.InvoiceGetPayload<{
  select: typeof INTEGRATION_INVOICE_SELECT;
}>;

const FINAL_REGISTRATION_STATUSES: Partial<Record<VerifactuStatus, RegistrationStatus>> = {
  ACCEPTED: 'ACCEPTED',
  ACCEPTED_WITH_WARNINGS: 'ACCEPTED_WITH_WARNINGS',
  REJECTED: 'REJECTED',
};

const REGISTRATION_ERRORS: Partial<Record<VerifactuStatus, RegistrationErrorResponse>> = {
  REJECTED: {
    code: 'REJECTED_BY_HACIENDA',
    message: 'Hacienda ha rechazado el registro. Revisa la factura en NovaFactura.',
  },
  ERROR: {
    code: 'SUBMISSION_FAILED',
    message: 'El envío a Hacienda ha fallado. La clínica puede reintentarlo desde NovaFactura.',
  },
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ERROR (sign or send failed) is not final: the clinic can retry from NovaFactura, so it stays PENDING. */
export function toRegistrationStatus(status: VerifactuStatus | null): RegistrationStatus {
  return (status && FINAL_REGISTRATION_STATUSES[status]) ?? 'PENDING';
}

function buildTaxBreakdown(lines: IntegrationInvoiceRow['lines']): TaxBreakdownResponse[] {
  const byRate = new Map<number, { base: bigint; tax: bigint }>();
  for (const line of lines) {
    const rate = Number(line.taxRate);
    const current = byRate.get(rate) ?? { base: 0n, tax: 0n };
    current.base += toCents(Number(line.subtotal));
    current.tax += toCents(Number(line.taxAmount));
    byRate.set(rate, current);
  }
  return [...byRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, amounts]) => ({
      rate: String(rate),
      base: formatMoney(Number(amounts.base) / 100),
      tax: formatMoney(Number(amounts.tax) / 100),
    }));
}

function toIssuedStatus(status: InvoiceStatus): IssuedInvoiceStatus {
  if (status === InvoiceStatus.CANCELLED) return 'CANCELLED';
  return status === InvoiceStatus.RECTIFIED ? 'RECTIFIED' : 'ISSUED';
}

function toCancellationResponse(
  cancellation: IntegrationInvoiceRow['cancellation']
): InvoiceCancellationResponse | null {
  if (!cancellation) return null;
  return {
    reason: cancellation.reason,
    cancelledAt: cancellation.createdAt.toISOString(),
    registrationStatus: toRegistrationStatus(cancellation.verifactuStatus),
  };
}

export function toIntegrationInvoiceResponse(
  invoice: IntegrationInvoiceRow,
  appUrl: string
): IntegrationInvoiceResponse {
  const base = Number(invoice.subtotal) - Number(invoice.discountAmount ?? 0);
  const issueDate = toIsoDate(invoice.issueDate);
  return {
    id: invoice.id,
    externalRef: invoice.externalRef ?? '',
    number: invoice.number ?? '',
    invoiceType: invoice.invoiceType,
    recordType: resolveInvoiceRecordType({
      invoiceType: invoice.invoiceType,
      isRectificative: invoice.isRectificative,
      rectifiedInvoice: invoice.rectifiedInvoice,
      exchangedInvoiceCount: invoice.exchangedInvoices.length,
    }),
    status: toIssuedStatus(invoice.status),
    issueDate,
    operationDate: invoice.operationDate ? toIsoDate(invoice.operationDate) : issueDate,
    rectifiedInvoiceId: invoice.rectifiedInvoiceId,
    exchangedByInvoiceId: invoice.exchangedByInvoiceId,
    replacedInvoiceIds: invoice.exchangedInvoices.map((replaced) => replaced.id),
    cancellation: toCancellationResponse(invoice.cancellation),
    totals: {
      base: formatMoney(base),
      tax: formatMoney(invoice.taxTotal),
      total: formatMoney(invoice.total),
    },
    taxBreakdown: buildTaxBreakdown(invoice.lines),
    hash: invoice.hash,
    qrUrl: invoice.verifactuQr,
    registrationStatus: toRegistrationStatus(invoice.verifactuStatus),
    registrationError:
      (invoice.verifactuStatus && REGISTRATION_ERRORS[invoice.verifactuStatus]) ?? null,
    paymentStatus: invoice.paymentStatus,
    amountPaid: formatMoney(invoice.amountPaid),
    appUrl,
  };
}
