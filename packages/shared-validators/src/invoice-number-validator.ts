/**
 * Invoice Number Validator
 * Validates invoice number format: PREFIX-YEAR-NUMBER
 */

export interface InvoiceNumberValidationResult {
  isValid: boolean;
  prefix?: string;
  year?: number;
  number?: number;
  error?: string;
}

/**
 * Regex for invoice number format
 * FORMAT: PREFIX-YYYY-NNNN
 * Examples: F-2025-0001, FAC-2025-123, INV-2024-00042
 */
const INVOICE_NUMBER_REGEX = /^([A-Z0-9]+)-(\d{4})-(\d+)$/;

const MIN_YEAR = 2020;
const MAX_YEAR = 2099;

/**
 * Validates an invoice number
 *
 * @param invoiceNumber - Invoice number to validate
 * @returns Validation result with parsed components
 *
 * @example
 * validateInvoiceNumber('F-2025-0001')
 * // { isValid: true, prefix: 'F', year: 2025, number: 1 }
 *
 * validateInvoiceNumber('FAC-2025-123')
 * // { isValid: true, prefix: 'FAC', year: 2025, number: 123 }
 *
 * validateInvoiceNumber('invalid')
 * // { isValid: false, error: 'Formato de número de factura inválido' }
 */
export function validateInvoiceNumber(invoiceNumber: string): InvoiceNumberValidationResult {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') {
    return {
      isValid: false,
      error: 'El número de factura es requerido',
    };
  }

  const trimmed = invoiceNumber.trim().toUpperCase();

  // Check format
  const match = INVOICE_NUMBER_REGEX.exec(trimmed);

  if (!match || !match[1] || !match[2] || !match[3]) {
    return {
      isValid: false,
      error: 'Formato de número de factura inválido (debe ser PREFIX-YYYY-NNNN)',
    };
  }

  const prefix = match[1];
  const yearStr = match[2];
  const numberStr = match[3];

  const year = parseInt(yearStr, 10);
  const number = parseInt(numberStr, 10);

  // Validate year range
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return {
      isValid: false,
      error: `El año debe estar entre ${MIN_YEAR} y ${MAX_YEAR}`,
    };
  }

  // Validate number is positive
  if (number <= 0) {
    return {
      isValid: false,
      error: 'El número debe ser mayor que 0',
    };
  }

  // Validate prefix (only letters and numbers, 1-10 chars)
  if (prefix.length < 1 || prefix.length > 10) {
    return {
      isValid: false,
      error: 'El prefijo debe tener entre 1 y 10 caracteres',
    };
  }

  return {
    isValid: true,
    prefix,
    year,
    number,
  };
}

/**
 * Simple check if invoice number is valid
 *
 * @param invoiceNumber - Invoice number to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidInvoiceNumber('F-2025-0001') // true
 * isValidInvoiceNumber('invalid') // false
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return validateInvoiceNumber(invoiceNumber).isValid;
}

/**
 * Generates a formatted invoice number
 *
 * @param prefix - Series prefix (e.g., 'F', 'FAC')
 * @param year - Year (e.g., 2025)
 * @param number - Sequential number (e.g., 1)
 * @param digits - Number of digits for padding (default: 4)
 * @returns Formatted invoice number
 *
 * @example
 * formatInvoiceNumber('F', 2025, 1) // 'F-2025-0001'
 * formatInvoiceNumber('FAC', 2025, 123, 6) // 'FAC-2025-000123'
 */
export function formatInvoiceNumber(
  prefix: string,
  year: number,
  number: number,
  digits: number = 4,
): string {
  const paddedNumber = number.toString().padStart(digits, '0');
  return `${prefix.toUpperCase()}-${year}-${paddedNumber}`;
}

/**
 * Formats a series-based invoice number preview using the same logic as the backend.
 * The prefix is used as-is; the year is NOT added automatically.
 * Numbers are zero-padded to 4 digits to match the backend format.
 *
 * FORMAT: {prefix}{formattedNumber}
 *
 * @param prefix - Series prefix as stored in the DB (e.g., 'F-2026-', 'F-')
 * @param _year - Unused (kept for backward compatibility)
 * @param number - Sequential number to preview (e.g., 1 for the next invoice)
 * @returns Formatted invoice number preview (e.g., 'F-2026-0001', 'F-0001')
 *
 * @example
 * formatSeriesPreview('F-2026-', 2026, 1)    // 'F-2026-0001'
 * formatSeriesPreview('FAC-', 2026, 9)        // 'FAC-0009'
 * formatSeriesPreview('R-2026-', 2026, 10)    // 'R-2026-0010'
 * formatSeriesPreview('F-', 2026, 42)         // 'F-0042'
 */
export function formatSeriesPreview(prefix: string, _year: number, number: number): string {
  return `${prefix}${number.toString().padStart(4, '0')}`;
}
