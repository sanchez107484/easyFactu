import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { RecurringInvoiceStatus } from '@prisma/client';

export class QueryRecurringInvoiceDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buscar por descripción o cliente' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RecurringInvoiceStatus })
  @IsOptional()
  @IsEnum(RecurringInvoiceStatus)
  status?: RecurringInvoiceStatus;

  @ApiPropertyOptional({ description: 'Filtrar por ID de cliente' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
