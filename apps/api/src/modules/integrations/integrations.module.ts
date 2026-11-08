import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GuardsModule } from '../../common/guards/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { InvoiceSeriesModule } from '../invoice-series/invoice-series.module';
import { InvoiceTemplateModule } from '../invoice-templates/invoice-template.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { PaymentModule } from '../payments/payment.module';
import { IntegrationAccountsController } from './controllers/integration-accounts.controller';
import { IntegrationConsentsController } from './controllers/integration-consents.controller';
import { IntegrationHealthController } from './controllers/integration-health.controller';
import { IntegrationInvoicesController } from './controllers/integration-invoices.controller';
import { ApiKeyRateLimitGuard } from './guards/api-key-rate-limit.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ProvisioningSecretGuard } from './guards/provisioning-secret.guard';
import { IdempotencyService } from './idempotency/idempotency.service';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { AccountProvisioningService } from './services/account-provisioning.service';
import { ApiKeyService } from './services/api-key.service';
import { IntegrationAccountsService } from './services/integration-accounts.service';
import { IntegrationConsentService } from './services/integration-consent.service';
import { IntegrationCustomersService } from './services/integration-customers.service';
import { IntegrationEmailsService } from './services/integration-emails.service';
import { IntegrationHealthService } from './services/integration-health.service';
import { IntegrationInvoiceActionsService } from './services/integration-invoice-actions.service';
import { IntegrationInvoicesService } from './services/integration-invoices.service';
import { IntegrationUrlsService } from './services/integration-urls.service';
import { PriceWithTaxConverter } from './services/price-with-tax.converter';

/** Controllers that form the ERP contract (Problem Details, X-Request-Id). */
export const INTEGRATION_CONTRACT_CONTROLLERS = [
  IntegrationHealthController,
  IntegrationAccountsController,
  IntegrationInvoicesController,
];

/**
 * Integrations API v1 (HU-21A): one contract served the same by NovaFactura and Nafactura.
 * It only orchestrates existing services (invoices, calculation, numbering, VeriFactu, PDF,
 * payments, subscriptions); fiscal logic stays in those modules.
 */
@Module({
  imports: [
    PrismaModule,
    GuardsModule,
    InvoiceModule,
    InvoiceSeriesModule,
    InvoiceTemplateModule,
    PaymentModule,
  ],
  controllers: [...INTEGRATION_CONTRACT_CONTROLLERS, IntegrationConsentsController],
  providers: [
    ApiKeyService,
    ApiKeyGuard,
    ApiKeyRateLimitGuard,
    ProvisioningSecretGuard,
    IdempotencyService,
    IntegrationUrlsService,
    IntegrationEmailsService,
    IntegrationHealthService,
    IntegrationCustomersService,
    PriceWithTaxConverter,
    IntegrationInvoicesService,
    IntegrationInvoiceActionsService,
    AccountProvisioningService,
    IntegrationConsentService,
    IntegrationAccountsService,
  ],
})
export class IntegrationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes(...INTEGRATION_CONTRACT_CONTROLLERS);
  }
}
