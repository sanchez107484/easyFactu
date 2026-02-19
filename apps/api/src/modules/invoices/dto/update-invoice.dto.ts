import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

// Can't update series, customer or lines after creation
export class UpdateInvoiceDto extends PartialType(
  OmitType(CreateInvoiceDto, ['seriesId', 'customerId', 'lines'] as const)
) {}
