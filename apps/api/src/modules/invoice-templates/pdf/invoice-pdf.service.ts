import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfStorageService } from './pdf-storage.service';
import { InvoicePdfRendererService } from './invoice-pdf-renderer.service';

const CACHEABLE_STATUSES = new Set(['CONFIRMED', 'SENT', 'PAID']);

interface PdfCacheInputs {
  updatedAt: Date;
  issuerSnapshotNif: string | null;
  layoutOverride: unknown;
  template: { updatedAt: Date } | null;
}

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfStorage: PdfStorageService,
    private readonly renderer: InvoicePdfRendererService
  ) {}

  async generate(
    tenantId: string,
    invoiceId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const [invoice, tenant] = await Promise.all([
      this.prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        select: {
          number: true,
          status: true,
          invoiceType: true,
          pdfUrl: true,
          updatedAt: true,
          issuerSnapshotNif: true,
          layoutOverride: true,
          customerSnapshotName: true,
          customer: { select: { name: true } },
          template: { select: { updatedAt: true } },
        },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { updatedAt: true, logoUrl: true },
      }),
    ]);

    if (!invoice) {
      throw new NotFoundException(`Factura con id ${invoiceId} no encontrada`);
    }
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const filename = this.buildFilename(invoice);
    const isCacheable = CACHEABLE_STATUSES.has(invoice.status);
    const contentHash = this.computeContentHash(invoice, tenant);
    const expectedPath = this.pdfStorage.buildHashedPath(tenantId, invoiceId, contentHash);

    if (isCacheable && invoice.pdfUrl === expectedPath) {
      const cached = await this.pdfStorage.download(invoice.pdfUrl);
      if (cached) {
        this.logger.debug(`PDF cache hit for invoice ${invoiceId} (hash=${contentHash})`);
        return { buffer: cached, filename };
      }
    }

    const buffer = await this.renderer.render(tenantId, invoiceId);

    if (isCacheable && this.pdfStorage.isEnabled) {
      this.storeInCache(tenantId, invoiceId, buffer, contentHash, invoice.pdfUrl, expectedPath);
    }

    return { buffer, filename };
  }

  /**
   * Invalidates the cached PDF for an invoice (call after update or re-confirmation).
   */
  async invalidateCache(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { pdfUrl: true },
    });
    if (!invoice?.pdfUrl) return;

    await Promise.all([
      this.pdfStorage.delete(invoice.pdfUrl),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl: null },
      }),
    ]);
  }

  /** Fire and forget: a failed upload only costs a re-render next time. */
  private storeInCache(
    tenantId: string,
    invoiceId: string,
    buffer: Buffer,
    contentHash: string,
    currentPdfUrl: string | null,
    expectedPath: string
  ): void {
    const staleUrl = currentPdfUrl && currentPdfUrl !== expectedPath ? currentPdfUrl : null;

    this.pdfStorage
      .upload(tenantId, invoiceId, buffer, contentHash)
      .then(async (storagePath) => {
        if (staleUrl) {
          await this.pdfStorage.delete(staleUrl).catch(() => {});
        }
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: { pdfUrl: storagePath },
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to cache PDF for invoice ${invoiceId}: ${msg}`);
      });
  }

  /**
   * Computes a short SHA-256 hash from the inputs that affect PDF content.
   * When any of these change, the hash changes and the cache auto-invalidates.
   *
   * For confirmed invoices with an issuer snapshot, the rendered PDF uses the
   * immutable snapshot fields — not live tenant data. In that case we use a
   * stable marker (snapshot NIF) instead of tenant.updatedAt so that unrelated
   * tenant changes (e.g. updating a phone number) do not bust the cache.
   *
   * The "web" marker separates these PDFs from the ones cached by the former
   * pdfkit generator, so those are re-rendered with the web layout.
   */
  private computeContentHash(
    invoice: PdfCacheInputs,
    tenant: { updatedAt: Date; logoUrl: string | null }
  ): string {
    const issuerPart =
      invoice.issuerSnapshotNif != null
        ? `snapshot:${invoice.issuerSnapshotNif}`
        : String(tenant.updatedAt);

    const parts = [
      'web',
      String(invoice.updatedAt),
      issuerPart,
      tenant.logoUrl ?? '',
      invoice.template ? String(invoice.template.updatedAt) : 'default',
      invoice.layoutOverride ? JSON.stringify(invoice.layoutOverride) : '',
    ];
    return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 12);
  }

  private buildFilename(invoice: {
    number: string | null;
    invoiceType: string | null;
    customerSnapshotName: string | null;
    customer: { name: string } | null;
  }): string {
    const typeLabel = this.resolveDocumentTypeLabel(invoice.invoiceType);
    // Prefer snapshot name (immutable) over live customer name so the filename
    // always matches the customer name printed inside the PDF.
    const customerName = invoice.customerSnapshotName ?? invoice.customer?.name;
    const raw = [invoice.number ?? typeLabel, customerName].filter(Boolean).join(' - ');
    return raw.replace(/[/\\:*?"<>|]/g, '').trim() || 'documento';
  }

  private resolveDocumentTypeLabel(invoiceType: string | null): string {
    if (invoiceType === 'proforma') return 'Proforma';
    if (invoiceType === 'quote') return 'Presupuesto';
    return 'Factura';
  }
}
