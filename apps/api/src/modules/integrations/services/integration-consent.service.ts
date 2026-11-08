import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IntegrationAccountStatus, Prisma, SubscriptionManager } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CONSENT_TOKEN_TTL_MS, ERP_INCLUDED_PLAN_SLUG } from '../integrations.constants';
import { IntegrationEmailsService } from './integration-emails.service';
import { IntegrationUrlsService } from './integration-urls.service';

const CONSENT_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export interface PendingAccount {
  id: string;
  tenantId: string;
  erpAccountId: string;
  status: IntegrationAccountStatus;
}

interface ConsentRequest {
  accountId: string;
  tenantId: string;
  businessName: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function invalidLink(): BadRequestException {
  return new BadRequestException('El enlace de autorización no es válido o ha caducado');
}

/**
 * When the ERP provisions a NIF that already has a NovaFactura account, nothing changes
 * until its OWNER accepts by email: then the plan becomes PRO managed by the ERP and the
 * ERP can request an API key. Paying plans are never activated without this acceptance.
 */
@Injectable()
export class IntegrationConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: IntegrationEmailsService,
    private readonly urls: IntegrationUrlsService
  ) {}

  async requestConsent(
    tenant: { id: string; businessName: string },
    erpAccountId: string
  ): Promise<PendingAccount> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CONSENT_TOKEN_TTL_MS);
    const account = await this.prisma.integrationAccount.create({
      data: {
        tenantId: tenant.id,
        erpAccountId,
        status: IntegrationAccountStatus.PENDING_CONSENT,
        consentTokenHash: hashToken(token),
        consentExpiresAt: expiresAt,
      },
      select: { id: true, tenantId: true, erpAccountId: true, status: true },
    });
    const ownerEmail = await this.findOwnerEmail(tenant.id);
    if (ownerEmail) {
      await this.emails.sendConsentRequest({
        to: ownerEmail,
        businessName: tenant.businessName,
        consentUrl: this.urls.consentUrl(token),
        expiresAt,
      });
    }
    return account;
  }

  /** What the consent page shows before the owner accepts. */
  async describe(
    token: string,
    userId: string
  ): Promise<{ businessName: string; expiresAt: Date }> {
    const request = await this.findValidRequest(token);
    await this.assertOwner(request.tenantId, userId);
    return { businessName: request.businessName, expiresAt: request.expiresAt };
  }

  async accept(token: string, userId: string): Promise<{ status: IntegrationAccountStatus }> {
    const request = await this.findValidRequest(token);
    await this.assertOwner(request.tenantId, userId);
    await this.prisma.$transaction((tx) => this.activate(tx, request, userId));
    return { status: IntegrationAccountStatus.ACTIVE };
  }

  private async activate(
    tx: Prisma.TransactionClient,
    request: ConsentRequest,
    userId: string
  ): Promise<void> {
    const includedPlan = await tx.plan.findUniqueOrThrow({
      where: { slug: ERP_INCLUDED_PLAN_SLUG },
      select: { id: true },
    });
    const previous = await tx.subscription.findUniqueOrThrow({
      where: { tenantId: request.tenantId },
      select: { planId: true },
    });
    await tx.subscription.update({
      where: { tenantId: request.tenantId },
      data: {
        planId: includedPlan.id,
        billingCycle: 'FREE',
        status: 'ACTIVE',
        managedBy: SubscriptionManager.ERP,
      },
    });
    await tx.planChangeLog.create({
      data: {
        tenantId: request.tenantId,
        fromPlanId: previous.planId,
        toPlanId: includedPlan.id,
        changedBy: userId,
        reason: 'Plan PRO incluido con el ERP (aceptado por el titular)',
      },
    });
    await tx.integrationAccount.update({
      where: { id: request.accountId },
      data: {
        status: IntegrationAccountStatus.ACTIVE,
        consentTokenHash: null,
        consentAcceptedAt: new Date(),
      },
    });
  }

  private async findValidRequest(token: string): Promise<ConsentRequest & { expiresAt: Date }> {
    if (!CONSENT_TOKEN_PATTERN.test(token)) throw invalidLink();
    const account = await this.prisma.integrationAccount.findUnique({
      where: { consentTokenHash: hashToken(token) },
      select: {
        id: true,
        tenantId: true,
        status: true,
        consentExpiresAt: true,
        tenant: { select: { businessName: true } },
      },
    });
    const isPending = account?.status === IntegrationAccountStatus.PENDING_CONSENT;
    if (
      !account ||
      !isPending ||
      !account.consentExpiresAt ||
      account.consentExpiresAt <= new Date()
    ) {
      throw invalidLink();
    }
    return {
      accountId: account.id,
      tenantId: account.tenantId,
      businessName: account.tenant.businessName,
      expiresAt: account.consentExpiresAt,
    };
  }

  private async assertOwner(tenantId: string, userId: string): Promise<void> {
    const owner = await this.prisma.tenantUser.findFirst({
      where: { tenantId, userId, isOwner: true },
      select: { id: true },
    });
    if (!owner)
      throw new ForbiddenException(
        'Solo el titular de la cuenta puede autorizar la conexión con el ERP'
      );
  }

  private async findOwnerEmail(tenantId: string): Promise<string | null> {
    const owner = await this.prisma.tenantUser.findFirst({
      where: { tenantId, isOwner: true },
      select: { user: { select: { email: true } } },
    });
    return owner?.user.email ?? null;
  }
}
