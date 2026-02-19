import { IsEmail, IsString, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidNif } from '../../../common/validators/is-valid-nif.validator';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener mayúsculas, minúsculas y números',
  })
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar 50 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'Los apellidos no pueden superar 50 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'Los apellidos solo pueden contener letras y espacios',
  })
  lastName!: string;

  @ApiProperty({ example: 'Mi Empresa S.L.' })
  @IsString()
  @MinLength(2, { message: 'El nombre de la empresa debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre de la empresa no puede superar 100 caracteres' })
  businessName!: string;

  @ApiProperty({ example: 'B12345678', description: 'NIF/CIF/NIE válido' })
  @IsString()
  @IsValidNif({ message: 'El NIF/CIF/NIE no es válido' })
  nif!: string;

  @ApiProperty({
    example: 'INDIVIDUAL',
    enum: AccountType,
    description:
      'Tipo de cuenta: INDIVIDUAL (autónomo), BUSINESS (empresa), AGENCY (gestoría), COLLABORATIVE (autónomos colaborando)',
  })
  @IsEnum(AccountType, { message: 'Tipo de cuenta inválido' })
  accountType!: AccountType;
}
