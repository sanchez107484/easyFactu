import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { ApiKeyService, IntegrationPrincipal } from '../services/api-key.service';

export interface RequestWithPrincipal extends Request {
  user?: IntegrationPrincipal;
}

export function extractBearerToken(request: Request): string | undefined {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim() || undefined;
}

/**
 * Authenticates the clinic by its API key and exposes it as `request.user`, so
 * @CurrentTenant() and PlanGuard work exactly as for a web session.
 * The tenant always comes from the key, never from the request body.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    const apiKey = extractBearerToken(request);
    if (!apiKey) {
      throw new IntegrationException(
        IntegrationErrorCode.INVALID_API_KEY,
        'Falta la cabecera Authorization: Bearer <API key>'
      );
    }
    request.user = await this.apiKeys.authenticate(apiKey);
    return true;
  }
}
