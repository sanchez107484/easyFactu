import { Injectable } from '@nestjs/common';
import { CreateInvoiceLineDto } from '../../invoices/dto/create-invoice.dto';
import { InvoiceCalculationService } from '../../invoices/invoice-calculation.service';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { divideHalfUp, parseScaled, scaledToNumber, toCents } from '../utils/decimal';

/** Price with tax included, as the till charged it. All values are decimal strings. */
export interface ChargedLine {
  description: string;
  quantity: string;
  unitPriceWithTax: string;
  taxRate: string;
  discountPercent?: string;
}

/** 1 for a sale; -1 for a return, whose lines are recorded with negative quantities. */
export type LineSign = 1n | -1n;

export interface ConvertedInvoiceLines {
  lines: CreateInvoiceLineDto[];
  /** Sum of round_half_up(quantity × unitPriceWithTax × (1 − discount%)) over the lines, in cents. */
  chargedCents: bigint;
}

interface ScaledLine {
  quantity: bigint; // 1e-4 units
  priceCents: bigint;
  taxRate: bigint; // whole percent: 0, 4, 10, 21
  discount: bigint; // 1e-2 percent: 0..10000
}

interface ConvertedLine {
  line: CreateInvoiceLineDto;
  chargedCents: bigint;
  /** Cents below the charged amount the line had to settle for (see class doc). */
  shortfallCents: bigint;
}

const QUANTITY_SCALE = 4;
const UNIT_PRICE_SCALE = 4;
const MONEY_SCALE = 2;
const PERCENT_BASIS = 10_000n; // 100.00 % with two decimals
const MAX_SEARCH_STEPS = 200n;
const MAX_SHORTFALL_CENTS = 5n;
export const ROUNDING_ADJUSTMENT_DESCRIPTION = 'Ajuste por redondeo (IVA incluido)';

/**
 * Turns prices with tax included into the net unit prices (4 decimals) the invoice stores,
 * so the invoice total is exactly the sum charged at the till.
 *
 * The invoice calculation rounds base and tax per line, so the net price is searched among
 * the 4-decimal prices around the exact quotient and checked with the real
 * InvoiceCalculationService (the one used at confirmation).
 *
 * Some charged amounts cannot be reached by any single line: at 4 % VAT, base and tax can
 * round up at the same point (9.49 € → 9.12 + 0.36 = 9.48 or 9.13 + 0.37 = 9.50), and very
 * large quantities make the price grid too coarse. Such a line keeps the closest amount
 * below the charge and the difference goes to one "Ajuste por redondeo" line per VAT rate,
 * so the total still matches to the cent.
 */
@Injectable()
export class PriceWithTaxConverter {
  constructor(private readonly calculation: InvoiceCalculationService) {}

  /**
   * With sign -1n (a return) the lines carry negative quantities and the search is checked
   * against the real calculation with that sign, so rounding of negative amounts is exact too.
   * chargedCents is always positive.
   */
  convertInvoice(chargedLines: ChargedLine[], sign: LineSign = 1n): ConvertedInvoiceLines {
    const converted = chargedLines.map((charged, index) => this.convertLine(charged, index, sign));
    const adjustments = this.roundingAdjustments(converted, sign);
    return {
      lines: [...converted.map((c) => c.line), ...adjustments],
      chargedCents: converted.reduce((sum, c) => sum + c.chargedCents, 0n),
    };
  }

  private convertLine(charged: ChargedLine, index: number, sign: LineSign): ConvertedLine {
    const scaled = this.scale(charged);
    const chargedCents = divideHalfUp(
      scaled.priceCents * scaled.quantity * (PERCENT_BASIS - scaled.discount),
      10n ** 8n
    );
    for (
      let shortfall = 0n;
      shortfall <= MAX_SHORTFALL_CENTS && shortfall <= chargedCents;
      shortfall++
    ) {
      const unitPrice = this.findUnitPrice(
        charged.description,
        scaled,
        chargedCents - shortfall,
        sign
      );
      if (unitPrice !== undefined) {
        return {
          line: this.toInvoiceLine(charged.description, scaled, unitPrice, sign),
          chargedCents,
          shortfallCents: shortfall,
        };
      }
    }
    throw this.unrepresentable(index);
  }

  /** One extra line per VAT rate carrying the cents the lines of that rate could not reach. */
  private roundingAdjustments(converted: ConvertedLine[], sign: LineSign): CreateInvoiceLineDto[] {
    const shortfallByRate = new Map<number, bigint>();
    for (const { line, shortfallCents } of converted) {
      if (shortfallCents > 0n) {
        shortfallByRate.set(
          line.taxRate,
          (shortfallByRate.get(line.taxRate) ?? 0n) + shortfallCents
        );
      }
    }
    return [...shortfallByRate].map(([taxRate, cents]) => {
      const scaled = {
        quantity: 10_000n,
        priceCents: cents,
        taxRate: BigInt(taxRate),
        discount: 0n,
      };
      const unitPrice = this.findUnitPrice(ROUNDING_ADJUSTMENT_DESCRIPTION, scaled, cents, sign);
      if (unitPrice === undefined) throw this.unrepresentable(converted.length);
      return this.toInvoiceLine(ROUNDING_ADJUSTMENT_DESCRIPTION, scaled, unitPrice, sign);
    });
  }

  private scale(charged: ChargedLine): ScaledLine {
    return {
      quantity: parseScaled(charged.quantity, QUANTITY_SCALE),
      priceCents: parseScaled(charged.unitPriceWithTax, MONEY_SCALE),
      taxRate: parseScaled(charged.taxRate, 0),
      discount: parseScaled(charged.discountPercent ?? '0', MONEY_SCALE),
    };
  }

  /** Net unit price (1e-4 units) whose base + tax equals the target, preferring a matching line total. */
  private findUnitPrice(
    description: string,
    scaled: ScaledLine,
    targetCents: bigint,
    sign: LineSign
  ): bigint | undefined {
    const netFactor = scaled.quantity * (PERCENT_BASIS - scaled.discount) * (100n + scaled.taxRate);
    if (netFactor === 0n) {
      // 100 % discount: every price yields 0; keep the net equivalent of the listed price.
      return targetCents === 0n
        ? divideHalfUp(scaled.priceCents * 10_000n, 100n + scaled.taxRate)
        : undefined;
    }
    const candidates = this.candidatesAround(divideHalfUp(targetCents * 10n ** 12n, netFactor));
    const target = { cents: targetCents, sign };
    return (
      candidates.find((price) => this.reaches(description, scaled, price, target, true)) ??
      candidates.find((price) => this.reaches(description, scaled, price, target, false))
    );
  }

  /** estimate, estimate+1, estimate−1, estimate+2… never negative. */
  private candidatesAround(estimate: bigint): bigint[] {
    const candidates = [estimate];
    for (let step = 1n; step <= MAX_SEARCH_STEPS; step++) {
      candidates.push(estimate + step);
      if (estimate - step >= 0n) candidates.push(estimate - step);
    }
    return candidates;
  }

  private reaches(
    description: string,
    scaled: ScaledLine,
    unitPrice: bigint,
    target: { cents: bigint; sign: LineSign },
    requireLineTotal: boolean
  ): boolean {
    const [result] = this.calculation.calculateTotals([
      this.toInvoiceLine(description, scaled, unitPrice, target.sign),
    ]).lines;
    const signedTarget = target.cents * target.sign;
    if (!result || toCents(result.subtotal) + toCents(result.taxAmount) !== signedTarget)
      return false;
    return !requireLineTotal || toCents(result.lineTotal) === signedTarget;
  }

  private toInvoiceLine(
    description: string,
    scaled: ScaledLine,
    unitPrice: bigint,
    sign: LineSign
  ): CreateInvoiceLineDto {
    const line = new CreateInvoiceLineDto();
    line.description = description;
    line.quantity = scaledToNumber(scaled.quantity * sign, QUANTITY_SCALE);
    line.unitPrice = scaledToNumber(unitPrice, UNIT_PRICE_SCALE);
    line.taxRate = Number(scaled.taxRate);
    if (scaled.discount > 0n) line.discountPercent = scaledToNumber(scaled.discount, MONEY_SCALE);
    return line;
  }

  private unrepresentable(index: number): IntegrationException {
    return new IntegrationException(
      IntegrationErrorCode.FISCAL_RULE,
      `La línea ${index + 1} no se puede expresar con un precio neto de 4 decimales que cuadre al céntimo. Divide la línea en varias con menos cantidad.`,
      {
        errors: [
          {
            field: `lines[${index}].quantity`,
            message: 'Cantidad demasiado alta para cuadrar al céntimo',
          },
        ],
      }
    );
  }
}
