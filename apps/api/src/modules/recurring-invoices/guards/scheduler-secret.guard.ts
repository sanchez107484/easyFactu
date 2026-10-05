import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Protects POST /trigger-scheduler endpoints so that only Vercel Cron
 * (which sends the CRON_SECRET as Authorization: Bearer <token>)
 * can trigger invoice/expense generation.
 *
 * Vercel automatically sends CRON_SECRET as the Authorization header
 * when invoking cron jobs - no custom header configuration needed.
 *
 * The guard fails closed if CRON_SECRET is not configured.
 */
@Injectable()
export class SchedulerSecretGuard implements CanActivate {
  private readonly logger = new Logger(SchedulerSecretGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();

    const authHeader = request.headers['authorization'];
    const provided = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const expected = this.configService.get<string>('CRON_SECRET');

    if (!expected) {
      this.logger.warn(
        'CRON_SECRET is not configured. Set it in your Vercel environment variables.'
      );
      throw new UnauthorizedException('CRON_SECRET debe configurarse antes de usar este endpoint');
    }

    const bearerPrefix = 'Bearer ';
    if (!provided || !provided.startsWith(bearerPrefix)) {
      throw new UnauthorizedException('Acceso denegado al endpoint del scheduler');
    }

    const token = provided.substring(bearerPrefix.length);
    if (token !== expected) {
      throw new UnauthorizedException('Acceso denegado al endpoint del scheduler');
    }

    return true;
  }
}
