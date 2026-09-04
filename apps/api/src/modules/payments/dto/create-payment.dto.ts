import {
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Importe del cobro', example: 500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @ApiProperty({ description: 'Fecha del cobro', example: '2026-04-16' })
  @IsDateString({}, { message: 'La fecha del cobro no es válida' })
  paymentDate!: string;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Método de pago utilizado' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Referencia del cobro (nº transferencia, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales sobre el cobro' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
