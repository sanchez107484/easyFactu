import {
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeriesType } from '@easyfactura/shared-types';

export class CreateInvoiceSeriesDto {
  @ApiProperty({ description: 'Código de la serie (ej: F, R, EXPORT)', example: 'F' })
  @IsString()
  @MinLength(1, { message: 'El código debe tener al menos 1 carácter' })
  @MaxLength(10, { message: 'El código no puede superar los 10 caracteres' })
  @Matches(/^[A-Z0-9]+$/, { message: 'El código solo puede contener letras mayúsculas y números' })
  code!: string;

  @ApiProperty({ description: 'Nombre descriptivo de la serie', example: 'Facturas generales' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name!: string;

  @ApiProperty({ enum: SeriesType, description: 'Tipo de serie', default: SeriesType.INVOICE })
  @IsEnum(SeriesType, { message: 'Tipo de serie no válido' })
  type!: SeriesType;

  @ApiProperty({ description: 'Prefijo de la numeración (ej: 2024/F-)', example: '2024/F-' })
  @IsString()
  @MinLength(1, { message: 'El prefijo debe tener al menos 1 carácter' })
  @MaxLength(20, { message: 'El prefijo no puede superar los 20 caracteres' })
  prefix!: string;

  @ApiPropertyOptional({
    description: 'Número de dígitos para la numeración',
    default: 4,
    minimum: 1,
    maximum: 8,
  })
  @IsOptional()
  @IsInt({ message: 'Los dígitos deben ser un número entero' })
  @Min(1, { message: 'El número de dígitos debe ser al menos 1' })
  @Max(8, { message: 'El número de dígitos no puede superar 8' })
  digits?: number;

  @ApiPropertyOptional({ description: 'Año de la serie (se autocompleta con el año actual)' })
  @IsOptional()
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2020, { message: 'El año debe ser 2020 o posterior' })
  @Max(2100, { message: 'El año no puede superar 2100' })
  year?: number;

  @ApiPropertyOptional({ description: 'Si es la serie por defecto para el tipo', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
