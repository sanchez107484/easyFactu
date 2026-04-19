'use client';

import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { CustomerCombobox } from '@/components/clientes/CustomerCombobox';
import { DueDatePicker } from '@/components/facturas/DueDatePicker';
import {
  PaymentDetailsFields,
  PaymentDetailsValues,
} from '@/components/facturas/PaymentDetailsFields';
import { formatSeriesPreview } from '@easyfactura/shared-validators';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import {
  PaymentMethod,
  Customer,
  SharedPoolCustomer,
  InvoiceSeries,
  Tenant,
  InvoiceDefaults,
} from '@easyfactura/shared-types';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { extendedLineSchema } from '@/lib/invoice-line-types';

// Local FormData type to avoid circular import — must match the schema in nueva/page.tsx
type FormData = {
  customerId: string;
  issueDate: string;
  dueDate?: string;
  seriesId?: string;
  discountPercent?: number;
  irpfPercent?: number;
  paymentMethod?: PaymentMethod;
  paymentDetails?: {
    iban?: string;
    bic?: string;
    accountHolder?: string;
    bizumPhone?: string;
    paypalEmail?: string;
    paymentNote?: string;
  };
  notes?: string;
  lines: z.infer<typeof extendedLineSchema>[];
};

// ==================== PROPS ====================

interface InvoiceGeneralDataCardProps {
  form: UseFormReturn<FormData>;
  customers: Customer[];
  loadingCustomers: boolean;
  sharedPool: SharedPoolCustomer[] | undefined;
  loadingShared: boolean;
  availableSeries: InvoiceSeries[];
  effectiveSeriesId: string;
  isProforma: boolean;
  tenantData: Tenant | null | undefined;
  currentTenant: Tenant | null | undefined;
  invoiceDefaults: InvoiceDefaults | null | undefined;
  isDuplicate: boolean;
  editDraftId?: string;
  defaultPaymentMethod: PaymentMethod | undefined;
  onActiveSection: (section: string) => void;
  onCreateCustomer: () => void;
  onSearchChange: (v: string) => void;
  onSelectSharedCustomer: (customer: SharedPoolCustomer) => void;
}

// ==================== COMPONENT ====================

export function InvoiceGeneralDataCard({
  form,
  customers,
  loadingCustomers,
  sharedPool,
  loadingShared,
  availableSeries,
  effectiveSeriesId,
  isProforma,
  tenantData,
  currentTenant,
  invoiceDefaults,
  isDuplicate,
  editDraftId,
  defaultPaymentMethod,
  onActiveSection,
  onCreateCustomer,
  onSearchChange,
  onSelectSharedCustomer,
}: InvoiceGeneralDataCardProps) {
  const { customerId, issueDate, dueDate, paymentMethod, paymentDetails } = form.watch();
  const activePaymentMethod = paymentMethod as PaymentMethod | undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Datos generales</CardTitle>
        {!invoiceDefaults && !isDuplicate && !editDraftId && (
          <p className="text-xs text-muted-foreground">
            ¿Siempre usas los mismos datos?{' '}
            <Link
              href="/dashboard/ajustes/facturacion"
              className="text-primary underline underline-offset-2"
            >
              Configura tus preferencias
            </Link>{' '}
            para ahorrar tiempo.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cliente */}
        <section
          id="field-customerId"
          className="space-y-2"
          onFocus={() => onActiveSection('customerId')}
        >
          <Label>
            Cliente <span className="text-destructive">*</span>
          </Label>
          {loadingCustomers ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <CustomerCombobox
              customers={customers}
              value={customerId || ''}
              onChange={(v) => form.setValue('customerId', v, { shouldValidate: true })}
              hasError={!!form.formState.errors.customerId}
              sharedCustomers={sharedPool}
              isLoadingShared={loadingShared}
              onSearchChange={onSearchChange}
              onSelectShared={onSelectSharedCustomer}
            />
          )}
          {form.formState.errors.customerId && (
            <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>
          )}
          <button
            type="button"
            onClick={onCreateCustomer}
            className="text-sm text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
          >
            + Crear nuevo cliente
          </button>
        </section>

        {/* Fechas */}
        <section
          id="field-issueDate"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onFocus={() => onActiveSection('issueDate')}
        >
          <div className="space-y-2">
            <Label htmlFor="issueDate">
              Fecha emisión <span className="text-destructive">*</span>
            </Label>
            <Input id="issueDate" type="date" {...form.register('issueDate')} />
            {form.formState.errors.issueDate && (
              <p className="text-sm text-destructive">{form.formState.errors.issueDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Fecha vencimiento</Label>
            <DueDatePicker
              issueDate={issueDate}
              value={dueDate}
              onChange={(date) => form.setValue('dueDate', date, { shouldDirty: true })}
            />
          </div>
        </section>

        {/* Serie de facturación */}
        {!isProforma && (
          <section
            id="field-seriesId"
            className="space-y-2"
            onFocus={() => onActiveSection('seriesId')}
          >
            <Label>
              Serie de facturación <span className="text-destructive">*</span>
            </Label>
            <Select
              value={effectiveSeriesId}
              onValueChange={(v) => form.setValue('seriesId', v, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una serie" />
              </SelectTrigger>
              <SelectContent>
                {availableSeries.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {' — '}
                    <span className="font-mono text-xs">
                      {formatSeriesPreview(s.prefix, s.year, s.nextNumber)}
                    </span>
                    {s.isDefault && (
                      <span className="ml-1 text-[10px] text-primary">(por defecto)</span>
                    )}
                  </SelectItem>
                ))}
                {availableSeries.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    No hay series activas.{' '}
                    <Link href="/dashboard/ajustes/facturacion" className="underline text-primary">
                      Crea una en ajustes
                    </Link>
                  </div>
                )}
              </SelectContent>
            </Select>
          </section>
        )}

        {/* Método de pago */}
        <section
          id="field-paymentMethod"
          className="space-y-3"
          onFocus={() => onActiveSection('paymentMethod')}
        >
          <Label>
            Método de pago <span className="text-destructive">*</span>
          </Label>
          <Select
            value={activePaymentMethod || ''}
            onValueChange={(v) => {
              form.setValue('paymentMethod', v as PaymentMethod, { shouldValidate: true });
              if (v !== defaultPaymentMethod) {
                form.setValue('paymentDetails', {});
              }
              if (v === PaymentMethod.BANK_TRANSFER) {
                const tenant = tenantData ?? currentTenant;
                if (tenant?.iban && !form.getValues('paymentDetails.iban')) {
                  form.setValue('paymentDetails.iban', tenant.iban, { shouldDirty: true });
                }
                if (tenant?.bankAccountHolder && !form.getValues('paymentDetails.accountHolder')) {
                  form.setValue('paymentDetails.accountHolder', tenant.bankAccountHolder, {
                    shouldDirty: true,
                  });
                }
              }
            }}
          >
            <SelectTrigger
              className={form.formState.errors.paymentMethod ? 'border-destructive' : ''}
            >
              <SelectValue placeholder="Selecciona un método" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.paymentMethod && (
            <p className="text-sm text-destructive">
              {form.formState.errors.paymentMethod.message}
            </p>
          )}
          {activePaymentMethod && (
            <PaymentDetailsFields
              paymentMethod={activePaymentMethod}
              values={(paymentDetails ?? {}) as PaymentDetailsValues}
              onChange={(key, value) =>
                form.setValue(
                  `paymentDetails.${key}` as `paymentDetails.${keyof PaymentDetailsValues}`,
                  value,
                  { shouldDirty: true },
                )
              }
              tenantIban={(tenantData ?? currentTenant)?.iban ?? undefined}
              tenantAccountHolder={(tenantData ?? currentTenant)?.bankAccountHolder ?? undefined}
            />
          )}
        </section>
      </CardContent>
    </Card>
  );
}
