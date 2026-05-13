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
  /** REAGYP only: compensation amount (subtotalAfterDiscount × compensacionPercent). 0 for GENERAL. */
  compensacionAmount: number;
  total: number;
}

export interface CalculateTotalsOptions {
  discountPercent?: number;
  irpfPercent?: number;
  /** REAGYP compensation rate (%). Pass undefined or 0 for GENERAL regime. */
  compensacionPercent?: number;
}

/**
 * Handles all monetary calculations for invoices.
 *
 * RULE: All amounts are rounded to 2 decimal places after each multiplication
 * to avoid floating-point accumulation errors. Arithmetic is done in cents
 * internally and converted back to euros.
 *
 * Regime behaviour:
 * - GENERAL (compensacionPercent not set):
 *     total = subtotalAfterDiscount + taxTotal − irpfTotal
 * - REAGYP (compensacionPercent set to 12.0 or 10.5):
 *     taxTotal = 0 (no IVA)
 *     compensacionAmount = subtotalAfterDiscount × compensacionPercent / 100
 *     IRPF base = subtotalAfterDiscount + compensacionAmount  (Art. 102.Dos LIVA)
 *     total = subtotalAfterDiscount + compensacionAmount − irpfTotal
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
   * @param options - Optional discount, IRPF and REAGYP compensation settings
   */
  calculateTotals(
    lines: CreateInvoiceLineDto[],
    options?: CalculateTotalsOptions | number, // number kept for backwards-compat
    irpfPercentLegacy?: number
  ): CalculatedInvoiceTotals {
    // Backwards-compatible: old callers pass (lines, discountPercent, irpfPercent)
    let discountPercent: number | undefined;
    let irpfPercent: number | undefined;
    let compensacionPercent: number | undefined;

    if (options !== undefined && typeof options === 'object') {
      discountPercent = options.discountPercent;
      irpfPercent = options.irpfPercent;
      compensacionPercent = options.compensacionPercent;
    } else {
      discountPercent = options as number | undefined;
      irpfPercent = irpfPercentLegacy;
    }

    const isReagyp = compensacionPercent != null && compensacionPercent > 0;

    // === STEP 1: Calculate per-line amounts ===
    const calculatedLines: CalculatedLine[] = lines.map((line) => {
      const subtotal = this.round2(Number(line.quantity) * Number(line.unitPrice));
      // In REAGYP, lines have no IVA
      const taxAmount = isReagyp ? 0 : this.round2(subtotal * (Number(line.taxRate) / 100));
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

    // === STEP 4a: GENERAL regime — standard IVA tax breakdown ===
    let taxBreakdown: TaxBreakdownItem[] = [];
    let taxTotal = 0;

    if (!isReagyp) {
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

      taxBreakdown = Array.from(taxMap.entries())
        .map(([taxRate, amounts]) => ({ taxRate, ...amounts }))
        .sort((a, b) => b.taxRate - a.taxRate);

      taxTotal = this.round2(taxBreakdown.reduce((sum, item) => sum + item.taxAmount, 0));
    }

    // === STEP 4b: REAGYP regime — agrarian compensation (no IVA) ===
    const compensacionAmount = isReagyp
      ? this.round2(subtotalAfterDiscount * (Number(compensacionPercent) / 100))
      : 0;

    // === STEP 5: IRPF (withheld from the invoiced amount) ===
    // GENERAL: IRPF applies to subtotalAfterDiscount (before IVA)
    // REAGYP:  IRPF applies to subtotalAfterDiscount + compensacionAmount (Art. 102.Dos LIVA)
    const irpfBase = isReagyp
      ? this.round2(subtotalAfterDiscount + compensacionAmount)
      : subtotalAfterDiscount;
    const irpfTotal = irpfPercent
      ? this.round2(irpfBase * (Number(irpfPercent) / 100))
      : 0;

    // === STEP 6: Final total ===
    // GENERAL: subtotalAfterDiscount + taxTotal − irpfTotal
    // REAGYP:  subtotalAfterDiscount + compensacionAmount − irpfTotal
    const total = isReagyp
      ? this.round2(subtotalAfterDiscount + compensacionAmount - irpfTotal)
      : this.round2(subtotalAfterDiscount + taxTotal - irpfTotal);

    return {
      lines: calculatedLines,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      taxBreakdown,
      taxTotal,
      irpfTotal,
      compensacionAmount,
      total,
    };
  }
}
