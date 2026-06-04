import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Frequency, PaymentMethod } from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';
import { PaymentDetailsDto } from '../../invoices/dto/create-invoice.dto';

export class CreateRecurringInvoiceLineDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @MinLength(2, { message: 'La descripción debe tener al menos 2 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  description!: string;

  @IsOptional()
  @IsBoolean()
  hideQty?: boolean;

  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'La cantidad admite hasta 4 decimales' })
  @Min(0.0001, { message: 'La cantidad debe ser mayor a 0' })
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'El precio admite hasta 4 decimales' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  unitPrice!: number;

  @IsNumber({}, { message: 'El tipo de IVA debe ser un número' })
  @IsEnum(VALID_TAX_RATES, { message: 'El tipo de IVA debe ser 0, 4, 10 o 21' })
  taxRate!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(30)
  irpfRate?: number;
}

export class CreateRecurringInvoiceDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @IsEnum(Frequency, { message: 'La frecuencia debe ser MONTHLY, QUARTERLY, SEMIANNUAL o ANNUAL' })
  frequency!: Frequency;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'El día del mes debe estar entre 1 y 28' })
  @Max(28, {
    message:
      'El día del mes debe estar entre 1 y 28 (máximo 28 para compatibilidad con todos los meses)',
  })
  dayOfMonth?: number;

  @IsDateString({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  startDate!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' })
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(30)
  irpfPercent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  /** Per-template REAGYP compensation rate. If set, overrides the tenant reaypRate at generation time. */
  compensacionPercent?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  sourceInvoiceId?: string;

  @IsOptional()
  @IsObject()
  layoutOverride?: object;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecurringInvoiceLineDto)
  @ArrayMinSize(1, { message: 'La factura recurrente debe tener al menos una línea' })
  lines!: CreateRecurringInvoiceLineDto[];
}
