import { IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResendActivationDto {
  @ApiPropertyOptional({
    example: 'correo-correcto@empresa.com',
    description:
      'Nuevo email si el anterior era incorrecto. Si se omite, se reenvía al email actual.',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;
}
