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

    if (user.tenantUsers.length === 0) {
      throw new UnauthorizedException('No tienes acceso a esta empresa');
    }

    const tenantUser = user.tenantUsers[0];
    if (!tenantUser) {
      throw new UnauthorizedException('No tienes acceso a esta empresa');
    }

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
}
