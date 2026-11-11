import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { resolveSsoDestination } from './sso-destinations';
import { SsoSessionService } from './sso-session.service';
import { SsoClaims, SsoTokenVerifierService } from './sso-token-verifier.service';
import { SsoAccount, SsoUser, SsoUserService } from './sso-user.service';
import { SSO_JTI_RETENTION_MS } from './sso.constants';

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * SSO from the ERP (HU-21D): ES256 token of ≤ 60 s → single-use jti → clinic by
 * erpAccountId → user by ERP user id (created as ADMIN if new) → normal session.
 */
@Injectable()
export class SsoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verifier: SsoTokenVerifierService,
    private readonly users: SsoUserService,
    private readonly sessions: SsoSessionService
  ) {}

  async exchange(token: string) {
    const claims = await this.verifier.verify(token);
    // Fail on a forbidden page before burning the token or creating anything.
    const redirectTo = resolveSsoDestination(claims.destination);
    await this.consumeJti(claims);
    const account = await this.users.resolveAccount(claims.erpAccountId);
    const user = await this.findOrCreateUserOnce(account, claims);
    const session = await this.sessions.open(user, account.tenantId);
    await this.purgeExpiredJtis();
    return { ...session, redirectTo };
  }

  /** The primary key on jti makes the check-and-mark atomic, also across instances. */
  private async consumeJti(claims: SsoClaims): Promise<void> {
    try {
      await this.prisma.ssoTokenUse.create({
        data: { jti: claims.jti, expiresAt: claims.expiresAt },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UnauthorizedException('Este enlace de acceso ya se ha utilizado');
      }
      throw error;
    }
  }

  /** Two first logins of the same ERP user at once: the loser finds the winner's user. */
  private async findOrCreateUserOnce(account: SsoAccount, claims: SsoClaims): Promise<SsoUser> {
    try {
      return await this.users.findOrCreateUser(account, claims);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return this.users.findOrCreateUser(account, claims);
    }
  }

  private async purgeExpiredJtis(): Promise<void> {
    await this.prisma.ssoTokenUse.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - SSO_JTI_RETENTION_MS) } },
    });
  }
}
