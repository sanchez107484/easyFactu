import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class FindInvoicesQueryDto {
  @ApiProperty({
    description: 'Id de la factura en el ERP (recuperación tras un tiempo agotado)',
    example: 'VENTA-2026-001234',
  })
  @Matches(/^[A-Za-z0-9._:/-]{1,100}$/, {
    message: 'externalRef: 1 a 100 caracteres (letras, números y . _ : / -)',
  })
  externalRef!: string;
}
