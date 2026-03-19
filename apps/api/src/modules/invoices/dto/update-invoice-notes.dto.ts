import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInvoiceNotesDto {
  @ApiPropertyOptional({ description: 'Texto de notas de la factura', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Las notas no pueden superar los 1000 caracteres' })
  notes?: string | null;
}
