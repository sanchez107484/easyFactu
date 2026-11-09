import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';

export const REGISTRATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'ACCEPTED_WITH_WARNINGS',
  'REJECTED',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const RECORD_TYPES = ['F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'R4', 'R5'] as const;
export const ISSUED_INVOICE_STATUSES = ['ISSUED', 'RECTIFIED', 'CANCELLED'] as const;
export type IssuedInvoiceStatus = (typeof ISSUED_INVOICE_STATUSES)[number];

export const ACCOUNT_STATUSES = ['PENDING_CONSENT', 'ACTIVE', 'GRACE', 'ENDED'] as const;

export class InvoiceTotalsResponse {
  @ApiProperty({ example: '409.00' }) base!: string;
  @ApiProperty({ example: '50.69' }) tax!: string;
  @ApiProperty({ example: '459.69' }) total!: string;
}

export class TaxBreakdownResponse {
  @ApiProperty({ example: '10' }) rate!: string;
  @ApiProperty({ example: '320.00' }) base!: string;
  @ApiProperty({ example: '32.00' }) tax!: string;
}

export class RegistrationErrorResponse {
  @ApiProperty({ example: 'SUBMISSION_FAILED' }) code!: string;
  @ApiProperty({
    example: 'El envío a Hacienda ha fallado. La clínica puede reintentarlo desde NovaFactura.',
  })
  message!: string;
}

export class InvoiceCancellationResponse {
  @ApiProperty({ example: 'Ticket duplicado por error' }) reason!: string;
  @ApiProperty({ example: '2026-11-09T10:15:00.000Z' }) cancelledAt!: string;
  @ApiProperty({
    enum: REGISTRATION_STATUSES,
    description: 'Estado del registro de anulación en Hacienda',
    example: 'PENDING',
  })
  registrationStatus!: RegistrationStatus;
}

export class IntegrationInvoiceResponse {
  @ApiProperty({ example: '8f0c3a52-2c7e-4f1e-9a51-0d6b1f0f9c11' }) id!: string;
  @ApiProperty({ example: 'VENTA-2026-001234' }) externalRef!: string;
  @ApiProperty({ example: 'T-2026-000318' }) number!: string;
  @ApiProperty({ enum: ['standard', 'simplified'], example: 'simplified' }) invoiceType!: string;
  @ApiProperty({
    enum: RECORD_TYPES,
    description:
      'Tipo de registro VeriFactu: F1 completa, F2 simplificada, F3 canje de simplificadas, ' +
      'R4 rectificativa de completa, R5 rectificativa de simplificada',
    example: 'F2',
  })
  recordType!: string;
  @ApiProperty({
    enum: ISSUED_INVOICE_STATUSES,
    description:
      'CANCELLED tras un registro de anulación; RECTIFIED si se sustituyó desde NovaFactura',
    example: 'ISSUED',
  })
  status!: IssuedInvoiceStatus;
  @ApiProperty({ example: '2026-11-08' }) issueDate!: string;
  @ApiProperty({
    description: 'Igual a issueDate salvo que se indicase otra',
    example: '2026-11-08',
  })
  operationDate!: string;
  @ApiProperty({ nullable: true, description: 'Factura que rectifica (R4/R5)', example: null })
  rectifiedInvoiceId!: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Factura completa (F3) por la que se canjeó esta simplificada',
    example: null,
  })
  exchangedByInvoiceId!: string | null;
  @ApiProperty({
    type: [String],
    description: 'Simplificadas que sustituye (solo F3)',
    example: [],
  })
  replacedInvoiceIds!: string[];
  @ApiProperty({ type: InvoiceCancellationResponse, nullable: true })
  cancellation!: InvoiceCancellationResponse | null;
  @ApiProperty({ type: InvoiceTotalsResponse }) totals!: InvoiceTotalsResponse;
  @ApiProperty({ type: [TaxBreakdownResponse] }) taxBreakdown!: TaxBreakdownResponse[];
  @ApiProperty({ nullable: true, example: '3C464DAF61ACB827…' }) hash!: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Puede cambiar hasta que registrationStatus sea final',
    example: 'https://…',
  })
  qrUrl!: string | null;
  @ApiProperty({
    enum: REGISTRATION_STATUSES,
    description:
      'PENDING mientras se envía o reintenta; los demás son finales. Con PENDING, consulta con espera creciente.',
    example: 'PENDING',
  })
  registrationStatus!: RegistrationStatus;
  @ApiProperty({ type: RegistrationErrorResponse, nullable: true })
  registrationError!: RegistrationErrorResponse | null;
  @ApiProperty({ enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], example: 'UNPAID' })
  paymentStatus!: string;
  @ApiProperty({ example: '0.00' }) amountPaid!: string;
  @ApiProperty({
    description: 'Enlace a la factura en NovaFactura (requiere sesión)',
    example: 'https://app.novafactura.es/dashboard/facturas/8f0c…',
  })
  appUrl!: string;
}

export class IntegrationInvoiceListResponse {
  @ApiProperty({ type: [IntegrationInvoiceResponse] }) data!: IntegrationInvoiceResponse[];
}

export class PaginationMetaResponse {
  @ApiProperty({ example: 42 }) total!: number;
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
}

export class IntegrationCustomerInvoicesResponse {
  @ApiProperty({ type: [IntegrationInvoiceResponse] }) data!: IntegrationInvoiceResponse[];
  @ApiProperty({ type: PaginationMetaResponse }) meta!: PaginationMetaResponse;
}

export class IntegrationSettingsResponse {
  @ApiProperty({
    description: 'Importe máximo de una simplificada, IVA incluido',
    example: '400.00',
  })
  simplifiedInvoiceLimit!: string;
}

export class IntegrationPaymentResponse {
  @ApiProperty({ example: '5b7f0a7e-0a8a-4d2e-9a0f-1b2c3d4e5f60' }) id!: string;
  @ApiProperty({ example: '8f0c3a52-2c7e-4f1e-9a51-0d6b1f0f9c11' }) invoiceId!: string;
  @ApiProperty({ example: '459.69' }) amount!: string;
  @ApiProperty({ example: '2026-11-08' }) paymentDate!: string;
  @ApiProperty({ enum: PaymentMethod, nullable: true, example: PaymentMethod.CARD })
  paymentMethod!: string | null;
  @ApiProperty({ nullable: true, example: 'COBRO-2026-000777' }) reference!: string | null;
  @ApiProperty({ enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], example: 'PAID' })
  invoicePaymentStatus!: string;
  @ApiProperty({ example: '459.69' }) invoiceAmountPaid!: string;
  @ApiProperty({ example: '0.00' }) invoiceAmountDue!: string;
}

export class IntegrationAccountResponse {
  @ApiProperty({ example: 'b3d5…' }) accountId!: string;
  @ApiProperty({ example: 'EMP-0042' }) erpAccountId!: string;
  @ApiProperty({ description: 'Tenant de la clínica; lo usa el ERP en el SSO', example: 'a1c2…' })
  tenantId!: string;
  @ApiProperty({ enum: ACCOUNT_STATUSES, example: 'ACTIVE' }) status!: string;
  @ApiProperty({
    nullable: true,
    description:
      'Solo en la respuesta que crea la key; se muestra una vez. En un reintento idempotente vuelve null: pide otra con POST /accounts/{erpAccountId}/keys.',
    example: 'nfk_test_Q2x…',
  })
  apiKey!: string | null;
  @ApiPropertyOptional({ nullable: true, example: '2b1e…' }) keyId?: string | null;
  @ApiProperty({ example: 'https://api.novafactura.es/api/v1' }) apiUrl!: string;
  @ApiProperty({ example: 'https://app.novafactura.es' }) appUrl!: string;
}

export class IssuedApiKeyResponse {
  @ApiProperty({ example: '2b1e…' }) keyId!: string;
  @ApiProperty({
    nullable: true,
    description: 'Se muestra una sola vez. En un reintento idempotente vuelve null.',
    example: 'nfk_test_Q2x…',
  })
  apiKey!: string | null;
  @ApiProperty({ example: '2026-11-08T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({
    description: 'Las keys anteriores siguen válidas hasta esta fecha (24 h)',
    example: '2026-11-09T10:00:00.000Z',
  })
  previousKeysExpireAt!: string;
}

export class HealthResponse {
  @ApiProperty({ example: 'ok' }) status!: string;
}

export class ProblemFieldErrorResponse {
  @ApiProperty({ example: 'lines[0].taxRate' }) field!: string;
  @ApiProperty({ example: 'Tipo de IVA no permitido (0, 4, 10 o 21)' }) message!: string;
}

export class ProblemDetailsResponse {
  @ApiProperty({ example: 'https://docs.novafactura.es/errors/validation-error' }) type!: string;
  @ApiProperty({ example: 'Datos no válidos' }) title!: string;
  @ApiProperty({ example: 400 }) status!: number;
  @ApiProperty({ example: 'VALIDATION_ERROR' }) code!: string;
  @ApiProperty({ example: false }) retryable!: boolean;
  @ApiProperty({ example: 'La petición tiene datos no válidos' }) detail!: string;
  @ApiProperty({ example: 'req_2f6c…' }) requestId!: string;
  @ApiPropertyOptional({ type: [ProblemFieldErrorResponse] }) errors?: ProblemFieldErrorResponse[];
}
