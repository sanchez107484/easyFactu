import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { InvoiceLayout } from '@easyfactura/shared-types';

export class CreateInvoiceTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsObject()
  layout!: InvoiceLayout;
}
