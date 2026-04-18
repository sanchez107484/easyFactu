import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsPostalCode,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@easyfactura/shared-types';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';

export class CreateDirectClientDto {
  @ApiPropertyOptional({ enum: AccountType, description: 'Tipo de cuenta del cliente' })
  @IsOptional()
  @IsEnum(AccountType, { message: 'Tipo de cuenta no valido' })
  accountType?: AccountType;

  @ApiProperty({ example: 'Acme Construcciones S.L.' })
  @IsString()
  @MinLength(2, { message: 'El nombre de la empresa debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la empresa no puede superar 100 caracteres' })
  businessName!: string;

  @ApiPropertyOptional({ example: 'Acme Construcciones Tecnologicas, S.L.' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La razon social no puede superar 100 caracteres' })
  legalName?: string;

  @ApiProperty({ example: 'B12345678' })
  @IsString()
  @IsValidNif({ message: 'El NIF/CIF no es valido' })
  nif!: string;

  @ApiProperty({ example: 'cliente@empresa.com' })
  @IsEmail({}, { message: 'El email no es valido' })
  email!: string;

  @ApiPropertyOptional({ example: 'Calle Mayor 1' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: '28001' })
  @IsOptional()
  @IsPostalCode('ES', { message: 'Codigo postal invalido' })
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional({ example: '+34 600 000 000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Notas internas sobre este cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
