// Helper para definir los detalles relevantes por método de pago
import { PaymentMethod } from '@easyfactura/shared-types';

export interface PaymentDetailField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'iban' | 'bic' | 'tel' | 'email' | 'textarea';
  inputProps?: Record<string, any>; // Para props extra (ej: className, id)
  gridCol?: number; // Para grid en UI
  required?: boolean;
  helperText?: string;
}

export const PAYMENT_METHOD_DETAILS: Record<PaymentMethod | 'BIZUM', PaymentDetailField[]> = {
  BANK_TRANSFER: [
    {
      key: 'iban',
      label: 'IBAN',
      type: 'iban',
      placeholder: 'ES91 2100 0418 4502 0005 1332',
      inputProps: { className: 'font-mono text-sm tracking-wider', id: 'iban' },
      required: true,
    },
    {
      key: 'accountHolder',
      label: 'Titular de la cuenta',
      type: 'text',
      placeholder: 'Nombre Apellidos / Empresa S.L.',
      gridCol: 1,
    },
    {
      key: 'bic',
      label: 'BIC/SWIFT',
      type: 'bic',
      placeholder: 'CAIXESBBXXX',
      inputProps: { className: 'font-mono text-sm' },
      helperText: '(pagos internacionales)',
      gridCol: 2,
    },
  ],
  DIRECT_DEBIT: [
    {
      key: 'paymentNote',
      label: 'Referencia mandato SEPA (opcional)',
      type: 'text',
      placeholder: 'Ej. SEPA-2024-0012',
    },
  ],
  CARD: [
    {
      key: 'paymentNote',
      label: 'Enlace de pago o instrucciones (opcional)',
      type: 'text',
      placeholder: 'https://pay.stripe.com/... o instrucciones para el cliente',
    },
  ],
  CASH: [],
  PAYPAL: [
    {
      key: 'paypalEmail',
      label: 'Email o enlace PayPal.me',
      type: 'email',
      placeholder: 'pagos@empresa.com  o  paypal.me/tuusuario',
    },
  ],
  OTHER: [
    {
      key: 'paymentNote',
      label: 'Detalla cómo debe realizar el pago',
      type: 'textarea',
      placeholder: 'Ej. Transferencia a Revolut: @tuusuario / Cheque a nombre de...',
    },
  ],
  BIZUM: [
    {
      key: 'bizumPhone',
      label: 'Número de teléfono',
      type: 'tel',
      placeholder: '+34 612 345 678',
    },
  ],
};

export function getPaymentDetailFields(method: PaymentMethod | 'BIZUM') {
  return PAYMENT_METHOD_DETAILS[method] ?? [];
}
