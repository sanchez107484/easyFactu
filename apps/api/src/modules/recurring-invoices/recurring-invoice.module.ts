import { Module } from '@nestjs/common';
import { RecurringInvoiceController } from './recurring-invoice.controller';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoiceSchedulerService } from './recurring-invoice-scheduler.service';
import { InvoiceModule } from '../invoices/invoice.module';

@Module({
  imports: [InvoiceModule],
  controllers: [RecurringInvoiceController],
  providers: [RecurringInvoiceService, RecurringInvoiceSchedulerService],
  exports: [RecurringInvoiceService],
})
export class RecurringInvoiceModule {}
