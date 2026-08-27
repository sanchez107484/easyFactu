import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringExpenseFrequency } from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';

export class CreateRecurringExpenseDto {
  @ApiProperty({ description: 'Concepto del gasto recurrente', minLength: 2, maxLength: 255 })
  @IsString()
  @MinLength(2, { message: 'El concepto debe tener al menos 2 caracteres' })
  @MaxLength(255, { message: 'El concepto no puede superar los 255 caracteres' })
  description!: string;

  @ApiProperty({ description: 'ID de la categoría de gasto' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ description: 'ID del proveedor' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID del cliente asociado' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Base imponible', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La base imponible admite hasta 2 decimales' })
  @Min(0.01, { message: 'La base imponible debe ser mayor que 0' })
  @Max(999_999_999.99, { message: 'La base imponible no puede superar los 999.999.999,99 €' })
  baseAmount!: number;

  @ApiProperty({ description: 'Tipo de IVA (%)', enum: VALID_TAX_RATES })
  @IsNumber({}, { message: 'El tipo de IVA debe ser un número' })
  @IsEnum(VALID_TAX_RATES, { message: 'El tipo de IVA debe ser 0, 4, 10 o 21' })
  vatRate!: number;

  @ApiProperty({ description: 'Frecuencia de generación', enum: RecurringExpenseFrequency })
  @IsEnum(RecurringExpenseFrequency, { message: 'La frecuencia no es válida' })
  frequency!: RecurringExpenseFrequency;

  @ApiProperty({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'Fecha de fin opcional (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Las notas no pueden superar los 2000 caracteres' })
  notes?: string;
}
