import { InvoicePdfService } from '../../src/modules/invoice-templates/pdf/invoice-pdf.service';
import { InvoiceService } from '../../src/modules/invoices/invoice.service';
import { IntegrationErrorCode } from '../../src/modules/integrations/errors/integration-error-code';
import { IntegrationCustomersService } from '../../src/modules/integrations/services/integration-customers.service';
import { IntegrationInvoiceActionsService } from '../../src/modules/integrations/services/integration-invoice-actions.service';
import { IntegrationInvoicesService } from '../../src/modules/integrations/services/integration-invoices.service';
import { IntegrationUrlsService } from '../../src/modules/integrations/services/integration-urls.service';
import { PriceWithTaxConverter } from '../../src/modules/integrations/services/price-with-tax.converter';
import { PaymentService } from '../../src/modules/payments/payment.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const INVOICE_B = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

type Row = Record<string, unknown>;

/** findFirst that honours plain equality filters (tenantId, id, externalRef…), like the database would. */
function scopedFindFirst(rows: Row[]) {
  return jest.fn(async ({ where }: { where: Row }) => {
    const plainFilters = Object.entries(where).filter(
      ([, value]) => typeof value !== 'object' || value === null
    );
    return rows.find((row) => plainFilters.every(([field, value]) => row[field] === value)) ?? null;
  });
}

function issuedInvoice(tenantId: string, id: string, externalRef: string): Row {
  return {
    id,
    tenantId,
    externalRef,
    number: 'T-2026-000001',
    invoiceType: 'simplified',
    issueDate: new Date('2026-11-08'),
    subtotal: 10,
    discountAmount: null,
    taxTotal: 2.1,
    total: 12.1,
    hash: 'HASH',
    verifactuQr: null,
    verifactuStatus: 'PENDING',
    paymentStatus: 'UNPAID',
    amountPaid: 0,
    status: 'CONFIRMED',
    lines: [{ taxRate: 21, subtotal: 10, taxAmount: 2.1 }],
  };
}

function setup() {
  const invoices = [issuedInvoice(TENANT_B, INVOICE_B, 'VENTA-B-1')];
  const customers: Row[] = [
    {
      id: 'customer-b',
      tenantId: TENANT_B,
      externalId: 'PAG-1',
      nif: '12345678Z',
      hasEquivalenceSurcharge: false,
    },
  ];
  const prisma = {
    invoice: { findFirst: scopedFindFirst(invoices) },
    customer: {
      findFirst: scopedFindFirst(customers),
      create: jest.fn(async ({ data }: { data: Row }) => ({ id: 'customer-new', ...data })),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const payments = { createPayment: jest.fn() } as unknown as PaymentService;
  const pdf = { generate: jest.fn() } as unknown as InvoicePdfService;
  const urls = {
    invoiceAppUrl: (id: string) => `https://app.test/dashboard/facturas/${id}`,
  } as unknown as IntegrationUrlsService;
  const customersService = new IntegrationCustomersService(prisma);
  const invoicesService = new IntegrationInvoicesService(
    prisma,
    {} as InvoiceService,
    customersService,
    {} as PriceWithTaxConverter,
    urls
  );
  const actions = new IntegrationInvoiceActionsService(invoicesService, payments, pdf);
  return { prisma, invoicesService, actions, customersService, payments, pdf };
}

describe('Integrations API · tenant isolation', () => {
  it("returns NOT_FOUND for another tenant's invoice", async () => {
    const { invoicesService } = setup();
    await expect(invoicesService.findOne(TENANT_A, INVOICE_B)).rejects.toMatchObject({
      code: IntegrationErrorCode.NOT_FOUND,
    });
    await expect(invoicesService.findOne(TENANT_B, INVOICE_B)).resolves.toMatchObject({
      id: INVOICE_B,
    });
  });

  it("does not find another tenant's invoice by externalRef", async () => {
    const { invoicesService } = setup();
    await expect(invoicesService.findByExternalRef(TENANT_A, 'VENTA-B-1')).resolves.toEqual({
      data: [],
    });
  });

  it("never registers a payment or renders a PDF for another tenant's invoice", async () => {
    const { actions, payments, pdf } = setup();
    const payment = { amount: '12.10', paymentMethod: 'CARD' } as never;

    await expect(actions.registerPayment(TENANT_A, INVOICE_B, payment)).rejects.toMatchObject({
      code: IntegrationErrorCode.NOT_FOUND,
    });
    await expect(actions.renderPdf(TENANT_A, INVOICE_B)).rejects.toMatchObject({
      code: IntegrationErrorCode.NOT_FOUND,
    });
    expect(payments.createPayment).not.toHaveBeenCalled();
    expect(pdf.generate).not.toHaveBeenCalled();
  });

  it('only exposes invoices issued through the API (with externalRef)', async () => {
    const { prisma, invoicesService } = setup();
    await invoicesService.findOne(TENANT_B, INVOICE_B);
    const [[query]] = (prisma.invoice.findFirst as jest.Mock).mock.calls as [[{ where: Row }]];
    expect(query.where).toMatchObject({ tenantId: TENANT_B, externalRef: { not: null } });
  });

  it("creates a new payer instead of reusing another tenant's customer with the same externalId and NIF", async () => {
    const { prisma, customersService } = setup();

    const payer = await customersService.upsertPayer(TENANT_A, {
      externalId: 'PAG-1',
      name: 'Laura',
      nif: '12345678Z',
    });

    expect(payer.id).toBe('customer-new');
    expect(prisma.customer.update).not.toHaveBeenCalled();
    for (const [query] of (prisma.customer.findFirst as jest.Mock).mock.calls as [
      { where: Row },
    ][]) {
      expect(query.where.tenantId).toBe(TENANT_A);
    }
    const [[created]] = (prisma.customer.create as jest.Mock).mock.calls as [[{ data: Row }]];
    expect(created.data).toMatchObject({ tenantId: TENANT_A, externalId: 'PAG-1' });
  });

  it('rejects malformed invoice ids as NOT_FOUND without querying', async () => {
    const { prisma, invoicesService } = setup();
    await expect(invoicesService.findOne(TENANT_A, "1' OR '1'='1")).rejects.toMatchObject({
      code: IntegrationErrorCode.NOT_FOUND,
    });
    expect(prisma.invoice.findFirst).not.toHaveBeenCalled();
  });
});
