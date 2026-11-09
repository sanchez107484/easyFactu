import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma, RectificationType, VerifactuStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { withTransactionRetry } from '../../../prisma/with-transaction-retry';
import { HACIENDA_ADAPTER, IHaciendaAdapter } from '../interfaces/hacienda-adapter.interface';
import { VerifactuHashService } from './verifactu-hash.service';

const CANCELLABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];
const ISSUED_STATUSES: InvoiceStatus[] = [...CANCELLABLE_STATUSES, InvoiceStatus.RECTIFIED];

const INVOICE_TO_CANCEL_SELECT = {
  id: true,
  status: true,
  hash: true,
  isRectificative: true,
  rectificationType: true,
  exchangedByInvoiceId: true,
  rectificativeInvoices: { where: { status: { in: ISSUED_STATUSES } }, select: { id: true } },
} satisfies Prisma.InvoiceSelect;

type InvoiceToCancel = Prisma.InvoiceGetPayload<{ select: typeof INVOICE_TO_CANCEL_SELECT }>;

/**
 * Cancellation records (RegistroAnulacion): annul the registration of an invoice that should
 * not have been issued (e.g. a duplicated ticket). Unlike a rectificative, nothing replaces it.
 * The record is chained after the latest record of the tenant and sent like an invoice.
 */
@Injectable()
export class VerifactuCancellationService {
  private readonly logger = new Logger(VerifactuCancellationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: VerifactuHashService,
    @Inject(HACIENDA_ADAPTER) private readonly haciendaAdapter: IHaciendaAdapter
  ) {}

  /**
   * Marks the invoice CANCELLED and creates its cancellation record in one transaction, then
   * hashes and submits the record in the background (same model as invoice confirmation).
   * An annulled F3 releases the simplified invoices it replaced.
   */
  async cancelInvoice(
    tenantId: string,
    invoiceId: string,
    reason: string
  ): Promise<{ id: string }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: INVOICE_TO_CANCEL_SELECT,
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    this.assertCancellable(invoice);

    const cancellation = await withTransactionRetry(
      () =>
        this.prisma.$transaction(async (tx) => {
          const updated = await tx.invoice.updateMany({
            where: { id: invoiceId, tenantId, status: { in: CANCELLABLE_STATUSES } },
            data: { status: InvoiceStatus.CANCELLED },
          });
          if (updated.count !== 1) throw new ConflictException('La factura ya no se puede anular');
          await tx.invoice.updateMany({
            where: { tenantId, exchangedByInvoiceId: invoiceId },
            data: { exchangedByInvoiceId: null },
          });
          return tx.invoiceCancellation.create({
            data: { tenantId, invoiceId, reason },
            select: { id: true },
          });
        }),
      'VerifactuCancellationService.cancelInvoice'
    );

    this.processCancellation(tenantId, cancellation.id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[VeriFactu] Error processing cancellation ${cancellation.id}: ${message}`);
    });
    return cancellation;
  }

  /** Hash (chain link), XML, signature and submission of a cancellation record. */
  async processCancellation(tenantId: string, cancellationId: string): Promise<void> {
    const cancellation = await this.prisma.invoiceCancellation.findFirst({
      where: { id: cancellationId, tenantId },
      select: {
        invoice: { select: { number: true, issueDate: true, issuerSnapshotNif: true } },
      },
    });
    if (!cancellation?.invoice.number || !cancellation.invoice.issuerSnapshotNif) {
      throw new Error('La factura anulada no tiene número o NIF del emisor');
    }
    const { hash, prevHash } = await this.hashService.generateCancellationHash(tenantId, {
      issuerNif: cancellation.invoice.issuerSnapshotNif,
      number: cancellation.invoice.number,
      issueDate: cancellation.invoice.issueDate,
    });
    await this.prisma.invoiceCancellation.update({
      where: { id: cancellationId },
      data: { hash, prevHash, chainedAt: new Date(), verifactuStatus: VerifactuStatus.PENDING },
    });
    await this.submit(tenantId, cancellationId);
  }

  /** A sign/send failure keeps the hash already stored and leaves the record in ERROR. */
  private async submit(tenantId: string, cancellationId: string): Promise<void> {
    try {
      const xml = await this.haciendaAdapter.generateCancellationXml(tenantId, cancellationId);
      const signedXml = await this.haciendaAdapter.signXml(xml, tenantId);
      await this.haciendaAdapter.sendCancellation(tenantId, cancellationId, signedXml);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `[VeriFactu] Sign/send failed for cancellation ${cancellationId}: ${message}`
      );
      await this.prisma.invoiceCancellation.update({
        where: { id: cancellationId },
        data: { verifactuStatus: VerifactuStatus.ERROR },
      });
    }
  }

  private assertCancellable(invoice: InvoiceToCancel): void {
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new ConflictException('La factura ya está anulada');
    }
    if (!CANCELLABLE_STATUSES.includes(invoice.status)) {
      throw new ConflictException('Solo se pueden anular facturas emitidas y no rectificadas');
    }
    if (!invoice.hash) {
      throw new ConflictException(
        'La factura todavía no tiene huella VeriFactu. Reintenta la anulación en unos segundos.'
      );
    }
    this.assertNoDependentRecords(invoice);
  }

  private assertNoDependentRecords(invoice: InvoiceToCancel): void {
    if (invoice.rectificativeInvoices.length > 0) {
      throw new ConflictException(
        'La factura tiene rectificativas emitidas. Anula primero las rectificativas.'
      );
    }
    if (invoice.exchangedByInvoiceId) {
      throw new ConflictException(
        'La factura simplificada se canjeó por una factura completa. Anula la factura completa.'
      );
    }
    if (invoice.isRectificative && invoice.rectificationType === RectificationType.SUBSTITUTION) {
      throw new ConflictException(
        'Una rectificativa por sustitución no se puede anular; emite otra rectificativa.'
      );
    }
  }
}
