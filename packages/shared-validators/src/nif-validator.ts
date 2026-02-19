/**
 * Validator for Spanish NIF/CIF/NIE
 * Based on official algorithms from Spanish Tax Agency (AEAT)
 */

const NIF_REGEX = /^(\d{8})([A-Z])$/;
const CIF_REGEX = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/;
const NIE_REGEX = /^([XYZ])(\d{7})([A-Z])$/;

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_LETTERS = 'JABCDEFGHI';

export enum NifType {
  NIF = 'NIF',
  CIF = 'CIF',
  NIE = 'NIE',
  INVALID = 'INVALID',
}

export interface NifValidationResult {
  isValid: boolean;
  type: NifType;
  message?: string;
}

export function getNifType(nif: string): NifType {
  const cleaned = nif
    .toUpperCase()
    .trim()
    .replace(/[\s.-]/g, '');
  if (NIF_REGEX.test(cleaned)) return NifType.NIF;
  if (CIF_REGEX.test(cleaned)) return NifType.CIF;
  if (NIE_REGEX.test(cleaned)) return NifType.NIE;
  return NifType.INVALID;
}

function validateNifInternal(nif: string): boolean {
  const match = nif.match(NIF_REGEX);
  if (!match || !match[1] || !match[2]) return false;
  const number = match[1];
  const letter = match[2];
  const expectedLetter = NIF_LETTERS[parseInt(number, 10) % 23];
  return letter === expectedLetter;
}

function validateCifInternal(cif: string): boolean {
  const match = cif.match(CIF_REGEX);
  if (!match || !match[1] || !match[2] || !match[3]) return false;
  const orgType = match[1];
  const number = match[2];
  const control = match[3];

  let sumA = 0;
  let sumB = 0;

  for (let i = 0; i < number.length; i++) {
    const char = number[i];
    if (!char) continue;
    const digit = parseInt(char, 10);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sumA += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sumB += digit;
    }
  }

  const totalSum = sumA + sumB;
  const unitDigit = totalSum % 10;
  const controlDigit = unitDigit === 0 ? 0 : 10 - unitDigit;

  const letterTypes = ['K', 'P', 'Q', 'S', 'N', 'W'];
  const numberTypes = ['A', 'B', 'E', 'H'];

  const expectedLetter = CIF_LETTERS[controlDigit];
  if (!expectedLetter) return false;

  if (letterTypes.includes(orgType)) {
    return control === expectedLetter;
  }
  if (numberTypes.includes(orgType)) {
    return control === controlDigit.toString();
  }
  return control === controlDigit.toString() || control === expectedLetter;
}

function validateNieInternal(nie: string): boolean {
  const match = nie.match(NIE_REGEX);
  if (!match || !match[1] || !match[2] || !match[3]) return false;
  const prefix = match[1];
  const number = match[2];
  const letter = match[3];

  const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' };
  const fullNumber = (prefixMap[prefix] ?? '') + number;
  const expectedLetter = NIF_LETTERS[parseInt(fullNumber, 10) % 23];
  return letter === expectedLetter;
}

export function validateNif(nif: string): NifValidationResult {
  if (!nif || typeof nif !== 'string') {
    return {
      isValid: false,
      type: NifType.INVALID,
      message: 'El NIF/CIF/NIE es obligatorio',
    };
  }

  const cleaned = nif
    .toUpperCase()
    .trim()
    .replace(/[\s.-]/g, '');
  const type = getNifType(cleaned);

  if (type === NifType.INVALID) {
    return {
      isValid: false,
      type,
      message: 'Formato de NIF/CIF/NIE no válido',
    };
  }

  let isValid = false;
  if (type === NifType.NIF) isValid = validateNifInternal(cleaned);
  else if (type === NifType.CIF) isValid = validateCifInternal(cleaned);
  else if (type === NifType.NIE) isValid = validateNieInternal(cleaned);

  return {
    isValid,
    type,
    message: isValid ? undefined : `${type} no válido`,
  };
}

export function isValidNif(nif: string): boolean {
  return validateNif(nif).isValid;
}
