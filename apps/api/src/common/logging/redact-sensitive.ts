/**
 * Masks secrets and fiscal identifiers before a text reaches the logs.
 *
 * Covers integration API keys (nfk_live_/nfk_test_), bearer tokens and Spanish
 * tax ids (DNI, NIE, CIF). Tax ids keep their last 3 characters so support can
 * still correlate a log line with a record without exposing the full id.
 */
const API_KEY_PATTERN = /\bnfk_(live|test)_[A-Za-z0-9_-]+/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const TAX_ID_PATTERN = /\b(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])\b/gi;

function maskTaxId(taxId: string): string {
  return `***${taxId.slice(-3)}`;
}

export function redactSensitive(text: string): string {
  return text
    .replace(API_KEY_PATTERN, 'nfk_$1_***')
    .replace(BEARER_PATTERN, 'Bearer ***')
    .replace(TAX_ID_PATTERN, maskTaxId);
}
