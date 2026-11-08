import { InvoiceCalculationService } from '../../src/modules/invoices/invoice-calculation.service';
import { IntegrationException } from '../../src/modules/integrations/errors/integration.exception';
import {
  ChargedLine,
  PriceWithTaxConverter,
  ROUNDING_ADJUSTMENT_DESCRIPTION,
} from '../../src/modules/integrations/services/price-with-tax.converter';
import { toCents } from '../../src/modules/integrations/utils/decimal';

const TAX_RATES = ['21', '10', '4', '0'];
const DISCOUNTS = [undefined, '5', '10', '12.5', '15', '33.33', '50', '99.99', '100'];
const QUANTITIES = [
  '1',
  '2',
  '3',
  '7',
  '12',
  '0.5',
  '0.25',
  '1.25',
  '2.5',
  '0.3333',
  '1.75',
  '3.125',
  '10.5',
];

/** Deterministic pseudo-random prices so failures are reproducible. */
function seededPrices(count: number): string[] {
  let seed = 20261108;
  const prices = ['0.01', '0.99', '1.00', '9.99', '35.00', '107.69', '352.00', '399.99', '1234.56'];
  while (prices.length < count) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    prices.push(((seed % 250000) / 100).toFixed(2));
  }
  return prices;
}

describe('PriceWithTaxConverter', () => {
  const calculation = new InvoiceCalculationService();
  const converter = new PriceWithTaxConverter(calculation);
  const prices = seededPrices(40);

  function chargedSum(lines: ChargedLine[]): { invoiceTotalCents: bigint; chargedCents: bigint } {
    const converted = converter.convertInvoice(lines);
    const totals = calculation.calculateTotals(converted.lines);
    return { invoiceTotalCents: toCents(totals.total), chargedCents: converted.chargedCents };
  }

  it('matches the charged amount to the cent for every rate, discount and quantity', () => {
    const mismatches: string[] = [];
    for (const taxRate of TAX_RATES) {
      for (const discountPercent of DISCOUNTS) {
        for (const quantity of QUANTITIES) {
          for (const unitPriceWithTax of prices) {
            const line = {
              description: 'Producto',
              quantity,
              unitPriceWithTax,
              taxRate,
              discountPercent,
            };
            const { invoiceTotalCents, chargedCents } = chargedSum([line]);
            if (invoiceTotalCents !== chargedCents) {
              mismatches.push(`${JSON.stringify(line)} → ${invoiceTotalCents} ≠ ${chargedCents}`);
            }
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('matches the sum of charged lines on mixed-rate invoices', () => {
    for (let offset = 0; offset < prices.length - 4; offset++) {
      const lines: ChargedLine[] = TAX_RATES.map((taxRate, index) => ({
        description: `Línea ${index}`,
        quantity: QUANTITIES[(offset + index) % QUANTITIES.length]!,
        unitPriceWithTax: prices[offset + index]!,
        taxRate,
        discountPercent: DISCOUNTS[(offset + index) % DISCOUNTS.length],
      }));
      const { invoiceTotalCents, chargedCents } = chargedSum(lines);
      expect(invoiceTotalCents).toBe(chargedCents);
    }
  });

  it('reproduces the contract example (352.00 at 10 % + 107.69 at 21 % = 459.69)', () => {
    const lines: ChargedLine[] = [
      {
        description: 'Gafas graduadas progresivas',
        quantity: '1',
        unitPriceWithTax: '352.00',
        taxRate: '10',
      },
      {
        description: 'Gafas de sol',
        quantity: '1',
        unitPriceWithTax: '107.69',
        taxRate: '21',
        discountPercent: '0',
      },
    ];
    const converted = converter.convertInvoice(lines);
    const totals = calculation.calculateTotals(converted.lines);

    expect(converted.lines).toHaveLength(2);
    expect(totals.total).toBe(459.69);
    expect(totals.subtotal).toBe(409);
    expect(totals.taxTotal).toBe(50.69);
  });

  it('rounds the charged amount half up', () => {
    // 3 × 0.05 with 50 % discount = 0.075 → 0.08
    const { chargedCents } = converter.convertInvoice([
      {
        description: 'X',
        quantity: '3',
        unitPriceWithTax: '0.05',
        taxRate: '21',
        discountPercent: '50',
      },
    ]);
    expect(chargedCents).toBe(8n);
  });

  it('adds a rounding adjustment line at the same rate when a 4 % amount is unreachable', () => {
    // 9.99 × 0.95 = 9.49: base 9.12 + 0.36 = 9.48, base 9.13 + 0.37 = 9.50
    const converted = converter.convertInvoice([
      {
        description: 'Lentes',
        quantity: '1',
        unitPriceWithTax: '9.99',
        taxRate: '4',
        discountPercent: '5',
      },
    ]);
    const totals = calculation.calculateTotals(converted.lines);

    expect(converted.lines).toHaveLength(2);
    expect(converted.lines[1]).toMatchObject({
      description: ROUNDING_ADJUSTMENT_DESCRIPTION,
      taxRate: 4,
      quantity: 1,
    });
    expect(totals.total).toBe(9.49);
  });

  it('never adds an adjustment line at 10 % and 21 % with unit quantities', () => {
    for (const taxRate of ['10', '21']) {
      for (const unitPriceWithTax of prices) {
        const converted = converter.convertInvoice([
          { description: 'X', quantity: '1', unitPriceWithTax, taxRate },
        ]);
        expect(converted.lines).toHaveLength(1);
      }
    }
  });

  it('returns FISCAL_RULE when no 4-decimal net price can match (huge quantity)', () => {
    const line = {
      description: 'X',
      quantity: '99999999',
      unitPriceWithTax: '0.01',
      taxRate: '21',
    };
    expect(() => converter.convertInvoice([line])).toThrow(IntegrationException);
  });
});
