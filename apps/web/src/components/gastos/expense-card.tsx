'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Expense } from '@easyfactura/shared-types';
import { cn, getCategoryColorFromName, formatCurrency } from '@/lib/utils';
import {
  Pencil,
  Trash2,
  Copy,
  Eye,
  MoreVertical,
  Repeat,
  Building2,
} from 'lucide-react';

const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (expense: Expense) => void;
  onView: (expense: Expense) => void;
  onDuplicate: (expense: Expense) => void;
  canWrite: boolean;
  onPrefetch: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function ExpenseCard({
  expense,
  onDelete,
  onView,
  onDuplicate,
  canWrite,
  onPrefetch,
  isSelected,
  onToggleSelect,
}: ExpenseCardProps) {
  const catColor = expense.category ? getCategoryColorFromName(expense.category.name) : null;

  const shortDate = (() => {
    const d = new Date(expense.date);
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
  })();

  const categoryDotColor = catColor
    ? catColor.text.includes('emerald') ? '#059669'
      : catColor.text.includes('amber') ? '#d97706'
      : catColor.text.includes('blue') ? '#2563eb'
      : catColor.text.includes('purple') ? '#7c3aed'
      : catColor.text.includes('rose') ? '#e11d48'
      : catColor.text.includes('cyan') ? '#0891b2'
      : 'hsl(var(--primary))'
    : 'hsl(var(--primary))';

  return (
    <div
      className={cn(
        'flex items-start gap-4 border-b last:border-b-0 py-4 px-4 transition-colors bg-card',
        'hover:bg-muted/30',
        isSelected && 'bg-primary/5',
      )}
      onMouseEnter={() => onPrefetch(expense.id)}
    >
      {canWrite && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="mt-1 shrink-0"
        />
      )}

      <div
        className="w-1 h-10 shrink-0 rounded-full mt-0.5"
        style={{ backgroundColor: categoryDotColor }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-medium text-foreground">
                {expense.description}
              </h3>
              {expense.recurringExpense?.id && (
                <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Repeat className="h-3 w-3" />
                  Recurrente
                </span>
              )}
            </div>

            <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground flex-wrap">
              <span>{shortDate}</span>
              {expense.category && (
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: categoryDotColor }}
                  />
                  {expense.category.name}
                </span>
              )}
              {expense.supplier && (
                <span className="flex items-center gap-1 truncate max-w-[150px]">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{expense.supplier.name}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(expense.totalAmount)}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => onView(expense)}
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs">Ver</span>
              </Button>

              {canWrite && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href={`/dashboard/gastos/${expense.id}`}>
                      <Pencil className="h-4 w-4" />
                      <span className="text-xs">Editar</span>
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDuplicate(expense)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(expense)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
