import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import {
  DEFAULT_RATE_LIMIT_PER_MINUTE,
  INTEGRATIONS_ENV,
  RATE_LIMIT_WINDOW_MS,
} from '../integrations.constants';
import { RequestWithPrincipal } from './api-key.guard';

interface Window {
  startedAt: number;
  count: number;
}

/**
 * Fixed one-minute window per API key (contract: 60 requests/minute and key), with
 * RateLimit-* headers on every response and Retry-After on 429.
 *
 * Counters live in memory: on serverless each instance counts on its own, so the limit
 * is enforced per instance. Enough to protect against a runaway client; a shared store
 * (Redis, pending in the platform) would make it exact.
 * Runs after ApiKeyGuard, which sets `request.user`.
 */
@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, Window>();
  private readonly limit: number;

  constructor(config: ConfigService) {
    const configured = Number(config.get<string>(INTEGRATIONS_ENV.RATE_LIMIT));
    this.limit =
      Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_RATE_LIMIT_PER_MINUTE;
  }

  canActivate(context: ExecutionContext): boolean {
    const keyId = context.switchToHttp().getRequest<RequestWithPrincipal>().user?.apiKeyId;
    if (!keyId) return true;

    const now = Date.now();
    const window = this.currentWindow(keyId, now);
    window.count += 1;
    const resetSeconds = Math.ceil((window.startedAt + RATE_LIMIT_WINDOW_MS - now) / 1000);
    this.setHeaders(context.switchToHttp().getResponse<Response>(), window, resetSeconds);

    if (window.count > this.limit) {
      throw new IntegrationException(
        IntegrationErrorCode.RATE_LIMITED,
        'Límite de peticiones por minuto superado',
        {
          retryAfterSeconds: resetSeconds,
        }
      );
    }
    return true;
  }

  private currentWindow(keyId: string, now: number): Window {
    const existing = this.windows.get(keyId);
    if (existing && now - existing.startedAt < RATE_LIMIT_WINDOW_MS) return existing;
    this.evictExpired(now);
    const fresh = { startedAt: now, count: 0 };
    this.windows.set(keyId, fresh);
    return fresh;
  }

  private evictExpired(now: number): void {
    for (const [keyId, window] of this.windows) {
      if (now - window.startedAt >= RATE_LIMIT_WINDOW_MS) this.windows.delete(keyId);
    }
  }

  private setHeaders(response: Response, window: Window, resetSeconds: number): void {
    response.setHeader('RateLimit-Limit', String(this.limit));
    response.setHeader('RateLimit-Remaining', String(Math.max(0, this.limit - window.count)));
    response.setHeader('RateLimit-Reset', String(resetSeconds));
  }
}
