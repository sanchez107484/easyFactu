import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';
import { IntegrationAddressDto } from './integration-address.dto';

export class AccountOwnerDto {
  @ApiProperty({ example: 'María' })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(1, { message: 'Obligatorio' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(1, { message: 'Obligatorio' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  lastName!: string;

  @ApiProperty({
    description: 'Email con el que el titular entrará en NovaFactura',
    example: 'titular@opticaejemplo.es',
  })
  @IsEmail({}, { message: 'Email no válido' })
  @MaxLength(255, { message: 'Máximo 255 caracteres' })
  email!: string;
}

export class ProvisionAccountDto {
  @ApiProperty({ description: 'Id de la empresa en el ERP', example: 'EMP-0042' })
  @Matches(/^[A-Za-z0-9._:/-]{1,100}$/, {
    message: 'erpAccountId: 1 a 100 caracteres (letras, números y . _ : / -)',
  })
  erpAccountId!: string;

  @ApiProperty({
    description: 'NIF o CIF de la clínica (emisor de las facturas)',
    example: 'B12345674',
  })
  @IsString({ message: 'Debe ser texto' })
  @IsValidNif({ message: 'NIF o CIF no válido' })
  nif!: string;

  @ApiProperty({ example: 'Óptica Ejemplo' })
  @IsString({ message: 'Debe ser texto' })
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  businessName!: string;

  @ApiPropertyOptional({ example: 'Óptica Ejemplo S.L.' })
  @IsOptional()
  @IsString({ message: 'Debe ser texto' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  legalName?: string;

  @ApiProperty({
    description: 'Email de facturación de la clínica',
    example: 'titular@opticaejemplo.es',
  })
  @IsEmail({}, { message: 'Email no válido' })
  @MaxLength(255, { message: 'Máximo 255 caracteres' })
  email!: string;

  @ApiProperty({ type: AccountOwnerDto })
  @IsDefined({ message: 'Obligatorio' })
  @ValidateNested()
  @Type(() => AccountOwnerDto)
  owner!: AccountOwnerDto;

  @ApiProperty({ type: IntegrationAddressDto })
  @IsDefined({ message: 'Obligatorio' })
  @ValidateNested()
  @Type(() => IntegrationAddressDto)
  address!: IntegrationAddressDto;
}
