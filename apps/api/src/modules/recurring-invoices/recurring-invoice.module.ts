import { Module } from '@nestjs/common';
import { RecurringInvoiceController } from './recurring-invoice.controller';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoiceSchedulerService } from './recurring-invoice-scheduler.service';
import { InvoiceModule } from '../invoices/invoice.module';
import { SchedulerSecretGuard } from './guards/scheduler-secret.guard';

@Module({
  imports: [InvoiceModule],
  controllers: [RecurringInvoiceController],
  providers: [RecurringInvoiceService, RecurringInvoiceSchedulerService, SchedulerSecretGuard],
  exports: [RecurringInvoiceService],
})
export class RecurringInvoiceModule {}
