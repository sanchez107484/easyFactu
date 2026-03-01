import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDir } from '@/hooks/use-sort-table';

interface SortableHeaderProps {
  /** Column label */
  label: string;
  /** Key this column sorts by */
  sortKey: string;
  /** Currently active sort key */
  currentKey: string;
  /** Current sort direction */
  direction: SortDir;
  /** Callback when header is clicked */
  onSort: (key: string) => void;
  /** Extra Tailwind classes (e.g. responsive visibility) */
  className?: string;
  /** Text alignment — defaults to left */
  align?: 'left' | 'right';
}

/**
 * Reusable sortable <th> element.
 * Drop it into any <thead> to add click-to-sort UX.
 *
 * Example:
 *   <SortableHeader label="Nombre" sortKey="name" currentKey={sortKey}
 *     direction={sortDir} onSort={handleSort} />
 */
export function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
  className,
  align = 'left',
}: SortableHeaderProps) {
  const active = sortKey === currentKey;

  return (
    <th
      className={cn(
        'py-3 font-medium text-xs',
        align === 'right' ? 'px-4 text-right' : 'px-4 text-left',
        className,
      )}
    >
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors select-none',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}
