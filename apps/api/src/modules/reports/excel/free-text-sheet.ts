import * as ExcelJS from 'exceljs';
import { FreeTextSalesLine } from '@easyfactura/shared-types';
import { ReportSheetHeader, addTableSheet } from './report-workbook.helpers';

/** Lines behind the "Sin artículo" row, with the closest catalog product as a hint. */
export function writeFreeTextSheet(
  workbook: ExcelJS.Workbook,
  header: ReportSheetHeader,
  lines: FreeTextSalesLine[]
): void {
  addTableSheet(workbook, header, {
    name: 'Sin artículo',
    columns: [
      { header: 'Factura', width: 16, value: (l) => l.invoiceNumber },
      { header: 'Fecha', width: 12, value: (l) => l.issueDate },
      { header: 'Cliente', width: 30, value: (l) => l.customerName },
      { header: 'Concepto', width: 40, value: (l) => l.description },
      { header: 'Cantidad', format: 'decimal', value: (l) => l.quantity },
      { header: 'Importe', format: 'currency', value: (l) => l.amount },
      { header: 'Artículo parecido', width: 30, value: (l) => l.suggestedProduct?.name ?? null },
    ],
    rows: lines,
  });
}
