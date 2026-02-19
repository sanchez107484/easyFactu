export { validateNif, isValidNif, getNifType, NifType } from './nif-validator';
export type { NifValidationResult } from './nif-validator';

export { validateIban, isValidIban } from './iban-validator';
export type { IbanValidationResult } from './iban-validator';

export { validatePostalCode, isValidPostalCode } from './postal-code-validator';
export type { PostalCodeValidationResult } from './postal-code-validator';

export { validateEmail, isValidEmail } from './email-validator';
export type { EmailValidationResult } from './email-validator';

export { validatePhone, isValidPhone } from './phone-validator';
export type { PhoneValidationResult } from './phone-validator';

export {
  validateInvoiceNumber,
  isValidInvoiceNumber,
  formatInvoiceNumber,
} from './invoice-number-validator';
export type { InvoiceNumberValidationResult } from './invoice-number-validator';
