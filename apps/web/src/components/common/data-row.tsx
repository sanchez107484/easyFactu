import { cn } from '@/lib/utils';

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

export function DataRow({ label, value, mono = false }: DataRowProps) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm text-right', mono && 'font-mono')}>{value}</span>
    </div>
  );
}
