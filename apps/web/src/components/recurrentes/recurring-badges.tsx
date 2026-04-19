import { Badge } from '@/components/ui/badge';
import { Frequency, RecurringStatus } from '@easyfactura/shared-types';
import { FREQUENCY_LABELS } from '@easyfactura/shared-constants';
import { cn } from '@/lib/utils';

interface RecurringFrequencyBadgeProps {
  frequency: Frequency;
  className?: string;
}

export function RecurringFrequencyBadge({ frequency, className }: RecurringFrequencyBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('font-medium', className)}>
      {FREQUENCY_LABELS[frequency]}
    </Badge>
  );
}

interface RecurringStatusBadgeProps {
  status: RecurringStatus;
  className?: string;
}

export function RecurringStatusBadge({ status, className }: RecurringStatusBadgeProps) {
  const config: Record<RecurringStatus, { label: string; className: string }> = {
    [RecurringStatus.ACTIVE]: {
      label: 'Activa',
      className:
        'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-100 border-transparent',
    },
    [RecurringStatus.PAUSED]: {
      label: 'Pausada',
      className:
        'bg-proforma-100 text-proforma-800 dark:bg-proforma-900 dark:text-proforma-100 border-transparent',
    },
    [RecurringStatus.COMPLETED]: {
      label: 'Completada',
      className:
        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-transparent',
    },
  };

  const { label, className: statusClassName } = config[status];

  return <Badge className={cn('text-xs font-medium', statusClassName, className)}>{label}</Badge>;
}
