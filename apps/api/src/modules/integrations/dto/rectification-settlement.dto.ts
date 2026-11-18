import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, ValidateNested, IsIn } from 'class-validator';
import { PaymentMethod, SELECTABLE_PAYMENT_METHODS } from '@easyfactura/shared-types';
import { ISO_DATE_PATTERN } from './issue-invoice.dto';

const POSITIVE_AMOUNT_PATTERN = /^(?!0+(\.0+)?$)\d{1,9}(\.\d{1,2})?$/;
const POSITIVE_AMOUNT_MESSAGE = 'Importe mayor que 0 con hasta 2 decimales, p. ej. "35.00"';

/** Money given back to the payer: a negative payment on the rectificative. */
export class SettlementRefundDto {
  @ApiProperty({ description: 'Importe reembolsado, en positivo', example: '80.00' })
  @Matches(POSITIVE_AMOUNT_PATTERN, { message: POSITIVE_AMOUNT_MESSAGE })
  amount!: string;

  @ApiProperty({ enum: SELECTABLE_PAYMENT_METHODS, example: PaymentMethod.CARD })
  @IsIn(SELECTABLE_PAYMENT_METHODS, { message: 'Método de pago no permitido' })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Fecha del reembolso (YYYY-MM-DD), no posterior a hoy. Por defecto, hoy.',
    example: '2026-11-18',
  })
  @IsOptional()
  @Matches(ISO_DATE_PATTERN, { message: 'Fecha con formato YYYY-MM-DD' })
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Referencia del reembolso en el ERP', example: 'REEMB-0045' })
  @IsOptional()
  @IsString({ message: 'Debe ser texto' })
  @MaxLength(255, { message: 'Máximo 255 caracteres' })
  reference?: string;
}

/** Part of the return offset against what the payer still owes on the original invoice. */
export class SettlementCompensationDto {
  @ApiProperty({
    description: 'Importe compensado con lo pendiente de la factura original, en positivo',
    example: '27.69',
  })
  @Matches(POSITIVE_AMOUNT_PATTERN, { message: POSITIVE_AMOUNT_MESSAGE })
  amount!: string;
}

/**
 * How a return is settled, as in the ERP. refund + compensation must equal the total of the
 * rectificative (in positive). Without settlement the rectificative stays unpaid, as before.
 */
export class RectificationSettlementDto {
  @ApiPropertyOptional({ type: SettlementRefundDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettlementRefundDto)
  refund?: SettlementRefundDto;

  @ApiPropertyOptional({ type: SettlementCompensationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettlementCompensationDto)
  compensation?: SettlementCompensationDto;
}
