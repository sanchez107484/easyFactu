import { Module } from '@nestjs/common';
import { InvoiceTemplateController } from './invoice-template.controller';
import { InvoiceTemplateService } from './invoice-template.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { PdfStorageService } from './pdf/pdf-storage.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceTemplateController],
  providers: [InvoiceTemplateService, InvoicePdfService, PdfStorageService],
  exports: [InvoiceTemplateService, InvoicePdfService, PdfStorageService],
})
export class InvoiceTemplateModule {}
