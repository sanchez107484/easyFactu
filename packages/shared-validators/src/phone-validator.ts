/**
 * Spanish Phone Number Validator
 * Validates Spanish mobile and landline numbers
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  formatted?: string;
  type?: 'mobile' | 'landline';
  error?: string;
}

/**
 * Validates a Spanish phone number
 *
 * Valid formats:
 * - Mobile: +34 6XX XXX XXX, +34 7XX XXX XXX
 * - Landline: +34 8XX XXX XXX, +34 9XX XXX XXX
 * - Without prefix: 6XX XXX XXX, 7XX XXX XXX, 8XX XXX XXX, 9XX XXX XXX
 *
 * @param phone - Phone number to validate
 * @returns Validation result with normalized and formatted phone
 *
 * @example
 * validatePhone('+34 612 345 678')
 * // { isValid: true, normalized: '+34612345678', formatted: '+34 612 345 678', type: 'mobile' }
 *
 * validatePhone('612345678')
 * // { isValid: true, normalized: '+34612345678', formatted: '+34 612 345 678', type: 'mobile' }
 *
 * validatePhone('912 34 56 78')
 * // { isValid: true, normalized: '+34912345678', formatted: '+34 912 345 678', type: 'landline' }
 */
export function validatePhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'El teléfono es requerido',
    };
  }

  // Remove all whitespace, dashes, parentheses, dots
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // Check if it starts with +34 or 0034
  let digits: string;
  if (cleaned.startsWith('+34')) {
    digits = cleaned.substring(3);
  } else if (cleaned.startsWith('0034')) {
    digits = cleaned.substring(4);
  } else if (cleaned.startsWith('34')) {
    digits = cleaned.substring(2);
  } else {
    digits = cleaned;
  }

  // Should have exactly 9 digits
  if (!/^\d{9}$/.test(digits)) {
    return {
      isValid: false,
      error: 'El teléfono debe tener 9 dígitos',
    };
  }

  // Check if it starts with valid prefix
  const firstDigit = digits[0];
  if (!firstDigit || !['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      error: 'Número de teléfono español inválido (debe empezar por 6, 7, 8 o 9)',
    };
  }

  // Determine type
  const type: 'mobile' | 'landline' =
    firstDigit === '6' || firstDigit === '7' ? 'mobile' : 'landline';

  // Normalized format: +34XXXXXXXXX
  const normalized = `+34${digits}`;

  // Formatted: +34 XXX XXX XXX
  const formatted = `+34 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;

  return {
    isValid: true,
    normalized,
    formatted,
    type,
  };
}

/**
 * Simple check if phone is valid
 *
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidPhone('+34 612 345 678') // true
 * isValidPhone('123') // false
 */
export function isValidPhone(phone: string): boolean {
  return validatePhone(phone).isValid;
}
