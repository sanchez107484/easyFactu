import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthTokensService, SessionTokens } from '../auth-tokens.service';
import { SsoUser } from './sso-user.service';

const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  emailVerified: true,
  tenantUsers: {
    select: {
      tenantId: true,
      role: true,
      isOwner: true,
      tenant: {
        select: {
          id: true,
          businessName: true,
          nif: true,
          setupCompleted: true,
          accountType: true,
          subscription: { include: { plan: true } },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type SessionProfile = Prisma.UserGetPayload<{ select: typeof PROFILE_SELECT }>;

/** Opens a regular NovaFactura session (same response shape as login) for an SSO user. */
@Injectable()
export class SsoSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokens: AuthTokensService
  ) {}

  async open(user: SsoUser, tenantId: string) {
    const tokens = await this.authTokens.generate(user.id, user.email, tenantId);
    const profile = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date(),
        lastActiveTenantId: tenantId,
      },
      select: PROFILE_SELECT,
    });
    return toAuthResponse(profile, tenantId, tokens);
  }
}

function toAuthResponse(profile: SessionProfile, tenantId: string, tokens: SessionTokens) {
  const current = profile.tenantUsers.find((tu) => tu.tenantId === tenantId);
  if (!current) {
    throw new UnauthorizedException('No tienes acceso a esta empresa');
  }
  return {
    user: {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      emailVerified: profile.emailVerified,
      lastActiveTenantId: tenantId,
    },
    tenants: profile.tenantUsers.map((tu) => ({
      tenant: tu.tenant,
      role: tu.role,
      isOwner: tu.isOwner,
    })),
    currentTenant: current.tenant,
    ...tokens,
  };
}
