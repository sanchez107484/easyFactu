import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReportVariation } from './report-variation';

interface ReportKpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
  /** When set, shows the variation against the comparison period. */
  comparison?: { current: number; previous: number; isHigherBetter?: boolean };
}

export function ReportKpiCard({
  label,
  value,
  hint,
  tone = 'default',
  comparison,
}: ReportKpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1 text-2xl font-semibold tabular-nums',
            tone === 'positive' && 'text-emerald-700 dark:text-emerald-400',
            tone === 'negative' && 'text-destructive',
          )}
        >
          {value}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {comparison && (
            <span className="flex items-center gap-1">
              <ReportVariation {...comparison} />
              <span>vs. anterior</span>
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportKpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
