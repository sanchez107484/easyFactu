import { HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { RequestWithPrincipal } from '../guards/api-key.guard';
import { IDEMPOTENCY_KEY_MAX_LENGTH } from '../integrations.constants';
import { IdempotencyContext, IdempotentOutcome } from './idempotency.service';
import { requestFingerprint } from './request-fingerprint';

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
export const PROVISIONING_SCOPE = 'provisioning';

function readIdempotencyKey(request: Request): string {
  const key = request.header(IDEMPOTENCY_KEY_HEADER)?.trim();
  if (!key || key.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new IntegrationException(
      IntegrationErrorCode.VALIDATION_ERROR,
      `La cabecera ${IDEMPOTENCY_KEY_HEADER} es obligatoria en todo POST (1 a ${IDEMPOTENCY_KEY_MAX_LENGTH} caracteres)`,
      { errors: [{ field: IDEMPOTENCY_KEY_HEADER, message: 'Obligatoria' }] }
    );
  }
  return key;
}

/**
 * Builds the idempotency context of a POST. Keys are scoped per integration account
 * (one clinic cannot collide with another) or to provisioning for the provisioning secret.
 */
export function idempotencyContextFrom(request: RequestWithPrincipal): IdempotencyContext {
  const accountId = request.user?.integrationAccountId;
  return {
    scope: accountId ? `account:${accountId}` : PROVISIONING_SCOPE,
    key: readIdempotencyKey(request),
    requestHash: requestFingerprint(request.method, request.path, request.body),
  };
}

/**
 * Sends the outcome: the original status the first time and 200 on a replay (contract).
 * Controllers send it themselves because Nest applies the route status after interceptors.
 */
export function sendIdempotentOutcome(response: Response, outcome: IdempotentOutcome): void {
  const status = outcome.replayed ? HttpStatus.OK : outcome.status;
  response.setHeader('Idempotent-Replayed', String(outcome.replayed));
  response.status(status).json(outcome.body);
}
