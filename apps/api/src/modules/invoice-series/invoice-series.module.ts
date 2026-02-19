import { Module } from '@nestjs/common';
import { InvoiceSeriesService } from './invoice-series.service';
import { InvoiceSeriesController } from './invoice-series.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceSeriesController],
  providers: [InvoiceSeriesService],
  exports: [InvoiceSeriesService],
})
export class InvoiceSeriesModule {}
