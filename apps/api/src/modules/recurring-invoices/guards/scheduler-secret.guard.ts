import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * BUG-06 fix: Protects POST /recurring-invoices/trigger-scheduler so that only
 * callers who know the SCHEDULER_SECRET can trigger invoice generation.
 *
 * The secret must be passed in the X-Scheduler-Secret request header.
 * This prevents any authenticated user (or even unauthenticated requests that
 * bypass the JwtAuthGuard) from firing the scheduler arbitrarily.
 *
 * The guard fails closed if SCHEDULER_SECRET is not configured or is empty —
 * see .env.example for the expected environment variable.
 */
@Injectable()
export class SchedulerSecretGuard implements CanActivate {
  private readonly logger = new Logger(SchedulerSecretGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const raw = request.headers['x-scheduler-secret'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    const expected = this.configService.get<string>('SCHEDULER_SECRET');

    if (!expected) {
      this.logger.warn('SCHEDULER_SECRET is not configured. Set it in your environment variables.');
      throw new UnauthorizedException(
        'SCHEDULER_SECRET debe configurarse antes de usar este endpoint'
      );
    }

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Acceso denegado al endpoint del scheduler');
    }

    return true;
  }
}
