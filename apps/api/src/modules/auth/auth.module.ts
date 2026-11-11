import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtValidationCacheService } from './jwt-validation-cache.service';
import { InvoiceSeriesModule } from '../invoice-series/invoice-series.module';
import { AuthTokensService } from './auth-tokens.service';
import { SsoController } from './sso/sso.controller';
import { SsoService } from './sso/sso.service';
import { SsoSessionService } from './sso/sso-session.service';
import { SsoTokenVerifierService } from './sso/sso-token-verifier.service';
import { SsoUserService } from './sso/sso-user.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // Configuration is done in strategies
    InvoiceSeriesModule,
  ],
  controllers: [AuthController, SsoController],
  providers: [
    AuthService,
    AuthTokensService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtValidationCacheService,
    SsoService,
    SsoTokenVerifierService,
    SsoUserService,
    SsoSessionService,
  ],
  exports: [AuthService, JwtValidationCacheService],
})
export class AuthModule {}
