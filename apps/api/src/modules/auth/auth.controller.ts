import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SwitchTenantDto } from './dto/switch-tenant.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CachedJwtUser } from '../auth/jwt-validation-cache.service';
import { Public } from '../../common/decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario y empresa' })
  @ApiResponse({ status: 201, description: 'Usuario registrado correctamente' })
  @ApiResponse({ status: 409, description: 'Email o NIF ya existe' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  @ApiResponse({ status: 200, description: 'Token refrescado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(
    @CurrentUser()
    user: {
      id: string;
      tenantId: string;
      actingAsClient?: boolean;
      agencyTenantId?: string;
      impersonationLogId?: string;
    },
    @Body() _dto: RefreshTokenDto
  ) {
    return this.authService.refreshTokens(user.id, user.tenantId, {
      actingAsClient: user.actingAsClient,
      agencyTenantId: user.agencyTenantId,
      impersonationLogId: user.impersonationLogId,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  async logout(@CurrentUser() user: { id: string; impersonationLogId?: string }) {
    return this.authService.logout(user.id, user.impersonationLogId);
  }

  @Post('switch-tenant')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar de empresa activa' })
  @ApiResponse({ status: 200, description: 'Empresa cambiada correctamente' })
  @ApiResponse({ status: 401, description: 'No tienes acceso a esta empresa' })
  async switchTenant(
    @CurrentUser()
    user: { id: string; email: string; actingAsClient?: boolean; impersonationLogId?: string },
    @Body() dto: SwitchTenantDto,
    @Req() req: Request
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    const userAgent = req.headers['user-agent'] ?? null;
    return this.authService.switchTenant(user, dto, { ipAddress, userAgent });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Email enviado si el usuario existe' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiResponse({ status: 200, description: 'Email verificado' })
  @ApiResponse({ status: 404, description: 'Token inválido' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getMe(@CurrentUser() user: CachedJwtUser) {
    return this.authService.getMe(user.id, {
      actingAsClient: user.actingAsClient,
      impersonatedTenantId: user.actingAsClient ? user.tenantId : undefined,
    });
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  // ─── Account activation (agency-created accounts) ────────────────────────

  // 20 req/min per IP — generous enough for page refreshes, tight enough to deter enumeration
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Public()
  @Get('activate-account/:token')
  @ApiOperation({ summary: 'Validar token de activación de cuenta' })
  @ApiResponse({ status: 200, description: 'Token válido, devuelve info de la cuenta' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async validateActivationToken(@Param('token') token: string) {
    return this.authService.validateActivationToken(token);
  }

  // 5 req/min per IP — bcrypt is CPU-intensive; this also blocks brute-force attempts
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Public()
  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar cuenta creada por una asesoría' })
  @ApiResponse({ status: 200, description: 'Cuenta activada, devuelve tokens JWT' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async activateAccount(@Body() dto: ActivateAccountDto) {
    return this.authService.activateAccount(dto);
  }
}
