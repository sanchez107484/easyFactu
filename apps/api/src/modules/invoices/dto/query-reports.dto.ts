import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryReportsDto {
  @ApiProperty({ description: 'Fecha de inicio del periodo', example: '2026-01-01' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ description: 'Fecha de fin del periodo', example: '2026-12-31' })
  @IsDateString()
  toDate!: string;
}
