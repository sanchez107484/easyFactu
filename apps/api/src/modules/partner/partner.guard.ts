import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IncomingMessage } from 'http';

@Injectable()
export class PartnerGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const key = request.headers['x-partner-key'];
    const secret = this.config.get<string>('PARTNER_SECRET');

    if (!secret) {
      throw new UnauthorizedException('Partner access not configured');
    }

    if (!key || key !== secret) {
      throw new UnauthorizedException('Invalid partner key');
    }

    return true;
  }
}
