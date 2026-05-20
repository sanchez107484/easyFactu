import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { VerifactuHashService } from './verifactu-hash.service';
import { VerifactuQrService } from './verifactu-qr.service';
import { HACIENDA_ADAPTER, IHaciendaAdapter } from '../interfaces/hacienda-adapter.interface';
import { InvoiceStatus, VerifactuStatus } from '@easyfactura/shared-types';

@Injectable()
export class VerifactuService {
  private readonly logger = new Logger(VerifactuService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: VerifactuHashService,
    private qrService: VerifactuQrService,
    private config: ConfigService,
    @Inject(HACIENDA_ADAPTER) private haciendaAdapter: IHaciendaAdapter
  ) {}

  /**
   * Process invoice for VeriFactu:
   * 1. Generate hash chain
   * 2. Generate QR code (always, independent of signing/sending)
   * 3. Generate XML
   * 4. Sign XML
   * 5. Send to Hacienda
   *
   * Steps 3-5 are wrapped in their own try-catch so that a sign/send failure
   * does not roll back the already-stored QR code or hash.
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

      // Step 2: Generate and store QR code immediately after hash.
      // This runs before sign/send so the QR is always persisted even if
      // the signing step is not yet implemented or the AEAT send fails.
      const qrUrl = this.buildQrUrl(hash, tenantId, invoiceId);
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { verifactuQr: qrUrl },
      });

      this.logger.log(`QR code generated for invoice ${invoiceId}`);

      // Steps 3-5: XML generation, signing, and AEAT submission.
      // Wrapped in a separate try-catch so that failures here do not
      // invalidate the hash and QR already stored above.
      try {
        // Step 3: Generate XML
        const xml = await this.haciendaAdapter.generateXml(tenantId, invoiceId);
        this.logger.log(`XML generated for invoice ${invoiceId}`);

        // Step 4: Sign XML with the tenant's digital certificate
        const signedXml = await this.haciendaAdapter.signXml(xml, tenantId);
        this.logger.log(`XML signed for invoice ${invoiceId}`);

        // Step 5: Send to Hacienda
        await this.haciendaAdapter.sendToHacienda(tenantId, invoiceId, signedXml);
        this.logger.log(`Invoice ${invoiceId} sent to Hacienda`);
      } catch (sendError: unknown) {
        const message = sendError instanceof Error ? sendError.message : String(sendError);
        this.logger.warn(
          `[VeriFactu] Sign/send failed for invoice ${invoiceId} (hash and QR already stored): ${message}`
        );
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: { verifactuStatus: VerifactuStatus.ERROR },
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing invoice ${invoiceId} for VeriFactu: ${message}`);

      // Update invoice status to error
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { verifactuStatus: VerifactuStatus.ERROR },
      });

      throw error;
    }
  }

  /**
   * Build the QR URL content based on QR_MODE env var.
   * - internal (default): internal verification page using the invoice hash.
   * - verifactu: AEAT validation URL (only valid once the invoice is registered at AEAT).
   * - naticket: Hacienda Foral de Navarra (not yet implemented — falls back to internal).
   */
  private buildQrUrl(hash: string, tenantId: string, invoiceId: string): string {
    const mode = this.config.get<string>('QR_MODE', 'internal');

    if (mode === 'verifactu') {
      // AEAT URL is built asynchronously — handled by the adapter.
      // Since this method is synchronous, schedule a fire-and-forget update.
      this.haciendaAdapter
        .generateQrUrl(tenantId, invoiceId)
        .then((url) =>
          this.prisma.invoice.update({ where: { id: invoiceId }, data: { verifactuQr: url } })
        )
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`[VeriFactu] Could not generate AEAT QR URL for ${invoiceId}: ${msg}`);
        });

      // Return the internal URL as an immediate value while the async one resolves.
      // It will be overwritten by the update above once the adapter resolves.
      return this.qrService.generateInternalQrUrl(hash);
    }

    // Default: internal verification page
    return this.qrService.generateInternalQrUrl(hash);
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
