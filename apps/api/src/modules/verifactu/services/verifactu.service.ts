import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { VerifactuHashService } from './verifactu-hash.service';
import { HACIENDA_ADAPTER, IHaciendaAdapter } from '../interfaces/hacienda-adapter.interface';
import { InvoiceStatus, VerifactuStatus } from '@easyfactura/shared-types';

@Injectable()
export class VerifactuService {
  private readonly logger = new Logger(VerifactuService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: VerifactuHashService,
    @Inject(HACIENDA_ADAPTER) private haciendaAdapter: IHaciendaAdapter
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

      // Get invoice — only the scalar fields needed; customer JOIN not required
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        select: {
          status: true,
          number: true,
          issueDate: true,
          total: true,
          issuerSnapshotNif: true,
        },
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

      if (!invoice.issuerSnapshotNif) {
        throw new Error(
          'La factura no tiene NIF del emisor en el snapshot. ' +
            'El flujo de confirmación puede estar incompleto — confirma la factura de nuevo.'
        );
      }

      // Step 1: Generate hash chain using the immutable issuer snapshot NIF.
      // Using the snapshot instead of re-fetching the tenant guarantees the hash
      // is always computed with the NIF that was current at confirmation time,
      // even if the tenant later changes their fiscal data or a retry happens days later.
      const { hash, prevHash } = await this.hashService.generateHash(tenantId, {
        issuerNif: invoice.issuerSnapshotNif,
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
      const xml = await this.haciendaAdapter.generateXml(tenantId, invoiceId);
      this.logger.log(`XML generated for invoice ${invoiceId}`);

      // Step 3: Sign XML with the tenant's digital certificate
      const signedXml = await this.haciendaAdapter.signXml(xml, tenantId);
      this.logger.log(`XML signed for invoice ${invoiceId}`);

      // Step 4: Send to Hacienda
      await this.haciendaAdapter.sendToHacienda(tenantId, invoiceId, signedXml);
      this.logger.log(`Invoice ${invoiceId} sent to Hacienda`);

      // Step 5: Generate QR code
      const qrUrl = await this.haciendaAdapter.generateQrUrl(tenantId, invoiceId);
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

    // Regenerate XML and retry via the active Hacienda adapter
    const xml = await this.haciendaAdapter.generateXml(tenantId, invoiceId);
    const signedXml = await this.haciendaAdapter.signXml(xml, tenantId);
    await this.haciendaAdapter.retrySubmission(tenantId, invoiceId, signedXml);
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
