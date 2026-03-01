import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@easyfactura/shared-types';

export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Borrador',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-50 dark:bg-zinc-900/50',
    border: 'border-zinc-200 dark:border-zinc-800',
    dot: 'bg-zinc-400',
  },
  [InvoiceStatus.CONFIRMED]: {
    label: 'Confirmada',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  [InvoiceStatus.SENT]: {
    label: 'Enviada',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  [InvoiceStatus.PAID]: {
    label: 'Pagada',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  [InvoiceStatus.RECTIFIED]: {
    label: 'Rectificada',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus | string;
}

/**
 * Dot-style badge for invoice statuses.
 * Usage: <InvoiceStatusBadge status={invoice.status} />
 */
export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const cfg = INVOICE_STATUS_CONFIG[status as InvoiceStatus];
  if (!cfg) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        cfg.bg,
        cfg.border,
        cfg.color,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
