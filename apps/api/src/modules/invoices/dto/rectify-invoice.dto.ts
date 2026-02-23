import {
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateInvoiceLineDto } from './create-invoice.dto';

export class RectifyInvoiceDto {
  @ApiProperty({ description: 'Motivo de la rectificación', minLength: 5, maxLength: 500 })
  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede superar los 500 caracteres' })
  rectificationReason!: string;

  @ApiProperty({ type: [CreateInvoiceLineDto], description: 'Líneas de la factura rectificativa' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  @ArrayMinSize(1, { message: 'La factura rectificativa debe tener al menos una línea' })
  @ArrayMaxSize(50, { message: 'La factura rectificativa no puede tener más de 50 líneas' })
  lines!: CreateInvoiceLineDto[];
}
