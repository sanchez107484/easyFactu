import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_AGENCY_GUARD_KEY } from '../decorators/skip-agency-guard.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard that ensures the current tenant has AccountType === AGENCY.
 * Apply at controller class level to protect all agency-scoped endpoints.
 *
 * Usage: @UseGuards(JwtAuthGuard, AgencyAccessGuard)
 */
@Injectable()
export class AgencyAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip this guard for routes marked @Public() — they bypass authentication entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Skip this guard for routes explicitly decorated with @SkipAgencyGuard()
    const skipAgencyGuard = this.reflector.getAllAndOverride<boolean>(SKIP_AGENCY_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipAgencyGuard) return true;
    const request = context.switchToHttp().getRequest<{ user?: { tenantId?: string } }>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No se pudo identificar el tenant activo');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { accountType: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    if (tenant.accountType !== 'AGENCY') {
      throw new ForbiddenException('Solo las asesorías pueden acceder a este recurso');
    }

    return true;
  }
}
