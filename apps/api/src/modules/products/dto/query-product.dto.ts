import { IsOptional, IsString, IsBoolean, IsEnum, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProductType } from '@prisma/client';

const PRODUCT_SORT_FIELDS = [
  'name',
  'reference',
  'type',
  'unitPrice',
  'taxRate',
  'createdAt',
] as const;

export class QueryProductDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_FIELDS })
  @IsOptional()
  @IsIn(PRODUCT_SORT_FIELDS)
  declare sortBy?: string;
}
