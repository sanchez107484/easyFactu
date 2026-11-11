import { generateKeyPairSync, randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IntegrationAccountStatus, Prisma, TenantUserRole } from '@prisma/client';
import { AuthTokensService } from '../../src/modules/auth/auth-tokens.service';
import {
  isAllowedSsoDestination,
  resolveSsoDestination,
} from '../../src/modules/auth/sso/sso-destinations';
import { SsoSessionService } from '../../src/modules/auth/sso/sso-session.service';
import { SsoTokenVerifierService } from '../../src/modules/auth/sso/sso-token-verifier.service';
import { SsoUserService } from '../../src/modules/auth/sso/sso-user.service';
import { SsoService } from '../../src/modules/auth/sso/sso.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const ISSUER = 'erp-opticas';
const AUDIENCE = 'novafactura';
const ERP_ACCOUNT_ID = 'erp-clinic-1';
const TENANT_ID = 'tenant-a';

function pemKeyPair() {
  return generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

const erpKeys = pemKeyPair();
const jwt = new JwtService({});

interface TokenOptions {
  claims?: Record<string, unknown>;
  lifetimeSeconds?: number;
  issuedSecondsAgo?: number;
  privateKey?: string;
}

function erpToken(options: TokenOptions = {}): string {
  const iat = Math.floor(Date.now() / 1000) - (options.issuedSecondsAgo ?? 0);
  return jwt.sign(
    {
      sub: 'erp-user-7',
      jti: randomUUID(),
      account_id: ERP_ACCOUNT_ID,
      email: 'ana@clinica.es',
      given_name: 'Ana',
      family_name: 'López',
      iss: ISSUER,
      aud: AUDIENCE,
      iat,
      exp: iat + (options.lifetimeSeconds ?? 60),
      ...options.claims,
    },
    {
      privateKey: options.privateKey ?? erpKeys.privateKey,
      algorithm: 'ES256',
    }
  );
}

interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isActive: boolean;
  passwordHash: string | null;
}
interface StoredMembership {
  tenantId: string;
  userId: string;
  role: TenantUserRole;
  isOwner: boolean;
}
interface StoredLink {
  id: string;
  integrationAccountId: string;
  erpUserId: string;
  userId: string;
}

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

function createStore() {
  const users: StoredUser[] = [
    {
      id: 'owner-1',
      email: 'ana@clinica.es',
      firstName: 'Ana',
      lastName: 'Owner',
      emailVerified: true,
      isActive: true,
      passwordHash: 'hash',
    },
  ];
  const memberships: StoredMembership[] = [
    { tenantId: TENANT_ID, userId: 'owner-1', role: TenantUserRole.OWNER, isOwner: true },
  ];
  const links: StoredLink[] = [];
  const usedJtis = new Set<string>();
  const account = { status: IntegrationAccountStatus.ACTIVE as IntegrationAccountStatus };
  const tenant = {
    id: TENANT_ID,
    businessName: 'Clínica A',
    nif: 'B12345678',
    setupCompleted: true,
    accountType: 'COMPANY',
    subscription: { managedBy: 'ERP', plan: { slug: 'PROFESSIONAL_FREE' } },
  };

  const prisma = {
    integrationAccount: {
      findUnique: jest.fn(async ({ where }: { where: { erpAccountId: string } }) =>
        where.erpAccountId === ERP_ACCOUNT_ID
          ? {
              id: 'account-a',
              tenantId: TENANT_ID,
              status: account.status,
              tenant: { isActive: true },
            }
          : null
      ),
    },
    ssoTokenUse: {
      create: jest.fn(async ({ data }: { data: { jti: string } }) => {
        if (usedJtis.has(data.jti)) throw uniqueViolation();
        usedJtis.add(data.jti);
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    erpSsoUser: {
      findUnique: jest.fn(
        async ({
          where,
        }: {
          where: {
            integrationAccountId_erpUserId: { integrationAccountId: string; erpUserId: string };
          };
        }) => {
          const key = where.integrationAccountId_erpUserId;
          const link = links.find(
            (l) =>
              l.integrationAccountId === key.integrationAccountId && l.erpUserId === key.erpUserId
          );
          return link ? { id: link.id, user: users.find((u) => u.id === link.userId) } : null;
        }
      ),
      update: jest.fn(async () => undefined),
      create: jest.fn(async ({ data }: { data: Omit<StoredLink, 'id'> }) => {
        links.push({ id: `link-${links.length + 1}`, ...data });
      }),
    },
    tenantUser: {
      findUnique: jest.fn(
        async ({ where }: { where: { tenantId_userId: { tenantId: string; userId: string } } }) =>
          memberships.find(
            (m) =>
              m.tenantId === where.tenantId_userId.tenantId &&
              m.userId === where.tenantId_userId.userId
          ) ?? null
      ),
      create: jest.fn(async ({ data }: { data: StoredMembership }) => {
        memberships.push(data);
      }),
    },
    user: {
      findUnique: jest.fn(
        async ({ where }: { where: { email: string } }) =>
          users.find((u) => u.email === where.email) ?? null
      ),
      create: jest.fn(async ({ data }: { data: Omit<StoredUser, 'id' | 'isActive'> }) => {
        if (users.some((u) => u.email === data.email)) throw uniqueViolation();
        const user = { id: `user-${users.length + 1}`, isActive: true, ...data };
        users.push(user);
        return user;
      }),
      update: jest.fn(async ({ where }: { where: { id: string } }) => {
        const user = users.find((u) => u.id === where.id)!;
        return {
          ...user,
          tenantUsers: memberships
            .filter((m) => m.userId === user.id)
            .map((m) => ({ ...m, tenant })),
        };
      }),
    },
  };
  const withTransaction = Object.assign(prisma, {
    $transaction: jest.fn(
      async (fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => fn(prisma)
    ),
  });
  return { prisma: withTransaction, users, memberships, links, account };
}

function configFor(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const SSO_CONFIG = {
  ERP_SSO_PUBLIC_KEY: erpKeys.publicKey.replace(/\n/g, '\\n'),
  ERP_SSO_ISSUER: ISSUER,
  ERP_SSO_AUDIENCE: AUDIENCE,
  JWT_ACCESS_SECRET: 'access-secret-access-secret-access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret-refresh-secret-refresh-secret',
};

function setup(config: Record<string, string | undefined> = SSO_CONFIG) {
  const store = createStore();
  const prisma = store.prisma as unknown as PrismaService;
  const configService = configFor(config);
  const service = new SsoService(
    prisma,
    new SsoTokenVerifierService(jwt, configService),
    new SsoUserService(prisma),
    new SsoSessionService(prisma, new AuthTokensService(jwt, configService))
  );
  return { service, ...store };
}

describe('SSO from the ERP (HU-21D)', () => {
  it('creates a new user as ADMIN (never OWNER) linked by ERP id and opens a session', async () => {
    const { service, users, memberships, links } = setup();

    const result = await service.exchange(
      erpToken({ claims: { email: 'nuevo@clinica.es', dest: '/dashboard/facturas' } })
    );

    const created = users.find((u) => u.email === 'nuevo@clinica.es');
    expect(created?.passwordHash).toBeNull();
    expect(memberships.find((m) => m.userId === created?.id)).toMatchObject({
      tenantId: TENANT_ID,
      role: TenantUserRole.ADMIN,
      isOwner: false,
    });
    expect(links).toEqual([
      expect.objectContaining({ erpUserId: 'erp-user-7', userId: created?.id }),
    ]);
    expect(result.redirectTo).toBe('/dashboard/facturas');
    expect(result.currentTenant.id).toBe(TENANT_ID);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it('never links by email: an existing email gets a separate user with a placeholder email', async () => {
    const { service, users, memberships } = setup();

    const result = await service.exchange(erpToken({ claims: { email: 'ana@clinica.es' } }));

    expect(result.user.id).not.toBe('owner-1');
    expect(result.user.email).toMatch(/@users\.invalid$/);
    expect(users.find((u) => u.id === 'owner-1')?.email).toBe('ana@clinica.es');
    expect(memberships.find((m) => m.userId === result.user.id)?.role).toBe(TenantUserRole.ADMIN);
  });

  it('finds the same user by ERP id on later logins, even if the email changed', async () => {
    const { service, users } = setup();
    const first = await service.exchange(erpToken({ claims: { email: 'a@clinica.es' } }));
    const second = await service.exchange(erpToken({ claims: { email: 'otro@clinica.es' } }));

    expect(second.user.id).toBe(first.user.id);
    expect(users).toHaveLength(2);
  });

  it('accepts a jti only once', async () => {
    const { service } = setup();
    const token = erpToken({ claims: { email: 'b@clinica.es' } });
    await service.exchange(token);

    await expect(service.exchange(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ['lives longer than 60 s', { lifetimeSeconds: 120 }],
    ['is expired', { issuedSecondsAgo: 90 }],
    ['is signed with another key', { privateKey: pemKeyPair().privateKey }],
    ['has no ERP user id', { claims: { sub: undefined } }],
    ['has no jti', { claims: { jti: undefined } }],
    ['has another audience', { claims: { aud: 'otra-app' } }],
  ])('rejects a token that %s', async (_case, options: TokenOptions) => {
    const { service, users } = setup();

    await expect(service.exchange(erpToken(options))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users).toHaveLength(1);
  });

  it('rejects HS256 tokens signed with the public key (algorithm confusion)', async () => {
    const { service } = setup();
    const forged = jwt.sign(
      { sub: 'x', jti: randomUUID(), account_id: ERP_ACCOUNT_ID, email: 'x@x.es', given_name: 'X' },
      {
        secret: erpKeys.publicKey,
        algorithm: 'HS256',
        issuer: ISSUER,
        audience: AUDIENCE,
        expiresIn: 30,
      }
    );

    await expect(service.exchange(forged)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects destinations outside the allow-list before burning the token', async () => {
    const { service, prisma } = setup();

    await expect(
      service.exchange(erpToken({ claims: { dest: '/dashboard/ajustes/usuarios' } }))
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.ssoTokenUse.create).not.toHaveBeenCalled();
  });

  it('does not bring back a user the clinic removed', async () => {
    const { service, memberships } = setup();
    const first = await service.exchange(erpToken({ claims: { email: 'c@clinica.es' } }));
    memberships.splice(
      memberships.findIndex((m) => m.userId === first.user.id),
      1
    );

    await expect(service.exchange(erpToken())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses clinics whose integration is not active', async () => {
    const { service, account } = setup();
    account.status = IntegrationAccountStatus.ENDED;

    await expect(service.exchange(erpToken())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses unknown clinics', async () => {
    const { service } = setup();

    await expect(
      service.exchange(erpToken({ claims: { account_id: 'otra-clinica' } }))
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('is disabled (503) when no public key is configured', async () => {
    const { service } = setup({ ...SSO_CONFIG, ERP_SSO_PUBLIC_KEY: '' });

    await expect(service.exchange(erpToken())).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

describe('SSO destinations', () => {
  it.each([
    '/dashboard',
    '/dashboard/facturas',
    '/dashboard/facturas/nueva',
    '/dashboard/facturas/0b7c2a8e-1f2d-4c3b-9a8e-7d6c5b4a3f21',
    '/dashboard/clientes',
    '/dashboard/informes',
    '/dashboard/ajustes/plantilla',
  ])('allows %s', (path) => {
    expect(isAllowedSsoDestination(path)).toBe(true);
  });

  it.each([
    '/dashboard/ajustes/usuarios',
    '/dashboard/ajustes/plan',
    '/dashboard/ajustes/seguridad',
    '/dashboard/asesoria',
    '/dashboard/facturas?x=1',
    '/dashboard/facturas/../ajustes/usuarios',
    'https://evil.example/dashboard',
    '//evil.example/dashboard',
    '/dashboard/',
  ])('rejects %s', (path) => {
    expect(isAllowedSsoDestination(path)).toBe(false);
  });

  it('defaults to the dashboard when the ERP sends no destination', () => {
    expect(resolveSsoDestination(undefined)).toBe('/dashboard');
  });
});
