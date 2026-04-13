import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_SECRET = 'change-me-in-production';

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
  private readonly logger = new Logger(SchedulerSecretGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = (request.headers as Record<string, string>)['x-scheduler-secret'];
    const expected = this.configService.get<string>('SCHEDULER_SECRET');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Always reject if using default secret
    if (!expected || expected === DEFAULT_SECRET) {
      this.logger.warn(
        'SCHEDULER_SECRET is not configured or uses the default value. ' +
          'Set a strong secret in your environment variables.',
      );
      // Fail closed unconditionally — using the default secret is always insecure
      throw new UnauthorizedException(
        'SCHEDULER_SECRET debe configurarse con un valor seguro antes de usar este endpoint',
      );
    }

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Acceso denegado al endpoint del scheduler');
    }

    return true;
  }
}
