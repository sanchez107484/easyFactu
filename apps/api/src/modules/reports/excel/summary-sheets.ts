import * as ExcelJS from 'exceljs';
import {
  ReportDimension,
  SummaryReport,
  SummaryReportBucket,
  SummaryValues,
} from '@easyfactura/shared-types';
import {
  CellValue,
  ReportSheetHeader,
  SheetColumn,
  addTableSheet,
  variationRatio,
} from './report-workbook.helpers';
import { dimensionLabel } from './report-labels';

const SUMMARY_FIELDS: { key: keyof SummaryValues; header: string }[] = [
  { key: 'income', header: 'Ingresos' },
  { key: 'expenses', header: 'Gastos' },
  { key: 'result', header: 'Resultado' },
];

function buildColumns(hasComparison: boolean): SheetColumn<SummaryReportBucket>[] {
  return SUMMARY_FIELDS.flatMap(({ key, header }): SheetColumn<SummaryReportBucket>[] => {
    const current: SheetColumn<SummaryReportBucket> = {
      header,
      format: 'currency',
      value: (bucket) => bucket[key],
    };
    if (!hasComparison) return [current];
    return [
      current,
      {
        header: `${header} anterior`,
        format: 'currency',
        width: 18,
        value: (b) => b.previous?.[key] ?? null,
      },
      {
        header: 'Var. %',
        format: 'percent',
        width: 10,
        value: (b) => variationRatio(b[key], b.previous?.[key]),
      },
    ];
  });
}

function buildTotals(report: SummaryReport): CellValue[] {
  return SUMMARY_FIELDS.flatMap(({ key }) => {
    const value = report.totals[key];
    if (!report.previousTotals) return [value];
    const previous = report.previousTotals[key];
    return [value, previous, variationRatio(value, previous)];
  });
}

export function writeSummarySheets(
  workbook: ExcelJS.Workbook,
  header: ReportSheetHeader,
  report: SummaryReport
): void {
  const hasComparison = report.previousTotals !== undefined;
  const periodHeader = dimensionLabel(ReportDimension.PERIOD, report.options.timeGrouping);

  addTableSheet(workbook, header, {
    name: 'Resumen',
    columns: [
      { header: periodHeader, width: 18, value: (bucket) => bucket.label },
      ...buildColumns(hasComparison),
    ],
    rows: report.buckets,
    totals: ['Total', ...buildTotals(report)],
  });
}
