import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRED_PLAN_KEY } from '../decorators/require-plan.decorator';
import { PlanTier } from '@easyfactura/shared-types';

const TIER_HIERARCHY: Record<PlanTier, number> = {
  [PlanTier.BASIC]: 1,
  [PlanTier.PROFESSIONAL]: 2,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<PlanTier>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa activa');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { select: { tier: true } } },
    });

    if (!subscription) {
      throw new ForbiddenException('Empresa no encontrada');
    }

    const currentTier = subscription.plan.tier;
    const currentLevel = TIER_HIERARCHY[currentTier] ?? 0;
    const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 0;

    if (currentLevel < requiredLevel) {
      throw new ForbiddenException(
        'Esta función requiere un plan PRO. Actualiza tu suscripción para continuar.'
      );
    }

    return true;
  }
}
