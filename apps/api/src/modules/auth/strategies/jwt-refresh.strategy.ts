import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtRefreshPayload {
  sub: string;
  email: string;
  tenantId: string;
  actingAsClient?: boolean;
  agencyTenantId?: string;
  impersonationLogId?: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken = (req.body as { refreshToken?: string }).refreshToken;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken || !user.isActive) {
      return null;
    }

    // Note: In production, compare hashed refresh token
    if (user.refreshToken !== refreshToken) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: payload.tenantId,
      actingAsClient: payload.actingAsClient ?? false,
      agencyTenantId: payload.agencyTenantId,
      impersonationLogId: payload.impersonationLogId,
    };
  }
}
