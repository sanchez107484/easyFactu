import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@easyfactura/shared-types';
import { MAX_LINES_PER_INVOICE } from '../integrations.constants';
import {
  EXTERNAL_ID_PATTERN,
  InvoicePayerDto,
  ISO_DATE_PATTERN,
  IssueInvoiceLineDto,
} from './issue-invoice.dto';

export const MAX_EXCHANGED_INVOICES = 50;

const EXTERNAL_REF_MESSAGE = 'externalRef: 1 a 100 caracteres (letras, números y . _ : / -)';

class ReasonDto {
  @ApiProperty({
    description: 'Motivo (se guarda en NovaFactura)',
    example: 'Devolución de la montura',
  })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(5, { message: 'Mínimo 5 caracteres' })
  @MaxLength(500, { message: 'Máximo 500 caracteres' })
  reason!: string;
}

/** Return (devolución) of all or part of an invoice: a rectificative by differences. */
export class RectifyIssuedInvoiceDto extends ReasonDto {
  @ApiProperty({
    description: 'Id de la devolución en el ERP, único por clínica (como el de una factura)',
    example: 'DEV-2026-000045',
  })
  @Matches(EXTERNAL_ID_PATTERN, { message: EXTERNAL_REF_MESSAGE })
  externalRef!: string;

  @ApiPropertyOptional({
    description: 'Fecha de la devolución (YYYY-MM-DD) si es anterior a hoy. Por defecto, hoy.',
    example: '2026-11-08',
  })
  @IsOptional()
  @Matches(ISO_DATE_PATTERN, { message: 'Fecha con formato YYYY-MM-DD' })
  operationDate?: string;

  @ApiProperty({
    type: [IssueInvoiceLineDto],
    description:
      'Líneas devueltas con el importe devuelto IVA incluido, en positivo. La rectificativa ' +
      'las registra en negativo. Cada tipo de IVA debe existir en la factura original.',
  })
  @IsDefined({ message: 'Obligatorio' })
  @IsArray({ message: 'Debe ser una lista' })
  @ArrayMinSize(1, { message: 'Al menos una línea' })
  @ArrayMaxSize(MAX_LINES_PER_INVOICE, { message: `Máximo ${MAX_LINES_PER_INVOICE} líneas` })
  @ValidateNested({ each: true })
  @Type(() => IssueInvoiceLineDto)
  lines!: IssueInvoiceLineDto[];
}

/** Exchange (canje) of simplified invoices for one complete invoice (F3). */
export class ExchangeSimplifiedInvoicesDto {
  @ApiProperty({ description: 'Id de la factura completa en el ERP', example: 'CANJE-2026-000012' })
  @Matches(EXTERNAL_ID_PATTERN, { message: EXTERNAL_REF_MESSAGE })
  externalRef!: string;

  @ApiProperty({
    description: 'Ids (NovaFactura) de las facturas simplificadas que se canjean',
    example: ['8f0c3a52-2c7e-4f1e-9a51-0d6b1f0f9c11'],
  })
  @IsArray({ message: 'Debe ser una lista' })
  @ArrayMinSize(1, { message: 'Al menos una factura' })
  @ArrayMaxSize(MAX_EXCHANGED_INVOICES, { message: `Máximo ${MAX_EXCHANGED_INVOICES} facturas` })
  @ArrayUnique({ message: 'Facturas repetidas' })
  @IsUUID('4', { each: true, message: 'Id de factura no válido' })
  invoiceIds!: string[];

  @ApiProperty({
    type: InvoicePayerDto,
    description: 'Destinatario de la factura completa: NIF y domicilio obligatorios',
  })
  @IsDefined({ message: 'Obligatorio' })
  @ValidateNested()
  @Type(() => InvoicePayerDto)
  customer!: InvoicePayerDto;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Método de pago no permitido' })
  paymentMethod?: PaymentMethod;
}

/** Cancellation record: the invoice should never have been issued. */
export class CancelInvoiceDto extends ReasonDto {}
