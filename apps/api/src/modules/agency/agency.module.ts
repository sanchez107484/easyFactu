import { Module } from '@nestjs/common';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { AgencyExportService } from './agency-export.service';
import { AgencyExportCegidService } from './agency-export-cegid.service';
import { AgencyExportDiamaconService } from './agency-export-diamacon.service';
import { ContaPlusExportService } from './contaplus-export.service';
import { FiscalValidatorService } from './fiscal-validator.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { InvoiceSeriesModule } from '../invoice-series/invoice-series.module';
import { AgencyAccessGuard } from '../../common/guards/agency-access.guard';

@Module({
  imports: [PrismaModule, InvoiceSeriesModule],
  // EmailService is provided globally via EmailModule (@Global decorator)
  controllers: [AgencyController],
  providers: [
    AgencyService,
    AgencyExportService,
    AgencyExportCegidService,
    AgencyExportDiamaconService,
    ContaPlusExportService,
    FiscalValidatorService,
    AgencyAccessGuard,
  ],
  exports: [AgencyService],
})
export class AgencyModule {}
