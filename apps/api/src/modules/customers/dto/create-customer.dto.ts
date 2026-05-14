import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '@easyfactura/shared-types';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';
import { IsValidSpanishPostalCode } from '../../../common/validators/is-valid-postal-code.validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nombre comercial del cliente' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name!: string;

  @ApiPropertyOptional({ description: 'Razón social del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La razón social no puede superar los 100 caracteres' })
  legalName?: string;

  @ApiProperty({ enum: CustomerType, description: 'Tipo de cliente' })
  @IsEnum(CustomerType, { message: 'Tipo de cliente no válido' })
  type!: CustomerType;

  @ApiProperty({ description: 'NIF/CIF/NIE del cliente (según tipo)' })
  @IsString()
  @IsValidNif()
  nif!: string;

  @ApiPropertyOptional({ description: 'Dirección del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La dirección no puede superar los 200 caracteres' })
  address?: string;

  @ApiPropertyOptional({ description: 'Código postal (5 dígitos)' })
  @IsOptional()
  @IsString()
  @IsValidSpanishPostalCode()
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

  @ApiPropertyOptional({ description: 'Persona de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La persona de contacto no puede superar los 100 caracteres' })
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Notas sobre el cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar los 500 caracteres' })
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Indica si este cliente también está acogido al REAGYP. Cuando es true y el tenant emisor está en REAGYP, la compensación agrícola NO se aplica.',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isReagyp debe ser un booleano' })
  isReagyp?: boolean;
}
