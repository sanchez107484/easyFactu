import { Invoice, PaymentMethod } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { formatIban } from '@easyfactura/shared-validators';

export interface PaymentDetails {
  iban?: string;
  bic?: string;
  accountHolder?: string;
  bizumPhone?: string;
  paypalEmail?: string;
  paymentNote?: string;
}

interface PaymentDetailsBlockProps {
  invoice: Invoice;
  paymentDetails?: PaymentDetails;
  primaryColor: string;
}

export function PaymentDetailsBlock({
  invoice,
  paymentDetails,
  primaryColor,
}: PaymentDetailsBlockProps) {
  const method = invoice.paymentMethod as string | null;

  if (!method) return null;

  const methodLabel = PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;
  const hasDetails =
    paymentDetails?.iban ||
    paymentDetails?.bizumPhone ||
    paymentDetails?.paypalEmail ||
    paymentDetails?.paymentNote ||
    paymentDetails?.accountHolder;

  return (
    <div
      style={{
        borderTop: `1.5px solid #e5e7eb`,
        paddingTop: '10px',
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <p
        style={{
          fontSize: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b7280',
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        Método de pago
      </p>

      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: primaryColor,
            marginBottom: hasDetails ? '4px' : '0',
          }}
        >
          {methodLabel}
        </p>

        {method === PaymentMethod.BANK_TRANSFER && (
          <>
            {paymentDetails?.iban ? (
              <p
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  color: '#111827',
                  fontWeight: 600,
                }}
              >
                {formatIban(paymentDetails.iban)}
              </p>
            ) : (
              <p style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>
                Añade tu IBAN en el formulario
              </p>
            )}
            {paymentDetails?.accountHolder && (
              <p style={{ fontSize: '9px', color: '#6b7280' }}>
                Titular: {paymentDetails.accountHolder}
              </p>
            )}
            {paymentDetails?.bic && (
              <p
                style={{
                  fontSize: '9px',
                  color: '#6b7280',
                }}
              >
                BIC/SWIFT: {paymentDetails.bic}
              </p>
            )}
          </>
        )}

        {method === 'BIZUM' && (
          <>
            {paymentDetails?.bizumPhone ? (
              <p
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  color: '#111827',
                  fontWeight: 600,
                }}
              >
                {paymentDetails.bizumPhone}
              </p>
            ) : (
              <p style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>
                Añade tu número de teléfono en el formulario
              </p>
            )}
          </>
        )}

        {method === PaymentMethod.PAYPAL && (
          <>
            {paymentDetails?.paypalEmail ? (
              <p style={{ fontSize: '10px', color: '#1d4ed8' }}>{paymentDetails.paypalEmail}</p>
            ) : (
              <p style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>
                Añade tu email o enlace de PayPal en el formulario
              </p>
            )}
          </>
        )}

        {method === PaymentMethod.DIRECT_DEBIT && (
          <>
            <p style={{ fontSize: '9px', color: '#6b7280' }}>
              El importe se cargará automáticamente en la cuenta del cliente en la fecha de
              vencimiento.
            </p>
            {paymentDetails?.paymentNote && (
              <p style={{ fontSize: '9px', color: '#6b7280' }}>
                Ref. SEPA: {paymentDetails.paymentNote}
              </p>
            )}
          </>
        )}

        {method === PaymentMethod.CARD && paymentDetails?.paymentNote && (
          <p style={{ fontSize: '9px', color: '#6b7280' }}>{paymentDetails.paymentNote}</p>
        )}

        {method === PaymentMethod.CASH && (
          <p style={{ fontSize: '9px', color: '#6b7280' }}>
            Límite legal: 1.000 € entre empresarios / 2.500 € con particulares.
          </p>
        )}

        {method === PaymentMethod.OTHER && paymentDetails?.paymentNote && (
          <p style={{ fontSize: '9px', color: '#6b7280' }}>{paymentDetails.paymentNote}</p>
        )}
      </div>
    </div>
  );
}
