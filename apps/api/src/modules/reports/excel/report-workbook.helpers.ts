import * as ExcelJS from 'exceljs';

export type CellFormat = 'text' | 'currency' | 'decimal' | 'integer' | 'percent';
export type CellValue = string | number | null;

export interface SheetColumn<T> {
  header: string;
  width?: number;
  format?: CellFormat;
  value: (row: T) => CellValue;
}

export interface SheetSpec<T> {
  name: string;
  columns: SheetColumn<T>[];
  rows: T[];
  /** Optional totals row, aligned with `columns`. */
  totals?: CellValue[];
  /** Excel outline level per row (0 = top). Enables collapsible groups. */
  outlineLevel?: (row: T) => number;
  isBold?: (row: T) => boolean;
}

/** Context printed at the top of every sheet. */
export interface ReportSheetHeader {
  title: string;
  tenantName: string;
  periodLabel: string;
  details: string[];
  note?: string;
}

const NUMBER_FORMATS: Record<CellFormat, string | undefined> = {
  text: undefined,
  currency: '#,##0.00 "€"',
  decimal: '#,##0.00',
  integer: '#,##0',
  percent: '0.0%',
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE8EEF7' },
};

export function addTableSheet<T>(
  workbook: ExcelJS.Workbook,
  header: ReportSheetHeader,
  spec: SheetSpec<T>
): void {
  const sheet = workbook.addWorksheet(spec.name.slice(0, 31), {
    properties: { outlineProperties: { summaryBelow: false, summaryRight: false } },
  });
  writeSheetHeader(sheet, header);

  const headerRow = sheet.addRow(spec.columns.map((column) => column.header));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => (cell.fill = HEADER_FILL));

  for (const row of spec.rows) {
    const sheetRow = sheet.addRow(spec.columns.map((column) => column.value(row)));
    const level = spec.outlineLevel?.(row) ?? 0;
    if (level > 0) sheetRow.outlineLevel = level;
    if (spec.isBold?.(row)) sheetRow.font = { bold: true };
  }

  if (spec.totals) {
    sheet.addRow(spec.totals).font = { bold: true };
  }

  applyColumnFormats(sheet, spec.columns);
  sheet.views = [{ state: 'frozen', ySplit: headerRow.number }];
}

function writeSheetHeader(sheet: ExcelJS.Worksheet, header: ReportSheetHeader): void {
  sheet.addRow([header.title]).font = { bold: true, size: 14 };
  sheet.addRow([header.tenantName]);
  sheet.addRow([`Periodo: ${header.periodLabel}`]);
  header.details.forEach((detail) => sheet.addRow([detail]));
  if (header.note) sheet.addRow([header.note]).font = { italic: true, color: { argb: 'FF666666' } };
  sheet.addRow([]);
}

function applyColumnFormats<T>(sheet: ExcelJS.Worksheet, columns: SheetColumn<T>[]): void {
  columns.forEach((column, index) => {
    const sheetColumn = sheet.getColumn(index + 1);
    sheetColumn.width = column.width ?? 16;
    const numFmt = NUMBER_FORMATS[column.format ?? 'text'];
    if (numFmt) sheetColumn.numFmt = numFmt;
  });
}

/** Ratio for a percent-formatted cell; null when there is no base to compare against. */
export function variationRatio(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 1000;
}
