import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvoiceTemplateController } from './invoice-template.controller';
import { InvoiceTemplateService } from './invoice-template.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { InvoicePdfRendererService } from './pdf/invoice-pdf-renderer.service';
import {
  InvoicePrintTokenGuard,
  InvoicePrintTokenService,
} from './pdf/invoice-print-token.service';
import { PdfStorageService } from './pdf/pdf-storage.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [InvoiceTemplateController],
  providers: [
    InvoiceTemplateService,
    InvoicePdfService,
    InvoicePdfRendererService,
    InvoicePrintTokenService,
    InvoicePrintTokenGuard,
    PdfStorageService,
  ],
  exports: [
    InvoiceTemplateService,
    InvoicePdfService,
    InvoicePrintTokenService,
    InvoicePrintTokenGuard,
    PdfStorageService,
  ],
})
export class InvoiceTemplateModule {}
