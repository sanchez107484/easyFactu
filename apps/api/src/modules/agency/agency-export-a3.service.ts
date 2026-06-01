import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import * as ExcelJS from 'exceljs';

import type { ExportableInvoice } from './agency-export.service';

/**
 * Generates Excel files (.xlsx) compatible with the A3CON "Importador de datos"
 * (Wolters Kluwer). A3CON uses a configurable template system where the user maps
 * each Excel column to the corresponding internal field. This service produces one
 * row per invoice with standard Spanish column headers that cover all mandatory
 * fields for the "Facturas emitidas" import type.
 *
 * Format rules:
 *  - One row per invoice (aggregated at invoice level, not per line)
 *  - Numeric amounts stored as actual numbers (not formatted strings)
 *  - Date format: DD/MM/YYYY
 *  - Tax rates stored as numeric percentages (e.g. 21 for 21%)
 */
@Injectable()
export class AgencyExportA3Service {
  async generate(invoices: ExportableInvoice[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyFactura';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Facturas emitidas', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Fecha factura', key: 'c01', width: 14 },
      { header: 'Número factura', key: 'c02', width: 18 },
      { header: 'Serie', key: 'c03', width: 14 },
      { header: 'NIF / CIF Cliente', key: 'c04', width: 18 },
      { header: 'Nombre / Razón Social', key: 'c05', width: 30 },
      { header: 'Concepto', key: 'c06', width: 40 },
      { header: 'Base imponible', key: 'c07', width: 16 },
      { header: 'Tipo IVA (%)', key: 'c08', width: 13 },
      { header: 'Cuota IVA', key: 'c09', width: 14 },
      { header: 'Tipo Recargo Equiv. (%)', key: 'c10', width: 22 },
      { header: 'Cuota Recargo Equiv.', key: 'c11', width: 20 },
      { header: 'Tipo Retención (%)', key: 'c12', width: 18 },
      { header: 'Cuota Retención', key: 'c13', width: 16 },
      { header: 'Total factura', key: 'c14', width: 14 },
      { header: 'Fecha vencimiento', key: 'c15', width: 18 },
      { header: 'Estado', key: 'c16', width: 12 },
    ];

    // ── Header row styling — A3 brand orange ──────────────────────────────
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC4400' } };
      cell.border = { bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    headerRow.height = 30;

    // ── Data rows — one row per invoice ───────────────────────────────────
    for (const inv of invoices) {
      const fechaFactura = this.formatDateEs(inv.issueDate);
      const fechaVto = inv.dueDate ? this.formatDateEs(inv.dueDate) : '';
      const serie = inv.series?.code ?? inv.series?.name ?? '';
      const customerNif = inv.customer?.nif ?? '';
      const customerName = inv.customer?.legalName ?? inv.customer?.name ?? 'Cliente desconocido';
      const concepto = this.buildConcepto(inv);
      const dominantTaxRate = this.getDominantTaxRate(inv.lines);
      const irpfPct = inv.irpfPercent ? Number(inv.irpfPercent) : this.getIrpfRate(inv.lines);
      const estado = this.mapEstado(inv.status);

      sheet.addRow([
        /* c01 Fecha factura          */ fechaFactura,
        /* c02 Número factura         */ inv.number ?? '',
        /* c03 Serie                  */ serie,
        /* c04 NIF / CIF Cliente      */ customerNif,
        /* c05 Nombre / Razón Social  */ customerName,
        /* c06 Concepto               */ concepto,
        /* c07 Base imponible         */ this.toNumber(inv.subtotal),
        /* c08 Tipo IVA (%)           */ dominantTaxRate,
        /* c09 Cuota IVA              */ this.toNumber(inv.taxTotal),
        /* c10 Tipo Recargo Equiv. (%)*/ 0,
        /* c11 Cuota Recargo Equiv.   */ 0,
        /* c12 Tipo Retención (%)     */ irpfPct,
        /* c13 Cuota Retención        */ this.toNumber(inv.irpfTotal ?? new Decimal(0)),
        /* c14 Total factura          */ this.toNumber(inv.total),
        /* c15 Fecha vencimiento      */ fechaVto,
        /* c16 Estado                 */ estado,
      ]);
    }

    // ── Data row styling ──────────────────────────────────────────────────
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const isEven = rowNumber % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { size: 9 };
        cell.alignment = { vertical: 'middle' };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8F5' } };
        }
      });
    });

    // ── Number format for amount columns ──────────────────────────────────
    const amountCols = [7, 9, 11, 13, 14]; // c07, c09, c11, c13, c14
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      amountCols.forEach((colIdx) => {
        const cell = row.getCell(colIdx);
        cell.numFmt = '#,##0.00';
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private formatDateEs(date: Date): string {
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      date.getFullYear(),
    ].join('/');
  }

  /** Returns a rounded numeric value suitable for Excel number cells. */
  private toNumber(value: Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Math.round(Number(value) * 100) / 100;
  }

  /**
   * Builds a short description from the invoice lines.
   * When there is a single line, uses that line's description.
   * When there are multiple lines, joins all descriptions separated by " / ".
   * Truncated to 150 characters to stay within reasonable cell limits.
   */
  private buildConcepto(inv: ExportableInvoice): string {
    if (inv.lines.length === 1 && inv.lines[0]) {
      return inv.lines[0].description.substring(0, 150);
    }
    return inv.lines
      .map((l) => l.description)
      .join(' / ')
      .substring(0, 150);
  }

  /**
   * Returns the tax rate with the highest total tax amount (dominant rate).
   * Used for the aggregated single-row A3 format where only one rate fits.
   */
  private getDominantTaxRate(lines: { taxRate: Decimal; taxAmount: Decimal }[]): number {
    if (lines.length === 0) return 0;
    const byRate = lines.reduce<Record<string, number>>((acc, line) => {
      const rate = Number(line.taxRate);
      acc[rate] = (acc[rate] ?? 0) + Number(line.taxAmount);
      return acc;
    }, {});
    return Number(Object.entries(byRate).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 0);
  }

  /** Returns the IRPF retention rate from the first line that has one. */
  private getIrpfRate(lines: { irpfRate: Decimal | null }[]): number {
    const line = lines.find((l) => l.irpfRate != null && Number(l.irpfRate) > 0);
    return line ? Number(line.irpfRate) : 0;
  }

  private mapEstado(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'SENT':
        return 'Enviada';
      case 'PAID':
        return 'Cobrada';
      default:
        return status;
    }
  }
}
