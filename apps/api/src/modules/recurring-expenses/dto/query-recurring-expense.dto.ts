import { IsOptional, IsString, IsBoolean, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const RECURRING_EXPENSE_SORT_FIELDS = ['description', 'startDate', 'totalAmount', 'createdAt'] as const;

export class QueryRecurringExpenseDto extends PaginationDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ enum: RECURRING_EXPENSE_SORT_FIELDS })
  @IsOptional()
  @IsIn(RECURRING_EXPENSE_SORT_FIELDS)
  declare sortBy?: string;
}
