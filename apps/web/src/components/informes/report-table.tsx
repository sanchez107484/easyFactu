import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface ReportTableColumn<T> {
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
  /** Footer cell content for the totals row. */
  total?: React.ReactNode;
}

interface ReportTableProps<T> {
  columns: ReportTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Rows beyond this limit are only included in the Excel file. */
  maxRows?: number;
  emptyMessage?: string;
}

const DEFAULT_MAX_ROWS = 50;

export function ReportTable<T>({
  columns,
  rows,
  getRowKey,
  maxRows = DEFAULT_MAX_ROWS,
  emptyMessage = 'No hay datos en este periodo.',
}: ReportTableProps<T>) {
  const visibleRows = rows.slice(0, maxRows);
  const hasTotals = columns.some((column) => column.total !== undefined);
  const alignClass = (column: ReportTableColumn<T>) =>
    column.align === 'right' ? 'text-right tabular-nums' : undefined;

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={`${column.header}-${index}`}
                  className={cn('whitespace-nowrap', alignClass(column))}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column, index) => (
                  <TableCell key={`${column.header}-${index}`} className={alignClass(column)}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {hasTotals && (
            <TableFooter>
              <TableRow className="font-semibold">
                {columns.map((column, index) => (
                  <TableCell key={`${column.header}-${index}`} className={alignClass(column)}>
                    {column.total}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      {rows.length > visibleRows.length && (
        <p className="text-xs text-muted-foreground">
          Mostrando {visibleRows.length} de {rows.length} filas. El Excel incluye todas.
        </p>
      )}
    </div>
  );
}
