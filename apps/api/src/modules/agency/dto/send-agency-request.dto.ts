import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendAgencyRequestDto {
  @ApiProperty({
    description: 'NIF de la asesoría a la que quieres vincularte',
    example: 'B12345678',
  })
  @IsString()
  @MaxLength(20)
  agencyNif!: string;

  @ApiPropertyOptional({
    description: 'Mensaje opcional para la asesoría',
    example: 'Soy cliente suyo desde hace años y me gustaría que llevaran mi contabilidad en EasyFactura.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
