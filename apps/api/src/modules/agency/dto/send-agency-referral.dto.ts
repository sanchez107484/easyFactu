import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendAgencyReferralDto {
  @ApiProperty({
    description: 'Email de la asesoría a la que quieres invitar a registrarse',
    example: 'mi.asesor@example.com',
  })
  @IsEmail({}, { message: 'Introduce un email válido' })
  agencyEmail!: string;

  @ApiPropertyOptional({
    description: 'Mensaje opcional para la asesoría',
    example: 'Soy tu cliente y me gustaría que gestionaras mi facturación aquí.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
