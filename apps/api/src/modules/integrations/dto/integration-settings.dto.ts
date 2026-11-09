import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class UpdateIntegrationSettingsDto {
  @ApiProperty({
    description:
      'Importe máximo (IVA incluido) de una factura simplificada. 400 € con carácter general; ' +
      'hasta 3000 € en las actividades del art. 4.1 RD 1619/2012 (p. ej. comercio minorista, ópticas).',
    example: '3000.00',
  })
  @Matches(/^\d{1,4}(\.\d{1,2})?$/, {
    message: 'Importe con punto decimal y hasta 2 decimales, p. ej. "3000.00"',
  })
  simplifiedInvoiceLimit!: string;
}
