import { HttpException } from '@nestjs/common';
import { ERROR_CODE_DEFINITIONS, IntegrationErrorCode } from './integration-error-code';

export interface FieldError {
  field: string;
  message: string;
}

export interface IntegrationExceptionOptions {
  errors?: FieldError[];
  /** Seconds the client should wait before retrying (sent as Retry-After). */
  retryAfterSeconds?: number;
  /** Extra Problem Details members (RFC 9457 extensions), e.g. the existing invoice id. */
  extensions?: Record<string, string>;
}

/**
 * Error with a stable contract code. Only used inside the integrations module; the
 * Problem Details filter turns it into `application/problem+json`.
 * `detail` is shown to integrators: never put NIFs, keys or tokens in it.
 */
export class IntegrationException extends HttpException {
  constructor(
    readonly code: IntegrationErrorCode,
    readonly detail: string,
    readonly problem: IntegrationExceptionOptions = {}
  ) {
    super(detail, ERROR_CODE_DEFINITIONS[code].status);
  }
}
