import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaymentMethod } from '@easyfactura/shared-types';

export class RegisterPaymentDto {
  @ApiProperty({
    description: 'Importe cobrado, mayor que 0, hasta 2 decimales',
    example: '459.69',
  })
  @Matches(/^(?!0+(\.0+)?$)\d{1,9}(\.\d{1,2})?$/, {
    message: 'Importe mayor que 0 con hasta 2 decimales, p. ej. "35.00"',
  })
  amount!: string;

  @ApiPropertyOptional({
    description: 'Fecha del cobro (YYYY-MM-DD). Por defecto, hoy.',
    example: '2026-11-08',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha con formato YYYY-MM-DD' })
  paymentDate?: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  @IsEnum(PaymentMethod, { message: 'Método de pago no permitido' })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Referencia del cobro en el ERP',
    example: 'COBRO-2026-000777',
  })
  @IsOptional()
  @IsString({ message: 'Debe ser texto' })
  @MaxLength(255, { message: 'Máximo 255 caracteres' })
  reference?: string;
}
