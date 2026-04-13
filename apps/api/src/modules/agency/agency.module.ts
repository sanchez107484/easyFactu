import { Module } from '@nestjs/common';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { InvoiceSeriesModule } from '../invoice-series/invoice-series.module';

@Module({
  imports: [PrismaModule, InvoiceSeriesModule],
  // EmailService is provided globally via EmailModule (@Global decorator)
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [AgencyService],
})
export class AgencyModule {}
