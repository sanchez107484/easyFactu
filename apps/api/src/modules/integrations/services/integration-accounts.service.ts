import { Injectable } from '@nestjs/common';
import { IntegrationAccountStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationAccountResponse, IssuedApiKeyResponse } from '../dto/integration-responses.dto';
import { ProvisionAccountDto } from '../dto/provision-account.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { OperationResult } from '../idempotency/idempotency.service';
import { API_KEY_ROTATION_OVERLAP_MS } from '../integrations.constants';
import { AccountProvisioningService } from './account-provisioning.service';
import { ApiKeyService, IssuedApiKey } from './api-key.service';
import { normalizeNif } from './integration-customers.service';
import { IntegrationConsentService, PendingAccount } from './integration-consent.service';
import { IntegrationUrlsService } from './integration-urls.service';

const ACCOUNT_SELECT = { id: true, tenantId: true, erpAccountId: true, status: true } as const;
const KEY_ISSUABLE_STATUSES: IntegrationAccountStatus[] = [
  IntegrationAccountStatus.ACTIVE,
  IntegrationAccountStatus.GRACE,
];

function accountNotFound(): IntegrationException {
  return new IntegrationException(
    IntegrationErrorCode.NOT_FOUND,
    'Cuenta no encontrada para ese erpAccountId'
  );
}

/** Account endpoints for the ERP (protected by the provisioning secret). */
@Injectable()
export class IntegrationAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: AccountProvisioningService,
    private readonly consent: IntegrationConsentService,
    private readonly apiKeys: ApiKeyService,
    private readonly urls: IntegrationUrlsService
  ) {}

  /**
   * New NIF → ACTIVE account with an API key. Known NIF → PENDING_CONSENT, no key until the
   * owner accepts. Known erpAccountId → its current state (200), never a second account.
   */
  async provision(dto: ProvisionAccountDto): Promise<OperationResult> {
    const existing = await this.prisma.integrationAccount.findUnique({
      where: { erpAccountId: dto.erpAccountId },
      select: ACCOUNT_SELECT,
    });
    if (existing) return { status: 200, body: this.toResponse(existing) };

    const nif = normalizeNif(dto.nif);
    const tenant = await this.prisma.tenant.findUnique({
      where: { nif },
      select: { id: true, businessName: true, integrationAccount: { select: { id: true } } },
    });
    if (tenant?.integrationAccount) {
      throw new IntegrationException(
        IntegrationErrorCode.ACCOUNT_CONFLICT,
        'Esta clínica ya está vinculada a otra empresa del ERP (otro erpAccountId)'
      );
    }
    if (tenant)
      return {
        status: 201,
        body: this.toResponse(await this.consent.requestConsent(tenant, dto.erpAccountId)),
      };

    const created = await this.provisioning.createAccount(dto, nif);
    const account = {
      id: created.accountId,
      tenantId: created.tenantId,
      erpAccountId: dto.erpAccountId,
      status: IntegrationAccountStatus.ACTIVE,
    };
    return { status: 201, body: this.toResponse(account, created.key) };
  }

  async getAccount(erpAccountId: string): Promise<IntegrationAccountResponse> {
    return this.toResponse(await this.findAccount(erpAccountId));
  }

  /** New key; the previous ones keep working for 24 h (rotation without downtime). */
  async issueKey(erpAccountId: string): Promise<IssuedApiKeyResponse> {
    const account = await this.findAccount(erpAccountId);
    if (!KEY_ISSUABLE_STATUSES.includes(account.status)) {
      throw new IntegrationException(
        IntegrationErrorCode.ACCOUNT_NOT_ACTIVE,
        `La cuenta está en estado ${account.status}: solo se emiten keys con la cuenta ACTIVE o GRACE`
      );
    }
    const key = await this.prisma.$transaction((tx) =>
      this.apiKeys.issue(tx, account.tenantId, account.id)
    );
    return {
      keyId: key.keyId,
      apiKey: key.apiKey,
      createdAt: key.createdAt.toISOString(),
      previousKeysExpireAt: new Date(
        key.createdAt.getTime() + API_KEY_ROTATION_OVERLAP_MS
      ).toISOString(),
    };
  }

  async revokeKey(erpAccountId: string, keyId: string): Promise<void> {
    const account = await this.findAccount(erpAccountId);
    await this.apiKeys.revoke(account.tenantId, account.id, keyId);
  }

  private async findAccount(erpAccountId: string): Promise<PendingAccount> {
    const account = await this.prisma.integrationAccount.findUnique({
      where: { erpAccountId },
      select: ACCOUNT_SELECT,
    });
    if (!account) throw accountNotFound();
    return account;
  }

  private toResponse(account: PendingAccount, key?: IssuedApiKey): IntegrationAccountResponse {
    return {
      accountId: account.id,
      erpAccountId: account.erpAccountId,
      tenantId: account.tenantId,
      status: account.status,
      apiKey: key?.apiKey ?? null,
      keyId: key?.keyId ?? null,
      apiUrl: this.urls.apiUrl,
      appUrl: this.urls.appUrl,
    };
  }
}
