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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';
import { RecurringFrequency } from '@prisma/client';
import { RecurringInvoiceLineDto } from './create-recurring-invoice.dto';

export class UpdateRecurringInvoiceDto {
  @ApiPropertyOptional({ description: 'ID del cliente' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'ID de la serie de facturación' })
  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @ApiPropertyOptional({ enum: RecurringFrequency })
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ description: 'Día del mes (1-28)', minimum: 1, maximum: 28 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Número máximo de generaciones' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;

  @ApiPropertyOptional({ description: 'Descripción / título', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ type: [RecurringInvoiceLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringInvoiceLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  lines?: RecurringInvoiceLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  irpfPercent?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  paymentDetails?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dueDays?: number;

  @ApiPropertyOptional({ description: 'Sobreescribir nextRunDate manualmente (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  nextRunDate?: string;
}
