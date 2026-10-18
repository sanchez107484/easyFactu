import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Percentage change, or null when there is no base to compare against. */
export function variationPercent(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

const percentFormat = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

interface ReportVariationProps {
  current: number;
  previous: number | undefined;
  /** For costs, going up is bad. */
  isHigherBetter?: boolean;
  className?: string;
}

export function ReportVariation({
  current,
  previous,
  isHigherBetter = true,
  className,
}: ReportVariationProps) {
  const percent = variationPercent(current, previous);
  if (percent === null) return <span className={cn('text-muted-foreground', className)}>—</span>;

  const isUp = percent > 0;
  const isGood = percent === 0 || isUp === isHigherBetter;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 tabular-nums',
        isGood ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive',
        className,
      )}
    >
      {percent !== 0 && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {percentFormat.format(percent)}&nbsp;%
    </span>
  );
}
