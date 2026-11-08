import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationAccountStatus, Prisma } from '@prisma/client';
import { IntegrationErrorCode } from '../../src/modules/integrations/errors/integration-error-code';
import { IntegrationException } from '../../src/modules/integrations/errors/integration.exception';
import { ApiKeyRateLimitGuard } from '../../src/modules/integrations/guards/api-key-rate-limit.guard';
import { ApiKeyGuard } from '../../src/modules/integrations/guards/api-key.guard';
import { ApiKeyService, hashApiKey } from '../../src/modules/integrations/services/api-key.service';
import { PrismaService } from '../../src/prisma/prisma.service';

interface StoredKey {
  id: string;
  tenantId: string;
  integrationAccountId: string;
  keyHash: string;
  revokedAt: Date | null;
  expiresAt: Date | null;
  integrationAccount: { status: IntegrationAccountStatus };
}

function configFor(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function setup(environment: 'sandbox' | 'production' = 'sandbox') {
  const keys: StoredKey[] = [];
  const prisma = {
    apiKey: {
      findUnique: jest.fn(
        async ({ where }: { where: { keyHash: string } }) =>
          keys.find((k) => k.keyHash === where.keyHash) ?? null
      ),
      findFirst: jest.fn(
        async ({ where }: { where: Partial<StoredKey> }) =>
          keys.find(
            (k) =>
              k.id === where.id &&
              k.tenantId === where.tenantId &&
              k.integrationAccountId === where.integrationAccountId
          ) ?? null
      ),
      update: jest.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<StoredKey> }) =>
          Object.assign(keys.find((k) => k.id === where.id)!, data)
      ),
    },
  } as unknown as PrismaService;
  const service = new ApiKeyService(prisma, configFor({ VERIFACTU_ENVIRONMENT: environment }));
  const store = (apiKey: string, overrides: Partial<StoredKey> = {}) =>
    keys.push({
      id: `key-${keys.length + 1}`,
      tenantId: 'tenant-a',
      integrationAccountId: 'account-a',
      keyHash: hashApiKey(apiKey),
      revokedAt: null,
      expiresAt: null,
      integrationAccount: { status: IntegrationAccountStatus.ACTIVE },
      ...overrides,
    });
  return { service, store, keys, prisma };
}

async function expectInvalidKey(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(IntegrationException);
  await promise.catch((error: IntegrationException) =>
    expect(error.code).toBe(IntegrationErrorCode.INVALID_API_KEY)
  );
}

function contextWith(
  request: object,
  response: object = { setHeader: jest.fn() }
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyService', () => {
  it('authenticates a valid key and resolves the tenant from the key, never from the request', async () => {
    const { service, store } = setup();
    store('nfk_test_valid');
    await expect(service.authenticate('nfk_test_valid')).resolves.toEqual({
      tenantId: 'tenant-a',
      integrationAccountId: 'account-a',
      apiKeyId: 'key-1',
    });
  });

  it('rejects a revoked key immediately', async () => {
    const { service, store } = setup();
    store('nfk_test_revoked', { revokedAt: new Date() });
    await expectInvalidKey(service.authenticate('nfk_test_revoked'));
  });

  it('rejects a rotated key once its 24 h overlap has passed', async () => {
    const { service, store } = setup();
    store('nfk_test_old', { expiresAt: new Date(Date.now() - 1) });
    store('nfk_test_overlap', { expiresAt: new Date(Date.now() + 60_000) });
    await expectInvalidKey(service.authenticate('nfk_test_old'));
    await expect(service.authenticate('nfk_test_overlap')).resolves.toMatchObject({
      tenantId: 'tenant-a',
    });
  });

  it('rejects keys of accounts that are pending consent or ended', async () => {
    const { service, store } = setup();
    store('nfk_test_pending', {
      integrationAccount: { status: IntegrationAccountStatus.PENDING_CONSENT },
    });
    store('nfk_test_ended', { integrationAccount: { status: IntegrationAccountStatus.ENDED } });
    await expectInvalidKey(service.authenticate('nfk_test_pending'));
    await expectInvalidKey(service.authenticate('nfk_test_ended'));
  });

  it('rejects a test key in production and a live key in sandbox without querying', async () => {
    const production = setup('production');
    production.store('nfk_test_x');
    await expectInvalidKey(production.service.authenticate('nfk_test_x'));
    expect(production.prisma.apiKey.findUnique).not.toHaveBeenCalled();

    const sandbox = setup('sandbox');
    sandbox.store('nfk_live_x');
    await expectInvalidKey(sandbox.service.authenticate('nfk_live_x'));
  });

  it('issues a key with the deployment prefix, stores only its hash and opens a 24 h overlap for older keys', async () => {
    const { service } = setup('production');
    const tx = {
      apiKey: {
        updateMany: jest.fn(async () => ({ count: 1 })),
        create: jest.fn(async () => ({ id: 'key-new', createdAt: new Date() })),
      },
    };

    const issued = await service.issue(
      tx as unknown as Prisma.TransactionClient,
      'tenant-a',
      'account-a'
    );

    expect(issued.apiKey).toMatch(/^nfk_live_[A-Za-z0-9_-]{43}$/);
    const created = tx.apiKey.create.mock.calls[0] as unknown as [{ data: Record<string, string> }];
    expect(created[0].data.keyHash).toBe(hashApiKey(issued.apiKey));
    expect(JSON.stringify(created[0].data)).not.toContain(issued.apiKey);
    const rotation = tx.apiKey.updateMany.mock.calls[0] as unknown as [
      { where: Record<string, unknown>; data: { expiresAt: Date } },
    ];
    expect(rotation[0].where).toMatchObject({
      tenantId: 'tenant-a',
      integrationAccountId: 'account-a',
      revokedAt: null,
    });
    const overlapHours = (rotation[0].data.expiresAt.getTime() - Date.now()) / 3_600_000;
    expect(overlapHours).toBeGreaterThan(23.9);
    expect(overlapHours).toBeLessThanOrEqual(24);
  });

  it("cannot revoke another tenant's key", async () => {
    const { service, store } = setup();
    store('nfk_test_b', { tenantId: 'tenant-b', integrationAccountId: 'account-b' });
    await expect(service.revoke('tenant-a', 'account-a', 'key-1')).rejects.toMatchObject({
      code: IntegrationErrorCode.NOT_FOUND,
    });
  });
});

describe('ApiKeyGuard', () => {
  it('sets request.user from the key and ignores any tenant in the body', async () => {
    const { service, store } = setup();
    store('nfk_test_valid');
    const request = {
      header: () => 'Bearer nfk_test_valid',
      body: { tenantId: 'tenant-b' },
    } as unknown as { user?: unknown };

    await new ApiKeyGuard(service).canActivate(contextWith(request));

    expect(request.user).toMatchObject({ tenantId: 'tenant-a' });
  });

  it('rejects requests without a bearer key', async () => {
    const { service } = setup();
    await expectInvalidKey(
      new ApiKeyGuard(service).canActivate(contextWith({ header: () => undefined }))
    );
  });
});

describe('ApiKeyRateLimitGuard', () => {
  it('allows 60 requests per minute and key, then 429 RATE_LIMITED with Retry-After', () => {
    const guard = new ApiKeyRateLimitGuard(configFor({}));
    const response = { setHeader: jest.fn() };
    const request = { user: { apiKeyId: 'key-1' } };

    for (let i = 0; i < 60; i++)
      expect(guard.canActivate(contextWith(request, response))).toBe(true);

    expect(() => guard.canActivate(contextWith(request, response))).toThrow(IntegrationException);
    expect(response.setHeader).toHaveBeenCalledWith('RateLimit-Limit', '60');
    expect(response.setHeader).toHaveBeenCalledWith('RateLimit-Remaining', '0');
    try {
      guard.canActivate(contextWith(request, response));
    } catch (error) {
      expect((error as IntegrationException).code).toBe(IntegrationErrorCode.RATE_LIMITED);
      expect((error as IntegrationException).problem.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('counts each key separately', () => {
    const guard = new ApiKeyRateLimitGuard(configFor({ INTEGRATIONS_RATE_LIMIT_PER_MINUTE: '1' }));
    expect(guard.canActivate(contextWith({ user: { apiKeyId: 'key-1' } }))).toBe(true);
    expect(guard.canActivate(contextWith({ user: { apiKeyId: 'key-2' } }))).toBe(true);
    expect(() => guard.canActivate(contextWith({ user: { apiKeyId: 'key-1' } }))).toThrow(
      IntegrationException
    );
  });
});
