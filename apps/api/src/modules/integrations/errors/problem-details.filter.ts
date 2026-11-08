import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { redactSensitive } from '../../../common/logging/redact-sensitive';
import { getRequestId } from '../middleware/request-id.middleware';
import { ERROR_CODE_DEFINITIONS, errorTypeUri } from './integration-error-code';
import { IntegrationException } from './integration.exception';
import { toIntegrationException } from './problem-details.mapper';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';
const MAX_LOGGED_MESSAGE_LENGTH = 500;

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  retryable: boolean;
  detail: string;
  requestId?: string;
  errors?: { field: string; message: string }[];
  [extension: string]: unknown;
}

export function buildProblemDetails(
  error: IntegrationException,
  requestId?: string
): ProblemDetails {
  const definition = ERROR_CODE_DEFINITIONS[error.code];
  return {
    ...error.problem.extensions,
    type: errorTypeUri(error.code),
    title: definition.title,
    status: definition.status,
    code: error.code,
    retryable: definition.retryable,
    detail: error.detail,
    ...(requestId ? { requestId } : {}),
    ...(error.problem.errors?.length ? { errors: error.problem.errors } : {}),
  };
}

/**
 * RFC 9457 Problem Details for the integrations API only. The rest of the API keeps
 * its historical error shape. Logs carry code, status and request id; never the body,
 * and any message is redacted (no NIFs, keys or tokens).
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('IntegrationsApi');

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const error = toIntegrationException(exception);
    const problem = buildProblemDetails(error, getRequestId(request));

    this.log(problem, request, exception);
    if (error.problem.retryAfterSeconds) {
      response.setHeader('Retry-After', String(error.problem.retryAfterSeconds));
    }
    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).send(JSON.stringify(problem));
  }

  private log(problem: ProblemDetails, request: Request, exception: unknown): void {
    const summary = `${request.method} ${request.path} ${problem.status} ${problem.code} requestId=${problem.requestId ?? '-'}`;
    if (problem.status < 500) {
      this.logger.warn(redactSensitive(summary));
      return;
    }
    const cause =
      exception instanceof Error ? `${exception.name}: ${exception.message}` : 'unknown error';
    this.logger.error(
      redactSensitive(`${summary} cause=${cause.slice(0, MAX_LOGGED_MESSAGE_LENGTH)}`)
    );
  }
}
