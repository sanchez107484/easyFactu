import { cn } from '@/lib/utils';
import { PaymentStatus } from '@easyfactura/shared-types';

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  [PaymentStatus.UNPAID]: {
    label: 'Pendiente de cobro',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-50 dark:bg-zinc-900/50',
    border: 'border-zinc-200 dark:border-zinc-800',
    dot: 'bg-zinc-400',
  },
  [PaymentStatus.PARTIALLY_PAID]: {
    label: 'Cobro parcial',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
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
