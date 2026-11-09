/**
 * Black-box contract suite of the integrations API v1. It must pass unchanged against the
 * NovaFactura and Nafactura sandboxes:
 *
 *   BASE_URL=https://<sandbox>/api/v1 API_KEY=nfk_test_… pnpm --filter @easyfactura/backend test:contract
 *
 * It issues real invoices in the sandbox (Hacienda test environment). Never point it at production.
 */
import { randomUUID } from 'crypto';
import { API_KEY, call, centsToMoney, chargedCents, RUN_ID } from './contract-client';

const REGISTRATION_STATUSES = ['PENDING', 'ACCEPTED', 'ACCEPTED_WITH_WARNINGS', 'REJECTED'];
const payer = { externalId: `PAG-${RUN_ID}`, name: 'Paciente Contrato', nif: '12345678Z' };
const contractExample = (externalRef: string) => ({
  externalRef,
  invoiceType: 'simplified',
  paymentMethod: 'CARD',
  customer: payer,
  lines: [
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
  ],
  regimeData: null,
});

function expectProblem(
  response: { status: number; headers: Headers; body: Record<string, unknown> },
  status: number,
  code: string
): void {
  expect(response.status).toBe(status);
  expect(response.headers.get('content-type')).toContain('application/problem+json');
  expect(response.body).toMatchObject({ status, code });
  expect(typeof response.body.retryable).toBe('boolean');
  expect(typeof response.body.requestId).toBe('string');
}

beforeAll(() => {
  if (API_KEY.startsWith('nfk_live_'))
    throw new Error('The contract suite only runs with sandbox keys (nfk_test_)');
});

describe('health and transport', () => {
  it('GET /health answers 200 {status:"ok"} without authentication', async () => {
    const response = await call('GET', '/health', { apiKey: null });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('echoes X-Request-Id, or generates one', async () => {
    const sent = await call('GET', '/health', { requestId: `contract-${RUN_ID}` });
    expect(sent.headers.get('x-request-id')).toBe(`contract-${RUN_ID}`);
    const generated = await call('GET', '/health');
    expect(generated.headers.get('x-request-id')).toBeTruthy();
  });

  it('sends RateLimit headers on key-authenticated calls', async () => {
    const response = await call('GET', `/invoices?externalRef=none-${RUN_ID}`);
    expect(response.headers.get('ratelimit-limit')).toBeTruthy();
    expect(response.headers.get('ratelimit-remaining')).toBeTruthy();
  });
});

describe('authentication and validation', () => {
  it('rejects an unknown key with 401 INVALID_API_KEY', async () => {
    expectProblem(
      await call('GET', `/invoices?externalRef=x`, { apiKey: 'nfk_test_doesnotexist' }),
      401,
      'INVALID_API_KEY'
    );
  });

  it('requires Idempotency-Key on POST', async () => {
    const response = await call('POST', '/invoices', {
      body: contractExample(`NOKEY-${RUN_ID}`),
      idempotencyKey: null,
    });
    expectProblem(response, 400, 'VALIDATION_ERROR');
  });

  it('reports field errors with paths such as lines[0].taxRate', async () => {
    const body = contractExample(`BAD-${RUN_ID}`);
    body.lines[0]!.taxRate = '7';
    const response = await call('POST', '/invoices', { body });
    expectProblem(response, 400, 'VALIDATION_ERROR');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'lines[0].taxRate' })])
    );
  });

  it('requires the payer address on a full invoice', async () => {
    const body = { ...contractExample(`STD-${RUN_ID}`), invoiceType: 'standard' };
    const response = await call('POST', '/invoices', { body });
    expectProblem(response, 400, 'VALIDATION_ERROR');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'customer.address' })])
    );
  });

  it('refuses a simplified invoice above the account limit with 422 FISCAL_RULE', async () => {
    const reset = await call('PATCH', '/settings', { body: { simplifiedInvoiceLimit: '400.00' } });
    expect(reset.status).toBe(200);
    const body = {
      ...contractExample(`LIMIT-${RUN_ID}`),
      lines: [{ description: 'Gafas', quantity: '1', unitPriceWithTax: '400.01', taxRate: '21' }],
    };
    expectProblem(await call('POST', '/invoices', { body }), 422, 'FISCAL_RULE');
  });

  it('answers 404 NOT_FOUND for an unknown invoice', async () => {
    expectProblem(await call('GET', `/invoices/${randomUUID()}`), 404, 'NOT_FOUND');
  });
});

describe('issue, idempotency and lookup', () => {
  const externalRef = `VENTA-${RUN_ID}`;
  const idempotencyKey = `idem-${RUN_ID}`;
  let invoiceId = '';

  it('issues the contract example: 201 with totals to the cent', async () => {
    const response = await call('POST', '/invoices', {
      body: contractExample(externalRef),
      idempotencyKey,
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      externalRef,
      invoiceType: 'simplified',
      totals: { base: '409.00', tax: '50.69', total: '459.69' },
      taxBreakdown: [
        { rate: '21', base: '89.00', tax: '18.69' },
        { rate: '10', base: '320.00', tax: '32.00' },
      ],
    });
    expect(REGISTRATION_STATUSES).toContain(response.body.registrationStatus);
    expect(response.body.number).toEqual(expect.any(String));
    invoiceId = String(response.body.id);
  });

  it('replays the same key and body with 200 and the same invoice', async () => {
    const replay = await call('POST', '/invoices', {
      body: contractExample(externalRef),
      idempotencyKey,
    });
    expect(replay.status).toBe(200);
    expect(replay.body.id).toBe(invoiceId);
  });

  it('rejects the same key with another body as 409 IDEMPOTENCY_CONFLICT', async () => {
    const body = { ...contractExample(externalRef), paymentMethod: 'CASH' };
    expectProblem(
      await call('POST', '/invoices', { body, idempotencyKey }),
      409,
      'IDEMPOTENCY_CONFLICT'
    );
  });

  it('rejects the same externalRef with another key as 409 DUPLICATE_EXTERNAL_REF', async () => {
    const response = await call('POST', '/invoices', { body: contractExample(externalRef) });
    expectProblem(response, 409, 'DUPLICATE_EXTERNAL_REF');
    expect(response.body.invoiceId).toBe(invoiceId);
  });

  it('returns the invoice by id and by externalRef', async () => {
    const byId = await call('GET', `/invoices/${invoiceId}`);
    expect(byId.status).toBe(200);
    expect(byId.body).toMatchObject({ id: invoiceId, externalRef });

    const byRef = await call<{ data: { id: string }[] }>(
      'GET',
      `/invoices?externalRef=${encodeURIComponent(externalRef)}`
    );
    expect(byRef.status).toBe(200);
    expect(byRef.body.data.map((invoice) => invoice.id)).toEqual([invoiceId]);
  });

  it('returns an empty list for an unknown externalRef', async () => {
    const response = await call('GET', `/invoices?externalRef=unknown-${RUN_ID}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  it('serves the PDF', async () => {
    const response = await call('GET', `/invoices/${invoiceId}/pdf`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    expect(Buffer.from(response.raw).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('registers the full payment', async () => {
    const response = await call('POST', `/invoices/${invoiceId}/payments`, {
      body: { amount: '459.69', paymentMethod: 'CARD', reference: `COBRO-${RUN_ID}` },
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      invoiceId,
      amount: '459.69',
      invoicePaymentStatus: 'PAID',
      invoiceAmountDue: '0.00',
    });
  });
});

describe('price with tax included: total equals the sum charged', () => {
  const CASES = [
    {
      taxRate: '21',
      lines: [
        ['1', '35.00'],
        ['3', '9.99', '15'],
        ['0.5', '107.69'],
        ['2.5', '1.00', '33.33'],
      ],
    },
    {
      taxRate: '10',
      lines: [
        ['1', '352.00'],
        ['1.25', '17.43', '10'],
        ['7', '0.99'],
        ['0.3333', '12.00', '50'],
      ],
    },
    {
      taxRate: '4',
      lines: [
        ['1', '9.99', '5'],
        ['2', '107.69'],
        ['3.125', '1.00', '12.5'],
        ['10.5', '0.99'],
      ],
    },
    {
      taxRate: '0',
      lines: [
        ['1', '45.00'],
        ['2', '19.99', '20'],
        ['0.75', '60.00'],
      ],
    },
  ];

  it.each(CASES)('$taxRate % with discounts and decimal quantities', async ({ taxRate, lines }) => {
    const body = {
      externalRef: `IVA${taxRate}-${RUN_ID}`,
      invoiceType: 'simplified',
      customer: payer,
      lines: lines.map(([quantity, unitPriceWithTax, discountPercent]) => ({
        description: `Producto ${taxRate}%`,
        quantity: quantity!,
        unitPriceWithTax: unitPriceWithTax!,
        taxRate,
        ...(discountPercent ? { discountPercent } : {}),
      })),
    };
    const expected = body.lines.reduce((sum, line) => sum + chargedCents(line), 0n);

    const response = await call<{ totals: { total: string } }>('POST', '/invoices', { body });

    expect(response.status).toBe(201);
    expect(response.body.totals.total).toBe(centsToMoney(expected));
  });
});

/** Madrid calendar date, `days` days ago (YYYY-MM-DD). */
function madridDate(days = 0): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(date);
}

type InvoiceBody = {
  id: string;
  recordType: string;
  status: string;
  hash: string | null;
  operationDate: string;
  totals: { total: string };
  rectifiedInvoiceId: string | null;
  exchangedByInvoiceId: string | null;
  replacedInvoiceIds: string[];
  cancellation: { registrationStatus: string } | null;
};

const ticketLine = {
  description: 'Líquido de lentillas',
  quantity: '1',
  unitPriceWithTax: '12.10',
  taxRate: '21',
};

async function issueTicket(suffix: string, extra: Record<string, unknown> = {}) {
  return call<InvoiceBody>('POST', '/invoices', {
    body: {
      externalRef: `T-${suffix}-${RUN_ID}`,
      invoiceType: 'simplified',
      lines: [ticketLine],
      ...extra,
    },
  });
}

/** The VeriFactu hash is generated right after confirmation, in the background. */
async function waitForHash(invoiceId: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await call<InvoiceBody>('GET', `/invoices/${invoiceId}`);
    if (response.body.hash) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Invoice ${invoiceId} was not hashed in time`);
}

describe('record types, payers without NIF and operation date (HU-21C)', () => {
  const identifiedPayer = {
    ...payer,
    address: { line1: 'C/ Mayor 1', postalCode: '31001', city: 'Pamplona', province: 'Navarra' },
  };

  it('reads and changes the simplified invoice limit (max 3000 €)', async () => {
    const updated = await call('PATCH', '/settings', { body: { simplifiedInvoiceLimit: '3000' } });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ simplifiedInvoiceLimit: '3000.00' });
    expectProblem(
      await call('PATCH', '/settings', { body: { simplifiedInvoiceLimit: '3000.01' } }),
      400,
      'VALIDATION_ERROR'
    );
    await call('PATCH', '/settings', { body: { simplifiedInvoiceLimit: '400.00' } });
    const read = await call('GET', '/settings');
    expect(read.body).toEqual({ simplifiedInvoiceLimit: '400.00' });
  });

  it('issues a simplified invoice without payer as F2', async () => {
    const response = await issueTicket('ANON');
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      recordType: 'F2',
      status: 'ISSUED',
      operationDate: madridDate(),
    });
  });

  it('issues a simplified invoice to a payer without NIF with an earlier operation date', async () => {
    const response = await issueTicket('NONIF', {
      operationDate: madridDate(2),
      customer: { externalId: `NONIF-${RUN_ID}`, name: 'Paciente sin NIF' },
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ recordType: 'F2', operationDate: madridDate(2) });
  });

  it('rejects a future operation date with 422 FISCAL_RULE', async () => {
    expectProblem(
      await issueTicket('FUTURE', { operationDate: madridDate(-2) }),
      422,
      'FISCAL_RULE'
    );
  });

  it('still requires the NIF on a complete invoice', async () => {
    const response = await call('POST', '/invoices', {
      body: {
        externalRef: `STDNONIF-${RUN_ID}`,
        invoiceType: 'standard',
        customer: { externalId: `X-${RUN_ID}`, name: 'Sin NIF', address: identifiedPayer.address },
        lines: [ticketLine],
      },
    });
    expectProblem(response, 400, 'VALIDATION_ERROR');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'customer.nif' })])
    );
  });

  it('registers a return of a simplified invoice as R5 and caps it at the original total', async () => {
    const ticket = await issueTicket('RET', { customer: payer });
    const refund = (ref: string, amount: string) =>
      call<InvoiceBody>('POST', `/invoices/${ticket.body.id}/rectifications`, {
        body: {
          externalRef: `${ref}-${RUN_ID}`,
          reason: 'Devolución en tienda',
          lines: [{ ...ticketLine, unitPriceWithTax: amount }],
        },
      });

    const partial = await refund('DEV1', '5.00');
    expect(partial.status).toBe(201);
    expect(partial.body).toMatchObject({
      recordType: 'R5',
      rectifiedInvoiceId: ticket.body.id,
      totals: { total: '-5.00' },
    });
    expectProblem(await refund('DEV2', '7.11'), 422, 'FISCAL_RULE');
  });

  it('exchanges simplified invoices for a complete invoice (F3)', async () => {
    const first = await issueTicket('EX1', { customer: payer });
    const second = await issueTicket('EX2', { customer: payer });
    const exchange = await call<InvoiceBody>('POST', '/invoices/exchanges', {
      body: {
        externalRef: `CANJE-${RUN_ID}`,
        invoiceIds: [first.body.id, second.body.id],
        customer: identifiedPayer,
      },
    });
    expect(exchange.status).toBe(201);
    expect(exchange.body).toMatchObject({
      recordType: 'F3',
      totals: { total: '24.20' },
      replacedInvoiceIds: expect.arrayContaining([first.body.id, second.body.id]),
    });

    const replaced = await call<InvoiceBody>('GET', `/invoices/${first.body.id}`);
    expect(replaced.body.exchangedByInvoiceId).toBe(exchange.body.id);
    expectProblem(
      await call('POST', '/invoices/exchanges', {
        body: {
          externalRef: `CANJE2-${RUN_ID}`,
          invoiceIds: [first.body.id],
          customer: identifiedPayer,
        },
      }),
      409,
      'INVALID_STATE'
    );
  });

  it('annuls an invoice issued by mistake with a cancellation record', async () => {
    const ticket = await issueTicket('ANUL');
    await waitForHash(ticket.body.id);
    const body = { reason: 'Ticket duplicado por error' };

    const cancelled = await call<InvoiceBody>('POST', `/invoices/${ticket.body.id}/cancellation`, {
      body,
    });
    expect(cancelled.status).toBe(201);
    expect(cancelled.body.status).toBe('CANCELLED');
    expect(REGISTRATION_STATUSES).toContain(cancelled.body.cancellation?.registrationStatus);

    expectProblem(
      await call('POST', `/invoices/${ticket.body.id}/cancellation`, { body }),
      409,
      'INVALID_STATE'
    );
  });

  it('lists the invoices of a payer, newest first and paginated', async () => {
    const response = await call<{ data: InvoiceBody[]; meta: { total: number; limit: number } }>(
      'GET',
      `/customers/${encodeURIComponent(payer.externalId)}/invoices?limit=5`
    );
    expect(response.status).toBe(200);
    expect(response.body.meta.limit).toBe(5);
    expect(response.body.meta.total).toBeGreaterThan(0);
    expect(response.body.data.length).toBeLessThanOrEqual(5);

    expectProblem(await call('GET', `/customers/unknown-${RUN_ID}/invoices`), 404, 'NOT_FOUND');
  });
});
