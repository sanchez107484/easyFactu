import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerImportService } from './customer-import.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, CustomerImportService],
  exports: [CustomerService],
})
export class CustomerModule {}
