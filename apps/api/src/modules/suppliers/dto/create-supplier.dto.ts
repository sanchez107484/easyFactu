import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Nombre comercial del proveedor' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name!: string;

  @ApiPropertyOptional({ description: 'Razón social del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La razón social no puede superar los 100 caracteres' })
  legalName?: string;

  @ApiPropertyOptional({ description: 'NIF/CIF/NIE del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El identificador fiscal no puede superar los 20 caracteres' })
  taxId?: string;

  @ApiPropertyOptional({ description: 'Dirección del proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La dirección no puede superar los 200 caracteres' })
  address?: string;

  @ApiPropertyOptional({ description: 'Código postal' })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'El código postal no puede superar los 10 caracteres' })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Ciudad' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La ciudad no puede superar los 100 caracteres' })
  city?: string;

  @ApiPropertyOptional({ description: 'Provincia' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La provincia no puede superar los 100 caracteres' })
  province?: string;

  @ApiPropertyOptional({ description: 'País (código ISO)', default: 'ES' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El código del país debe tener 2 caracteres' })
  @MaxLength(2, { message: 'El código del país debe tener 2 caracteres' })
  country?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede superar los 20 caracteres' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Email de contacto' })
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Notas sobre el proveedor' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar los 500 caracteres' })
  notes?: string;
}
