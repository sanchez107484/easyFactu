import { Module } from '@nestjs/common';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { AgencyClientService } from './agency-client.service';
import { AgencyInvitationService } from './agency-invitation.service';
import { AgencyInvoiceService } from './agency-invoice.service';
import { AgencyStatsService } from './agency-stats.service';
import { AgencyImpersonationService } from './agency-impersonation.service';
import { AgencyRequestService } from './agency-request.service';
import { AgencyExportService } from './agency-export.service';
import { AgencyExportCegidService } from './agency-export-cegid.service';
import { AgencyExportDiamaconService } from './agency-export-diamacon.service';
import { AgencyExportA3Service } from './agency-export-a3.service';
import { ContaPlusExportService } from './contaplus-export.service';
import { FiscalValidatorService } from './fiscal-validator.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { InvoiceSeriesModule } from '../invoice-series/invoice-series.module';
import { AgencyAccessGuard } from '../../common/guards/agency-access.guard';

@Module({
  imports: [PrismaModule, InvoiceSeriesModule],
  controllers: [AgencyController],
  providers: [
    AgencyService,
    AgencyClientService,
    AgencyInvitationService,
    AgencyInvoiceService,
    AgencyStatsService,
    AgencyImpersonationService,
    AgencyRequestService,
    AgencyExportService,
    AgencyExportCegidService,
    AgencyExportDiamaconService,
    AgencyExportA3Service,
    ContaPlusExportService,
    FiscalValidatorService,
    AgencyAccessGuard,
  ],
  exports: [AgencyService],
})
export class AgencyModule {}
