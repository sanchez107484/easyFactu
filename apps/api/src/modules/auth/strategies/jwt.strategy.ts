import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenantUsers: {
          where: { tenantId: payload.tenantId },
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    // Primary path: direct TenantUser membership
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
      };
    }

    // Secondary path: agency user acting as a managed client tenant
    // The JWT has tenantId = clientTenantId, but the user only has a TenantUser
    // record on their own agency tenant. Access is granted via AgencyClientRelation.
    const agencyRelation = await this.prisma.agencyClientRelation.findFirst({
      where: {
        clientTenantId: payload.tenantId,
        agencyTenant: {
          isActive: true,
          tenantUsers: { some: { userId: payload.sub } },
        },
      },
      include: { clientTenant: true },
    });

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
      role: 'ADMIN' as const,
      isOwner: false,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
