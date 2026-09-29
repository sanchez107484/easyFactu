import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type BillingCycle = 'monthly' | 'annual';

interface BillingCycleToggleProps {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
  annualBadge?: string;
  className?: string;
}

export function BillingCycleToggle({
  value,
  onChange,
  annualBadge,
  className,
}: BillingCycleToggleProps) {
  return (
    <div className={cn('flex items-center gap-2 p-1 bg-muted rounded-lg w-fit', className)}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-md transition-all',
          value === 'monthly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Mensual
      </button>

      <button
        type="button"
        onClick={() => onChange('annual')}
        className={cn(
          'relative px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
          value === 'annual'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Anual
        {annualBadge && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 hover:bg-green-100"
          >
            {annualBadge}
          </Badge>
        )}
      </button>
    </div>
  );
}

export type { BillingCycle };
