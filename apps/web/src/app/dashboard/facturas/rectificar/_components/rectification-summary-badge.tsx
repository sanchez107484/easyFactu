import { cn } from '@/lib/utils';
import { FileText, Pencil } from 'lucide-react';
import type { RectificationInvoiceSummary } from '@easyfactura/shared-types';

interface RectificationSummaryBadgeProps {
  summary: RectificationInvoiceSummary;
  className?: string;
}

/**
 * Indicadores de rectificativas previas de una factura:
 * - Badge 'Borrador pendiente' si hay un draft rectificativo
 * - Contador total de rectificativas ya emitidas (>0)
 * Compacto por diseño: pensado para filas de tabla y tarjetas móviles.
 */
export function RectificationSummaryBadge({ summary, className }: RectificationSummaryBadgeProps) {
  if (summary.totalCount === 0 && !summary.hasPendingDraft) return null;

  if (summary.hasPendingDraft) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded font-medium border text-[10px] px-1.5 py-0.5',
          'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          className,
        )}
        title="Ya existe un borrador de rectificativa para esta factura"
      >
        <Pencil className="h-2.5 w-2.5" />
        Borrador pendiente
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium border text-[10px] px-1.5 py-0.5',
        'bg-rectificativa-50 dark:bg-rectificativa-950/30 text-rectificativa-700 dark:text-rectificativa-300 border-rectificativa-200 dark:border-rectificativa-800',
        className,
      )}
      title={`Esta factura tiene ${summary.totalCount} rectificativa${summary.totalCount > 1 ? 's' : ''} emitida${summary.totalCount > 1 ? 's' : ''}`}
    >
      <FileText className="h-2.5 w-2.5" />
      {summary.totalCount} rectificativa{summary.totalCount > 1 ? 's' : ''}
    </span>
  );
}
