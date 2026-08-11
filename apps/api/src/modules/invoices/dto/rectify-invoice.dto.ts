import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RectificationType } from '@easyfactura/shared-types';
import { VALID_TAX_RATES } from '@easyfactura/shared-constants';

export class CreateRectificativeLineDto {
  @ApiPropertyOptional({ description: 'ID del producto existente (opcional)' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Descripción de la línea', minLength: 2, maxLength: 500 })
  @IsString()
  @MinLength(2, { message: 'La descripción debe tener al menos 2 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  description!: string;

  @ApiPropertyOptional({ description: 'Ocultar cantidad en la vista previa/PDF' })
  @IsOptional()
  @IsBoolean()
  hideQty?: boolean;

  @ApiProperty({ description: 'Cantidad (puede ser negativa para ajustes)' })
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'La cantidad admite hasta 4 decimales' })
  quantity!: number;

  @ApiProperty({ description: 'Precio unitario (puede ser negativo para ajustes)' })
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'El precio admite hasta 4 decimales' })
  unitPrice!: number;

  @ApiProperty({ description: 'Tipo de IVA (%)', enum: VALID_TAX_RATES })
  @IsNumber({}, { message: 'El tipo de IVA debe ser un número' })
  @IsEnum(VALID_TAX_RATES, { message: 'El tipo de IVA debe ser 0, 4, 10 o 21' })
  taxRate!: number;

  @ApiPropertyOptional({ description: 'Descuento por línea (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El descuento admite hasta 2 decimales' })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Retención IRPF por línea (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El IRPF admite hasta 2 decimales' })
  @Min(0)
  @Max(100)
  irpfRate?: number;

  @ApiPropertyOptional({ description: 'Tipo de Recargo de Equivalencia para esta línea (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El recargo de equivalencia admite hasta 2 decimales' })
  @Min(0)
  @Max(100)
  surchargeRate?: number;
}

export class RectifyInvoiceDto {
  @ApiProperty({ description: 'Motivo de la rectificación', minLength: 5, maxLength: 500 })
  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede superar los 500 caracteres' })
  rectificationReason!: string;

  @ApiProperty({
    description: 'Tipo de rectificación: SUBSTITUTION (sustitución) o DIFFERENCES (diferencias)',
    enum: RectificationType,
  })
  @IsEnum(RectificationType, {
    message: 'El tipo de rectificación debe ser SUBSTITUTION o DIFFERENCES',
  })
  rectificationType!: RectificationType;

  @ApiProperty({
    type: [CreateRectificativeLineDto],
    description:
      'Líneas de la factura rectificativa. Para SUBSTITUTION: importes finales corregidos. Para DIFFERENCES: solo los ajustes (puede incluir valores negativos).',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRectificativeLineDto)
  @ArrayMinSize(1, { message: 'La factura rectificativa debe tener al menos una línea' })
  @ArrayMaxSize(50, { message: 'La factura rectificativa no puede tener más de 50 líneas' })
  lines!: CreateRectificativeLineDto[];
}
