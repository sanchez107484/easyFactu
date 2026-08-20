import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const SUPPLIER_SORT_FIELDS = ['name', 'taxId', 'createdAt'] as const;

export class QuerySupplierDto extends PaginationDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 500, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  declare limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SUPPLIER_SORT_FIELDS })
  @IsOptional()
  @IsIn(SUPPLIER_SORT_FIELDS)
  declare sortBy?: string;
}
