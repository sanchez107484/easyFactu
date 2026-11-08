import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { brandConfig } from '@easyfactura/brand-config';
import { INTEGRATIONS_ENV } from '../integrations.constants';

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Public URLs of this deployment, returned to the ERP at provisioning. NovaFactura and
 * Nafactura run the same code: only these URLs (and the Hacienda adapter) change.
 */
@Injectable()
export class IntegrationUrlsService {
  constructor(private readonly config: ConfigService) {}

  /** Base URL the ERP stores per company; integration routes live under `${apiUrl}/integrations/v1`. */
  get apiUrl(): string {
    const configured = this.config.get<string>(INTEGRATIONS_ENV.API_URL);
    return withoutTrailingSlash(
      configured ?? `http://localhost:${this.config.get<string>('APP_PORT') ?? 3001}/api/v1`
    );
  }

  get appUrl(): string {
    const configured = this.config.get<string>(INTEGRATIONS_ENV.APP_URL);
    const frontendUrl = this.config.get<string>('FRONTEND_URL')?.split(',')[0]?.trim();
    return withoutTrailingSlash(configured ?? frontendUrl ?? brandConfig.app.url);
  }

  invoiceAppUrl(invoiceId: string): string {
    return `${this.appUrl}/dashboard/facturas/${invoiceId}`;
  }

  consentUrl(token: string): string {
    return `${this.appUrl}/integraciones/consentimiento/${token}`;
  }
}
