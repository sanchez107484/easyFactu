import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateRecurringExpensesDto {
  @ApiPropertyOptional({ description: 'Generar gastos hasta esta fecha (YYYY-MM-DD). Por defecto: hoy' })
  @IsOptional()
  @IsDateString()
  upToDate?: string;
}
