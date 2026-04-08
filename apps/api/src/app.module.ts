import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenants/tenant.module';
import { CustomerModule } from './modules/customers/customer.module';
import { ProductModule } from './modules/products/product.module';
import { InvoiceModule } from './modules/invoices/invoice.module';
import { InvoiceSeriesModule } from './modules/invoice-series/invoice-series.module';
import { VerifactuModule } from './modules/verifactu/verifactu.module';
import { InvoiceTemplateModule } from './modules/invoice-templates/invoice-template.module';
import { InvoiceDefaultsModule } from './modules/invoice-defaults/invoice-defaults.module';
import { RecurringInvoiceModule } from './modules/recurring-invoices/recurring-invoice.module';

@Module({
  imports: [
    // Config - Load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task scheduling (cron jobs)
    ScheduleModule.forRoot(),

    // Prisma
    PrismaModule,

    // Feature modules
    AuthModule,
    TenantModule,
    CustomerModule,
    ProductModule,
    InvoiceModule,
    InvoiceSeriesModule,
    VerifactuModule,
    InvoiceTemplateModule,
    InvoiceDefaultsModule,
    RecurringInvoiceModule,
  ],
  controllers: [],
  providers: [
    // Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
