import { Injectable } from '@nestjs/common';
import {
  IntegrationAccountStatus,
  Prisma,
  SubscriptionManager,
  TenantUserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { InvoiceSeriesService } from '../../invoice-series/invoice-series.service';
import { createFreeSubscription } from '../../subscriptions/initial-subscription';
import { ProvisionAccountDto } from '../dto/provision-account.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { ACTIVATION_TOKEN_TTL_MS } from '../integrations.constants';
import { ApiKeyService, IssuedApiKey } from './api-key.service';
import { IntegrationEmailsService } from './integration-emails.service';
import { IntegrationUrlsService } from './integration-urls.service';

export interface ProvisionedAccount {
  accountId: string;
  tenantId: string;
  key: IssuedApiKey;
}

interface ActivationToken {
  token: string;
  expiresAt: Date;
}

/**
 * Creates a clinic from scratch for the ERP in one transaction: tenant, OWNER user
 * (activates by email), default series, PRO subscription managed by the ERP,
 * integration account and its first API key.
 */
@Injectable()
export class AccountProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly series: InvoiceSeriesService,
    private readonly apiKeys: ApiKeyService,
    private readonly emails: IntegrationEmailsService,
    private readonly urls: IntegrationUrlsService
  ) {}

  async createAccount(dto: ProvisionAccountDto, nif: string): Promise<ProvisionedAccount> {
    const ownerEmail = dto.owner.email.trim().toLowerCase();
    await this.assertOwnerEmailFree(ownerEmail);
    const activation: ActivationToken = {
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS),
    };

    const provisioned = await this.prisma.$transaction((tx) =>
      this.createInTransaction(tx, dto, nif, ownerEmail, activation)
    );

    await this.emails.sendAccountCreated({
      to: ownerEmail,
      businessName: dto.businessName,
      activationUrl: `${this.urls.appUrl}/activar-cuenta/${activation.token}`,
      expiresAt: activation.expiresAt,
    });
    return provisioned;
  }

  private async createInTransaction(
    tx: Prisma.TransactionClient,
    dto: ProvisionAccountDto,
    nif: string,
    ownerEmail: string,
    activation: ActivationToken
  ): Promise<ProvisionedAccount> {
    const tenant = await tx.tenant.create({
      data: this.tenantData(dto, nif),
      select: { id: true },
    });
    await this.createOwner(tx, tenant.id, dto, ownerEmail, activation);
    await this.series.createDefaultSeries(tenant.id, tx);
    await createFreeSubscription(tx, tenant.id, 'PROFESSIONAL_FREE', SubscriptionManager.ERP);
    const account = await tx.integrationAccount.create({
      data: {
        tenantId: tenant.id,
        erpAccountId: dto.erpAccountId,
        status: IntegrationAccountStatus.ACTIVE,
      },
      select: { id: true },
    });
    const key = await this.apiKeys.issue(tx, tenant.id, account.id);
    return { accountId: account.id, tenantId: tenant.id, key };
  }

  private tenantData(dto: ProvisionAccountDto, nif: string): Prisma.TenantCreateInput {
    return {
      businessName: dto.businessName.trim(),
      legalName: dto.legalName?.trim() || null,
      nif,
      email: dto.email.trim().toLowerCase(),
      address: dto.address.line1.trim(),
      postalCode: dto.address.postalCode,
      city: dto.address.city.trim(),
      province: dto.address.province?.trim() ?? '',
      // The ERP sends complete fiscal data, so the onboarding wizard is not needed.
      setupCompleted: true,
    };
  }

  private async createOwner(
    tx: Prisma.TransactionClient,
    tenantId: string,
    dto: ProvisionAccountDto,
    ownerEmail: string,
    activation: ActivationToken
  ): Promise<void> {
    const user = await tx.user.create({
      data: {
        email: ownerEmail,
        passwordHash: null,
        firstName: dto.owner.firstName.trim(),
        lastName: dto.owner.lastName.trim(),
        emailVerified: false,
        accountActivationToken: activation.token,
        accountActivationExpires: activation.expiresAt,
        lastActiveTenantId: tenantId,
      },
      select: { id: true },
    });
    await tx.tenantUser.create({
      data: { tenantId, userId: user.id, role: TenantUserRole.OWNER, isOwner: true },
    });
  }

  private async assertOwnerEmailFree(ownerEmail: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new IntegrationException(
        IntegrationErrorCode.ACCOUNT_CONFLICT,
        'El email del titular ya tiene una cuenta en NovaFactura con otro NIF. Usa otro email para esta clínica.',
        { errors: [{ field: 'owner.email', message: 'Email ya registrado' }] }
      );
    }
  }
}
