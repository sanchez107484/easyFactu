import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsBoolean,
  IsObject,
  ValidateIf,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';

export class CreateInvoiceLineDto {
  @ApiPropertyOptional({
    description:
      'ID de la línea existente (solo en updates). Si se incluye, la línea se actualizará en lugar de crearse de cero. Líneas sin id se crean nuevas, y las omitidas se borran.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'ID del producto existente (opcional)' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Descripción de la línea', minLength: 2, maxLength: 500 })
  @IsString()
  @MinLength(2, { message: 'La descripción debe tener al menos 2 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  description!: string;

  @ApiPropertyOptional({
    description:
      'Ocultar cantidad en la vista previa/PDF (servicios y líneas sin cantidad explícita)',
  })
  @IsOptional()
  @IsBoolean()
  hideQty?: boolean;

  @ApiProperty({ description: 'Cantidad (hasta 4 decimales)', minimum: 0.0001 })
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'La cantidad admite hasta 4 decimales' })
  @Min(0.0001, { message: 'La cantidad debe ser mayor a 0' })
  quantity!: number;

  @ApiProperty({ description: 'Precio unitario (hasta 2 decimales)', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio admite hasta 2 decimales' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  unitPrice!: number;

  @ApiProperty({ description: 'Tipo de IVA (%)', enum: VALID_TAX_RATES })
  @IsNumber({}, { message: 'El tipo de IVA debe ser un número' })
  @IsEnum(VALID_TAX_RATES, { message: 'El tipo de IVA debe ser 0, 4, 10 o 21' })
  taxRate!: number;

  @ApiPropertyOptional({ description: 'Descuento por línea (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El descuento admite hasta 2 decimales' })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Retención IRPF por línea (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El IRPF admite hasta 2 decimales' })
  @Min(0)
  @Max(100)
  irpfRate?: number;
}

export class PaymentDetailsDto {
  @ApiPropertyOptional({ description: 'IBAN para transferencia bancaria' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'BIC/SWIFT para transferencia bancaria' })
  @IsOptional()
  @IsString()
  bic?: string;

  @ApiPropertyOptional({ description: 'Titular de la cuenta bancaria' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ description: 'Teléfono Bizum' })
  @IsOptional()
  @IsString()
  bizumPhone?: string;

  @ApiPropertyOptional({ description: 'Email de PayPal' })
  @IsOptional()
  @IsString()
  paypalEmail?: string;

  @ApiPropertyOptional({ description: 'Nota de pago (referencia, etc.)' })
  @IsOptional()
  @IsString()
  paymentNote?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    description: 'ID de la serie (si no se indica, se usa la serie por defecto)',
  })
  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ description: 'Fecha de emisión (YYYY-MM-DD)' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Descuento global sobre el subtotal (%)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  @Max(100, { message: 'El descuento no puede superar el 100%' })
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Retención IRPF (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  irpfPercent?: number;

  @ApiPropertyOptional({
    description:
      'Porcentaje de compensación agraria REAGYP (%). ' +
      'Cuando el frontend lo envía, se usa directamente en lugar del tipo configurado en el tenant. ' +
      'Enviar 0 desactiva la compensación para esta factura.',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  compensacionPercent?: number;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Método de pago (obligatorio para facturas, opcional para presupuestos)',
  })
  @ValidateIf((o) => o.invoiceType !== 'quote' || !!o.paymentMethod)
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  @IsEnum(PaymentMethod, { message: 'Método de pago no válido' })
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    type: [CreateInvoiceLineDto],
    description: 'Líneas de la factura (mínimo 1, máximo 50)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  @ArrayMinSize(1, { message: 'La factura debe tener al menos una línea' })
  @ArrayMaxSize(50, { message: 'La factura no puede tener más de 50 líneas' })
  lines!: CreateInvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Notas adicionales', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Las notas no pueden superar los 1000 caracteres' })
  notes?: string;

  @ApiPropertyOptional({
    type: PaymentDetailsDto,
    description: 'Detalles adicionales del pago (estructura flexible según método)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @ApiPropertyOptional({
    enum: ['standard', 'proforma', 'simplified', 'quote'],
    description: "Tipo de documento: 'standard' | 'proforma' | 'simplified' | 'quote'",
    default: 'standard',
  })
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'proforma', 'simplified', 'quote'], {
    message: "El tipo de factura debe ser 'standard', 'proforma', 'simplified' o 'quote'",
  })
  invoiceType?: string;

  @ApiPropertyOptional({ description: 'Fecha límite de validez del presupuesto (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'ID de la plantilla de diseño a utilizar' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description:
      'Override parcial del layout de plantilla para esta factura (ej: ocultar columnas de tabla)',
  })
  @IsOptional()
  @IsObject()
  layoutOverride?: object;
}
