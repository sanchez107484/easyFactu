import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';

export const REGISTRATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'ACCEPTED_WITH_WARNINGS',
  'REJECTED',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

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

export class IntegrationInvoiceResponse {
  @ApiProperty({ example: '8f0c3a52-2c7e-4f1e-9a51-0d6b1f0f9c11' }) id!: string;
  @ApiProperty({ example: 'VENTA-2026-001234' }) externalRef!: string;
  @ApiProperty({ example: 'T-2026-000318' }) number!: string;
  @ApiProperty({ enum: ['standard', 'simplified'], example: 'simplified' }) invoiceType!: string;
  @ApiProperty({ example: '2026-11-08' }) issueDate!: string;
  @ApiProperty({ example: '2026-11-08' }) operationDate!: string;
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
