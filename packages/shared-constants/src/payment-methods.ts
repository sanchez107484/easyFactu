/**
 * Payment methods for invoices
 */

export const PAYMENT_METHODS = {
  BANK_TRANSFER: "BANK_TRANSFER",
  DIRECT_DEBIT: "DIRECT_DEBIT",
  CARD: "CARD",
  CASH: "CASH",
  PAYPAL: "PAYPAL",
  OTHER: "OTHER",
} as const;

export const PAYMENT_METHOD_LABELS: Record<
  keyof typeof PAYMENT_METHODS,
  string
> = {
  BANK_TRANSFER: "Transferencia bancaria",
  DIRECT_DEBIT: "Domiciliación bancaria",
  CARD: "Tarjeta",
  CASH: "Efectivo",
  PAYPAL: "PayPal",
  OTHER: "Otro",
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
