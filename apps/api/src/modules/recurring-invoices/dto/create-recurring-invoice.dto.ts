import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
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

  @ApiProperty({ description: 'Cantidad' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ description: 'Precio unitario' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ description: 'Tipo de IVA (%)' })
  @IsNumber()
  @IsEnum(VALID_TAX_RATES, { message: 'El tipo de IVA debe ser 0, 4, 10 o 21' })
  taxRate!: number;

  @ApiPropertyOptional({ description: 'Retención IRPF por línea (%)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  irpfRate?: number;

  @ApiPropertyOptional({ description: 'Ocultar cantidad en PDF' })
  @IsOptional()
  hideQty?: boolean;
}

export class CreateRecurringInvoiceDto {
  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional({ description: 'ID de la serie de facturación' })
  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @ApiProperty({ enum: RecurringFrequency, description: 'Frecuencia de generación' })
  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @ApiProperty({ description: 'Día del mes en que se genera (1-28)', minimum: 1, maximum: 28 })
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

  @ApiPropertyOptional({ description: 'Número máximo de generaciones' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;

  @ApiPropertyOptional({ description: 'Descripción / título de la recurrente', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ type: [RecurringInvoiceLineDto], description: 'Líneas de la factura' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringInvoiceLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  lines!: RecurringInvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Descuento global (%)' })
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

  @ApiPropertyOptional({ description: 'Detalles de pago (IBAN, BIC, etc.)' })
  @IsOptional()
  paymentDetails?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Notas de la factura', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Días de vencimiento desde la fecha de emisión' })
  @IsOptional()
  @IsInt()
  @Min(0)
  dueDays?: number;
}
