import {
  IsNumber,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, SELECTABLE_PAYMENT_METHODS } from '@easyfactura/shared-types';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Importe del cobro/abono. Negativo para notas de crédito.',
    example: 500.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({ message: 'El importe es obligatorio' })
  amount!: number;

  @ApiProperty({ description: 'Fecha del cobro', example: '2026-04-16' })
  @IsDateString({}, { message: 'La fecha del cobro no es válida' })
  paymentDate!: string;

  @ApiPropertyOptional({
    enum: SELECTABLE_PAYMENT_METHODS,
    description: 'Método de pago utilizado',
  })
  @IsOptional()
  @IsIn(SELECTABLE_PAYMENT_METHODS, { message: 'Método de pago no válido' })
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
