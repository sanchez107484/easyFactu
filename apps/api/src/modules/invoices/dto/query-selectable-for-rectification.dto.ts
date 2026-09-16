import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const RECTIFICATION_SELECT_SORT_FIELDS = [
  'number',
  'issueDate',
  'dueDate',
  'total',
  'createdAt',
  'customer',
] as const;

/**
 * Query para GET /invoices/selectable-for-rectification.
 * Solo devuelve facturas rectificables (CONFIRMED/SENT/PAID) y, por defecto,
 * excluye las que ya tienen una rectificativa confirmada.
 */
export class QuerySelectableInvoicesForRectificationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por número, cliente o NIF' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: RECTIFICATION_SELECT_SORT_FIELDS })
  @IsOptional()
  @IsIn(RECTIFICATION_SELECT_SORT_FIELDS)
  declare sortBy?: string;

  @ApiPropertyOptional({
    description: 'Si false, incluye facturas con rectificativa confirmada. Por defecto true.',
  })
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = (obj as Record<string, unknown>).excludeAlreadyRectified;
    if (raw === undefined || raw === null) return undefined;
    if (raw === 'false' || raw === false) return false;
    return raw === 'true' || raw === true;
  })
  @IsBoolean()
  excludeAlreadyRectified?: boolean;

  // Compatibilidad con query strings tipo ?sortOrder=asc
  declare sortOrder?: 'asc' | 'desc';
}
