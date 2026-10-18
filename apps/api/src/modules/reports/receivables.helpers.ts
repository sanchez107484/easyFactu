import {
  ReceivableAging,
  ReceivableAgingBucket,
  ReceivableInvoice,
  ReceivablesCustomerRow,
  ReceivablesReport,
} from '@easyfactura/shared-types';
import { toAmount } from './report-sql.helpers';

const DAY_MS = 86_400_000;

export interface ReceivableInvoiceRow {
  id: string;
  number: string | null;
  issue_date: Date;
  due_date: Date;
  total: string;
  paid: string;
  customer_id: string;
  customer_name: string;
  customer_nif: string | null;
}

export function emptyAging(): ReceivableAging {
  return {
    [ReceivableAgingBucket.NOT_DUE]: 0,
    [ReceivableAgingBucket.DAYS_1_30]: 0,
    [ReceivableAgingBucket.DAYS_31_60]: 0,
    [ReceivableAgingBucket.DAYS_61_90]: 0,
    [ReceivableAgingBucket.OVER_90]: 0,
  };
}

export function agingBucketFor(daysOverdue: number): ReceivableAgingBucket {
  if (daysOverdue <= 0) return ReceivableAgingBucket.NOT_DUE;
  if (daysOverdue <= 30) return ReceivableAgingBucket.DAYS_1_30;
  if (daysOverdue <= 60) return ReceivableAgingBucket.DAYS_31_60;
  if (daysOverdue <= 90) return ReceivableAgingBucket.DAYS_61_90;
  return ReceivableAgingBucket.OVER_90;
}

export function toReceivableInvoice(row: ReceivableInvoiceRow, asOf: Date): ReceivableInvoice {
  const daysOverdue = Math.round((asOf.getTime() - row.due_date.getTime()) / DAY_MS);
  const totalGross = toAmount(row.total);
  const paidGross = toAmount(row.paid);
  return {
    id: row.id,
    number: row.number,
    issueDate: row.issue_date.toISOString().slice(0, 10),
    dueDate: row.due_date.toISOString().slice(0, 10),
    daysOverdue,
    bucket: agingBucketFor(daysOverdue),
    totalGross,
    paidGross,
    pendingGross: toAmount(totalGross - paidGross),
  };
}

function addToAging(aging: ReceivableAging, invoice: ReceivableInvoice): ReceivableAging {
  return { ...aging, [invoice.bucket]: toAmount(aging[invoice.bucket] + invoice.pendingGross) };
}

/** Groups pending invoices by customer, largest balance first. */
export function buildCustomerRows(
  rows: ReceivableInvoiceRow[],
  asOf: Date
): ReceivablesCustomerRow[] {
  const byCustomer = new Map<string, ReceivablesCustomerRow>();

  for (const row of rows) {
    const invoice = toReceivableInvoice(row, asOf);
    const current = byCustomer.get(row.customer_id) ?? {
      customerId: row.customer_id,
      name: row.customer_name,
      nif: row.customer_nif,
      pendingGross: 0,
      aging: emptyAging(),
      invoicesCount: 0,
      maxDaysOverdue: Number.NEGATIVE_INFINITY,
      invoices: [],
    };
    byCustomer.set(row.customer_id, {
      ...current,
      pendingGross: toAmount(current.pendingGross + invoice.pendingGross),
      aging: addToAging(current.aging, invoice),
      invoicesCount: current.invoicesCount + 1,
      maxDaysOverdue: Math.max(current.maxDaysOverdue, invoice.daysOverdue),
      invoices: [...current.invoices, invoice],
    });
  }

  return [...byCustomer.values()].sort((a, b) => b.pendingGross - a.pendingGross);
}

export function sumReceivables(rows: ReceivablesCustomerRow[]): ReceivablesReport['totals'] {
  const aging = rows.reduce((acc, row) => {
    const next = { ...acc };
    for (const bucket of Object.values(ReceivableAgingBucket)) {
      next[bucket] = toAmount(acc[bucket] + row.aging[bucket]);
    }
    return next;
  }, emptyAging());

  const pendingGross = toAmount(rows.reduce((acc, row) => acc + row.pendingGross, 0));
  return {
    pendingGross,
    overdueGross: toAmount(pendingGross - aging[ReceivableAgingBucket.NOT_DUE]),
    aging,
    invoicesCount: rows.reduce((acc, row) => acc + row.invoicesCount, 0),
    customersCount: rows.length,
  };
}
