import { Module } from '@nestjs/common';
import { InvoiceDefaultsService } from './invoice-defaults.service';
import { InvoiceDefaultsController } from './invoice-defaults.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceDefaultsController],
  providers: [InvoiceDefaultsService],
})
export class InvoiceDefaultsModule {}
