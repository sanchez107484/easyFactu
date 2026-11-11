import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString, MaxLength } from 'class-validator';

export class SsoExchangeDto {
  @ApiProperty({
    description: 'Token ES256 de un solo uso (≤ 60 s) firmado por el ERP',
    example: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @MaxLength(4096)
  @IsJWT({ message: 'El enlace de acceso no es válido' })
  token!: string;
}
