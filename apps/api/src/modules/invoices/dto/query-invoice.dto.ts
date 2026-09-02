import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
  IsIn,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
  @ApiPropertyOptional({ enum: InvoiceStatus, isArray: true })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? (obj as Record<string, unknown>).status;
    if (raw === undefined || raw === null) return undefined;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      // Accept comma separated values (status=A,B) or single value
      if (raw.includes(','))
        return raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      return [raw];
    }
    return raw;
  })
  @IsEnum(InvoiceStatus, { each: true })
  status?: InvoiceStatus | InvoiceStatus[];

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

  @ApiPropertyOptional({
    description: 'Buscar también en líneas de factura (descripción, producto)',
  })
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = (obj as Record<string, unknown>).searchLines;
    if (raw === undefined || raw === null) return undefined;
    if (raw === 'false' || raw === false) return false;
    return raw === 'true' || raw === true;
  })
  @IsBoolean()
  searchLines?: boolean;

  @ApiPropertyOptional({ description: 'Precio unitario mínimo de la línea' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minUnitPrice?: number;

  @ApiPropertyOptional({ description: 'Precio unitario máximo de la línea' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxUnitPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  rectifiableOnly?: boolean;
}
