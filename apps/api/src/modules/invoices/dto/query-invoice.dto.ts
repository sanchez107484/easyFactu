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
import { InvoiceStatus, PaymentStatus, QuoteAcceptanceStatus } from '@easyfactura/shared-types';

const INVOICE_SORT_FIELDS = [
  'number',
  'issueDate',
  'dueDate',
  'total',
  'createdAt',
  'customer',
  'validUntil',
] as const;

export class QueryInvoiceDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

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

  @ApiPropertyOptional({ enum: QuoteAcceptanceStatus })
  @IsOptional()
  @IsEnum(QuoteAcceptanceStatus)
  quoteAcceptanceStatus?: QuoteAcceptanceStatus;

  @ApiPropertyOptional({ enum: INVOICE_SORT_FIELDS })
  @IsOptional()
  @IsIn(INVOICE_SORT_FIELDS)
  declare sortBy?: string;

  @ApiPropertyOptional({ description: 'Filtrar solo facturas REAGYP (compensación agraria)' })
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = (obj as Record<string, unknown>).isReagyp;
    if (raw === undefined || raw === null) return undefined;
    if (raw === 'false' || raw === false) return false;
    return raw === 'true' || raw === true;
  })
  @IsBoolean()
  isReagyp?: boolean;
}
