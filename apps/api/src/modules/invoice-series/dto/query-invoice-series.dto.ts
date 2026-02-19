import { IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SeriesType } from '@easyfactura/shared-types';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryInvoiceSeriesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SeriesType, description: 'Filtrar por tipo de serie' })
  @IsOptional()
  @IsEnum(SeriesType)
  type?: SeriesType;

  @ApiPropertyOptional({ description: 'Filtrar por año' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Filtrar por si es serie por defecto' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;
}
