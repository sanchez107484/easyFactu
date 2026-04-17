import { IsInt, IsIn, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportClientDto {
  @ApiProperty({ description: 'Año fiscal para la exportación', example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2099)
  @Type(() => Number)
  year!: number;

  @ApiPropertyOptional({
    description: 'Trimestre (1-4). Si no se indica, se exporta el año completo.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsIn([1, 2, 3, 4])
  @Type(() => Number)
  quarter?: number;
}
