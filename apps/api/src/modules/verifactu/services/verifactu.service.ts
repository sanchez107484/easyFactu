import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { VerifactuHashService } from './verifactu-hash.service';
import { VerifactuXmlService } from './verifactu-xml.service';
import { VerifactuSignerService } from './verifactu-signer.service';
import { VerifactuSenderService } from './verifactu-sender.service';
import { VerifactuQrService } from './verifactu-qr.service';
import { InvoiceStatus, VerifactuStatus } from '@easyfactura/shared-types';

@Injectable()
export class VerifactuService {
  private readonly logger = new Logger(VerifactuService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: VerifactuHashService,
    private xmlService: VerifactuXmlService,
    private signerService: VerifactuSignerService,
    private senderService: VerifactuSenderService,
    private qrService: VerifactuQrService
  ) {}

  /**
   * Process invoice for VeriFactu:
   * 1. Generate hash chain
   * 2. Generate XML
   * 3. Sign XML
   * 4. Send to AEAT
   * 5. Generate QR code
   */
  async processInvoice(tenantId: string, invoiceId: string): Promise<void> {
    try {
      this.logger.log(`Processing invoice ${invoiceId} for VeriFactu`);

      // Get invoice
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { customer: true },
      });

      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      if (invoice.status !== InvoiceStatus.CONFIRMED) {
        throw new Error('Solo se pueden procesar facturas confirmadas');
      }

      if (!invoice.number) {
        throw new Error('La factura confirmada no tiene número asignado');
      }

      // Step 1: Generate hash chain
      const { hash, prevHash } = await this.hashService.generateHash(tenantId, {
        nif: invoice.customer.nif,
        number: invoice.number,
        issueDate: invoice.issueDate,
        total: Number(invoice.total),
      });

      // Update invoice with hash
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          hash,
          prevHash,
          verifactuStatus: VerifactuStatus.PENDING,
        },
      });

      this.logger.log(`Hash generated for invoice ${invoiceId}: ${hash}`);

      // Step 2: Generate XML
      const xml = await this.xmlService.generateXml(tenantId, invoiceId);
      this.logger.log(`XML generated for invoice ${invoiceId}`);

      // Step 3: Sign XML (TODO: implement with tenant certificate)
      const signedXml = await this.signerService.signXml(xml);
      this.logger.log(`XML signed for invoice ${invoiceId}`);

      // Step 4: Send to AEAT
      await this.senderService.sendToAeat(tenantId, invoiceId, signedXml);
      this.logger.log(`Invoice ${invoiceId} sent to AEAT`);

      // Step 5: Generate QR code
      const qrUrl = await this.qrService.generateQrUrl(tenantId, invoiceId);
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { verifactuQr: qrUrl },
      });

      this.logger.log(`QR code generated for invoice ${invoiceId}`);
    } catch (error: any) {
      this.logger.error(`Error processing invoice ${invoiceId} for VeriFactu:`, error.message);

      // Update invoice status to error
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { verifactuStatus: VerifactuStatus.ERROR },
      });

      throw error;
    }
  }

  /**
   * Verify hash chain integrity for an invoice
   */
  async verifyInvoiceIntegrity(tenantId: string, invoiceId: string): Promise<boolean> {
    return this.hashService.verifyHashChain(tenantId, invoiceId);
  }

  /**
   * Retry failed VeriFactu submission
   */
  async retryFailedSubmission(tenantId: string, invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    if (invoice.verifactuStatus !== VerifactuStatus.ERROR) {
      throw new Error('Solo se pueden reintentar facturas con error');
    }

    // Regenerate XML and retry
    const xml = await this.xmlService.generateXml(tenantId, invoiceId);
    const signedXml = await this.signerService.signXml(xml);
    await this.senderService.retryFailedSubmission(tenantId, invoiceId, signedXml);
  }

  /**
   * Get VeriFactu logs for an invoice
   */
  async getInvoiceLogs(tenantId: string, invoiceId: string) {
    return this.prisma.verifactuLog.findMany({
      where: { invoiceId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
