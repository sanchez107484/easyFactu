import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentMethod,
  PaymentStatus,
  ProductType,
  ReportComparison,
  ReportDimension,
  ReportRequest,
  ReportSortBy,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';
import { REPORT_TOP_N_OPTIONS } from '@easyfactura/shared-constants';

const MAX_FILTER_ITEMS = 50;

export class ReportRequestDto implements ReportRequest {
  @ApiProperty({ enum: ReportType, description: 'Tipo de informe' })
  @IsEnum(ReportType, { message: 'Tipo de informe no válido' })
  type!: ReportType;

  @ApiProperty({ description: 'Fecha de inicio del periodo', example: '2026-01-01' })
  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  fromDate!: string;

  @ApiProperty({ description: 'Fecha de fin del periodo', example: '2026-12-31' })
  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  toDate!: string;

  @ApiPropertyOptional({ enum: ReportTimeGrouping, default: ReportTimeGrouping.MONTH })
  @IsOptional()
  @IsEnum(ReportTimeGrouping, { message: 'Agrupación temporal no válida' })
  timeGrouping?: ReportTimeGrouping;

  @ApiPropertyOptional({ enum: ReportComparison, default: ReportComparison.NONE })
  @IsOptional()
  @IsEnum(ReportComparison, { message: 'Comparación no válida' })
  comparison?: ReportComparison;

  @ApiPropertyOptional({ enum: ReportDimension, description: 'Ventas/Gastos: agrupar por' })
  @IsOptional()
  @IsEnum(ReportDimension, { message: 'Agrupación no válida' })
  groupBy?: ReportDimension;

  @ApiPropertyOptional({ enum: ReportDimension, description: 'Ventas/Gastos: desglosar por' })
  @IsOptional()
  @IsEnum(ReportDimension, { message: 'Desglose no válido' })
  breakdownBy?: ReportDimension;

  @ApiPropertyOptional({ enum: REPORT_TOP_N_OPTIONS, description: 'Mostrar solo los N primeros' })
  @IsOptional()
  @IsInt()
  @IsIn([...REPORT_TOP_N_OPTIONS], { message: 'Valor de "mostrar los primeros" no válido' })
  topN?: number;

  @ApiPropertyOptional({ enum: ReportSortBy, default: ReportSortBy.AMOUNT })
  @IsOptional()
  @IsEnum(ReportSortBy, { message: 'Orden no válido' })
  sortBy?: ReportSortBy;

  @ApiPropertyOptional({ type: [String], description: 'Ventas: clientes' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_ITEMS)
  @IsUUID(undefined, { each: true, message: 'Cliente no válido' })
  customerIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Ventas: artículos' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_ITEMS)
  @IsUUID(undefined, { each: true, message: 'Artículo no válido' })
  productIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Ventas: códigos de serie' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_ITEMS)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  seriesCodes?: string[];

  @ApiPropertyOptional({
    enum: PaymentStatus,
    isArray: true,
    description: 'Ventas: estado de cobro',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentStatus, { each: true, message: 'Estado de cobro no válido' })
  paymentStatuses?: PaymentStatus[];

  @ApiPropertyOptional({ enum: ProductType, description: 'Ventas: tipo de artículo' })
  @IsOptional()
  @IsEnum(ProductType, { message: 'Tipo de artículo no válido' })
  productType?: ProductType;

  @ApiPropertyOptional({ type: [String], description: 'Gastos: categorías' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_ITEMS)
  @IsUUID(undefined, { each: true, message: 'Categoría no válida' })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Gastos: proveedores' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_ITEMS)
  @IsUUID(undefined, { each: true, message: 'Proveedor no válido' })
  supplierIds?: string[];

  @ApiPropertyOptional({ enum: PaymentMethod, isArray: true, description: 'Cobros: forma de pago' })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true, message: 'Forma de pago no válida' })
  paymentMethods?: PaymentMethod[];
}
