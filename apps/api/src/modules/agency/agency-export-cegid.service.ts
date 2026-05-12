import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import * as ExcelJS from 'exceljs';

import type { ExportableInvoice } from './agency-export.service';

/**
 * Generates Excel files in the format required by Cegid Contasimple.
 * Extracted from AgencyExportService to keep each format's logic self-contained.
 *
 * Format rules:
 *  - 41 exact columns matching the Cegid import template header names
 *  - One row per line item (concepto)
 *  - Invoice header columns (Serie, Número, Cliente…) only on the first row of each invoice
 */
@Injectable()
export class AgencyExportCegidService {
  async generate(invoices: ExportableInvoice[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cegid Contasimple';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Sheet1', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // ── 41 columns — exact Cegid Contasimple header names ────────────────
    sheet.columns = [
      { header: 'Serie', key: 'c01', width: 22 },
      { header: 'Número', key: 'c02', width: 18 },
      { header: 'Período', key: 'c03', width: 10 },
      {
        header: 'Número de factura que rectifica (sólo para facturas rectificativas)',
        key: 'c04',
        width: 42,
      },
      { header: 'Fecha factura', key: 'c05', width: 14 },
      { header: 'Fecha vencimiento', key: 'c06', width: 18 },
      { header: 'Estado', key: 'c07', width: 12 },
      { header: 'Tipo ingreso', key: 'c08', width: 14 },
      { header: 'Notas privadas', key: 'c09', width: 30 },
      { header: 'Notas en la factura', key: 'c10', width: 30 },
      { header: 'Fecha operación', key: 'c11', width: 16 },
      { header: 'Tipo operación', key: 'c12', width: 14 },
      { header: 'Concepto - Inicio servicio', key: 'c13', width: 20 },
      { header: 'Concepto - Fin servicio', key: 'c14', width: 18 },
      { header: 'Concepto - Descripción', key: 'c15', width: 35 },
      { header: 'Concepto - Descripción detallada', key: 'c16', width: 35 },
      { header: 'Concepto - Base imponible unitaria', key: 'c17', width: 30 },
      { header: 'Concepto - Cantidad', key: 'c18', width: 18 },
      { header: 'Concepto - % descuento', key: 'c19', width: 20 },
      { header: 'Concepto - Total base imponible', key: 'c20', width: 28 },
      { header: 'Concepto - % IVA', key: 'c21', width: 14 },
      { header: 'Concepto - Cuota IVA', key: 'c22', width: 18 },
      { header: 'Concepto - % RE', key: 'c23', width: 14 },
      { header: 'Concepto - Cuota RE', key: 'c24', width: 16 },
      { header: 'Concepto - % Retención', key: 'c25', width: 20 },
      { header: 'Concepto - Cuota Retención', key: 'c26', width: 22 },
      { header: 'Cliente - NIF', key: 'c27', width: 14 },
      { header: 'Cliente - Nombre o Razón Social', key: 'c28', width: 32 },
      { header: 'Cliente - Dirección', key: 'c29', width: 30 },
      { header: 'Cliente - Cód. Postal', key: 'c30', width: 14 },
      { header: 'Cliente - Población', key: 'c31', width: 20 },
      { header: 'Cliente - Provincia', key: 'c32', width: 18 },
      { header: 'Cliente - País', key: 'c33', width: 10 },
      { header: 'Cliente - Telf', key: 'c34', width: 14 },
      { header: 'Cliente - Fax', key: 'c35', width: 12 },
      { header: 'Cliente - Email', key: 'c36', width: 25 },
      { header: 'Cobro - Fecha', key: 'c37', width: 14 },
      { header: 'Cobro - Importe', key: 'c38', width: 16 },
      { header: 'Cobro - Método de cobro', key: 'c39', width: 22 },
      { header: 'Cobro - Tipo de método de cobro', key: 'c40', width: 26 },
      { header: 'Cobro - Número de cuenta o tarjeta', key: 'c41', width: 30 },
    ];

    // ── Header row styling ────────────────────────────────────────────────
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.border = { bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    headerRow.height = 45;

    // ── Data rows — one row per line item ─────────────────────────────────
    for (const inv of invoices) {
      const serie =
        inv.series?.name ?? (inv.isRectificative ? 'Facturas rectificativas' : 'Facturas normales');
      const periodo = this.buildCegidPeriodo(inv.issueDate);
      const fechaFactura = this.formatDateEs(inv.issueDate);
      const fechaVto = inv.dueDate ? this.formatDateEs(inv.dueDate) : '';
      const estado = inv.status === 'PAID' ? 'Pagado' : 'Pendiente';
      const rectificaNum = inv.isRectificative ? (inv.rectifiedInvoice?.number ?? '') : '';
      const primaryPayment = inv.payments.length > 0 ? inv.payments[inv.payments.length - 1] : null;
      const totalPaidAmt = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);

      for (let i = 0; i < inv.lines.length; i++) {
        const line = inv.lines[i];
        if (!line) continue;

        const isFirst = i === 0;
        const irpfPct =
          line.irpfRate != null
            ? Number(line.irpfRate)
            : inv.irpfPercent
              ? Number(inv.irpfPercent)
              : 0;
        const irpfAmt = line.irpfAmount != null ? Number(line.irpfAmount) : 0;

        sheet.addRow([
          /* c01 Serie             */ isFirst ? serie : '',
          /* c02 Número            */ isFirst ? (inv.number ?? '') : '',
          /* c03 Período           */ isFirst ? periodo : '',
          /* c04 Rectifica         */ isFirst ? rectificaNum : '',
          /* c05 Fecha factura     */ isFirst ? fechaFactura : '',
          /* c06 Fecha vencimiento */ isFirst ? fechaVto : '',
          /* c07 Estado            */ isFirst ? estado : '',
          /* c08 Tipo ingreso      */ isFirst ? '700' : '',
          /* c09 Notas privadas    */ isFirst ? (inv.notes ?? '') : '',
          /* c10 Notas factura     */ '',
          /* c11 Fecha operación   */ isFirst ? fechaFactura : '',
          /* c12 Tipo operación    */ isFirst ? this.buildTipoOperacion(inv.customer) : '',
          /* c13 Inicio servicio   */ '',
          /* c14 Fin servicio      */ '',
          /* c15 Descripción       */ line.description,
          /* c16 Desc. detallada   */ '',
          /* c17 Base unit.        */ this.formatCegidAmount(line.unitPrice),
          /* c18 Cantidad          */ this.formatCegidQty(line.quantity),
          /* c19 % descuento       */ inv.discountPercent && Number(inv.discountPercent) > 0
            ? this.formatCegidPct(inv.discountPercent)
            : '0',
          /* c20 Total base impon. */ this.formatCegidAmount(
            this.applyDiscount(line.subtotal, inv.discountPercent)
          ),
          /* c21 % IVA             */ this.formatCegidPct(line.taxRate),
          /* c22 Cuota IVA         */ this.formatCegidAmount(
            this.applyDiscount(line.taxAmount, inv.discountPercent)
          ),
          /* c23 % RE              */ '0',
          /* c24 Cuota RE          */ '0',
          /* c25 % Retención       */ irpfPct > 0 ? this.formatCegidPct(irpfPct) : '0',
          /* c26 Cuota Retención   */ irpfAmt > 0 ? this.formatCegidAmount(irpfAmt) : '0',
          /* c27 Cliente NIF       */ isFirst ? (inv.customer?.nif ?? '') : '',
          /* c28 Cliente Nombre    */ isFirst
            ? (inv.customer?.legalName ?? inv.customer?.name ?? '')
            : '',
          /* c29 Cliente Dirección */ isFirst ? (inv.customer?.address ?? '') : '',
          /* c30 Cliente CP        */ isFirst ? (inv.customer?.postalCode ?? '') : '',
          /* c31 Cliente Población */ isFirst ? (inv.customer?.city ?? '') : '',
          /* c32 Cliente Provincia */ isFirst ? (inv.customer?.province ?? '') : '',
          /* c33 Cliente País      */ isFirst ? (inv.customer?.country ?? 'ES') : '',
          /* c34 Cliente Telf      */ isFirst ? (inv.customer?.phone ?? '') : '',
          /* c35 Cliente Fax       */ '',
          /* c36 Cliente Email     */ isFirst ? (inv.customer?.email ?? '') : '',
          /* c37 Cobro Fecha       */ isFirst && primaryPayment
            ? this.formatDateEs(primaryPayment.paymentDate)
            : '',
          /* c38 Cobro Importe     */ isFirst && primaryPayment
            ? this.formatCegidAmount(
                inv.payments.length === 1 ? primaryPayment.amount : totalPaidAmt
              )
            : '',
          /* c39 Cobro Método      */ isFirst && primaryPayment
            ? this.mapPaymentMethod(primaryPayment.paymentMethod)
            : '',
          /* c40 Cobro Tipo        */ '',
          /* c41 Cobro Cuenta      */ '',
        ]);
      }
    }

    // ── Data row styling ──────────────────────────────────────────────────
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { size: 9 };
        cell.alignment = { vertical: 'middle' };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Returns quarter-based period string: "2026-2T" for April–June 2026. */
  private buildCegidPeriodo(date: Date): string {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `${date.getFullYear()}-${quarter}T`;
  }

  /** Formats a date as DD/MM/YYYY (Spanish convention). */
  private formatDateEs(date: Date): string {
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      date.getFullYear(),
    ].join('/');
  }

  /**
   * Formats a monetary amount as Cegid expects: Spanish decimal comma + "€" suffix.
   * Zero values are represented as "0" (no suffix) to match the template.
   */
  private formatCegidAmount(value: Decimal | number | null | undefined): string {
    if (value === null || value === undefined) return '0';
    const n = Number(value);
    if (n === 0) return '0';
    const formatted = n.toFixed(2).replace('.', ',').replace(/,00$/, '');
    return `${formatted}€`;
  }

  /** Formats a percentage value using Spanish decimal comma (e.g. "5,2" not "5.2"). */
  private formatCegidPct(value: Decimal | number): string {
    const n = Number(value);
    if (n === 0) return '0';
    return n.toString().replace('.', ',');
  }

  /** Formats a quantity: integer if whole number, 2 decimal places otherwise. */
  private formatCegidQty(value: Decimal | number): string {
    const n = Number(value);
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
  }

  /**
   * Applies an invoice-level discount to a line amount.
   * Returns the value unchanged when discount is null/zero.
   */
  private applyDiscount(
    value: Decimal | number,
    discountPercent: Decimal | null | undefined
  ): number {
    const n = Number(value);
    if (!discountPercent || Number(discountPercent) === 0) return n;
    return n * (1 - Number(discountPercent) / 100);
  }

  /**
   * Determines the Cegid "Tipo operación" from the customer's type and country:
   *   INTRACOMMUNITY customer type → 'Intracomunitario'
   *   Non-EU country              → 'Exportación'
   *   Spain or rest of EU         → 'Nacional' / 'Intracomunitario'
   */
  private buildTipoOperacion(customer: ExportableInvoice['customer']): string {
    if (!customer) return 'Nacional';
    if (customer.type === 'INTRACOMMUNITY') return 'Intracomunitario';
    const country = (customer.country ?? 'ES').toUpperCase();
    if (country === 'ES') return 'Nacional';
    if (AgencyExportCegidService.EU_COUNTRIES.has(country)) return 'Intracomunitario';
    return 'Exportación';
  }

  /** Maps an internal PaymentMethod enum value to the Cegid display label. */
  private mapPaymentMethod(method: string | null | undefined): string {
    switch (method) {
      case 'BANK_TRANSFER':
        return 'Transferencia bancaria';
      case 'DIRECT_DEBIT':
        return 'Domiciliación bancaria';
      case 'CARD':
        return 'Tarjeta';
      case 'CASH':
        return 'Efectivo';
      case 'PAYPAL':
        return 'PayPal';
      case 'BIZUM':
        return 'Bizum';
      default:
        return 'Otro';
    }
  }

  private static readonly EU_COUNTRIES = new Set([
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'SE',
  ]);
}
