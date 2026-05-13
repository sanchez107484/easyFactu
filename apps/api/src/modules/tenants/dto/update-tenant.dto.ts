import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength, IsNumber, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, TaxRegime } from '@easyfactura/shared-types';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';
import { IsValidIban } from '../../../common/validators/is-valid-iban.validator';
import { IsValidSpanishPostalCode } from '../../../common/validators/is-valid-postal-code.validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Nombre comercial de la empresa' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre comercial debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre comercial no puede superar los 100 caracteres' })
  businessName?: string;

  @ApiPropertyOptional({ description: 'Razón social' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La razón social no puede superar los 100 caracteres' })
  legalName?: string;

  @ApiPropertyOptional({ description: 'NIF/CIF de la empresa' })
  @IsOptional()
  @IsString()
  @IsValidNif()
  nif?: string;

  @ApiPropertyOptional({ description: 'Dirección fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La dirección no puede superar los 200 caracteres' })
  address?: string;

  @ApiPropertyOptional({ description: 'Código postal' })
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

  @ApiPropertyOptional({ description: 'IBAN de la cuenta bancaria' })
  @IsOptional()
  @IsString()
  @IsValidIban()
  iban?: string;

  @ApiPropertyOptional({ description: 'Titular de la cuenta bancaria' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El titular no puede superar los 100 caracteres' })
  bankAccountHolder?: string;

  @ApiPropertyOptional({ description: 'Código BIC/SWIFT del banco' })
  @IsOptional()
  @IsString()
  @MaxLength(11, { message: 'El BIC no puede superar los 11 caracteres' })
  bic?: string;

  @ApiPropertyOptional({ description: 'Sitio web' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El sitio web no puede superar los 100 caracteres' })
  website?: string;

  @ApiPropertyOptional({ enum: AccountType, description: 'Tipo de cuenta' })
  @IsOptional()
  @IsEnum(AccountType, { message: 'Tipo de cuenta no válido' })
  accountType?: AccountType;

  @ApiPropertyOptional({
    enum: TaxRegime,
    description: 'Régimen fiscal: GENERAL (IVA estándar) o REAGYP (compensación agraria)',
  })
  @IsOptional()
  @IsEnum(TaxRegime, { message: 'Régimen fiscal no válido' })
  taxRegime?: TaxRegime;

  @ApiPropertyOptional({
    description: 'Tasa de compensación agraria (%). 12.0 para agricultura/silvicultura, 10.5 para ganadería/pesca. Solo obligatorio cuando taxRegime = REAGYP. Enviar null para borrar.',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @ValidateIf((o) => o.reaypRate !== null)
  @IsNumber({}, { message: 'La tasa de compensación debe ser un número' })
  @Min(0, { message: 'La tasa de compensación no puede ser negativa' })
  @Max(100, { message: 'La tasa de compensación no puede superar el 100%' })
  @Type(() => Number)
  reaypRate?: number | null;
}
