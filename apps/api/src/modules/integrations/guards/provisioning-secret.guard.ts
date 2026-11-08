import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { INTEGRATIONS_ENV } from '../integrations.constants';
import { extractBearerToken } from './api-key.guard';

const MIN_SECRET_LENGTH = 32;

/** Compares digests so the comparison is constant time whatever the input length. */
function secretsMatch(received: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(received), digest(expected));
}

/**
 * Protects account provisioning (create, query, keys) with the ERP's global secret.
 * Fails closed when the secret is missing or too short.
 */
@Injectable()
export class ProvisioningSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>(INTEGRATIONS_ENV.PROVISION_SECRET);
    if (!expected || expected.length < MIN_SECRET_LENGTH) {
      throw new IntegrationException(
        IntegrationErrorCode.INVALID_PROVISION_SECRET,
        'El alta de cuentas no está configurada en este despliegue'
      );
    }
    const received = extractBearerToken(context.switchToHttp().getRequest<Request>());
    if (!received || !secretsMatch(received, expected)) {
      throw new IntegrationException(
        IntegrationErrorCode.INVALID_PROVISION_SECRET,
        'Secreto de alta no válido'
      );
    }
    return true;
  }
}
