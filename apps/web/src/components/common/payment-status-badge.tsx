import { cn } from '@/lib/utils';
import { PaymentStatus } from '@easyfactura/shared-types';

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  [PaymentStatus.UNPAID]: {
    label: 'Pendiente de cobro',
    color: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-50 dark:bg-neutral-900/50',
    border: 'border-neutral-200 dark:border-neutral-800',
    dot: 'bg-neutral-400',
  },
  [PaymentStatus.PARTIALLY_PAID]: {
    label: 'Cobro parcial',
    color: 'text-proforma-600 dark:text-proforma-400',
    bg: 'bg-proforma-50 dark:bg-proforma-950/40',
    border: 'border-proforma-200 dark:border-proforma-800',
    dot: 'bg-proforma-500',
  },
  [PaymentStatus.PAID]: {
    label: 'Cobrada',
    color: 'text-secondary-600 dark:text-secondary-400',
    bg: 'bg-secondary-50 dark:bg-secondary-950/40',
    border: 'border-secondary-200 dark:border-secondary-800',
    dot: 'bg-secondary-500',
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  /** Show a compact version (just the dot + label, no padding) */
  compact?: boolean;
}

/**
 * Dot-style badge for payment statuses.
 * Usage: <PaymentStatusBadge status={invoice.paymentStatus} />
 */
export function PaymentStatusBadge({ status, compact }: PaymentStatusBadgeProps) {
  const cfg = PAYMENT_STATUS_CONFIG[status as PaymentStatus];
  if (!cfg) return null;

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cfg.color)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
        {cfg.label}
      </span>
    );
  }

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
