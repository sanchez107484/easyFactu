import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { brandConfig } from '@easyfactura/brand-config';
import { INTEGRATIONS_ENV } from '../../integrations/integrations.constants';
import { InvoicePrintTokenService, PRINT_TOKEN_HEADER } from './invoice-print-token.service';

// Below the API's 30 s Vercel limit, leaving room for the DB work around it.
const RENDER_TIMEOUT_MS = 25_000;

/**
 * Renders invoice PDFs through the web app (Chromium + the same React blocks as the
 * dashboard preview). Single PDF generator for the dashboard and the integrations API.
 */
@Injectable()
export class InvoicePdfRendererService {
  private readonly logger = new Logger(InvoicePdfRendererService.name);

  constructor(
    private readonly printTokens: InvoicePrintTokenService,
    private readonly configService: ConfigService
  ) {}

  async render(tenantId: string, invoiceId: string): Promise<Buffer> {
    const token = await this.printTokens.sign({ tenantId, invoiceId });
    const url = `${this.rendererBaseUrl()}/api/invoices/${encodeURIComponent(invoiceId)}/pdf`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { [PRINT_TOKEN_HEADER]: token, Accept: 'application/pdf' },
        signal: AbortSignal.timeout(RENDER_TIMEOUT_MS),
      });
    } catch (err: unknown) {
      this.logger.error(`PDF renderer unreachable for invoice ${invoiceId}: ${describe(err)}`);
      throw new ServiceUnavailableException('No se ha podido generar el PDF');
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('application/pdf')) {
      this.logger.error(
        `PDF renderer failed for invoice ${invoiceId}: HTTP ${response.status} (${contentType})`
      );
      throw new ServiceUnavailableException('No se ha podido generar el PDF');
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * The web app of this deployment, resolved like IntegrationUrlsService.appUrl
   * (not injected: IntegrationsModule already imports this module).
   */
  private rendererBaseUrl(): string {
    const configured = this.configService.get<string>(INTEGRATIONS_ENV.APP_URL);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')?.split(',')[0]?.trim();
    return (configured ?? frontendUrl ?? brandConfig.app.url).replace(/\/+$/, '');
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}
