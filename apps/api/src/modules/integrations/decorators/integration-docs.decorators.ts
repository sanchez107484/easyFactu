import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiPaymentRequiredResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ProblemDetailsResponse } from '../dto/integration-responses.dto';
import { IDEMPOTENCY_KEY_HEADER } from '../idempotency/idempotent-response';

export const API_KEY_SECURITY = 'apiKey';
export const PROVISIONING_SECURITY = 'provisioningSecret';

const problem = (description: string) => ({ type: ProblemDetailsResponse, description });

/** Idempotency-Key header + the conflicts it can produce. */
export const ApiIdempotentPost = () =>
  applyDecorators(
    ApiHeader({
      name: IDEMPOTENCY_KEY_HEADER,
      required: true,
      description:
        'Obligatoria. Misma clave y mismo cuerpo: misma respuesta (200). Se guarda 30 días.',
    }),
    ApiConflictResponse(problem('IDEMPOTENCY_CONFLICT · REQUEST_IN_PROGRESS (reintentable)'))
  );

/** Errors every API key endpoint can return. */
export const ApiKeyErrorResponses = () =>
  applyDecorators(
    ApiHeader({
      name: 'X-Request-Id',
      required: false,
      description: 'Se respeta si se envía; si no, se genera. Vuelve siempre.',
    }),
    ApiBadRequestResponse(problem('VALIDATION_ERROR')),
    ApiUnauthorizedResponse(problem('INVALID_API_KEY')),
    ApiPaymentRequiredResponse(problem('PLAN_REQUIRED')),
    ApiNotFoundResponse(problem('NOT_FOUND')),
    ApiUnprocessableEntityResponse(problem('FISCAL_RULE')),
    ApiTooManyRequestsResponse(problem('RATE_LIMITED, con Retry-After')),
    ApiInternalServerErrorResponse(problem('INTERNAL (reintentable con la misma Idempotency-Key)'))
  );

/** Errors every provisioning endpoint can return. */
export const ProvisioningErrorResponses = () =>
  applyDecorators(
    ApiBadRequestResponse(problem('VALIDATION_ERROR')),
    ApiUnauthorizedResponse(problem('INVALID_PROVISION_SECRET')),
    ApiNotFoundResponse(problem('NOT_FOUND')),
    ApiInternalServerErrorResponse(problem('INTERNAL (reintentable)'))
  );
