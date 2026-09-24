import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRED_PLAN_KEY } from '../decorators/require-plan.decorator';
import { Plan } from '@easyfactura/shared-types';

const PLAN_HIERARCHY: Record<Plan, number> = {
  [Plan.FREE]: 1,
  [Plan.BASIC]: 2,
  [Plan.PROFESSIONAL]: 3,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<Plan>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar la empresa activa');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Empresa no encontrada');
    }

    const currentLevel = PLAN_HIERARCHY[tenant.plan as Plan] ?? 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 0;

    if (currentLevel < requiredLevel) {
      throw new ForbiddenException(
        'Esta función requiere un plan PRO. Actualiza tu suscripción para continuar.'
      );
    }

    return true;
  }
}
