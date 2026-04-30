import { IsOptional, IsString, IsEnum, IsBoolean, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CustomerType } from '@easyfactura/shared-types';

const CUSTOMER_SORT_FIELDS = ['name', 'nif', 'city', 'type', 'createdAt'] as const;

export class QueryCustomerDto extends PaginationDto {
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

  @ApiPropertyOptional({ enum: CustomerType })
  @IsOptional()
  @Transform(({ value }) => (value === 'undefined' || value === '' ? undefined : value))
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = (obj as Record<string, unknown>).active;
    if (raw === undefined || raw === null) return undefined;
    if (raw === 'false' || raw === false) return false;
    return raw === 'true' || raw === true;
  })
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Buscar por NIF exacto' })
  @IsOptional()
  @IsString()
  nif?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_SORT_FIELDS })
  @IsOptional()
  @IsIn(CUSTOMER_SORT_FIELDS)
  declare sortBy?: string;
}
