import { RectificationType } from '@prisma/client';
import {
  IntegrationInvoiceRow,
  toIntegrationInvoiceResponse,
} from '../../src/modules/integrations/services/integration-invoice.mapper';
import {
  apiVisibleInvoiceWhere,
  resolveSaleExternalRef,
} from '../../src/modules/integrations/services/integration-invoice-visibility';

function row(overrides: Partial<IntegrationInvoiceRow>): IntegrationInvoiceRow {
  const base = {
    id: 'original',
    externalRef: 'VENTA-1',
    number: 'A-2026-0001',
    invoiceType: 'standard',
    status: 'CONFIRMED',
    issueDate: new Date('2026-11-08'),
    operationDate: null,
    isRectificative: false,
    rectifiedInvoiceId: null,
    rectifiedInvoice: null,
    rectificativeInvoices: [],
    exchangedByInvoiceId: null,
    exchangedInvoices: [],
    cancellation: null,
    subtotal: 100,
    discountAmount: null,
    taxTotal: 21,
    total: 121,
    hash: 'HASH',
    verifactuQr: null,
    verifactuStatus: 'ACCEPTED',
    paymentStatus: 'UNPAID',
    amountPaid: 0,
    lines: [],
  };
  return { ...base, ...overrides } as unknown as IntegrationInvoiceRow;
}

describe('HU-21G · substitute invoices in the integrations API', () => {
  describe('apiVisibleInvoiceWhere', () => {
    it('exposes ERP invoices and substitutes whose chain reaches one', () => {
      expect(apiVisibleInvoiceWhere(0)).toEqual({ externalRef: { not: null } });
      expect(apiVisibleInvoiceWhere(1)).toEqual({
        OR: [
          { externalRef: { not: null } },
          {
            isRectificative: true,
            rectificationType: RectificationType.SUBSTITUTION,
            rectifiedInvoice: { externalRef: { not: null } },
          },
        ],
      });
    });

    it('never exposes rectifications by differences made from NovaFactura', () => {
      const json = JSON.stringify(apiVisibleInvoiceWhere());
      expect(json).not.toContain(RectificationType.DIFFERENCES);
    });
  });

  describe('resolveSaleExternalRef', () => {
    it('uses the first sale reference up the substitution chain', () => {
      expect(resolveSaleExternalRef({ externalRef: 'VENTA-1' })).toBe('VENTA-1');
      expect(
        resolveSaleExternalRef({
          externalRef: null,
          rectifiedInvoice: { externalRef: null, rectifiedInvoice: { externalRef: 'VENTA-9' } },
        })
      ).toBe('VENTA-9');
      expect(resolveSaleExternalRef({ externalRef: null, rectifiedInvoice: null })).toBe('');
    });
  });

  describe('response', () => {
    it('a substituted invoice says which invoice replaces it', () => {
      const response = toIntegrationInvoiceResponse(
        row({ status: 'RECTIFIED', rectificativeInvoices: [{ id: 'substitute' }] }),
        'https://app'
      );
      expect(response.status).toBe('RECTIFIED');
      expect(response.rectifiedByInvoiceId).toBe('substitute');
    });

    it('an invoice that was not substituted has rectifiedByInvoiceId null', () => {
      expect(toIntegrationInvoiceResponse(row({}), 'https://app').rectifiedByInvoiceId).toBeNull();
    });

    it('the substitute points to the original and keeps its sale reference', () => {
      const response = toIntegrationInvoiceResponse(
        row({
          id: 'substitute',
          externalRef: null,
          isRectificative: true,
          rectifiedInvoiceId: 'original',
          rectifiedInvoice: {
            invoiceType: 'standard',
            externalRef: 'VENTA-1',
            rectifiedInvoice: null,
          },
        }),
        'https://app'
      );
      expect(response.externalRef).toBe('VENTA-1');
      expect(response.rectifiedInvoiceId).toBe('original');
      expect(response.recordType).toBe('R4');
    });
  });
});
