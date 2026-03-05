import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { TenantUserRole } from '@easyfactura/shared-types';

// Higher number = more permissions. OWNER inherits all lower roles.
const ROLE_HIERARCHY: Record<string, number> = {
  [TenantUserRole.OWNER]: 4,
  [TenantUserRole.ADMIN]: 3,
  [TenantUserRole.ACCOUNTANT]: 2,
  [TenantUserRole.VIEWER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const hasRole = requiredRoles.some((r) => (ROLE_HIERARCHY[r] ?? 0) <= userLevel);

    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return true;
  }
}
