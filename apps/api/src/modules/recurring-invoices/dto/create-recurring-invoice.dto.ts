import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';
import { RecurringFrequency } from '@prisma/client';

export class RecurringInvoiceLineDto {
  @ApiPropertyOptional({ description: 'ID del producto existente (opcional)' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Descripción de la línea', minLength: 2, maxLength: 500 })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ description: 'Ocultar cantidad en PDF' })
  @IsOptional()
  @IsBoolean()
  hideQty?: boolean;

  @ApiProperty({ description: 'Cantidad', minimum: 0.0001 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ description: 'Precio unitario', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ description: 'Tipo de IVA (%)', enum: VALID_TAX_RATES })
  @IsNumber()
  @IsEnum(VALID_TAX_RATES)
  taxRate!: number;

  @ApiPropertyOptional({ description: 'Retención IRPF por línea (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  irpfRate?: number;
}

export class RecurringPaymentDetailsDto {
  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  bic?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  bizumPhone?: string;

  @IsOptional()
  @IsString()
  paypalEmail?: string;

  @IsOptional()
  @IsString()
  paymentNote?: string;
}

export class CreateRecurringInvoiceDto {
  @ApiProperty({ description: 'Nombre descriptivo de la recurrente' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional({ description: 'ID de la serie (usa la predeterminada si no se indica)' })
  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @ApiProperty({
    enum: RecurringFrequency,
    description: 'Frecuencia de generación',
  })
  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @ApiProperty({ description: 'Día del mes para generar (1-28)', minimum: 1, maximum: 28 })
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth!: number;

  @ApiProperty({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Número máximo de ocurrencias', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;

  @ApiProperty({ type: [RecurringInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringInvoiceLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  lines!: RecurringInvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Descuento global (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Retención IRPF global (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  irpfPercent?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ type: RecurringPaymentDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringPaymentDetailsDto)
  paymentDetails?: RecurringPaymentDetailsDto;

  @ApiPropertyOptional({ description: 'Notas adicionales', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Días de vencimiento desde emisión', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dueDays?: number;
}
