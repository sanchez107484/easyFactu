import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInvoiceSeriesDto } from './create-invoice-series.dto';

// No se puede cambiar el código ni el año de una serie existente
export class UpdateInvoiceSeriesDto extends PartialType(
  OmitType(CreateInvoiceSeriesDto, ['code', 'year'] as const)
) {}
