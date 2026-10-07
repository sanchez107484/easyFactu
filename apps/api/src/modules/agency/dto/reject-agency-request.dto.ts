import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectAgencyRequestDto {
  @ApiPropertyOptional({ description: 'Motivo opcional del rechazo (visible para el autónomo)', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
