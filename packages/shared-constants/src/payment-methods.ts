import {
  PaymentMethod,
  PaymentType,
  SELECTABLE_PAYMENT_METHODS,
  SelectablePaymentMethod,
} from '@easyfactura/shared-types';

export { PaymentMethod, PaymentType };

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia bancaria',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.OTHER]: 'Otro',
  [PaymentMethod.BIZUM]: 'Bizum',
  [PaymentMethod.COMPENSATION]: 'Compensación',
};

/** Labels of the methods offered in selects: never COMPENSATION, which only the system records. */
export const SELECTABLE_PAYMENT_METHOD_LABELS = Object.fromEntries(
  SELECTABLE_PAYMENT_METHODS.map((method) => [method, PAYMENT_METHOD_LABELS[method]]),
) as Record<SelectablePaymentMethod, string>;

export const PAYMENT_METHOD_SECTION_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: 'Datos para la transferencia',
  [PaymentMethod.DIRECT_DEBIT]: 'Domiciliación bancaria',
  [PaymentMethod.CARD]: 'Pago con tarjeta',
  [PaymentMethod.CASH]: 'Pago en efectivo',
  [PaymentMethod.PAYPAL]: 'Datos PayPal',
  [PaymentMethod.OTHER]: 'Instrucciones de pago',
  [PaymentMethod.BIZUM]: 'Datos Bizum',
  [PaymentMethod.COMPENSATION]: 'Compensación',
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(SELECTABLE_PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.FULL]: 'Cobro completo',
  [PaymentType.PARTIAL]: 'Cobro parcial',
};
