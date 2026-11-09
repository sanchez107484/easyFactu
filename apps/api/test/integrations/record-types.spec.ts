import { InvoiceCalculationService } from '../../src/modules/invoices/invoice-calculation.service';
import { InvoiceService } from '../../src/modules/invoices/invoice.service';
import { IntegrationInvoiceResponse } from '../../src/modules/integrations/dto/integration-responses.dto';
import {
  ExchangeSimplifiedInvoicesDto,
  RectifyIssuedInvoiceDto,
} from '../../src/modules/integrations/dto/invoice-records.dto';
import { IssueInvoiceDto } from '../../src/modules/integrations/dto/issue-invoice.dto';
import { IntegrationErrorCode } from '../../src/modules/integrations/errors/integration-error-code';
import {
  ANONYMOUS_PAYER_EXTERNAL_ID,
  IntegrationCustomersService,
} from '../../src/modules/integrations/services/integration-customers.service';
import { IntegrationExchangesService } from '../../src/modules/integrations/services/integration-exchanges.service';
import { todayInSpain } from '../../src/modules/integrations/services/integration-invoice-rules';
import { IntegrationInvoicesService } from '../../src/modules/integrations/services/integration-invoices.service';
import { IntegrationRectificationsService } from '../../src/modules/integrations/services/integration-rectifications.service';
import { IntegrationSettingsService } from '../../src/modules/integrations/services/integration-settings.service';
import { IntegrationUrlsService } from '../../src/modules/integrations/services/integration-urls.service';
import { PriceWithTaxConverter } from '../../src/modules/integrations/services/price-with-tax.converter';
import { PrismaService } from '../../src/prisma/prisma.service';

const TENANT = 'tenant-a';
const ORIGINAL_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const TICKET_1 = '1b4e28ba-2fa1-41d2-883f-0016d3cca427';
const TICKET_2 = '6fa459ea-ee8a-4ca4-894e-db77e160355e';

const ISSUED: IntegrationInvoiceResponse = {
  id: 'issued-id',
  externalRef: 'REF',
  number: 'T-2026-000001',
  invoiceType: 'simplified',
  recordType: 'F2',
  status: 'ISSUED',
  issueDate: '2026-11-09',
  operationDate: '2026-11-09',
  rectifiedInvoiceId: null,
  exchangedByInvoiceId: null,
  replacedInvoiceIds: [],
  cancellation: null,
  totals: { base: '82.64', tax: '17.36', total: '100.00' },
  taxBreakdown: [{ rate: '21', base: '82.64', tax: '17.36' }],
  hash: 'H',
  qrUrl: null,
  registrationStatus: 'PENDING',
  registrationError: null,
  paymentStatus: 'UNPAID',
  amountPaid: '0.00',
  appUrl: 'https://app.test',
};

function daysAgo(days: number): string {
  const date = new Date(`${todayInSpain()}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function setup(options: { simplifiedLimit?: number } = {}) {
  const calculation = new InvoiceCalculationService();
  const prisma = {
    tenant: {
      findUniqueOrThrow: jest.fn(async () => ({
        taxRegime: 'GENERAL',
        simplifiedInvoiceLimit: options.simplifiedLimit ?? 400,
      })),
      update: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(async () => null),
      findMany: jest.fn(async () => []),
      aggregate: jest.fn(async () => ({ _sum: { total: null } })),
      updateMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => ({
        count: where.id.in.length,
      })),
    },
  } as unknown as PrismaService;
  const invoiceService = {
    create: jest.fn(async (_t: string, _u: null, dto: { lines: unknown[] }) => ({
      id: 'draft-id',
      total: calculation.calculateTotals(dto.lines as never).total,
    })),
    rectify: jest.fn(async (_t: string, _id: string, dto: { lines: unknown[] }) => ({
      id: 'draft-id',
      total: calculation.calculateTotals(dto.lines as never).total,
    })),
    confirm: jest.fn(),
    remove: jest.fn(),
  } as unknown as InvoiceService;
  const customers = {
    upsertPayer: jest.fn(async () => ({ id: 'payer-id' })),
  } as unknown as IntegrationCustomersService;
  const urls = { invoiceAppUrl: () => 'https://app.test' } as unknown as IntegrationUrlsService;
  const converter = new PriceWithTaxConverter(calculation);
  const invoices = new IntegrationInvoicesService(
    prisma,
    invoiceService,
    customers,
    converter,
    urls
  );
  jest.spyOn(invoices, 'findOne').mockResolvedValue(ISSUED);
  return { prisma, invoiceService, customers, converter, invoices };
}

function ticket(overrides: Partial<IssueInvoiceDto> = {}): IssueInvoiceDto {
  return {
    externalRef: 'VENTA-1',
    invoiceType: 'simplified',
    lines: [{ description: 'Montura', quantity: '1', unitPriceWithTax: '100.00', taxRate: '21' }],
    ...overrides,
  };
}

describe('Integrations · issue rules (HU-21C)', () => {
  it('issues a simplified invoice without payer to "Consumidor final"', async () => {
    const { invoices, customers, invoiceService } = setup();
    await invoices.issue(TENANT, ticket());
    expect(customers.upsertPayer).toHaveBeenCalledWith(TENANT, undefined);
    expect(invoiceService.confirm).toHaveBeenCalledWith(TENANT, 'draft-id');
  });

  it('issues a simplified invoice to a payer without NIF', async () => {
    const { invoices, customers } = setup();
    const payer = { externalId: 'PAG-1', name: 'Carmen Ruiz' };
    await invoices.issue(TENANT, ticket({ customer: payer }));
    expect(customers.upsertPayer).toHaveBeenCalledWith(TENANT, payer);
  });

  it.each([
    ['without payer', undefined, 'customer'],
    ['without NIF', { externalId: 'PAG-1', name: 'Seguros' }, 'customer.nif'],
    [
      'without address',
      { externalId: 'PAG-1', name: 'Seguros', nif: 'A58818501' },
      'customer.address',
    ],
  ])('rejects a complete invoice %s', async (_label, customer, field) => {
    const { invoices, invoiceService } = setup();
    await expect(
      invoices.issue(TENANT, ticket({ invoiceType: 'standard', customer }))
    ).rejects.toMatchObject({
      code: IntegrationErrorCode.VALIDATION_ERROR,
      problem: { errors: [{ field }] },
    });
    expect(invoiceService.create).not.toHaveBeenCalled();
  });

  it('applies the simplified invoice limit of the tenant', async () => {
    const line = {
      description: 'Progresivas',
      quantity: '1',
      unitPriceWithTax: '450.00',
      taxRate: '10',
    };
    const strict = setup({ simplifiedLimit: 400 });
    await expect(strict.invoices.issue(TENANT, ticket({ lines: [line] }))).rejects.toMatchObject({
      code: IntegrationErrorCode.FISCAL_RULE,
    });
    expect(strict.invoiceService.create).not.toHaveBeenCalled();

    const retail = setup({ simplifiedLimit: 3000 });
    await retail.invoices.issue(TENANT, ticket({ lines: [line] }));
    expect(retail.invoiceService.confirm).toHaveBeenCalled();
  });

  it('stores an operation date earlier than the issue date', async () => {
    const { invoices, invoiceService } = setup();
    const operationDate = daysAgo(3);
    await invoices.issue(TENANT, ticket({ operationDate }));
    const [, , createDto, options] = (invoiceService.create as jest.Mock).mock.calls[0];
    expect(createDto.issueDate).toBe(todayInSpain());
    expect(options).toEqual({ externalRef: 'VENTA-1', operationDate });
  });

  it('does not store an operation date equal to the issue date', async () => {
    const { invoices, invoiceService } = setup();
    await invoices.issue(TENANT, ticket({ operationDate: todayInSpain() }));
    const [, , , options] = (invoiceService.create as jest.Mock).mock.calls[0];
    expect(options.operationDate).toBeUndefined();
  });

  it.each([
    ['in the future', daysAgo(-1), IntegrationErrorCode.FISCAL_RULE],
    ['that does not exist', '2026-02-30', IntegrationErrorCode.VALIDATION_ERROR],
  ])('rejects an operation date %s', async (_label, operationDate, code) => {
    const { invoices } = setup();
    await expect(invoices.issue(TENANT, ticket({ operationDate }))).rejects.toMatchObject({ code });
  });
});

describe('Integrations · returns (rectificatives by differences)', () => {
  function refund(overrides: Partial<RectifyIssuedInvoiceDto> = {}): RectifyIssuedInvoiceDto {
    return {
      externalRef: 'DEV-1',
      reason: 'Devolución de la montura',
      lines: [{ description: 'Montura', quantity: '1', unitPriceWithTax: '50.00', taxRate: '21' }],
      ...overrides,
    };
  }

  function setupReturns() {
    const context = setup();
    const service = new IntegrationRectificationsService(
      context.prisma,
      context.invoiceService,
      context.invoices,
      context.converter
    );
    return { ...context, service };
  }

  it('issues negative lines and confirms only if the total is minus the refund', async () => {
    const { service, invoiceService } = setupReturns();
    await service.rectify(TENANT, ORIGINAL_ID, refund());

    const [, originalId, rectifyDto, options] = (invoiceService.rectify as jest.Mock).mock.calls[0];
    expect(originalId).toBe(ORIGINAL_ID);
    expect(rectifyDto.rectificationType).toBe('DIFFERENCES');
    expect(rectifyDto.lines.every((line: { quantity: number }) => line.quantity < 0)).toBe(true);
    expect(options).toMatchObject({ externalRef: 'DEV-1', issueDate: todayInSpain() });
    expect(invoiceService.confirm).toHaveBeenCalledWith(TENANT, 'draft-id');
  });

  it('rejects returns beyond what is left to refund', async () => {
    const { service, prisma, invoiceService } = setupReturns();
    (prisma.invoice.aggregate as jest.Mock).mockResolvedValue({ _sum: { total: -60 } });
    await expect(service.rectify(TENANT, ORIGINAL_ID, refund())).rejects.toMatchObject({
      code: IntegrationErrorCode.FISCAL_RULE,
    });
    expect(invoiceService.rectify).not.toHaveBeenCalled();
  });

  it('rejects a VAT rate the original invoice does not have', async () => {
    const { service } = setupReturns();
    const lines = [
      { description: 'Lentes', quantity: '1', unitPriceWithTax: '10.00', taxRate: '10' },
    ];
    await expect(service.rectify(TENANT, ORIGINAL_ID, refund({ lines }))).rejects.toMatchObject({
      code: IntegrationErrorCode.FISCAL_RULE,
      problem: { errors: [{ field: 'lines[0].taxRate' }] },
    });
  });

  it('does not rectify a rectificative', async () => {
    const { service, invoices } = setupReturns();
    (invoices.findOne as jest.Mock).mockResolvedValue({ ...ISSUED, rectifiedInvoiceId: 'x' });
    await expect(service.rectify(TENANT, ORIGINAL_ID, refund())).rejects.toMatchObject({
      code: IntegrationErrorCode.INVALID_STATE,
    });
  });
});

describe('Integrations · exchange of simplified invoices (F3)', () => {
  const payer = {
    externalId: 'PAG-1',
    name: 'Laura Gómez',
    nif: '12345678Z',
    address: { line1: 'C/ Mayor 1', postalCode: '31001', city: 'Pamplona' },
  };

  function simplifiedRow(id: string, overrides: Record<string, unknown> = {}) {
    return {
      id,
      number: `T-${id.slice(0, 4)}`,
      status: 'CONFIRMED',
      invoiceType: 'simplified',
      isRectificative: false,
      issueDate: new Date(`${daysAgo(2)}T00:00:00Z`),
      operationDate: null,
      total: 12.1,
      exchangedByInvoiceId: null,
      rectificativeInvoices: [],
      lines: [
        {
          description: 'Líquido',
          quantity: 1,
          unitPrice: 10,
          taxRate: 21,
          discountPercent: null,
          hideQty: false,
        },
      ],
      ...overrides,
    };
  }

  function setupExchange(rows: ReturnType<typeof simplifiedRow>[]) {
    const context = setup();
    (context.prisma.invoice.findMany as jest.Mock).mockResolvedValue(rows);
    const service = new IntegrationExchangesService(
      context.prisma,
      context.invoiceService,
      context.invoices,
      context.customers
    );
    return { ...context, service };
  }

  function exchangeDto(invoiceIds: string[]): ExchangeSimplifiedInvoicesDto {
    return { externalRef: 'CANJE-1', invoiceIds, customer: payer };
  }

  it('copies the lines, links the tickets before confirming and keeps their date', async () => {
    const { service, invoiceService, prisma } = setupExchange([
      simplifiedRow(TICKET_1),
      simplifiedRow(TICKET_2),
    ]);
    await service.exchange(TENANT, exchangeDto([TICKET_1, TICKET_2]));

    const [, , createDto, options] = (invoiceService.create as jest.Mock).mock.calls[0];
    expect(createDto.invoiceType).toBe('standard');
    expect(createDto.lines).toHaveLength(2);
    expect(options).toEqual({ externalRef: 'CANJE-1', operationDate: daysAgo(2) });
    const linkOrder = (prisma.invoice.updateMany as jest.Mock).mock.invocationCallOrder[0];
    const confirmOrder = (invoiceService.confirm as jest.Mock).mock.invocationCallOrder[0];
    expect(linkOrder).toBeLessThan(confirmOrder ?? 0);
  });

  it('requires an identified recipient', async () => {
    const { service } = setupExchange([simplifiedRow(TICKET_1)]);
    const dto = { ...exchangeDto([TICKET_1]), customer: { externalId: 'PAG-1', name: 'Laura' } };
    await expect(service.exchange(TENANT, dto)).rejects.toMatchObject({
      code: IntegrationErrorCode.VALIDATION_ERROR,
    });
  });

  it.each([
    ['a complete invoice', { invoiceType: 'standard' }, IntegrationErrorCode.FISCAL_RULE],
    ['an exchanged ticket', { exchangedByInvoiceId: 'other' }, IntegrationErrorCode.INVALID_STATE],
    ['a cancelled ticket', { status: 'CANCELLED' }, IntegrationErrorCode.INVALID_STATE],
    [
      'a ticket with returns',
      { rectificativeInvoices: [{ id: 'r' }] },
      IntegrationErrorCode.INVALID_STATE,
    ],
  ])('rejects %s', async (_label, overrides, code) => {
    const { service, invoiceService } = setupExchange([simplifiedRow(TICKET_1, overrides)]);
    await expect(service.exchange(TENANT, exchangeDto([TICKET_1]))).rejects.toMatchObject({ code });
    expect(invoiceService.create).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when a ticket is missing or belongs to another tenant', async () => {
    const { service } = setupExchange([simplifiedRow(TICKET_1)]);
    await expect(service.exchange(TENANT, exchangeDto([TICKET_1, TICKET_2]))).rejects.toMatchObject(
      {
        code: IntegrationErrorCode.NOT_FOUND,
      }
    );
  });

  it('discards the draft when another exchange took a ticket in the meantime', async () => {
    const { service, prisma, invoiceService } = setupExchange([simplifiedRow(TICKET_1)]);
    (prisma.invoice.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    await expect(service.exchange(TENANT, exchangeDto([TICKET_1]))).rejects.toMatchObject({
      code: IntegrationErrorCode.INVALID_STATE,
    });
    expect(invoiceService.remove).toHaveBeenCalledWith(TENANT, 'draft-id');
    expect(invoiceService.confirm).not.toHaveBeenCalled();
  });
});

describe('Integrations · settings', () => {
  it.each(['0', '3000.01'])('rejects a simplified limit of %s €', async (value) => {
    const { prisma } = setup();
    const settings = new IntegrationSettingsService(prisma);
    await expect(settings.update(TENANT, { simplifiedInvoiceLimit: value })).rejects.toMatchObject({
      code: IntegrationErrorCode.VALIDATION_ERROR,
    });
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });

  it('accepts up to 3000 €', async () => {
    const { prisma } = setup();
    const settings = new IntegrationSettingsService(prisma);
    await expect(settings.update(TENANT, { simplifiedInvoiceLimit: '3000' })).resolves.toEqual({
      simplifiedInvoiceLimit: '3000.00',
    });
  });
});

describe('Integrations · payers without NIF', () => {
  function customersSetup(existing: Record<string, unknown> | null) {
    const prisma = {
      customer: {
        findFirst: jest.fn(async () => existing),
        create: jest.fn(async () => ({ id: 'new-id' })),
        update: jest.fn(),
      },
    } as unknown as PrismaService;
    return { prisma, service: new IntegrationCustomersService(prisma) };
  }

  it('creates "Consumidor final" once, without NIF', async () => {
    const { prisma, service } = customersSetup(null);
    await service.upsertPayer(TENANT, undefined);
    const [[created]] = (prisma.customer.create as jest.Mock).mock.calls;
    expect(created.data).toMatchObject({
      tenantId: TENANT,
      externalId: ANONYMOUS_PAYER_EXTERNAL_ID,
      name: 'Consumidor final',
      nif: null,
      type: 'INDIVIDUAL',
    });
  });

  it('reuses "Consumidor final" without touching it', async () => {
    const { prisma, service } = customersSetup({
      id: 'anon',
      nif: null,
      externalId: ANONYMOUS_PAYER_EXTERNAL_ID,
    });
    await expect(service.upsertPayer(TENANT, undefined)).resolves.toEqual({ id: 'anon' });
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });

  it('keeps the known NIF when a ticket arrives without it', async () => {
    const { prisma, service } = customersSetup({
      id: 'payer',
      nif: '12345678Z',
      externalId: 'PAG-1',
      hasEquivalenceSurcharge: false,
    });
    await service.upsertPayer(TENANT, { externalId: 'PAG-1', name: 'Laura' });
    const [[update]] = (prisma.customer.update as jest.Mock).mock.calls;
    expect(update.data.nif).toBe('12345678Z');
  });

  it('does not look payers up by NIF when none is sent', async () => {
    const { prisma, service } = customersSetup(null);
    await service.upsertPayer(TENANT, { externalId: 'PAG-9', name: 'Carmen' });
    expect(prisma.customer.findFirst).toHaveBeenCalledTimes(1);
  });
});
