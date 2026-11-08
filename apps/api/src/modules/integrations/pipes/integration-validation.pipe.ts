import { ValidationError, ValidationPipe } from '@nestjs/common';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { FieldError, IntegrationException } from '../errors/integration.exception';

const FALLBACK_MESSAGES: Record<string, string> = {
  whitelistValidation: 'Campo no permitido',
  isDefined: 'Campo obligatorio',
  isString: 'Debe ser texto',
  isNotEmpty: 'No puede estar vacío',
  isObject: 'Debe ser un objeto',
  isArray: 'Debe ser una lista',
  nestedValidation: 'Datos no válidos',
};

function messageFor(constraint: string, defaultMessage: string): string {
  const isEnglishDefault = defaultMessage.includes(' must ') || defaultMessage.includes(' should ');
  return isEnglishDefault ? (FALLBACK_MESSAGES[constraint] ?? 'Valor no válido') : defaultMessage;
}

/** Flattens class-validator errors into `lines[0].taxRate`-style field paths. */
export function flattenValidationErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  return errors.flatMap((error) => {
    const isIndex = /^\d+$/.test(error.property);
    const separator = parentPath && !isIndex ? '.' : '';
    const field = isIndex
      ? `${parentPath}[${error.property}]`
      : `${parentPath}${separator}${error.property}`;
    const own = Object.entries(error.constraints ?? {}).map(([constraint, message]) => ({
      field,
      message: messageFor(constraint, message),
    }));
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/**
 * Validation for the integrations API. Applied through @IntegrationBody / @IntegrationQuery
 * (custom decorators), which the global ValidationPipe skips, so field errors reach the
 * Problem Details response as `errors: [{ field, message }]`.
 */
export const integrationValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  validateCustomDecorators: true,
  exceptionFactory: (errors) =>
    new IntegrationException(
      IntegrationErrorCode.VALIDATION_ERROR,
      'La petición tiene datos no válidos',
      {
        errors: flattenValidationErrors(errors),
      }
    ),
});
