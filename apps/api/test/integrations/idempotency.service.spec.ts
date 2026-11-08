import { IdempotencyRecord, IdempotencyStatus, Prisma } from '@prisma/client';
import { IntegrationErrorCode } from '../../src/modules/integrations/errors/integration-error-code';
import { IntegrationException } from '../../src/modules/integrations/errors/integration.exception';
import { IdempotencyService } from '../../src/modules/integrations/idempotency/idempotency.service';
import { requestFingerprint } from '../../src/modules/integrations/idempotency/request-fingerprint';
import { PrismaService } from '../../src/prisma/prisma.service';

type RecordInput = Omit<IdempotencyRecord, 'id' | 'createdAt' | 'responseStatus' | 'responseBody'> &
  Partial<Pick<IdempotencyRecord, 'responseStatus' | 'responseBody'>>;

/** In-memory idempotency_records with the (scope, idempotencyKey) unique constraint. */
function createFakePrisma() {
  const rows = new Map<string, IdempotencyRecord>();
  const keyOf = (scope: string, key: string) => `${scope}|${key}`;
  const matches = (row: IdempotencyRecord, where: Record<string, unknown>) =>
    Object.entries(where).every(([field, condition]) => {
      const value = row[field as keyof IdempotencyRecord];
      if (condition && typeof condition === 'object' && 'lte' in condition)
        return (value as Date) <= (condition.lte as Date);
      if (condition && typeof condition === 'object' && 'lt' in condition)
        return (value as Date) < (condition.lt as Date);
      return value === condition;
    });

  const idempotencyRecord = {
    create: jest.fn(async ({ data }: { data: RecordInput }) => {
      const id = keyOf(data.scope, data.idempotencyKey);
      if (rows.has(id)) {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        });
      }
      const row = {
        responseStatus: null,
        responseBody: null,
        ...data,
        id,
        createdAt: new Date(),
      } as IdempotencyRecord;
      rows.set(id, row);
      return row;
    }),
    findUnique: jest.fn(
      async ({
        where,
      }: {
        where: { scope_idempotencyKey: { scope: string; idempotencyKey: string } };
      }) =>
        rows.get(
          keyOf(where.scope_idempotencyKey.scope, where.scope_idempotencyKey.idempotencyKey)
        ) ?? null
    ),
    update: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { scope_idempotencyKey: { scope: string; idempotencyKey: string } };
        data: Partial<IdempotencyRecord>;
      }) => {
        const row = rows.get(
          keyOf(where.scope_idempotencyKey.scope, where.scope_idempotencyKey.idempotencyKey)
        )!;
        Object.assign(row, data);
        return row;
      }
    ),
    updateMany: jest.fn(
      async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Partial<IdempotencyRecord>;
      }) => {
        const matching = [...rows.values()].filter((row) => matches(row, where));
        matching.forEach((row) => Object.assign(row, data));
        return { count: matching.length };
      }
    ),
    deleteMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const matching = [...rows.values()].filter((row) => matches(row, where));
      matching.forEach((row) => rows.delete(row.id));
      return { count: matching.length };
    }),
  };
  return { prisma: { idempotencyRecord } as unknown as PrismaService, rows };
}

const context = (body: unknown, key = 'VENTA-1') => ({
  scope: 'account:acc-1',
  key,
  requestHash: requestFingerprint('POST', '/api/v1/integrations/v1/invoices', body),
});

async function expectCode(promise: Promise<unknown>, code: IntegrationErrorCode): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(IntegrationException);
  await promise.catch((error: IntegrationException) => expect(error.code).toBe(code));
}

describe('IdempotencyService', () => {
  it('runs once and replays the stored response for the same key and body', async () => {
    const { prisma } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    const operation = jest.fn(async () => ({ status: 201, body: { id: 'inv-1' } }));

    const first = await service.execute(context({ a: 1, b: 2 }), operation);
    const second = await service.execute(context({ b: 2, a: 1 }), operation);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ status: 201, body: { id: 'inv-1' }, replayed: false });
    expect(second).toEqual({ status: 201, body: { id: 'inv-1' }, replayed: true });
  });

  it('rejects the same key with a different body as IDEMPOTENCY_CONFLICT', async () => {
    const { prisma } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    await service.execute(context({ total: '10.00' }), async () => ({ status: 201, body: {} }));

    await expectCode(
      service.execute(context({ total: '99.00' }), async () => ({ status: 201, body: {} })),
      IntegrationErrorCode.IDEMPOTENCY_CONFLICT
    );
  });

  it('answers REQUEST_IN_PROGRESS while the first request is still running', async () => {
    const { prisma } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    let finish: () => void = () => undefined;
    const slow = service.execute(
      context({ a: 1 }),
      () => new Promise((resolve) => (finish = () => resolve({ status: 201, body: {} })))
    );
    await new Promise((resolve) => setImmediate(resolve));

    await expectCode(
      service.execute(context({ a: 1 }), async () => ({ status: 201, body: {} })),
      IntegrationErrorCode.REQUEST_IN_PROGRESS
    );
    finish();
    await slow;
  });

  it('releases the key when the operation fails so the integrator can retry', async () => {
    const { prisma } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    await expect(
      service.execute(context({ a: 1 }), async () => Promise.reject(new Error('boom')))
    ).rejects.toThrow('boom');

    const retry = await service.execute(context({ a: 1 }), async () => ({
      status: 201,
      body: { ok: true },
    }));
    expect(retry.replayed).toBe(false);
  });

  it('treats records older than 30 days as absent', async () => {
    const { prisma, rows } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    await service.execute(context({ a: 1 }), async () => ({ status: 201, body: { run: 1 } }));
    rows.forEach((row) => (row.expiresAt = new Date(Date.now() - 1000)));

    const again = await service.execute(context({ a: 2 }), async () => ({
      status: 201,
      body: { run: 2 },
    }));
    expect(again).toEqual({ status: 201, body: { run: 2 }, replayed: false });
  });

  it('stores records with a 30-day expiry', async () => {
    const { prisma, rows } = createFakePrisma();
    await new IdempotencyService(prisma).execute(context({}), async () => ({
      status: 201,
      body: {},
    }));
    const [row] = [...rows.values()];
    const days = (row!.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
  });

  it('never stores a plaintext API key for replay', async () => {
    const { prisma, rows } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    const first = await service.execute(context({}), async () => ({
      status: 201,
      body: { apiKey: 'nfk_test_secret', keyId: 'k1' },
    }));
    const replay = await service.execute(context({}), async () => ({ status: 201, body: {} }));

    expect(first.body).toEqual({ apiKey: 'nfk_test_secret', keyId: 'k1' });
    expect(replay.body).toEqual({ apiKey: null, keyId: 'k1' });
    expect(JSON.stringify([...rows.values()])).not.toContain('nfk_test_secret');
  });

  it('takes over a stale IN_PROGRESS lock left by a crashed request', async () => {
    const { prisma, rows } = createFakePrisma();
    const service = new IdempotencyService(prisma);
    await prisma.idempotencyRecord.create({
      data: {
        scope: 'account:acc-1',
        idempotencyKey: 'VENTA-1',
        requestHash: context({ a: 1 }).requestHash,
        status: IdempotencyStatus.IN_PROGRESS,
        lockedUntil: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const outcome = await service.execute(context({ a: 1 }), async () => ({
      status: 201,
      body: { recovered: true },
    }));
    expect(outcome.replayed).toBe(false);
    expect([...rows.values()][0]!.status).toBe(IdempotencyStatus.COMPLETED);
  });
});
