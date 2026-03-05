import { PaymentMethod } from '@easyfactura/shared-types';

export { PaymentMethod };

/**
 * Payment methods for invoices
 */
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  DIRECT_DEBIT: 'DIRECT_DEBIT',
  CARD: 'CARD',
  CASH: 'CASH',
  PAYPAL: 'PAYPAL',
  OTHER: 'OTHER',
  BIZUM: 'BIZUM',
} as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia bancaria',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.OTHER]: 'Otro',
  [PaymentMethod.BIZUM]: 'Bizum',
};

export const PAYMENT_METHOD_SECTION_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Datos para la transferencia',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Pago con tarjeta',
  [PaymentMethod.CASH]: 'Pago en efectivo',
  [PaymentMethod.PAYPAL]: 'Datos PayPal',
  [PaymentMethod.OTHER]: 'Instrucciones de pago',
  [PaymentMethod.BIZUM]: 'Datos Bizum',
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label }),
);
