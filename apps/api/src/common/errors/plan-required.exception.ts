import { ForbiddenException } from '@nestjs/common';

/**
 * Thrown by PlanGuard when the tenant's plan is below the required tier.
 *
 * It stays a 403 for the web app; the integrations API maps it to
 * 402 PLAN_REQUIRED in its Problem Details filter.
 */
export class PlanRequiredException extends ForbiddenException {
  constructor() {
    super('Esta función requiere un plan PRO. Actualiza tu suscripción para continuar.');
  }
}
