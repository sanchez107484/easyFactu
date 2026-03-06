/**
 * Validator for IBAN (International Bank Account Number)
 * Based on ISO 13616 standard
 */

export interface IbanValidationResult {
  isValid: boolean;
  country?: string;
  message?: string;
}

const IBAN_LENGTHS: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

function mod97(iban: string): number {
  let remainder = iban;
  let block: string;

  while (remainder.length > 2) {
    block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }

  return parseInt(remainder, 10) % 97;
}

function convertIbanToNumeric(iban: string): string {
  return iban
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return (code - 55).toString();
      }
      return char;
    })
    .join('');
}

export function validateIban(iban: string): IbanValidationResult {
  if (!iban || typeof iban !== 'string') {
    return { isValid: false, message: 'El IBAN es obligatorio' };
  }

  const cleaned = iban.toUpperCase().replace(/[\s]/g, '');

  if (!/^[A-Z]{2}/.test(cleaned)) {
    return {
      isValid: false,
      message: 'El IBAN debe comenzar con el código de país (2 letras)',
    };
  }

  const countryCode = cleaned.slice(0, 2);

  if (!IBAN_LENGTHS[countryCode]) {
    return {
      isValid: false,
      country: countryCode,
      message: `Código de país no reconocido: ${countryCode}`,
    };
  }

  const expectedLength = IBAN_LENGTHS[countryCode];
  if (cleaned.length !== expectedLength) {
    return {
      isValid: false,
      country: countryCode,
      message: `El IBAN de ${countryCode} debe tener ${expectedLength} caracteres`,
    };
  }

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return {
      isValid: false,
      country: countryCode,
      message: 'El IBAN contiene caracteres no válidos',
    };
  }

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = convertIbanToNumeric(rearranged);

  if (mod97(numeric) !== 1) {
    return {
      isValid: false,
      country: countryCode,
      message: 'El IBAN no es válido (checksum incorrecto)',
    };
  }

  return { isValid: true, country: countryCode };
}

export function isValidIban(iban: string): boolean {
  return validateIban(iban).isValid;
}

/**
 * Formats an IBAN string for display: strips whitespace, uppercases,
 * and inserts a space every 4 characters (e.g. "ES9121000418450200051332" → "ES91 2100 0418 4502 0005 1332").
 */
export function formatIban(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
}
