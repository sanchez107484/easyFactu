import { IsOptional, IsString, IsEnum, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CustomerType } from '@easyfactura/shared-types';

const CUSTOMER_SORT_FIELDS = ['name', 'nif', 'city', 'type', 'createdAt'] as const;

export class QueryCustomerDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
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
