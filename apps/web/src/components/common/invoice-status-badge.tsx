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
  [InvoiceStatus.PROFORMA]: {
    label: 'Proforma',
    color: 'text-proforma-600 dark:text-proforma-400',
    bg: 'bg-proforma-50 dark:bg-proforma-950/40',
    border: 'border-proforma-200 dark:border-proforma-800',
    dot: 'bg-proforma-500',
  },
  [InvoiceStatus.CONFIRMED]: {
    label: 'Confirmada',
    color: 'text-invoice-600 dark:text-invoice-400',
    bg: 'bg-invoice-50 dark:bg-invoice-950/40',
    border: 'border-invoice-200 dark:border-invoice-800',
    dot: 'bg-invoice-500',
  },
  [InvoiceStatus.SENT]: {
    label: 'Enviada',
    color: 'text-customer-600 dark:text-customer-400',
    bg: 'bg-customer-50 dark:bg-customer-950/40',
    border: 'border-customer-200 dark:border-customer-800',
    dot: 'bg-customer-500',
  },
  [InvoiceStatus.PAID]: {
    label: 'Pagada',
    color: 'text-secondary-600 dark:text-secondary-400',
    bg: 'bg-secondary-50 dark:bg-secondary-950/40',
    border: 'border-secondary-200 dark:border-secondary-800',
    dot: 'bg-secondary-500',
  },
  [InvoiceStatus.RECTIFIED]: {
    label: 'Rectificada',
    color: 'text-rectificativa-600 dark:text-rectificativa-400',
    bg: 'bg-rectificativa-50 dark:bg-rectificativa-950/40',
    border: 'border-rectificativa-200 dark:border-rectificativa-800',
    dot: 'bg-rectificativa-500',
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
