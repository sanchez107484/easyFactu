import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtValidationCacheService } from './jwt-validation-cache.service';
import { InvoiceSeriesModule } from '../invoice-series/invoice-series.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // Configuration is done in strategies
    InvoiceSeriesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtValidationCacheService],
  exports: [AuthService, JwtValidationCacheService],
})
export class AuthModule {}
