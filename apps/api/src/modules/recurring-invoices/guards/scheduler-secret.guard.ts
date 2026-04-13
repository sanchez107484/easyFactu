import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * BUG-06 fix: Protects POST /recurring-invoices/trigger-scheduler so that only
 * callers who know the SCHEDULER_SECRET can trigger invoice generation.
 *
 * The secret must be passed in the X-Scheduler-Secret request header.
 * This prevents any authenticated user (or even unauthenticated requests that
 * bypass the JwtAuthGuard) from firing the scheduler arbitrarily.
 */
@Injectable()
export class SchedulerSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = (request.headers as Record<string, string>)['x-scheduler-secret'];
    const expected = this.configService.get<string>('SCHEDULER_SECRET');

    if (!expected || expected === 'change-me-in-production') {
      // Fail open in dev — fail closed in production
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new UnauthorizedException('SCHEDULER_SECRET no configurado en producción');
      }
      return true;
    }

    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Acceso denegado al endpoint del scheduler');
    }

    return true;
  }
}
