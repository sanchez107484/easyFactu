/**
 * Email Validator
 * RFC 5322 basic format validation
 */

export interface EmailValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Basic email regex following RFC 5322
 * Simplified version that covers 99.9% of real-world emails
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

/**
 * Validates an email address
 *
 * @param email - Email to validate
 * @returns Validation result with normalized email
 *
 * @example
 * validateEmail('user@example.com')
 * // { isValid: true, normalized: 'user@example.com' }
 *
 * validateEmail('  USER@EXAMPLE.COM  ')
 * // { isValid: true, normalized: 'user@example.com' }
 *
 * validateEmail('invalid.email')
 * // { isValid: false, error: 'Formato de email inválido' }
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'El email es requerido',
    };
  }

  // Trim whitespace
  const trimmed = email.trim();

  // Check maximum length
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      error: `El email no puede tener más de ${MAX_EMAIL_LENGTH} caracteres`,
    };
  }

  // Check if it contains @
  if (!trimmed.includes('@')) {
    return {
      isValid: false,
      error: 'Formato de email inválido',
    };
  }

  // Split into local and domain parts
  const [localPart, ...domainParts] = trimmed.split('@');

  if (!localPart || domainParts.length === 0) {
    return {
      isValid: false,
      error: 'Formato de email inválido',
    };
  }

  const domain = domainParts.join('@');

  // Check local part length
  if (localPart.length > MAX_LOCAL_PART_LENGTH) {
    return {
      isValid: false,
      error: `La parte local del email no puede tener más de ${MAX_LOCAL_PART_LENGTH} caracteres`,
    };
  }

  // Check format with regex
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Formato de email inválido',
    };
  }

  // Normalize to lowercase
  const normalized = trimmed.toLowerCase();

  return {
    isValid: true,
    normalized,
  };
}

/**
 * Simple check if email is valid
 *
 * @param email - Email to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}
