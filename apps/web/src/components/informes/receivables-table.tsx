'use client';

import { Fragment, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  ReceivableAgingBucket,
  ReceivableInvoice,
  ReceivablesCustomerRow,
  ReceivablesReport,
} from '@easyfactura/shared-types';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AGING_BUCKET_LABELS } from '@/lib/report-config';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const BUCKETS = Object.values(ReceivableAgingBucket);
const MAX_VISIBLE_CUSTOMERS = 50;

function amountOrDash(value: number): string {
  return value === 0 ? '—' : formatCurrency(value);
}

function overdueLabel(days: number): string {
  if (days <= 0) return 'Sin vencer';
  return days === 1 ? '1 día' : `${days} días`;
}

/** Customer rows with their aging buckets; click to see the pending invoices. */
export function ReceivablesTable({ report }: { report: ReceivablesReport }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visibleRows = report.rows.slice(0, MAX_VISIBLE_CUSTOMERS);

  function toggle(customerId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Pulsa en un cliente para ver sus facturas pendientes.
      </p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Pendiente</TableHead>
              {BUCKETS.map((bucket) => (
                <TableHead key={bucket} className="whitespace-nowrap text-right">
                  {AGING_BUCKET_LABELS[bucket]}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap text-right">Mayor retraso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <CustomerRows
                key={row.customerId}
                row={row}
                isExpanded={expanded.has(row.customerId)}
                onToggle={() => toggle(row.customerId)}
              />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(report.totals.pendingGross)}
              </TableCell>
              {BUCKETS.map((bucket) => (
                <TableCell key={bucket} className="text-right tabular-nums">
                  {amountOrDash(report.totals.aging[bucket])}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {report.rows.length > visibleRows.length && (
        <p className="text-xs text-muted-foreground">
          Mostrando {visibleRows.length} de {report.rows.length} clientes. El Excel incluye todos.
        </p>
      )}
    </div>
  );
}

interface CustomerRowsProps {
  row: ReceivablesCustomerRow;
  isExpanded: boolean;
  onToggle: () => void;
}

function CustomerRows({ row, isExpanded, onToggle }: CustomerRowsProps) {
  return (
    <Fragment>
      <TableRow className="cursor-pointer" onClick={onToggle} aria-expanded={isExpanded}>
        <TableCell>
          <span className="flex items-center gap-1.5">
            <ChevronRight
              className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')}
              aria-hidden
            />
            <span className="truncate">{row.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {row.invoicesCount === 1 ? '1 factura' : `${row.invoicesCount} facturas`}
            </span>
          </span>
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {formatCurrency(row.pendingGross)}
        </TableCell>
        {BUCKETS.map((bucket) => (
          <TableCell key={bucket} className="text-right tabular-nums">
            {amountOrDash(row.aging[bucket])}
          </TableCell>
        ))}
        <TableCell className={cn('text-right', row.maxDaysOverdue > 60 && 'text-destructive')}>
          {overdueLabel(row.maxDaysOverdue)}
        </TableCell>
      </TableRow>
      {isExpanded &&
        row.invoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)}
    </Fragment>
  );
}

function InvoiceRow({ invoice }: { invoice: ReceivableInvoice }) {
  return (
    <TableRow className="bg-muted/40 text-sm">
      <TableCell className="pl-10">
        <span className="font-medium">{invoice.number ?? 'Sin número'}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          vence {formatDate(invoice.dueDate)}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(invoice.pendingGross)}
      </TableCell>
      {BUCKETS.map((bucket) => (
        <TableCell key={bucket} className="text-right tabular-nums">
          {invoice.bucket === bucket ? formatCurrency(invoice.pendingGross) : ''}
        </TableCell>
      ))}
      <TableCell className={cn('text-right', invoice.daysOverdue > 60 && 'text-destructive')}>
        {overdueLabel(invoice.daysOverdue)}
      </TableCell>
    </TableRow>
  );
}
