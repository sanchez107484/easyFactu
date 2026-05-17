import { Injectable, NotImplementedException } from '@nestjs/common';
import { IHaciendaAdapter } from '../../interfaces/hacienda-adapter.interface';

/**
 * Adaptador para la Hacienda Foral de Navarra.
 *
 * ESTADO: Pendiente de implementación.
 * Requiere la especificación técnica del sistema de facturación foral de Navarra
 * (formato XML, protocolo de envío, formato QR, firma electrónica requerida).
 *
 * Para activarlo, establece HACIENDA_ADAPTER=navarra en las variables de entorno
 * de la API de NaFactura.
 */
@Injectable()
export class NavarraHaciendaAdapter implements IHaciendaAdapter {
  async generateXml(_tenantId: string, _invoiceId: string): Promise<string> {
    throw new NotImplementedException(
      'NavarraHaciendaAdapter: generateXml pendiente de implementación. ' +
        'Se requiere la especificación técnica de Hacienda Navarra.'
    );
  }

  async signXml(_xml: string, _tenantId: string): Promise<string> {
    throw new NotImplementedException(
      'NavarraHaciendaAdapter: signXml pendiente de implementación. ' +
        'Se requiere la especificación de firma de Hacienda Navarra.'
    );
  }

  async sendToHacienda(_tenantId: string, _invoiceId: string, _signedXml: string): Promise<void> {
    throw new NotImplementedException(
      'NavarraHaciendaAdapter: sendToHacienda pendiente de implementación. ' +
        'Se requiere el endpoint y protocolo de Hacienda Navarra.'
    );
  }

  async retrySubmission(_tenantId: string, _invoiceId: string, _signedXml: string): Promise<void> {
    throw new NotImplementedException(
      'NavarraHaciendaAdapter: retrySubmission pendiente de implementación.'
    );
  }

  async generateQrUrl(_tenantId: string, _invoiceId: string): Promise<string> {
    throw new NotImplementedException(
      'NavarraHaciendaAdapter: generateQrUrl pendiente de implementación. ' +
        'Se requiere el formato de QR de Hacienda Navarra.'
    );
  }
}
