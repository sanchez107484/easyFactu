import {
  validateNif,
  isValidNif,
  getNifType,
  NifType,
} from './nif-validator';

// ─── getNifType ───────────────────────────────────────────────────────────────

describe('getNifType', () => {
  it('should detect NIF format', () => {
    expect(getNifType('12345678Z')).toBe(NifType.NIF);
  });

  it('should detect CIF format', () => {
    expect(getNifType('A12345674')).toBe(NifType.CIF);
  });

  it('should detect NIE format', () => {
    expect(getNifType('X1234567L')).toBe(NifType.NIE);
  });

  it('should return INVALID for unrecognised format', () => {
    expect(getNifType('INVALID')).toBe(NifType.INVALID);
    expect(getNifType('')).toBe(NifType.INVALID);
    expect(getNifType('1234')).toBe(NifType.INVALID);
  });

  it('should normalise lowercase input', () => {
    expect(getNifType('12345678z')).toBe(NifType.NIF);
    expect(getNifType('a12345674')).toBe(NifType.CIF);
    expect(getNifType('x1234567l')).toBe(NifType.NIE);
  });

  it('should normalise input with spaces and dashes', () => {
    expect(getNifType('12345678-Z')).toBe(NifType.NIF);
    expect(getNifType('A-1234567-4')).toBe(NifType.CIF);
  });
});

// ─── NIF validation ───────────────────────────────────────────────────────────

describe('validateNif — NIF (DNI)', () => {
  // Known valid NIFs computed from the official modulo-23 algorithm
  const VALID_NIFS = [
    '00000000T', // 0 % 23 = 0 → T
    '00000001R', // 1 % 23 = 1 → R
    '12345678Z', // 12345678 % 23 = 23 → Z
    '99999999R', // 99999999 % 23 = 1 → R
  ];

  const INVALID_NIFS = [
    '12345678A', // wrong letter
    '12345678X', // wrong letter
    '00000000A', // wrong letter for 0
  ];

  it.each(VALID_NIFS)('should validate correct NIF: %s', (nif) => {
    const result = validateNif(nif);
    expect(result.isValid).toBe(true);
    expect(result.type).toBe(NifType.NIF);
    expect(result.message).toBeUndefined();
  });

  it.each(INVALID_NIFS)('should reject NIF with wrong control letter: %s', (nif) => {
    const result = validateNif(nif);
    expect(result.isValid).toBe(false);
    expect(result.type).toBe(NifType.NIF);
    expect(result.message).toBe('NIF no válido');
  });

  it('should be case-insensitive', () => {
    expect(validateNif('00000000t').isValid).toBe(true);
  });

  it('should accept NIF with formatting separators', () => {
    expect(validateNif('00.000.000-T').isValid).toBe(true);
  });
});

// ─── CIF validation ───────────────────────────────────────────────────────────

describe('validateNif — CIF (sociedades)', () => {
  // Real CIFs with known control digits
  const VALID_CIFS = [
    'A58818501', // Inditex SA
    'B83088474', // Generic SL
    'A12345674', // numeric control digit
    'K0000001J', // letter-only control types (K)
    'P0000001B', // letter-only control types (P)
  ];

  const INVALID_CIFS = [
    'A58818500', // wrong control digit
    'B83088470', // wrong control digit
    'A12345670', // wrong control (should be 4)
  ];

  it.each(VALID_CIFS)('should validate correct CIF: %s', (cif) => {
    const result = validateNif(cif);
    expect(result.isValid).toBe(true);
    expect(result.type).toBe(NifType.CIF);
  });

  it.each(INVALID_CIFS)('should reject CIF with wrong control: %s', (cif) => {
    const result = validateNif(cif);
    expect(result.isValid).toBe(false);
    expect(result.type).toBe(NifType.CIF);
  });

  it('should be case-insensitive', () => {
    expect(validateNif('a58818501').isValid).toBe(true);
  });
});

// ─── NIE validation ───────────────────────────────────────────────────────────

describe('validateNif — NIE (extranjeros)', () => {
  // NIE algorithm: replace X→0, Y→1, Z→2 then apply NIF modulo-23
  const VALID_NIES = [
    'X0000000T', // 00000000 % 23 = 0  → T
    'X1234567L', // 01234567 % 23 = 19 → L
    'Y0000001S', // 10000001 % 23 = 15 → S
    'Z0000000M', // 20000000 % 23 = 5  → M
  ];

  const INVALID_NIES = [
    'X0000000A', // wrong letter (should be T)
    'Y0000001A', // wrong letter (should be S)
  ];

  it.each(VALID_NIES)('should validate correct NIE: %s', (nie) => {
    const result = validateNif(nie);
    expect(result.isValid).toBe(true);
    expect(result.type).toBe(NifType.NIE);
  });

  it.each(INVALID_NIES)('should reject NIE with wrong control letter: %s', (nie) => {
    const result = validateNif(nie);
    expect(result.isValid).toBe(false);
    expect(result.type).toBe(NifType.NIE);
  });

  it('should be case-insensitive', () => {
    expect(validateNif('x0000000t').isValid).toBe(true);
  });

  it('should normalise NIE with formatting separators', () => {
    expect(validateNif('X-0000000-T').isValid).toBe(true);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('validateNif — edge cases', () => {
  it('should reject empty string', () => {
    const result = validateNif('');
    expect(result.isValid).toBe(false);
    expect(result.type).toBe(NifType.INVALID);
    expect(result.message).toBe('El NIF/CIF/NIE es obligatorio');
  });

  it('should reject null-like non-string', () => {
    // @ts-expect-error testing runtime guard
    const result = validateNif(null);
    expect(result.isValid).toBe(false);
    expect(result.type).toBe(NifType.INVALID);
  });

  it('should reject strings with invalid format', () => {
    const result = validateNif('ABCDEFGHI');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Formato de NIF/CIF/NIE no válido');
  });

  it('should reject NIF that is too short', () => {
    expect(validateNif('1234567Z').isValid).toBe(false);
  });

  it('should reject NIF that is too long', () => {
    expect(validateNif('123456789Z').isValid).toBe(false);
  });
});

// ─── isValidNif helper ────────────────────────────────────────────────────────

describe('isValidNif', () => {
  it('should return true for a valid NIF', () => {
    expect(isValidNif('00000000T')).toBe(true);
  });

  it('should return false for an invalid NIF', () => {
    expect(isValidNif('00000000A')).toBe(false);
  });

  it('should return true for a valid CIF', () => {
    expect(isValidNif('A58818501')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidNif('')).toBe(false);
  });
});
