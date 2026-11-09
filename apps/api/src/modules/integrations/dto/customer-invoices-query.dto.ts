import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export const CUSTOMER_INVOICES_MAX_LIMIT = 100;
export const CUSTOMER_INVOICES_DEFAULT_LIMIT = 20;

export class CustomerInvoicesQueryDto {
  @ApiPropertyOptional({ description: 'Página (desde 1)', example: '1' })
  @IsOptional()
  @Matches(/^[1-9]\d{0,5}$/, { message: 'Número de página desde 1' })
  page?: string;

  @ApiPropertyOptional({
    description: `Resultados por página (1 a ${CUSTOMER_INVOICES_MAX_LIMIT}, por defecto ${CUSTOMER_INVOICES_DEFAULT_LIMIT})`,
    example: '20',
  })
  @IsOptional()
  @Matches(/^(100|[1-9]\d?)$/, { message: `Entre 1 y ${CUSTOMER_INVOICES_MAX_LIMIT}` })
  limit?: string;
}
