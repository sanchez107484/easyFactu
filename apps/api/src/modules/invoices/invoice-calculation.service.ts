import { Injectable } from '@nestjs/common';
import { CreateInvoiceLineDto } from './dto/create-invoice.dto';

export interface TaxBreakdownItem {
  taxRate: number;
  baseAmount: number;
  taxAmount: number;
  /** Tipo de Recargo de Equivalencia para este tramo de IVA. 0 si no aplica. */
  surchargeRate: number;
  surchargeAmount: number;
}

export interface CalculatedLine {
  subtotal: number;
  taxAmount: number;
  /**
   * Tipo de Recargo de Equivalencia (%) aplicado a esta línea, según el Art. 161 LIVA
   * (21%→5.2, 10%→1.4, 4%→0.5, 0%→0). 0 si el cliente no está en régimen de RE
   * o si el tipo de IVA de la línea no tiene un recargo definido.
   * Se persiste en `InvoiceLine.surchargeRate` para trazabilidad fiscal.
   */
  surchargeRate: number;
  /** Importe de Recargo de Equivalencia para esta línea. 0 si no aplica. */
  surchargeAmount: number;
  lineTotal: number;
}

export interface CalculatedInvoiceTotals {
  lines: CalculatedLine[];
  subtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  taxBreakdown: TaxBreakdownItem[];
  taxTotal: number;
  /** Recargo de Equivalencia total (suma de RE de todas las líneas). 0 si no aplica. */
  surchargeTotal: number;
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
  /**
   * Recargo de Equivalencia rate map: { taxRate -> surchargeRate } (Art. 161 LIVA).
   * Pass a non-empty map when the customer has hasEquivalenceSurcharge=true.
   * Each line's surcharge rate is taken from this map using its taxRate.
   * If a rate is not present for a line's taxRate, surcharge defaults to 0 for that line.
   *
   * The RE rate is FIXED BY LAW — there is no user input for it. The map is the
   * single source of truth and is stamped on each invoice line for traceability.
   */
  equivalenceSurchargeRates?: Record<number, number>;
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
    const surchargeRateMap: Record<number, number> =
      options !== undefined && typeof options === 'object'
        ? options.equivalenceSurchargeRates ?? {}
        : {};
    const hasEquivalenceSurcharge = Object.keys(surchargeRateMap).length > 0;

    // === STEP 1: Calculate per-line amounts ===
    // IMPORTANT: intermediate values are kept at full floating-point precision before
    // the final round2 so that lineTotal is derived from the precise unitPrice (up to 4
    // decimal places) rather than from an already-rounded subtotal. Without this, a total
    // entered by the user (e.g. 35 €) back-calculates to unitPrice=28.9256, which rounds
    // to subtotal=28.93, and then 28.93×1.21=35.0053 → lineTotal=35.01 (off by 1 cent).
    const calculatedLinesRaw: (CalculatedLine & { _precise: number })[] = lines.map((line) => {
      // Use full precision for intermediate multiplication — do NOT round2 here.
      const grossSubtotal = Number(line.quantity) * Number(line.unitPrice);
      // Apply per-line discount at full precision before computing tax.
      const lineDiscountAmount =
        line.discountPercent && Number(line.discountPercent) > 0
          ? grossSubtotal * (Number(line.discountPercent) / 100)
          : 0;
      const precise = grossSubtotal - lineDiscountAmount; // full precision, not stored in DB
      // In REAGYP, lines have no IVA.
      // taxAmount and lineTotal are derived from `precise` (not from round2(precise))
      // so that e.g. 28.9256 × 0.21 = 6.074376 → round2 → 6.07, and
      // 28.9256 × 1.21 = 34.999976 → round2 → 35.00 (not 35.01).
      const taxAmount = isReagyp ? 0 : this.round2(precise * (Number(line.taxRate) / 100));
      // Surcharge rate is always derived from the Art. 161 LIVA map using the line's taxRate.
      // No user input — the rate is fixed by law. Stamped on the line for traceability.
      const lineSurchargeRate = hasEquivalenceSurcharge
        ? surchargeRateMap[Number(line.taxRate)] ?? 0
        : 0;
      const surchargeAmount = hasEquivalenceSurcharge && !isReagyp
        ? this.round2(precise * (lineSurchargeRate / 100))
        : 0;
      const lineTotal = this.round2(precise * (isReagyp ? 1 : 1 + Number(line.taxRate) / 100));
      const subtotal = this.round2(precise); // rounded for DB storage (Decimal 12,2)
      return { subtotal, taxAmount, surchargeRate: lineSurchargeRate, surchargeAmount, lineTotal, _precise: precise };
    });
    // Strip the internal _precise field before exposing the public CalculatedLine array.
    const calculatedLines: CalculatedLine[] = calculatedLinesRaw.map(
      ({ subtotal, taxAmount, surchargeRate, surchargeAmount, lineTotal }) => ({
        subtotal,
        taxAmount,
        surchargeRate,
        surchargeAmount,
        lineTotal,
      })
    );

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
      const discountRatio = subtotal !== 0 ? subtotalAfterDiscount / subtotal : 1;
      const taxMap = new Map<number, { baseAmount: number; taxAmount: number; surchargeRate: number; surchargeAmount: number }>();

      lines.forEach((line, index) => {
        const rate = Number(line.taxRate);
        const linePrecise = calculatedLinesRaw[index]!._precise;
        const surchargeRate = hasEquivalenceSurcharge ? surchargeRateMap[rate] ?? 0 : 0;
        // Keep full precision for the tax multiplication to avoid the double-rounding error.
        const lineBaseForTax = linePrecise * discountRatio; // full precision
        const lineSubtotalAfterDiscount = this.round2(lineBaseForTax); // rounded for baseAmount display only
        const lineTaxAfterDiscount = this.round2(lineBaseForTax * (rate / 100)); // use unrounded base
        const lineSurchargeAfterDiscount = hasEquivalenceSurcharge
          ? this.round2(lineBaseForTax * (surchargeRate / 100))
          : 0;

        const existing = taxMap.get(rate);
        if (existing) {
          existing.baseAmount = this.round2(existing.baseAmount + lineSubtotalAfterDiscount);
          existing.taxAmount = this.round2(existing.taxAmount + lineTaxAfterDiscount);
          existing.surchargeAmount = this.round2(existing.surchargeAmount + lineSurchargeAfterDiscount);
        } else {
          taxMap.set(rate, {
            baseAmount: lineSubtotalAfterDiscount,
            taxAmount: lineTaxAfterDiscount,
            surchargeRate,
            surchargeAmount: lineSurchargeAfterDiscount,
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

    // === STEP 4c: Recargo de Equivalencia total ===
    const surchargeTotal = hasEquivalenceSurcharge && !isReagyp
      ? this.round2(taxBreakdown.reduce((sum, item) => sum + item.surchargeAmount, 0))
      : 0;

    // === STEP 5: IRPF (withheld from the invoiced amount) ===
    // GENERAL: IRPF applies to subtotalAfterDiscount (before IVA)
    // REAGYP:  IRPF applies to subtotalAfterDiscount + compensacionAmount (Art. 102.Dos LIVA)
    const irpfBase = isReagyp
      ? this.round2(subtotalAfterDiscount + compensacionAmount)
      : subtotalAfterDiscount;
    const irpfTotal = irpfPercent ? this.round2(irpfBase * (Number(irpfPercent) / 100)) : 0;

    // === STEP 6: Final total ===
    // GENERAL:    subtotalAfterDiscount + taxTotal + surchargeTotal − irpfTotal
    // REAGYP:     subtotalAfterDiscount + compensacionAmount − irpfTotal (no RE in REAGYP)
    const total = isReagyp
      ? this.round2(subtotalAfterDiscount + compensacionAmount - irpfTotal)
      : this.round2(subtotalAfterDiscount + taxTotal + surchargeTotal - irpfTotal);

    return {
      lines: calculatedLines,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      taxBreakdown,
      taxTotal,
      surchargeTotal,
      irpfTotal,
      compensacionAmount,
      total,
    };
  }
}
