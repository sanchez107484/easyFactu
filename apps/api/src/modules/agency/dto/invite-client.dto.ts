import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteClientDto {
  @ApiProperty({ example: 'autonomo@empresa.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  inviteeEmail!: string;

  @ApiPropertyOptional({ example: 'Juan García' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  inviteeName?: string;
}
