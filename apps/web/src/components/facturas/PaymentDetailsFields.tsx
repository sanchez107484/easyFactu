'use client';

import { PaymentMethod } from '@easyfactura/shared-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_METHOD_SECTION_LABELS } from '@easyfactura/shared-constants';
import { formatIban } from '@easyfactura/shared-validators';
import { getPaymentDetailFields } from '@/lib/payment-method-details';

export interface PaymentDetailsValues {
  iban?: string;
  bic?: string;
  accountHolder?: string;
  bizumPhone?: string;
  paypalEmail?: string;
  paymentNote?: string;
}

interface PaymentDetailsFieldsProps {
  paymentMethod: PaymentMethod;
  values: PaymentDetailsValues;
  onChange: (key: keyof PaymentDetailsValues, value: string) => void;
  tenantIban?: string;
  tenantAccountHolder?: string;
}

export function PaymentDetailsFields({
  paymentMethod,
  values,
  onChange,
  tenantIban,
  tenantAccountHolder,
}: PaymentDetailsFieldsProps) {
  const handleIbanChange = (raw: string) => {
    onChange('iban', formatIban(raw));
  };

  const isBankTransfer = paymentMethod === PaymentMethod.BANK_TRANSFER;

  const tenantIbanClean = tenantIban?.replace(/\s/g, '') ?? '';
  const valuesIbanClean = values.iban?.replace(/\s/g, '') ?? '';

  const effectiveIban =
    isBankTransfer && !valuesIbanClean && tenantIbanClean
      ? formatIban(tenantIban!)
      : values.iban
        ? formatIban(values.iban)
        : undefined;

  const effectiveHolder =
    isBankTransfer && !values.accountHolder && tenantAccountHolder
      ? tenantAccountHolder
      : values.accountHolder;

  const isSyncedWithTenant =
    isBankTransfer &&
    !!tenantIbanClean &&
    (tenantIbanClean === valuesIbanClean || !valuesIbanClean);

  const isDifferentFromTenant =
    isBankTransfer && !!tenantIbanClean && !!valuesIbanClean && tenantIbanClean !== valuesIbanClean;

  const isNewIban = isBankTransfer && !tenantIbanClean && !!valuesIbanClean;

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {PAYMENT_METHOD_SECTION_LABELS[paymentMethod]}
      </p>

      {paymentMethod === PaymentMethod.CASH && (
        <p className="text-sm text-muted-foreground">
          💡 Recuerda: la normativa española limita los pagos en efectivo a <strong>1.000 €</strong>{' '}
          entre empresarios y autónomos (2.500 € con particulares).
        </p>
      )}

      {isBankTransfer && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="pd-iban" className="text-sm">
              IBAN
            </Label>
            <Input
              id="pd-iban"
              placeholder="ES91 2100 0418 4502 0005 1332"
              className="font-mono text-sm tracking-wider"
              value={effectiveIban ?? ''}
              onChange={(e) => handleIbanChange(e.target.value)}
            />

            {isSyncedWithTenant && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span>✓ Sincronizado con tus</span>
                <a
                  href="/dashboard/ajustes/empresa"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  datos de empresa
                </a>
              </p>
            )}

            {isDifferentFromTenant && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 flex-wrap">
                <span>
                  Diferente al guardado en Empresa ({tenantIban ? formatIban(tenantIban) : ''}).
                </span>
                <button
                  type="button"
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                  onClick={() => {
                    onChange('iban', tenantIban!);
                    onChange('accountHolder', tenantAccountHolder ?? values.accountHolder ?? '');
                  }}
                >
                  Usar el de Empresa
                </button>
              </p>
            )}

            {isNewIban && (
              <p className="text-xs text-muted-foreground">
                Al guardar, este IBAN también se actualizará en tus{' '}
                <a
                  href="/dashboard/ajustes/empresa"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  datos de empresa
                </a>
                .
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Titular de la cuenta</Label>
              <Input
                placeholder="Nombre Apellidos / Empresa S.L."
                value={effectiveHolder ?? ''}
                onChange={(e) => onChange('accountHolder', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">
                BIC/SWIFT{' '}
                <span className="text-muted-foreground font-normal">(pagos internacionales)</span>
              </Label>
              <Input
                placeholder="CAIXESBBXXX"
                className="font-mono text-sm"
                value={values.bic ?? ''}
                onChange={(e) => onChange('bic', e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {paymentMethod !== PaymentMethod.BANK_TRANSFER &&
        paymentMethod !== PaymentMethod.CASH &&
        getPaymentDetailFields(paymentMethod).map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-sm">
              {field.label}
              {field.helperText && (
                <span className="text-muted-foreground font-normal ml-1">{field.helperText}</span>
              )}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                placeholder={field.placeholder}
                rows={2}
                value={values[field.key as keyof PaymentDetailsValues] ?? ''}
                onChange={(e) => onChange(field.key as keyof PaymentDetailsValues, e.target.value)}
              />
            ) : (
              <Input
                type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                placeholder={field.placeholder}
                className={field.inputProps?.className}
                value={values[field.key as keyof PaymentDetailsValues] ?? ''}
                onChange={(e) => onChange(field.key as keyof PaymentDetailsValues, e.target.value)}
              />
            )}
          </div>
        ))}
    </div>
  );
}
