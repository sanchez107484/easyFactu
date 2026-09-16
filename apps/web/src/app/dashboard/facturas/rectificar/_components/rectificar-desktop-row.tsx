'use client';

import Link from 'next/link';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { RectificationSummaryBadge } from './rectification-summary-badge';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SelectableInvoiceForRectification } from '@easyfactura/shared-types';

interface RectificarDesktopRowProps {
  invoice: SelectableInvoiceForRectification;
  onSelect: (id: string) => void;
}

/**
 * Fila desktop (tr) del listado de selección.
 * Click en la fila o en el número → abrir modal de rectificación.
 * Botón "Ver detalle" → navegar al detalle de la factura.
 */
export function RectificarDesktopRow({ invoice, onSelect }: RectificarDesktopRowProps) {
  return (
    <tr
      onClick={() => onSelect(invoice.id)}
      className="cursor-pointer hover:bg-muted/40 transition-colors"
    >
      <td className="px-6 py-3 font-mono text-sm font-medium whitespace-nowrap">
        <span className="hover:text-primary transition-colors">
          {invoice.number ?? 'BORRADOR'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-[200px]">
            {invoice.customer?.name ?? invoice.customerSnapshotName ?? '—'}
          </p>
          {(invoice.customer?.nif ?? invoice.customerSnapshotNif) && (
            <p className="text-xs font-mono text-muted-foreground">
              {invoice.customer?.nif ?? invoice.customerSnapshotNif}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
        {formatDateShort(invoice.issueDate)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
        {formatCurrency(Number(invoice.total))}
      </td>
      <td className="px-4 py-3">
        <InvoiceStatusBadge status={invoice.status} />
      </td>
      <td className="px-4 py-3">
        <RectificationSummaryBadge summary={invoice.rectificativeSummary} />
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/dashboard/facturas/${invoice.id}`}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            Ver detalle
          </Link>
        </Button>
      </td>
    </tr>
  );
}
