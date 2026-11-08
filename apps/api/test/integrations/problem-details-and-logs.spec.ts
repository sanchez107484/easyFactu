import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PlanRequiredException } from '../../src/common/errors/plan-required.exception';
import { redactSensitive } from '../../src/common/logging/redact-sensitive';
import { IntegrationErrorCode } from '../../src/modules/integrations/errors/integration-error-code';
import { IntegrationException } from '../../src/modules/integrations/errors/integration.exception';
import { ProblemDetailsFilter } from '../../src/modules/integrations/errors/problem-details.filter';
import { IssueInvoiceDto } from '../../src/modules/integrations/dto/issue-invoice.dto';
import { integrationValidationPipe } from '../../src/modules/integrations/pipes/integration-validation.pipe';

const NIF = '12345678Z';
const CIF = 'A58818501';
const API_KEY = 'nfk_live_Q2xpbmljYVNlY3JldEtleTEyMzQ1Njc4OTA';

interface CapturedResponse {
  status: number;
  headers: Record<string, string>;
  contentType: string;
  body: Record<string, unknown>;
}

function runFilter(
  exception: unknown,
  path = '/api/v1/integrations/v1/invoices'
): CapturedResponse {
  const captured: CapturedResponse = { status: 0, headers: {}, contentType: '', body: {} };
  const response = {
    setHeader: (name: string, value: string) => (captured.headers[name] = value),
    status(code: number) {
      captured.status = code;
      return this;
    },
    type(contentType: string) {
      captured.contentType = contentType;
      return this;
    },
    send: (payload: string) => (captured.body = JSON.parse(payload) as Record<string, unknown>),
  };
  const request = { method: 'POST', path, requestId: 'req_test-1' };
  const host = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ArgumentsHost;
  new ProblemDetailsFilter().catch(exception, host);
  return captured;
}

describe('ProblemDetailsFilter', () => {
  it('answers application/problem+json with stable code, retryable and requestId', () => {
    const result = runFilter(
      new IntegrationException(IntegrationErrorCode.FISCAL_RULE, 'Supera el límite')
    );
    expect(result.status).toBe(422);
    expect(result.contentType).toBe('application/problem+json');
    expect(result.body).toMatchObject({
      type: 'https://docs.novafactura.es/errors/fiscal-rule',
      status: 422,
      code: 'FISCAL_RULE',
      retryable: false,
      detail: 'Supera el límite',
      requestId: 'req_test-1',
    });
  });

  it.each([
    [new PlanRequiredException(), 402, 'PLAN_REQUIRED', false],
    [new NotFoundException('Factura no encontrada'), 404, 'NOT_FOUND', false],
    [
      new ConflictException('Solo se pueden registrar cobros en facturas confirmadas'),
      409,
      'INVALID_STATE',
      false,
    ],
    [
      new BadRequestException('El importe supera el pendiente de cobro'),
      400,
      'VALIDATION_ERROR',
      false,
    ],
    [new Error('unexpected'), 500, 'INTERNAL', true],
  ])('maps %p to %i %s', (exception, status, code, retryable) => {
    expect(runFilter(exception).body).toMatchObject({ status, code, retryable });
  });

  it('maps a duplicated externalRef race (P2002) to DUPLICATE_EXTERNAL_REF', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['tenant_id', 'external_ref'] },
    });
    expect(runFilter(error).body).toMatchObject({ status: 409, code: 'DUPLICATE_EXTERNAL_REF' });
  });

  it('sends Retry-After for retryable errors that carry it', () => {
    const result = runFilter(
      new IntegrationException(IntegrationErrorCode.REQUEST_IN_PROGRESS, 'En curso', {
        retryAfterSeconds: 2,
      })
    );
    expect(result.headers['Retry-After']).toBe('2');
    expect(result.body).toMatchObject({ status: 409, retryable: true });
  });

  it('never leaks internal error messages to the integrator', () => {
    const result = runFilter(new Error(`Prisma query failed with nif ${NIF} and key ${API_KEY}`));
    expect(JSON.stringify(result.body)).not.toContain(NIF);
    expect(JSON.stringify(result.body)).not.toContain(API_KEY);
  });
});

describe('Integrations logs', () => {
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  const loggedText = () => JSON.stringify([...warn.mock.calls, ...error.mock.calls]);

  it('never log a NIF, CIF or API key, even when an internal error message contains them', () => {
    runFilter(
      new Error(`Customer ${NIF} / ${CIF} failed with Bearer ${API_KEY}`),
      `/api/v1/integrations/v1/customers/${NIF}/invoices`
    );
    runFilter(new BadRequestException(`NIF ${NIF} no válido`));

    const text = loggedText();
    expect(text).toContain('requestId=req_test-1');
    expect(text).not.toContain(NIF);
    expect(text).not.toContain(CIF);
    expect(text).not.toContain(API_KEY);
  });

  it('redactSensitive masks keys, bearer tokens and tax ids but keeps the last 3 characters', () => {
    const redacted = redactSensitive(
      `nif=${NIF} cif=${CIF} nie=X1234567L key=${API_KEY} auth=Bearer eyJhbGciOi.abc.def`
    );
    expect(redacted).toBe('nif=***78Z cif=***501 nie=***67L key=nfk_live_*** auth=Bearer ***');
  });
});

describe('integrationValidationPipe', () => {
  it('returns VALIDATION_ERROR with field paths such as lines[0].taxRate', async () => {
    const body = {
      externalRef: 'VENTA-1',
      invoiceType: 'simplified',
      customer: { externalId: 'PAG-1', name: 'Laura', nif: '00000000A' },
      lines: [{ description: 'Gafas', quantity: '1', unitPriceWithTax: '35.00', taxRate: '7' }],
      tenantId: 'tenant-b',
    };

    const failure = await integrationValidationPipe
      .transform(body, { type: 'custom', metatype: IssueInvoiceDto })
      .catch((e: unknown) => e as IntegrationException);

    expect(failure).toBeInstanceOf(IntegrationException);
    const fields = (failure as IntegrationException).problem.errors?.map((e) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['lines[0].taxRate', 'customer.nif', 'tenantId'])
    );
  });
});
