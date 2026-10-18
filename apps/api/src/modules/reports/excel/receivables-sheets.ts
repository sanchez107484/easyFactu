import * as ExcelJS from 'exceljs';
import {
  ReceivableAgingBucket,
  ReceivableInvoice,
  ReceivablesCustomerRow,
  ReceivablesReport,
} from '@easyfactura/shared-types';
import {
  CellValue,
  ReportSheetHeader,
  SheetColumn,
  addTableSheet,
} from './report-workbook.helpers';
import { AGING_BUCKET_LABELS } from '@easyfactura/shared-constants';

const BUCKETS = Object.values(ReceivableAgingBucket);

type AgingRow =
  | { kind: 'customer'; customer: ReceivablesCustomerRow }
  | { kind: 'invoice'; invoice: ReceivableInvoice };

interface FlatInvoiceRow {
  customer: ReceivablesCustomerRow;
  invoice: ReceivableInvoice;
}

function agingColumns(): SheetColumn<AgingRow>[] {
  return BUCKETS.map((bucket) => ({
    header: AGING_BUCKET_LABELS[bucket],
    format: 'currency',
    width: 14,
    value: (row) =>
      row.kind === 'customer'
        ? row.customer.aging[bucket]
        : row.invoice.bucket === bucket
          ? row.invoice.pendingGross
          : null,
  }));
}

function invoiceOnly<T>(pick: (invoice: ReceivableInvoice) => T) {
  return (row: AgingRow) => (row.kind === 'invoice' ? pick(row.invoice) : null);
}

const AGING_COLUMNS: SheetColumn<AgingRow>[] = [
  {
    header: 'Cliente / Factura',
    width: 36,
    value: (row) =>
      row.kind === 'customer'
        ? `${row.customer.name}${row.customer.nif ? ` (${row.customer.nif})` : ''}`
        : `    ${row.invoice.number ?? 'Sin número'}`,
  },
  { header: 'Emisión', width: 12, value: invoiceOnly((i) => i.issueDate) },
  { header: 'Vencimiento', width: 12, value: invoiceOnly((i) => i.dueDate) },
  {
    header: 'Días de retraso',
    format: 'integer',
    width: 14,
    value: (row) =>
      row.kind === 'customer'
        ? Math.max(row.customer.maxDaysOverdue, 0)
        : Math.max(row.invoice.daysOverdue, 0),
  },
  { header: 'Total factura', format: 'currency', value: invoiceOnly((i) => i.totalGross) },
  { header: 'Cobrado', format: 'currency', value: invoiceOnly((i) => i.paidGross) },
  {
    header: 'Pendiente',
    format: 'currency',
    value: (row) =>
      row.kind === 'customer' ? row.customer.pendingGross : row.invoice.pendingGross,
  },
  ...agingColumns(),
];

const FLAT_COLUMNS: SheetColumn<FlatInvoiceRow>[] = [
  { header: 'Cliente', width: 32, value: (r) => r.customer.name },
  { header: 'NIF', width: 14, value: (r) => r.customer.nif },
  { header: 'Factura', width: 16, value: (r) => r.invoice.number },
  { header: 'Emisión', width: 12, value: (r) => r.invoice.issueDate },
  { header: 'Vencimiento', width: 12, value: (r) => r.invoice.dueDate },
  {
    header: 'Días de retraso',
    format: 'integer',
    width: 14,
    value: (r) => Math.max(r.invoice.daysOverdue, 0),
  },
  { header: 'Tramo', width: 14, value: (r) => AGING_BUCKET_LABELS[r.invoice.bucket] },
  { header: 'Total factura', format: 'currency', value: (r) => r.invoice.totalGross },
  { header: 'Cobrado', format: 'currency', value: (r) => r.invoice.paidGross },
  { header: 'Pendiente', format: 'currency', value: (r) => r.invoice.pendingGross },
];

export function writeReceivablesSheets(
  workbook: ExcelJS.Workbook,
  header: ReportSheetHeader,
  report: ReceivablesReport
): void {
  const { totals } = report;
  const totalsRow: CellValue[] = [
    'Total',
    null,
    null,
    null,
    null,
    null,
    totals.pendingGross,
    ...BUCKETS.map((bucket) => totals.aging[bucket]),
  ];

  addTableSheet<AgingRow>(workbook, header, {
    name: 'Cobros pendientes',
    columns: AGING_COLUMNS,
    rows: report.rows.flatMap((customer): AgingRow[] => [
      { kind: 'customer', customer },
      ...customer.invoices.map((invoice): AgingRow => ({ kind: 'invoice', invoice })),
    ]),
    outlineLevel: (row) => (row.kind === 'invoice' ? 1 : 0),
    isBold: (row) => row.kind === 'customer',
    totals: totalsRow,
  });

  addTableSheet<FlatInvoiceRow>(workbook, header, {
    name: 'Facturas',
    columns: FLAT_COLUMNS,
    rows: report.rows.flatMap((customer) =>
      customer.invoices.map((invoice) => ({ customer, invoice }))
    ),
  });
}
