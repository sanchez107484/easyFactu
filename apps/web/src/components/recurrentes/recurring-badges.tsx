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
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-transparent',
    },
    [RecurringStatus.PAUSED]: {
      label: 'Pausada',
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-transparent',
    },
    [RecurringStatus.COMPLETED]: {
      label: 'Completada',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-transparent',
    },
  };

  const { label, className: statusClassName } = config[status];

  return <Badge className={cn('text-xs font-medium', statusClassName, className)}>{label}</Badge>;
}
