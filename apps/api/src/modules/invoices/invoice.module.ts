import { Module, forwardRef } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { VerifactuModule } from '../verifactu/verifactu.module';

@Module({
  imports: [forwardRef(() => VerifactuModule)],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
