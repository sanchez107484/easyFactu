import {
  IsString,
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { Frequency, PaymentMethod } from '@easyfactura/shared-types';
import { CreateRecurringInvoiceLineDto } from './create-recurring-invoice.dto';
import { PaymentDetailsDto } from '../../invoices/dto/create-invoice.dto';

export class UpdateRecurringInvoiceDto {
  @IsOptional()
  @IsEnum(Frequency)
  frequency?: Frequency;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(30)
  irpfPercent?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  /** Per-template REAGYP compensation rate. Pass null to clear (fall back to tenant rate). */
  compensacionPercent?: number | null;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecurringInvoiceLineDto)
  @ArrayMinSize(1)
  lines?: CreateRecurringInvoiceLineDto[];

  @IsOptional()
  @IsObject()
  layoutOverride?: object | null;
}
