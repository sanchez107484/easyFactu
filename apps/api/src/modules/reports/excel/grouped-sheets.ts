import * as ExcelJS from 'exceljs';
import {
  ExpenseMetrics,
  ExpensesReport,
  ReportGroupRow,
  ReportOptions,
  SalesMetrics,
  SalesReport,
} from '@easyfactura/shared-types';
import {
  CellFormat,
  CellValue,
  ReportSheetHeader,
  SheetColumn,
  addTableSheet,
  variationRatio,
} from './report-workbook.helpers';
import { dimensionLabel, sublabelHeader } from './report-labels';

interface MetricColumn<M> {
  header: string;
  format: CellFormat;
  width?: number;
  value: (metrics: M) => number | undefined;
  /** Adds "anterior" and "Var. %" columns when the report has a comparison. */
  isCompared?: boolean;
}

interface GroupedSheetInput<M> {
  options: ReportOptions;
  rows: ReportGroupRow<M>[];
  totals: M;
  previousTotals?: M;
  metricColumns: MetricColumn<M>[];
}

interface FlatRow<M> {
  level: number;
  parent?: ReportGroupRow<M>;
  row: ReportGroupRow<M>;
}

const SALES_COLUMNS: MetricColumn<SalesMetrics>[] = [
  { header: 'Facturado', format: 'currency', value: (m) => m.invoiced, isCompared: true },
  { header: 'Unidades', format: 'decimal', value: (m) => m.units },
  { header: 'Nº facturas', format: 'integer', value: (m) => m.invoicesCount },
  { header: 'Precio medio', format: 'currency', value: (m) => m.averagePrice },
];

const CUSTOMER_COLUMNS: MetricColumn<SalesMetrics>[] = [
  { header: 'Gastos imputados', format: 'currency', width: 18, value: (m) => m.expenses },
  { header: 'Margen', format: 'currency', value: (m) => m.margin },
  {
    header: 'Cobrado (total factura)',
    format: 'currency',
    width: 22,
    value: (m) => m.collectedGross,
  },
  {
    header: 'Pendiente (total factura)',
    format: 'currency',
    width: 24,
    value: (m) => m.pendingGross,
  },
];

const EXPENSE_COLUMNS: MetricColumn<ExpenseMetrics>[] = [
  { header: 'Importe', format: 'currency', value: (m) => m.amount, isCompared: true },
  { header: 'Nº gastos', format: 'integer', value: (m) => m.count },
];

export function writeSalesSheets(
  wb: ExcelJS.Workbook,
  header: ReportSheetHeader,
  report: SalesReport
) {
  const metricColumns = report.hasCustomerMetrics
    ? [...SALES_COLUMNS, ...CUSTOMER_COLUMNS]
    : SALES_COLUMNS;
  writeGroupedSheets(wb, header, { ...report, metricColumns });
}

export function writeExpensesSheets(
  wb: ExcelJS.Workbook,
  header: ReportSheetHeader,
  report: ExpensesReport
) {
  writeGroupedSheets(wb, header, { ...report, metricColumns: EXPENSE_COLUMNS });
}

function writeGroupedSheets<M>(
  wb: ExcelJS.Workbook,
  header: ReportSheetHeader,
  input: GroupedSheetInput<M>
) {
  const hasComparison = input.previousTotals !== undefined;
  const metricColumns = buildMetricSheetColumns(input.metricColumns, hasComparison);

  addTableSheet<FlatRow<M>>(wb, header, {
    name: 'Agrupado',
    columns: [
      { header: groupedLabelHeader(input.options), width: 40, value: displayLabel },
      ...metricColumns,
    ],
    rows: flattenTree(input.rows),
    outlineLevel: (r) => r.level,
    isBold: (r) => r.level === 0 && Boolean(input.options.breakdownBy),
    totals: ['Total', ...totalsRow(input.metricColumns, input.totals, input.previousTotals)],
  });

  addTableSheet<FlatRow<M>>(wb, header, {
    name: 'Datos',
    columns: [...dimensionColumns<M>(input.options), ...metricColumns],
    rows: input.options.breakdownBy ? leafRows(input.rows) : flattenTree(input.rows),
  });
}

function buildMetricSheetColumns<M>(
  columns: MetricColumn<M>[],
  hasComparison: boolean
): SheetColumn<FlatRow<M>>[] {
  return columns.flatMap((column): SheetColumn<FlatRow<M>>[] => {
    const current: SheetColumn<FlatRow<M>> = {
      header: column.header,
      format: column.format,
      width: column.width,
      value: (r) => column.value(r.row.metrics) ?? null,
    };
    if (!hasComparison || !column.isCompared) return [current];
    return [
      current,
      {
        header: `${column.header} anterior`,
        format: column.format,
        width: 18,
        value: (r) => (r.row.previous ? (column.value(r.row.previous) ?? null) : null),
      },
      {
        header: 'Var. %',
        format: 'percent',
        width: 10,
        value: (r) =>
          variationRatio(
            column.value(r.row.metrics) ?? 0,
            r.row.previous ? column.value(r.row.previous) : undefined
          ),
      },
    ];
  });
}

function totalsRow<M>(columns: MetricColumn<M>[], totals: M, previous?: M): CellValue[] {
  return columns.flatMap((column) => {
    const value = column.value(totals) ?? null;
    if (!previous || !column.isCompared) return [value];
    const previousValue = column.value(previous);
    return [value, previousValue ?? null, variationRatio(value ?? 0, previousValue)];
  });
}

function dimensionColumns<M>({
  groupBy,
  breakdownBy,
  timeGrouping,
}: ReportOptions): SheetColumn<FlatRow<M>>[] {
  if (!groupBy) return [];
  const columns: SheetColumn<FlatRow<M>>[] = [
    {
      header: dimensionLabel(groupBy, timeGrouping),
      width: 32,
      value: (r) => (r.parent ?? r.row).label,
    },
  ];
  const groupSub = sublabelHeader(groupBy);
  if (groupSub)
    columns.push({ header: groupSub, width: 14, value: (r) => (r.parent ?? r.row).sublabel });
  if (breakdownBy) {
    columns.push({
      header: dimensionLabel(breakdownBy, timeGrouping),
      width: 32,
      value: (r) => (r.parent ? r.row.label : null),
    });
    const breakdownSub = sublabelHeader(breakdownBy);
    if (breakdownSub)
      columns.push({
        header: breakdownSub,
        width: 14,
        value: (r) => (r.parent ? r.row.sublabel : null),
      });
  }
  return columns;
}

function groupedLabelHeader({ groupBy, breakdownBy, timeGrouping }: ReportOptions): string {
  if (!groupBy) return '';
  const first = dimensionLabel(groupBy, timeGrouping);
  return breakdownBy ? `${first} › ${dimensionLabel(breakdownBy, timeGrouping)}` : first;
}

function displayLabel<M>({ level, row }: FlatRow<M>): string {
  const text = row.sublabel ? `${row.label} (${row.sublabel})` : row.label;
  return level > 0 ? `    ${text}` : text;
}

function flattenTree<M>(rows: ReportGroupRow<M>[]): FlatRow<M>[] {
  return rows.flatMap((row) => [
    { level: 0, row },
    ...(row.children ?? []).map((child) => ({ level: 1, parent: row, row: child })),
  ]);
}

/** One row per group × breakdown pair; groups without breakdown (e.g. "Otros") stay as-is. */
function leafRows<M>(rows: ReportGroupRow<M>[]): FlatRow<M>[] {
  return rows.flatMap((row) =>
    row.children?.length
      ? row.children.map((child) => ({ level: 1, parent: row, row: child }))
      : [{ level: 0, row }]
  );
}
