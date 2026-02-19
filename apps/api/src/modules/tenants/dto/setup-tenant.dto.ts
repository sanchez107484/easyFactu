import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';
import { IsValidSpanishPostalCode } from '../../../common/validators/is-valid-postal-code.validator';

export class SetupTenantDto {
  @ApiProperty({ description: 'Nombre comercial de la empresa' })
  @IsString()
  @MinLength(2, { message: 'El nombre comercial debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre comercial no puede superar los 100 caracteres' })
  businessName!: string;

  @ApiPropertyOptional({ description: 'Razón social (si es diferente del nombre comercial)' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La razón social no puede superar los 100 caracteres' })
  legalName?: string;

  @ApiProperty({ description: 'NIF/CIF de la empresa' })
  @IsString()
  @IsValidNif()
  nif!: string;

  @ApiProperty({ description: 'Dirección fiscal' })
  @IsString()
  @MinLength(5, { message: 'La dirección debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'La dirección no puede superar los 200 caracteres' })
  address!: string;

  @ApiProperty({ description: 'Código postal' })
  @IsString()
  @IsValidSpanishPostalCode()
  postalCode!: string;

  @ApiProperty({ description: 'Ciudad' })
  @IsString()
  @MinLength(2, { message: 'La ciudad debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'La ciudad no puede superar los 100 caracteres' })
  city!: string;

  @ApiProperty({ description: 'Provincia' })
  @IsString()
  @MinLength(2, { message: 'La provincia debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'La provincia no puede superar los 100 caracteres' })
  province!: string;

  @ApiPropertyOptional({ description: 'País (código ISO)', default: 'ES' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El código del país debe tener 2 caracteres' })
  @MaxLength(2, { message: 'El código del país debe tener 2 caracteres' })
  country?: string;

  @ApiProperty({ description: 'Email de contacto' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede superar los 20 caracteres' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Sitio web' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El sitio web no puede superar los 100 caracteres' })
  website?: string;
}
