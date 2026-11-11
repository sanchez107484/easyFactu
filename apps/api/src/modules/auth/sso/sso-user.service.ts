import { ForbiddenException, Injectable } from '@nestjs/common';
import { IntegrationAccountStatus, Prisma, TenantUserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SsoClaims } from './sso-token-verifier.service';

export interface SsoAccount {
  integrationAccountId: string;
  tenantId: string;
}

export interface SsoUser {
  id: string;
  email: string;
}

const USABLE_ACCOUNT_STATUSES: IntegrationAccountStatus[] = [
  IntegrationAccountStatus.ACTIVE,
  IntegrationAccountStatus.GRACE,
];

/** Role of users created by SSO: a normal member, never OWNER. */
export const SSO_USER_ROLE = TenantUserRole.ADMIN;

const ACCESS_REVOKED_MESSAGE = 'Tu acceso a esta empresa en NovaFactura ha sido retirado';

/** Placeholder for when the ERP email already belongs to another NovaFactura user. */
function placeholderEmail(): string {
  return `erp-sso+${randomUUID()}@users.invalid`;
}

/**
 * Maps an ERP user to a NovaFactura user of the clinic. The ERP user id is the identity:
 * the token's email never finds or links an existing account (that would let the ERP take
 * over any account, the OWNER's included).
 */
@Injectable()
export class SsoUserService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAccount(erpAccountId: string): Promise<SsoAccount> {
    const account = await this.prisma.integrationAccount.findUnique({
      where: { erpAccountId },
      select: { id: true, tenantId: true, status: true, tenant: { select: { isActive: true } } },
    });
    if (!account || !USABLE_ACCOUNT_STATUSES.includes(account.status) || !account.tenant.isActive) {
      throw new ForbiddenException('Esta empresa no tiene activa la integración con el ERP');
    }
    return { integrationAccountId: account.id, tenantId: account.tenantId };
  }

  findOrCreateUser(account: SsoAccount, claims: SsoClaims): Promise<SsoUser> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findLinkedUser(tx, account, claims.erpUserId);
      return existing ?? this.createLinkedUser(tx, account, claims);
    });
  }

  private async findLinkedUser(
    tx: Prisma.TransactionClient,
    account: SsoAccount,
    erpUserId: string
  ): Promise<SsoUser | null> {
    const link = await tx.erpSsoUser.findUnique({
      where: {
        integrationAccountId_erpUserId: {
          integrationAccountId: account.integrationAccountId,
          erpUserId,
        },
      },
      select: { id: true, user: { select: { id: true, email: true, isActive: true } } },
    });
    if (!link) return null;
    await this.assertStillMember(tx, account.tenantId, link.user);
    await tx.erpSsoUser.update({ where: { id: link.id }, data: { lastLoginAt: new Date() } });
    return { id: link.user.id, email: link.user.email };
  }

  /** An OWNER may deactivate or remove the user: SSO never brings them back silently. */
  private async assertStillMember(
    tx: Prisma.TransactionClient,
    tenantId: string,
    user: { id: string; isActive: boolean }
  ): Promise<void> {
    const membership = await tx.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      select: { id: true },
    });
    if (!membership || !user.isActive) {
      throw new ForbiddenException(ACCESS_REVOKED_MESSAGE);
    }
  }

  private async createLinkedUser(
    tx: Prisma.TransactionClient,
    account: SsoAccount,
    claims: SsoClaims
  ): Promise<SsoUser> {
    const user = await tx.user.create({
      data: {
        email: await this.availableEmail(tx, claims.email),
        // No password: SSO users only enter from the ERP.
        passwordHash: null,
        firstName: claims.firstName,
        lastName: claims.lastName,
        emailVerified: false,
        lastActiveTenantId: account.tenantId,
      },
      select: { id: true, email: true },
    });
    await tx.tenantUser.create({
      data: { tenantId: account.tenantId, userId: user.id, role: SSO_USER_ROLE, isOwner: false },
    });
    await tx.erpSsoUser.create({
      data: {
        tenantId: account.tenantId,
        integrationAccountId: account.integrationAccountId,
        erpUserId: claims.erpUserId,
        userId: user.id,
        lastLoginAt: new Date(),
      },
    });
    return user;
  }

  private async availableEmail(tx: Prisma.TransactionClient, email: string): Promise<string> {
    const taken = await tx.user.findUnique({ where: { email }, select: { id: true } });
    return taken ? placeholderEmail() : email;
  }
}
