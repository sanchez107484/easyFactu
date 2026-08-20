import { Injectable } from '@nestjs/common';

export interface ExpenseCalculatedAmounts {
  vatAmount: number;
  totalAmount: number;
}

/**
 * Handles monetary calculations for expenses.
 *
 * RULE: All amounts are rounded to 2 decimal places using half-up rounding
 * to avoid floating-point accumulation errors. This matches the rounding
 * strategy used by InvoiceCalculationService.
 */
@Injectable()
export class ExpensesCalculationService {
  /**
   * Rounds a number to 2 decimal places using half-up rounding.
   */
  round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculates VAT and total amounts from base amount and VAT rate.
   */
  calculate(baseAmount: number, vatRate: number): ExpenseCalculatedAmounts {
    const vatAmount = this.round2(baseAmount * (vatRate / 100));
    const totalAmount = this.round2(baseAmount + vatAmount);

    return { vatAmount, totalAmount };
  }
}
