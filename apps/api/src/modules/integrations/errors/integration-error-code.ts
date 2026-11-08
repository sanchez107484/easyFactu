/**
 * Stable error codes of the integrations API v1 (contract). The ERP branches on `code`
 * and `retryable`, never on `title` or `detail`. Adding a code is backwards compatible;
 * renaming or removing one is a breaking change (/v2).
 */
export enum IntegrationErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_API_KEY = 'INVALID_API_KEY',
  INVALID_PROVISION_SECRET = 'INVALID_PROVISION_SECRET',
  PLAN_REQUIRED = 'PLAN_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  IDEMPOTENCY_CONFLICT = 'IDEMPOTENCY_CONFLICT',
  REQUEST_IN_PROGRESS = 'REQUEST_IN_PROGRESS',
  DUPLICATE_EXTERNAL_REF = 'DUPLICATE_EXTERNAL_REF',
  ACCOUNT_CONFLICT = 'ACCOUNT_CONFLICT',
  ACCOUNT_NOT_ACTIVE = 'ACCOUNT_NOT_ACTIVE',
  INVALID_STATE = 'INVALID_STATE',
  FISCAL_RULE = 'FISCAL_RULE',
  RATE_LIMITED = 'RATE_LIMITED',
  HACIENDA_UNAVAILABLE = 'HACIENDA_UNAVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
  UPSTREAM_TIMEOUT = 'UPSTREAM_TIMEOUT',
  INTERNAL = 'INTERNAL',
}

interface ErrorCodeDefinition {
  status: number;
  title: string;
  retryable: boolean;
}

export const ERROR_CODE_DEFINITIONS: Record<IntegrationErrorCode, ErrorCodeDefinition> = {
  VALIDATION_ERROR: { status: 400, title: 'Datos no válidos', retryable: false },
  INVALID_API_KEY: { status: 401, title: 'API key no válida', retryable: false },
  INVALID_PROVISION_SECRET: { status: 401, title: 'Secreto de alta no válido', retryable: false },
  PLAN_REQUIRED: { status: 402, title: 'Plan PRO requerido', retryable: false },
  FORBIDDEN: { status: 403, title: 'Operación no permitida', retryable: false },
  NOT_FOUND: { status: 404, title: 'Recurso no encontrado', retryable: false },
  IDEMPOTENCY_CONFLICT: {
    status: 409,
    title: 'Idempotency-Key reutilizada con otra petición',
    retryable: false,
  },
  REQUEST_IN_PROGRESS: {
    status: 409,
    title: 'La misma Idempotency-Key se está procesando',
    retryable: true,
  },
  DUPLICATE_EXTERNAL_REF: {
    status: 409,
    title: 'Ya existe una factura con ese externalRef',
    retryable: false,
  },
  ACCOUNT_CONFLICT: {
    status: 409,
    title: 'La cuenta entra en conflicto con otra existente',
    retryable: false,
  },
  ACCOUNT_NOT_ACTIVE: { status: 409, title: 'La cuenta no está activa', retryable: false },
  INVALID_STATE: { status: 409, title: 'Estado no válido para esta operación', retryable: false },
  FISCAL_RULE: { status: 422, title: 'Regla fiscal incumplida', retryable: false },
  RATE_LIMITED: { status: 429, title: 'Demasiadas peticiones', retryable: true },
  HACIENDA_UNAVAILABLE: { status: 502, title: 'Hacienda no disponible', retryable: true },
  MAINTENANCE: { status: 503, title: 'Servicio en mantenimiento', retryable: true },
  UPSTREAM_TIMEOUT: { status: 504, title: 'Tiempo de espera agotado', retryable: true },
  INTERNAL: { status: 500, title: 'Error interno', retryable: true },
};

export function errorTypeUri(code: IntegrationErrorCode): string {
  return `https://docs.novafactura.es/errors/${code.toLowerCase().replace(/_/g, '-')}`;
}
