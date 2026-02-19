import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadCertificateDto {
  @ApiProperty({
    description: 'Contraseña del certificado digital',
    example: 'mi-password-seguro',
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password!: string;
}
