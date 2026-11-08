import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyEnvironment, IntegrationAccountStatus, Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import {
  API_KEY_PREFIX,
  API_KEY_ROTATION_OVERLAP_MS,
  API_KEY_VISIBLE_CHARS,
  INTEGRATIONS_ENV,
} from '../integrations.constants';

export interface IntegrationPrincipal {
  tenantId: string;
  integrationAccountId: string;
  apiKeyId: string;
}

export interface IssuedApiKey {
  keyId: string;
  apiKey: string;
  createdAt: Date;
}

const USABLE_ACCOUNT_STATUSES: IntegrationAccountStatus[] = [
  IntegrationAccountStatus.ACTIVE,
  IntegrationAccountStatus.GRACE,
];

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey, 'utf8').digest('hex');
}

function invalidKey(): IntegrationException {
  return new IntegrationException(
    IntegrationErrorCode.INVALID_API_KEY,
    'API key no válida, caducada o revocada'
  );
}

/**
 * Per-clinic API keys. The plaintext is returned once and only its SHA-256 is stored
 * (keys carry 256 bits of entropy, so a fast hash is enough for lookup).
 * The key prefix is tied to the deployment: production (VERIFACTU_ENVIRONMENT=production)
 * only issues and accepts nfk_live_, every other deployment only nfk_test_.
 */
@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  get environment(): ApiKeyEnvironment {
    const verifactuEnvironment = this.config.get<string>(INTEGRATIONS_ENV.VERIFACTU_ENVIRONMENT);
    return verifactuEnvironment === 'production' ? ApiKeyEnvironment.LIVE : ApiKeyEnvironment.TEST;
  }

  /**
   * Creates a key for the account. Keys that are still valid without a deadline get one
   * 24 h ahead, so the integrator can switch without downtime (rotation with overlap).
   */
  async issue(
    tx: Prisma.TransactionClient,
    tenantId: string,
    integrationAccountId: string
  ): Promise<IssuedApiKey> {
    const now = new Date();
    const overlapEndsAt = new Date(now.getTime() + API_KEY_ROTATION_OVERLAP_MS);
    await tx.apiKey.updateMany({
      where: {
        tenantId,
        integrationAccountId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: overlapEndsAt } }],
      },
      data: { expiresAt: overlapEndsAt },
    });

    const apiKey = `${API_KEY_PREFIX[this.environment]}${randomBytes(32).toString('base64url')}`;
    const created = await tx.apiKey.create({
      data: {
        tenantId,
        integrationAccountId,
        keyHash: hashApiKey(apiKey),
        keyPrefix: apiKey.slice(0, API_KEY_VISIBLE_CHARS),
        environment: this.environment,
      },
      select: { id: true, createdAt: true },
    });
    return { keyId: created.id, apiKey, createdAt: created.createdAt };
  }

  /** Revokes a key immediately. Revoking an already revoked key is a no-op. */
  async revoke(tenantId: string, integrationAccountId: string, keyId: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId, integrationAccountId },
      select: { id: true, revokedAt: true },
    });
    if (!key) {
      throw new IntegrationException(IntegrationErrorCode.NOT_FOUND, 'API key no encontrada');
    }
    if (key.revokedAt) return;
    await this.prisma.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
  }

  async authenticate(apiKey: string): Promise<IntegrationPrincipal> {
    if (!apiKey.startsWith(API_KEY_PREFIX[this.environment])) throw invalidKey();

    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(apiKey) },
      select: {
        id: true,
        tenantId: true,
        integrationAccountId: true,
        revokedAt: true,
        expiresAt: true,
        integrationAccount: { select: { status: true } },
      },
    });
    if (!key || !this.isUsable(key)) throw invalidKey();

    return {
      tenantId: key.tenantId,
      integrationAccountId: key.integrationAccountId,
      apiKeyId: key.id,
    };
  }

  private isUsable(key: {
    revokedAt: Date | null;
    expiresAt: Date | null;
    integrationAccount: { status: IntegrationAccountStatus };
  }): boolean {
    if (key.revokedAt) return false;
    if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) return false;
    return USABLE_ACCOUNT_STATUSES.includes(key.integrationAccount.status);
  }
}
