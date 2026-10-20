'use client';

import { Fragment, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { ReportGroupRow } from '@easyfactura/shared-types';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReportVariation } from './report-variation';

export interface GroupedMetricColumn<M> {
  header: string;
  value: (metrics: M) => number | undefined;
  format: (value: number) => string;
  /** Adds a "Var." column when the report has a comparison. */
  isCompared?: boolean;
  isHigherBetter?: boolean;
}

export interface GroupedRowAction {
  label: string;
  onSelect: () => void;
}

interface GroupedReportTableProps<M> {
  labelHeader: string;
  rows: ReportGroupRow<M>[];
  totals: M;
  previousTotals?: M;
  columns: GroupedMetricColumn<M>[];
  /** Groups beyond this limit are only included in the Excel file. */
  maxRows?: number;
  /** Optional per-group "dig deeper" action (e.g. "Ver qué compra"). */
  getRowAction?: (row: ReportGroupRow<M>) => GroupedRowAction | undefined;
  /** Custom content shown when a group row is expanded (instead of / besides its breakdown). */
  renderRowDetail?: (row: ReportGroupRow<M>) => React.ReactNode | undefined;
  /** Short note next to a group label (e.g. lines attributed by description). */
  getRowNote?: (row: ReportGroupRow<M>) => string | undefined;
}

const DEFAULT_MAX_ROWS = 50;

/** Group rows can be expanded to show their breakdown (e.g. customer → products). */
export function GroupedReportTable<M>({
  labelHeader,
  rows,
  totals,
  previousTotals,
  columns,
  maxRows = DEFAULT_MAX_ROWS,
  getRowAction,
  renderRowDetail,
  getRowNote,
}: GroupedReportTableProps<M>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const hasComparison = previousTotals !== undefined;
  const visibleRows = rows.slice(0, maxRows);
  const hasBreakdown = rows.some((row) => row.children?.length);
  const hasActions = getRowAction !== undefined;
  const actionPlaceholder = hasActions ? <TableCell /> : null;
  const columnCount =
    1 +
    columns.reduce((count, column) => count + (hasComparison && column.isCompared ? 2 : 1), 0) +
    (hasActions ? 1 : 0);

  function toggle(key: string) {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay datos en este periodo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {hasBreakdown && (
        <p className="text-xs text-muted-foreground">Pulsa en una fila para ver su desglose.</p>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labelHeader}</TableHead>
              {columns.map((column) => (
                <Fragment key={column.header}>
                  <TableHead className="whitespace-nowrap text-right">{column.header}</TableHead>
                  {hasComparison && column.isCompared && (
                    <TableHead className="text-right">Var.</TableHead>
                  )}
                </Fragment>
              ))}
              {hasActions && (
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => {
              const isExpanded = expandedKeys.has(row.key);
              const detail = renderRowDetail?.(row);
              const canExpand = Boolean(row.children?.length) || detail !== undefined;
              return (
                <Fragment key={row.key}>
                  <TableRow
                    className={cn(
                      canExpand && 'cursor-pointer',
                      row.isOther && 'text-muted-foreground',
                    )}
                    onClick={canExpand ? () => toggle(row.key) : undefined}
                    aria-expanded={canExpand ? isExpanded : undefined}
                  >
                    <TableCell>
                      <RowLabel
                        row={row}
                        canExpand={canExpand}
                        isExpanded={isExpanded}
                        note={getRowNote?.(row)}
                      />
                    </TableCell>
                    <MetricCells row={row} columns={columns} hasComparison={hasComparison} />
                    {hasActions && (
                      <TableCell className="text-right">
                        <RowActionButton action={getRowAction(row)} />
                      </TableCell>
                    )}
                  </TableRow>
                  {isExpanded &&
                    row.children?.map((child) => (
                      <TableRow key={`${row.key}:${child.key}`} className="bg-muted/40 text-sm">
                        <TableCell className="pl-10">
                          <RowLabel row={child} />
                        </TableCell>
                        <MetricCells row={child} columns={columns} hasComparison={hasComparison} />
                        {actionPlaceholder}
                      </TableRow>
                    ))}
                  {isExpanded && detail !== undefined && (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={columnCount} className="p-0">
                        {detail}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <MetricCells
                row={{ metrics: totals, previous: previousTotals }}
                columns={columns}
                hasComparison={hasComparison}
              />
              {actionPlaceholder}
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {rows.length > visibleRows.length && (
        <p className="text-xs text-muted-foreground">
          Mostrando {visibleRows.length} de {rows.length} grupos. El Excel incluye todos.
        </p>
      )}
    </div>
  );
}

interface RowLabelProps<M> {
  row: ReportGroupRow<M>;
  canExpand?: boolean;
  isExpanded?: boolean;
  note?: string;
}

function RowLabel<M>({ row, canExpand, isExpanded, note }: RowLabelProps<M>) {
  return (
    <span className="flex items-center gap-1.5">
      {canExpand && (
        <ChevronRight
          className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')}
          aria-hidden
        />
      )}
      <span className="truncate">{row.label}</span>
      {row.sublabel && (
        <span className="shrink-0 text-xs text-muted-foreground">{row.sublabel}</span>
      )}
      {note && (
        <span
          className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-1.5 text-[10px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          title={note}
        >
          {note}
        </span>
      )}
    </span>
  );
}

interface MetricCellsProps<M> {
  row: { metrics: M; previous?: M };
  columns: GroupedMetricColumn<M>[];
  hasComparison: boolean;
}

function MetricCells<M>({ row, columns, hasComparison }: MetricCellsProps<M>) {
  return (
    <>
      {columns.map((column) => {
        const value = column.value(row.metrics);
        return (
          <Fragment key={column.header}>
            <TableCell className="text-right tabular-nums">
              {value === undefined ? '—' : column.format(value)}
            </TableCell>
            {hasComparison && column.isCompared && (
              <TableCell className="text-right">
                <ReportVariation
                  current={value ?? 0}
                  previous={row.previous ? column.value(row.previous) : undefined}
                  isHigherBetter={column.isHigherBetter}
                />
              </TableCell>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

function RowActionButton({ action }: { action: GroupedRowAction | undefined }) {
  if (!action) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 whitespace-nowrap px-2 text-xs"
      onClick={(event) => {
        // The row itself toggles the breakdown; don't trigger it too.
        event.stopPropagation();
        action.onSelect();
      }}
    >
      <Search className="h-3.5 w-3.5" />
      {action.label}
    </Button>
  );
}
