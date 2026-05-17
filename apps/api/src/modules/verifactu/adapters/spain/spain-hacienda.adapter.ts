import { Injectable } from '@nestjs/common';
import { IHaciendaAdapter } from '../../interfaces/hacienda-adapter.interface';
import { VerifactuXmlService } from '../../services/verifactu-xml.service';
import { VerifactuSignerService } from '../../services/verifactu-signer.service';
import { VerifactuSenderService } from '../../services/verifactu-sender.service';
import { VerifactuQrService } from '../../services/verifactu-qr.service';

/**
 * Adaptador para la AEAT (Agencia Tributaria Española).
 * Implementa IHaciendaAdapter delegando en los servicios especializados existentes
 * de VeriFactu (XML según Reglamento 254/2025, firma PKCS12, envío SOAP a AEAT, QR normativo).
 */
@Injectable()
export class SpainHaciendaAdapter implements IHaciendaAdapter {
  constructor(
    private xmlService: VerifactuXmlService,
    private signerService: VerifactuSignerService,
    private senderService: VerifactuSenderService,
    private qrService: VerifactuQrService
  ) {}

  async generateXml(tenantId: string, invoiceId: string): Promise<string> {
    return this.xmlService.generateXml(tenantId, invoiceId);
  }

  async signXml(xml: string, _tenantId: string): Promise<string> {
    return this.signerService.signXml(xml);
  }

  async sendToHacienda(tenantId: string, invoiceId: string, signedXml: string): Promise<void> {
    return this.senderService.sendToAeat(tenantId, invoiceId, signedXml);
  }

  async retrySubmission(tenantId: string, invoiceId: string, signedXml: string): Promise<void> {
    return this.senderService.retryFailedSubmission(tenantId, invoiceId, signedXml);
  }

  async generateQrUrl(tenantId: string, invoiceId: string): Promise<string> {
    return this.qrService.generateQrUrl(tenantId, invoiceId);
  }
}
