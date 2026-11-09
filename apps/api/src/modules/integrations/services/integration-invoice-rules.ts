import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { ISSUE_DATE_TIMEZONE } from '../integrations.constants';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Today in Spain (YYYY-MM-DD): the issue date of every invoice issued through the API. */
export function todayInSpain(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ISSUE_DATE_TIMEZONE }).format(now);
}

export function invoiceNotFound(): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.NOT_FOUND, 'Factura no encontrada');
}

export function fiscalRule(detail: string, field?: string): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.FISCAL_RULE, detail, {
    errors: field ? [{ field, message: detail }] : undefined,
  });
}

export function validationError(
  detail: string,
  field: string,
  message: string
): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.VALIDATION_ERROR, detail, {
    errors: [{ field, message }],
  });
}

export function invalidState(detail: string): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.INVALID_STATE, detail);
}

/** YYYY-MM-DD that exists in the calendar (rejects 2026-02-30). */
function isCalendarDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * The operation date may be earlier than the issue date (the invoice is issued later), never
 * later: invoices are always issued today. Returns the value to store: undefined when it is
 * the issue date itself, so FechaOperacion is only sent when it differs.
 */
export function resolveOperationDate(operationDate: string | undefined): string | undefined {
  if (operationDate === undefined) return undefined;
  if (!isCalendarDate(operationDate)) {
    throw validationError('Fecha de operación no válida', 'operationDate', 'Fecha inexistente');
  }
  const today = todayInSpain();
  if (operationDate > today) {
    throw fiscalRule('La fecha de operación no puede ser posterior a hoy', 'operationDate');
  }
  return operationDate === today ? undefined : operationDate;
}

/** Legal maximum of a simplified invoice (art. 4.1 RD 1619/2012, retail and similar). */
export const MAX_SIMPLIFIED_INVOICE_LIMIT = 3000;

export function assertSimplifiedLimit(chargedCents: bigint, limitEuros: number): void {
  if (chargedCents > BigInt(Math.round(limitEuros * 100))) {
    throw fiscalRule(
      `Una factura simplificada no puede superar ${limitEuros.toFixed(2)} € en esta cuenta. Emite una factura completa (standard).`,
      'invoiceType'
    );
  }
}
