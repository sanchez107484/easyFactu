import { Module, forwardRef } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceCalculationService } from './invoice-calculation.service';
import { VerifactuModule } from '../verifactu/verifactu.module';
import { InvoiceTemplateModule } from '../invoice-templates/invoice-template.module';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [forwardRef(() => VerifactuModule), InvoiceTemplateModule, TenantModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceNumberService, InvoiceCalculationService],
  exports: [InvoiceService, InvoiceNumberService, InvoiceCalculationService],
})
export class InvoiceModule {}
