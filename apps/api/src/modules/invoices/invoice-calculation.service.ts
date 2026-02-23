import { Injectable } from '@nestjs/common';
import { CreateInvoiceLineDto } from './dto/create-invoice.dto';

export interface TaxBreakdownItem {
  taxRate: number;
  baseAmount: number;
  taxAmount: number;
}

export interface CalculatedLine {
  subtotal: number;
  taxAmount: number;
  lineTotal: number;
}

export interface CalculatedInvoiceTotals {
  lines: CalculatedLine[];
  subtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  taxBreakdown: TaxBreakdownItem[];
  taxTotal: number;
  irpfTotal: number;
  total: number;
}

/**
 * Handles all monetary calculations for invoices.
 *
 * RULE: All amounts are rounded to 2 decimal places after each multiplication
 * to avoid floating-point accumulation errors. Arithmetic is done in cents
 * internally and converted back to euros.
 */
@Injectable()
export class InvoiceCalculationService {
  /**
   * Rounds a number to 2 decimal places using integer-based arithmetic
   * to avoid floating-point precision issues.
   */
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculates all totals for an invoice.
   *
   * @param lines - Invoice line items
   * @param discountPercent - Global discount on subtotal (0-100)
   * @param irpfPercent - IRPF withholding percentage (0-100)
   */
  calculateTotals(
    lines: CreateInvoiceLineDto[],
    discountPercent?: number,
    irpfPercent?: number
  ): CalculatedInvoiceTotals {
    // === STEP 1: Calculate per-line amounts ===
    const calculatedLines: CalculatedLine[] = lines.map((line) => {
      const subtotal = this.round2(Number(line.quantity) * Number(line.unitPrice));
      const taxAmount = this.round2(subtotal * (Number(line.taxRate) / 100));
      const lineTotal = this.round2(subtotal + taxAmount);
      return { subtotal, taxAmount, lineTotal };
    });

    // === STEP 2: Invoice subtotal (sum of all line subtotals) ===
    const subtotal = this.round2(calculatedLines.reduce((sum, line) => sum + line.subtotal, 0));

    // === STEP 3: Global discount ===
    const discountAmount = discountPercent
      ? this.round2(subtotal * (Number(discountPercent) / 100))
      : 0;
    const subtotalAfterDiscount = this.round2(subtotal - discountAmount);

    // === STEP 4: Tax breakdown grouped by tax rate ===
    // When a discount is applied, distribute it proportionally to each tax group
    const discountRatio = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;

    const taxMap = new Map<number, { baseAmount: number; taxAmount: number }>();

    lines.forEach((line, index) => {
      const rate = Number(line.taxRate);
      const lineSubtotalAfterDiscount = this.round2(
        calculatedLines[index]!.subtotal * discountRatio
      );
      const lineTaxAfterDiscount = this.round2(lineSubtotalAfterDiscount * (rate / 100));

      const existing = taxMap.get(rate);
      if (existing) {
        existing.baseAmount = this.round2(existing.baseAmount + lineSubtotalAfterDiscount);
        existing.taxAmount = this.round2(existing.taxAmount + lineTaxAfterDiscount);
      } else {
        taxMap.set(rate, {
          baseAmount: lineSubtotalAfterDiscount,
          taxAmount: lineTaxAfterDiscount,
        });
      }
    });

    const taxBreakdown: TaxBreakdownItem[] = Array.from(taxMap.entries())
      .map(([taxRate, amounts]) => ({ taxRate, ...amounts }))
      .sort((a, b) => b.taxRate - a.taxRate);

    const taxTotal = this.round2(taxBreakdown.reduce((sum, item) => sum + item.taxAmount, 0));

    // === STEP 5: IRPF (withheld from the invoiced amount) ===
    // IRPF applies to subtotalAfterDiscount (before taxes)
    const irpfTotal = irpfPercent
      ? this.round2(subtotalAfterDiscount * (Number(irpfPercent) / 100))
      : 0;

    // === STEP 6: Final total ===
    // total = subtotal after discount + taxes - IRPF withholding
    const total = this.round2(subtotalAfterDiscount + taxTotal - irpfTotal);

    return {
      lines: calculatedLines,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      taxBreakdown,
      taxTotal,
      irpfTotal,
      total,
    };
  }
}
