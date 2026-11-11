import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ImpersonationClaims {
  actingAsClient: true;
  agencyTenantId: string;
  impersonationLogId: string;
}

/** Signs the access/refresh pair of a NovaFactura session. No DB I/O (safe inside transactions). */
@Injectable()
export class AuthTokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async generate(
    userId: string,
    email: string,
    tenantId: string,
    impersonation?: ImpersonationClaims
  ): Promise<SessionTokens> {
    const payload = {
      sub: userId,
      email,
      tenantId,
      ...(impersonation
        ? {
            actingAsClient: true,
            agencyTenantId: impersonation.agencyTenantId,
            impersonationLogId: impersonation.impersonationLogId,
          }
        : {}),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
