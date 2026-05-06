import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtValidationCacheService, CachedJwtUser } from '../jwt-validation-cache.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  /** When true, the JWT was issued for an agency user acting as a managed client. */
  actingAsClient?: boolean;
  /** Tenant ID of the agency that initiated the impersonation. Only set when actingAsClient=true. */
  agencyTenantId?: string;
  /** ID of the impersonation log row — used to close it on logout/return. */
  impersonationLogId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cache: JwtValidationCacheService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<CachedJwtUser> {
    const actingAsClient = payload.actingAsClient === true;

    const cached = this.cache.get(payload.sub, payload.tenantId, actingAsClient);
    if (cached) return cached;

    const resolved = actingAsClient
      ? await this.resolveAsAgencyClient(payload)
      : await this.resolveAsDirectMember(payload);

    this.cache.set(resolved);
    return resolved;
  }

  private async resolveAsDirectMember(payload: JwtPayload): Promise<CachedJwtUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        tenantUsers: {
          where: { tenantId: payload.tenantId },
          select: {
            role: true,
            isOwner: true,
            tenant: { select: { isActive: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    if (user.tenantUsers.length > 0) {
      const tenantUser = user.tenantUsers[0]!;

      if (!tenantUser.tenant.isActive) {
        throw new UnauthorizedException('Empresa desactivada');
      }

      return {
        id: user.id,
        email: user.email,
        tenantId: payload.tenantId,
        role: tenantUser.role,
        isOwner: tenantUser.isOwner,
        firstName: user.firstName,
        lastName: user.lastName,
        actingAsClient: false,
        agencyTenantId: undefined,
        impersonationLogId: undefined,
      };
    }

    // The JWT claims direct membership but it no longer exists.
    throw new UnauthorizedException('No tienes acceso a esta empresa');
  }

  private async resolveAsAgencyClient(payload: JwtPayload): Promise<CachedJwtUser> {
    // Agency user acting as a managed client tenant. The JWT has
    // tenantId = clientTenantId; the user only has TenantUser on their agency.
    // Access is granted via AgencyClientRelation. Single round-trip resolves both
    // the user identity and the agency relation.
    const [user, agencyRelation] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      }),
      this.prisma.agencyClientRelation.findFirst({
        where: {
          clientTenantId: payload.tenantId,
          agencyTenant: {
            isActive: true,
            tenantUsers: { some: { userId: payload.sub } },
          },
        },
        select: {
          agencyTenantId: true,
          clientTenant: { select: { isActive: true } },
        },
      }),
    ]);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    if (!agencyRelation) {
      throw new UnauthorizedException('No tienes acceso a esta empresa');
    }

    if (!agencyRelation.clientTenant.isActive) {
      throw new UnauthorizedException('Empresa desactivada');
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: payload.tenantId,
      role: 'ADMIN',
      isOwner: false,
      firstName: user.firstName,
      lastName: user.lastName,
      actingAsClient: true,
      agencyTenantId: payload.agencyTenantId ?? agencyRelation.agencyTenantId,
      impersonationLogId: payload.impersonationLogId,
    };
  }
}
