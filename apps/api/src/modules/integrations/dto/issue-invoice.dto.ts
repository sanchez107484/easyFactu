import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsDefined,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@easyfactura/shared-types';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';
import { MAX_LINES_PER_INVOICE } from '../integrations.constants';
import { IntegrationAddressDto } from './integration-address.dto';

export const ISSUABLE_INVOICE_TYPES = ['standard', 'simplified'] as const;
export type IssuableInvoiceType = (typeof ISSUABLE_INVOICE_TYPES)[number];

const EXTERNAL_ID_PATTERN = /^[A-Za-z0-9._:/-]{1,100}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class InvoicePayerDto {
  @ApiProperty({
    description: 'Id del pagador en el ERP. Crea o actualiza el cliente por este valor.',
    example: 'PAG-000981',
  })
  @Matches(EXTERNAL_ID_PATTERN, {
    message: 'externalId: 1 a 100 caracteres (letras, números y . _ : / -)',
  })
  externalId!: string;

  @ApiProperty({ description: 'Nombre o razón social del pagador', example: 'Laura Gómez Ruiz' })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  name!: string;

  @ApiProperty({
    description: 'NIF, NIE o CIF del pagador. Obligatorio en los dos tipos de factura.',
    example: '12345678Z',
  })
  @IsString({ message: 'Debe ser texto' })
  @IsValidNif({ message: 'NIF, NIE o CIF no válido' })
  nif!: string;

  @ApiPropertyOptional({ example: 'laura@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email no válido' })
  @MaxLength(255, { message: 'Máximo 255 caracteres' })
  email?: string;

  @ApiPropertyOptional({
    type: IntegrationAddressDto,
    description: 'Domicilio del pagador. Obligatorio en facturas completas (standard).',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IntegrationAddressDto)
  address?: IntegrationAddressDto;
}

export class IssueInvoiceLineDto {
  @ApiProperty({
    description: 'Descripción comercial (nunca graduaciones ni diagnósticos)',
    example: 'Gafas graduadas progresivas',
  })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  @MaxLength(500, { message: 'Máximo 500 caracteres' })
  description!: string;

  @ApiProperty({ description: 'Cantidad, hasta 4 decimales, mayor que 0', example: '1' })
  @Matches(/^(?!0+(\.0+)?$)\d{1,8}(\.\d{1,4})?$/, {
    message: 'Cantidad mayor que 0 con hasta 4 decimales, p. ej. "1" o "0.5"',
  })
  quantity!: string;

  @ApiProperty({
    description: 'Precio unitario cobrado, IVA incluido, hasta 2 decimales',
    example: '352.00',
  })
  @Matches(/^\d{1,9}(\.\d{1,2})?$/, {
    message: 'Importe con punto decimal y hasta 2 decimales, p. ej. "35.00"',
  })
  unitPriceWithTax!: string;

  @ApiProperty({ description: 'Tipo de IVA (%)', enum: ['0', '4', '10', '21'], example: '10' })
  @Matches(/^(0|4|10|21)(\.0{1,2})?$/, { message: 'Tipo de IVA no permitido (0, 4, 10 o 21)' })
  taxRate!: string;

  @ApiPropertyOptional({
    description: 'Descuento de la línea (%), hasta 2 decimales',
    example: '0',
  })
  @IsOptional()
  @Matches(/^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/, {
    message: 'Descuento entre 0 y 100 con hasta 2 decimales',
  })
  discountPercent?: string;
}

export class IssueInvoiceDto {
  @ApiProperty({
    description:
      'Id de la factura en el ERP, único por clínica. Si una venta se reparte entre varios pagadores, una referencia por factura.',
    example: 'VENTA-2026-001234',
  })
  @Matches(EXTERNAL_ID_PATTERN, {
    message: 'externalRef: 1 a 100 caracteres (letras, números y . _ : / -)',
  })
  externalRef!: string;

  @ApiProperty({ enum: ISSUABLE_INVOICE_TYPES, example: 'simplified' })
  @IsIn(ISSUABLE_INVOICE_TYPES, { message: "Debe ser 'standard' o 'simplified'" })
  invoiceType!: IssuableInvoiceType;

  @ApiPropertyOptional({
    description: 'Fecha de la operación (YYYY-MM-DD). Por defecto, hoy.',
    example: '2026-11-08',
  })
  @IsOptional()
  @Matches(ISO_DATE_PATTERN, { message: 'Fecha con formato YYYY-MM-DD' })
  operationDate?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Método de pago no permitido' })
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    type: InvoicePayerDto,
    description: 'Pagador: el cliente de la factura. Siempre obligatorio.',
  })
  @IsDefined({ message: 'Obligatorio' })
  @ValidateNested()
  @Type(() => InvoicePayerDto)
  customer!: InvoicePayerDto;

  @ApiProperty({ type: [IssueInvoiceLineDto] })
  @IsDefined({ message: 'Obligatorio' })
  @IsArray({ message: 'Debe ser una lista' })
  @ArrayMinSize(1, { message: 'Al menos una línea' })
  @ArrayMaxSize(MAX_LINES_PER_INVOICE, { message: `Máximo ${MAX_LINES_PER_INVOICE} líneas` })
  @ValidateNested({ each: true })
  @Type(() => IssueInvoiceLineDto)
  lines!: IssueInvoiceLineDto[];

  @ApiPropertyOptional({
    description:
      'Datos propios de un régimen (p. ej. foral). Opcional; el régimen lo decide la cuenta.',
    nullable: true,
    example: null,
  })
  @IsOptional()
  @IsObject({ message: 'Debe ser un objeto' })
  regimeData?: Record<string, unknown> | null;
}
