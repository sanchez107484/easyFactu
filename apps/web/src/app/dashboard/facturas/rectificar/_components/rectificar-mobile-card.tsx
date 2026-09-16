'use client';

import Link from 'next/link';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { InvoiceStatusBadge } from '@/components/common/invoice-status-badge';
import { RectificationSummaryBadge } from './rectification-summary-badge';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SelectableInvoiceForRectification } from '@easyfactura/shared-types';

interface RectificarMobileCardProps {
  invoice: SelectableInvoiceForRectification;
  onSelect: (id: string) => void;
}

/**
 * Tarjeta móvil para la pantalla de selección.
 * Click en la tarjeta → abrir modal de rectificación.
 * Botón "Ver detalle" → navegar al detalle de la factura.
 */
export function RectificarMobileCard({ invoice, onSelect }: RectificarMobileCardProps) {
  return (
    <div className="p-4 hover:bg-muted/40 transition-colors">
      <div
        onClick={() => onSelect(invoice.id)}
        className="cursor-pointer"
      >
        <div className="flex justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold">{invoice.number ?? 'BORRADOR'}</p>
            <p className="text-sm truncate">
              {invoice.customer?.name ?? invoice.customerSnapshotName ?? '—'}
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              {invoice.customer?.nif ?? invoice.customerSnapshotNif ?? ''}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {formatDateShort(invoice.issueDate)}
              </span>
              <InvoiceStatusBadge status={invoice.status} />
              <RectificationSummaryBadge summary={invoice.rectificativeSummary} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(Number(invoice.total))}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 text-xs"
        >
          <Link href={`/dashboard/facturas/${invoice.id}`}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            Ver detalle
          </Link>
        </Button>
      </div>
    </div>
  );
}
