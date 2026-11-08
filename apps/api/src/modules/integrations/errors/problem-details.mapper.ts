import { HttpException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { PlanRequiredException } from '../../../common/errors/plan-required.exception';
import { redactSensitive } from '../../../common/logging/redact-sensitive';
import { IntegrationErrorCode } from './integration-error-code';
import { IntegrationException } from './integration.exception';

const INTERNAL_DETAIL = 'Error interno. Reintenta con la misma Idempotency-Key.';
const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2034']);

const CODE_BY_HTTP_STATUS: Record<number, IntegrationErrorCode> = {
  400: IntegrationErrorCode.VALIDATION_ERROR,
  401: IntegrationErrorCode.INVALID_API_KEY,
  402: IntegrationErrorCode.PLAN_REQUIRED,
  403: IntegrationErrorCode.FORBIDDEN,
  404: IntegrationErrorCode.NOT_FOUND,
  409: IntegrationErrorCode.INVALID_STATE,
  422: IntegrationErrorCode.FISCAL_RULE,
  429: IntegrationErrorCode.RATE_LIMITED,
};

function messageOf(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.map(String).join('. ');
  return typeof message === 'string' ? message : exception.message;
}

function fromHttpException(exception: HttpException): IntegrationException {
  const status = exception.getStatus();
  if (status >= 500)
    return new IntegrationException(IntegrationErrorCode.INTERNAL, INTERNAL_DETAIL);
  const code = CODE_BY_HTTP_STATUS[status] ?? IntegrationErrorCode.VALIDATION_ERROR;
  return new IntegrationException(code, redactSensitive(messageOf(exception)));
}

function fromPrismaError(error: Prisma.PrismaClientKnownRequestError): IntegrationException {
  const target = JSON.stringify(error.meta?.target ?? '');
  if (error.code === 'P2002' && /external_?ref/i.test(target)) {
    return new IntegrationException(
      IntegrationErrorCode.DUPLICATE_EXTERNAL_REF,
      'Ya existe una factura con ese externalRef. Recupérala con GET /invoices?externalRef='
    );
  }
  if (error.code === 'P2025') {
    return new IntegrationException(IntegrationErrorCode.NOT_FOUND, 'Recurso no encontrado');
  }
  if (error.code === 'P2002') {
    return new IntegrationException(
      IntegrationErrorCode.INVALID_STATE,
      'Ya existe un registro con estos datos'
    );
  }
  const retryAfterSeconds = TRANSIENT_PRISMA_CODES.has(error.code) ? 5 : undefined;
  return new IntegrationException(IntegrationErrorCode.INTERNAL, INTERNAL_DETAIL, {
    retryAfterSeconds,
  });
}

/** Translates any error thrown inside the integrations module into a contract error. */
export function toIntegrationException(exception: unknown): IntegrationException {
  if (exception instanceof IntegrationException) return exception;
  if (exception instanceof PlanRequiredException) {
    return new IntegrationException(
      IntegrationErrorCode.PLAN_REQUIRED,
      'La cuenta no tiene un plan PRO activo'
    );
  }
  if (exception instanceof ThrottlerException) {
    return new IntegrationException(IntegrationErrorCode.RATE_LIMITED, 'Demasiadas peticiones', {
      retryAfterSeconds: 60,
    });
  }
  if (exception instanceof HttpException) return fromHttpException(exception);
  if (exception instanceof Prisma.PrismaClientKnownRequestError) return fromPrismaError(exception);
  return new IntegrationException(IntegrationErrorCode.INTERNAL, INTERNAL_DETAIL);
}
