import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
  IsIn,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@easyfactura/shared-types';
import { CreateInvoiceLineDto, PaymentDetailsDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  irpfPercent?: number;

  @ApiPropertyOptional({
    description:
      'Porcentaje de compensación agraria REAGYP (%). ' +
      'Cuando el frontend lo envía, se usa directamente en lugar del tipo configurado en el tenant. ' +
      'Enviar 0 desactiva la compensación para esta factura.',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  compensacionPercent?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ type: [CreateInvoiceLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  @ArrayMinSize(1, { message: 'La factura debe tener al menos una línea' })
  @ArrayMaxSize(50, { message: 'La factura no puede tener más de 50 líneas' })
  lines?: CreateInvoiceLineDto[];

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    type: PaymentDetailsDto,
    description: 'Detalles adicionales del pago (estructura flexible según método)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @ApiPropertyOptional({
    enum: ['standard', 'proforma', 'simplified', 'quote'],
    description: "Tipo de documento: 'standard' | 'proforma' | 'simplified' | 'quote'",
  })
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'proforma', 'simplified', 'quote'], {
    message: "El tipo de factura debe ser 'standard', 'proforma', 'simplified' o 'quote'",
  })
  invoiceType?: string;

  @ApiPropertyOptional({ description: 'Fecha límite de validez del presupuesto (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'],
    description: 'Estado de aceptación del presupuesto',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'], {
    message: 'Estado de presupuesto no válido',
  })
  quoteAcceptanceStatus?: string;

  @ApiPropertyOptional({ description: 'ID de la plantilla de diseño a utilizar' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description:
      'Override parcial del layout de plantilla para esta factura (ej: ocultar columnas de tabla)',
  })
  @IsOptional()
  @IsObject()
  layoutOverride?: object;
}
