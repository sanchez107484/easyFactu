import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_TAX_RATES = [0, 4, 10, 21] as const;

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto o servicio' })
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  description?: string;

  @ApiProperty({ description: 'Precio unitario sin IVA' })
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'El precio debe tener máximo 4 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  unitPrice!: number;

  @ApiProperty({ enum: VALID_TAX_RATES, description: 'Tipo de IVA (0, 4, 10 o 21)' })
  @IsNumber({}, { message: 'El tipo de IVA debe ser un número' })
  @IsIn(VALID_TAX_RATES, { message: 'El tipo de IVA debe ser 0, 4, 10 o 21' })
  taxRate!: number;

  @ApiPropertyOptional({ description: 'Porcentaje de IRPF (0-100)', default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El IRPF debe tener máximo 2 decimales' })
  @Min(0, { message: 'El IRPF no puede ser negativo' })
  irpfRate?: number;

  @ApiPropertyOptional({ description: 'Código de referencia único del producto' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'La referencia no puede superar los 50 caracteres' })
  reference?: string;

  @ApiPropertyOptional({ description: 'Estado del producto', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
