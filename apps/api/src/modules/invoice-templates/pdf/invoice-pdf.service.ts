import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  DEFAULT_INVOICE_LAYOUT,
  Invoice,
  InvoiceLayout,
  LayoutOverride,
  InvoiceTemplate,
  Tenant,
} from '@easyfactura/shared-types';
import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { PrismaService } from '../../../prisma/prisma.service';
import { PdfStorageService } from './pdf-storage.service';
import { formatCurrency } from '../../../common/utils/format';

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfStorage: PdfStorageService
  ) {}

  async generate(
    tenantId: string,
    invoiceId: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    // Fetch invoice and tenant in parallel to minimize round trips
    const [invoice, tenant] = await Promise.all([
      this.prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: {
          customer: true,
          lines: { orderBy: { sortOrder: 'asc' } },
          series: true,
          template: true,
        },
      }),
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    if (!invoice) {
      throw new NotFoundException(`Factura con id ${invoiceId} no encontrada`);
    }
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const filename = this.buildFilename(invoice);

    // Cache hit: only confirmed invoices are cached (drafts change frequently)
    const isCacheable =
      invoice.status === 'CONFIRMED' || invoice.status === 'PAID' || invoice.status === 'SENT';
    if (isCacheable && invoice.pdfUrl) {
      const cached = await this.pdfStorage.download(invoice.pdfUrl);
      if (cached) {
        this.logger.debug(`PDF cache hit for invoice ${invoiceId}`);
        return { buffer: cached, filename };
      }
    }

    const resolvedTemplate = invoice.template ?? {
      id: 'default',
      tenantId,
      name: 'Plantilla predeterminada',
      isDefault: true,
      layout: DEFAULT_INVOICE_LAYOUT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const buffer = await this.renderPdf(
      invoice as unknown as Invoice,
      resolvedTemplate as unknown as InvoiceTemplate,
      tenant as unknown as Tenant
    );

    // Store in cache for confirmed/paid/sent invoices (fire and forget)
    if (isCacheable && this.pdfStorage.isEnabled) {
      this.pdfStorage
        .upload(tenantId, invoiceId, buffer)
        .then((storagePath) =>
          this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { pdfUrl: storagePath },
          })
        )
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to cache PDF for invoice ${invoiceId}: ${msg}`);
        });
    }

    return { buffer, filename };
  }

  private buildFilename(invoice: {
    number: string | null;
    invoiceType?: string | null;
    customer?: { name: string } | null;
  }): string {
    const typeLabel = this.resolveDocumentTypeLabel(invoice.invoiceType);
    const raw = [invoice.number ?? typeLabel, invoice.customer?.name].filter(Boolean).join(' - ');
    return raw.replace(/[/\\:*?"<>|]/g, '').trim() || 'documento';
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

  async generatePreview(tenantId: string, templateId: string): Promise<Buffer> {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Plantilla con id ${templateId} no encontrada`);
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const exampleInvoice = this.buildExampleInvoice(tenantId);

    return this.renderPdf(
      exampleInvoice,
      template as unknown as InvoiceTemplate,
      tenant as unknown as Tenant
    );
  }

  private async renderPdf(
    invoice: Invoice,
    template: InvoiceTemplate,
    tenant: Tenant
  ): Promise<Buffer> {
    const logoBuffer = this.resolveLogo(tenant.logoUrl);
    const pdfTitle = [invoice.number, invoice.customer?.name].filter(Boolean).join(' - ');
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: pdfTitle } });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Resolve effective itemsTable config (template layout → invoice layoutOverride)
    const templateItemsTable =
      (template?.layout as InvoiceLayout)?.itemsTable ?? DEFAULT_INVOICE_LAYOUT.itemsTable;
    const overrideItemsTable = (invoice.layoutOverride as LayoutOverride)?.itemsTable;
    const tableConfig = {
      ...DEFAULT_INVOICE_LAYOUT.itemsTable,
      ...templateItemsTable,
      ...overrideItemsTable,
    };
    const showUnitPrice = tableConfig.showUnitPrice ?? true;
    const showTaxColumn = tableConfig.showTaxColumn ?? true;
    const showLineTotal = tableConfig.showLineTotal ?? true;

    // Logo
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 40, 40, { width: 120 });
      } catch (e) {
        // Si el logo no se puede leer, lo ignoramos
      }
    }

    // Cabecera empresa
    doc.fontSize(16).text(tenant.legalName || '', 200, 40, { align: 'right' });
    doc.fontSize(10).text(tenant.address || '', 200, 60, { align: 'right' });
    doc.text(`${tenant.postalCode || ''} ${tenant.city || ''}`, 200, 75, { align: 'right' });
    doc.text(`${tenant.province || ''} (${tenant.country || ''})`, 200, 90, { align: 'right' });
    doc.text(`NIF: ${tenant.nif || ''}`, 200, 105, { align: 'right' });
    doc.text(`Email: ${tenant.email || ''}`, 200, 120, { align: 'right' });

    // Datos factura
    const docTypeLabel = this.resolveDocumentTypeLabel(invoice.invoiceType);
    const docNumber = invoice.number ? `${docTypeLabel} Nº: ${invoice.number}` : docTypeLabel;
    doc.moveDown(2);
    doc.fontSize(14).text(docNumber, 40, undefined, { align: 'left' });
    doc.fontSize(10).text(`Fecha emisión: ${invoice.issueDate?.toString().slice(0, 10) || ''}`);
    if (invoice.dueDate) doc.text(`Fecha vencimiento: ${invoice.dueDate.toString().slice(0, 10)}`);

    // Cliente
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Cliente:', 40, undefined);
    doc.fontSize(10).text(invoice.customer?.legalName || '');
    doc.text(invoice.customer?.address || '');
    doc.text(`${invoice.customer?.postalCode || ''} ${invoice.customer?.city || ''}`);
    doc.text(`${invoice.customer?.province || ''} (${invoice.customer?.country || ''})`);
    doc.text(`NIF: ${invoice.customer?.nif || ''}`);
    doc.text(`Email: ${invoice.customer?.email || ''}`);

    // Líneas de factura
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Conceptos:', 40, undefined);
    doc.fontSize(10);
    const headerParts = ['Descripción'.padEnd(25)];
    headerParts.push('Cant.'.padStart(5));
    if (showUnitPrice) headerParts.push('Precio'.padStart(8));
    if (showTaxColumn) headerParts.push('IVA'.padStart(5));
    if (showLineTotal) headerParts.push('Total'.padStart(8));
    doc.text(headerParts.join('  '));
    doc.moveDown(0.2);
    if (Array.isArray(invoice.lines)) {
      invoice.lines.forEach((line) => {
        const rowParts = [(line.description || '').padEnd(25).slice(0, 25)];
        rowParts.push((line.quantity?.toString() ?? '').padStart(5));
        if (showUnitPrice) rowParts.push(formatCurrency(line.unitPrice).padStart(12));
        if (showTaxColumn) rowParts.push(`${line.taxRate?.toFixed(0) ?? ''}%`.padStart(5));
        if (showLineTotal) rowParts.push(formatCurrency(line.lineTotal).padStart(12));
        doc.text(rowParts.join('  '));
      });
    }

    // Totales
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Totales:', 40, undefined);
    doc.fontSize(10);
    doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`);
    doc.text(`IVA: ${formatCurrency(invoice.taxTotal)}`);
    if (invoice.irpfTotal) doc.text(`IRPF: ${formatCurrency(invoice.irpfTotal)}`);
    if (invoice.discountAmount) doc.text(`Descuento: ${formatCurrency(invoice.discountAmount)}`);
    doc.text(`Total: ${formatCurrency(invoice.total)}`);

    // Notas
    if (invoice.notes) {
      doc.moveDown(1);
      doc.fontSize(10).text(`Notas: ${invoice.notes}`);
    }

    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });
  }

  private resolveDocumentTypeLabel(invoiceType?: string | null): string {
    if (invoiceType === 'proforma') return 'Proforma';
    if (invoiceType === 'quote') return 'Presupuesto';
    return 'Factura';
  }

  private resolveLogo(logoUrl: string | null): Buffer | undefined {
    if (!logoUrl) return undefined;

    // New format: data URL stored directly in the database
    if (logoUrl.startsWith('data:')) {
      const base64 = logoUrl.split(',')[1];
      return base64 ? Buffer.from(base64, 'base64') : undefined;
    }

    // Legacy format: local filesystem path (development only)
    const relativePath = logoUrl.replace(/^\/uploads\//, '');
    const absolutePath = join(process.cwd(), 'uploads', relativePath);
    return existsSync(absolutePath) ? readFileSync(absolutePath) : undefined;
  }

  private buildExampleInvoice(tenantId: string): Invoice {
    const now = new Date().toISOString();
    return {
      id: 'preview',
      tenantId,
      seriesId: 'preview',
      customerId: 'preview',
      number: 'FAC-2024-0001',
      issueDate: now,
      dueDate: null,
      status: 'CONFIRMED' as never,
      subtotal: 1000,
      discountPercent: null,
      discountAmount: null,
      taxTotal: 210,
      irpfPercent: null,
      irpfTotal: null,
      total: 1210,
      paymentMethod: null,
      paymentDetails: null,
      notes: 'Esta es una factura de ejemplo para previsualizar la plantilla.',
      pdfUrl: null,
      verifactuHash: null,
      verifactuPrevHash: null,
      verifactuStatus: null,
      verifactuQr: null,
      verifactuSentAt: null,
      verifactuResponse: null,
      isRectificative: false,
      rectifiedInvoiceId: null,
      rectificationReason: null,
      createdAt: now,
      updatedAt: now,
      customer: {
        id: 'preview',
        tenantId,
        type: 'COMPANY' as never,
        name: 'Empresa Ejemplo S.L.',
        legalName: 'Empresa Ejemplo Sociedad Limitada',
        nif: 'B12345678',
        email: 'contacto@ejemplo.com',
        phone: '+34 912 345 678',
        address: 'Calle Mayor 1',
        postalCode: '28001',
        city: 'Madrid',
        province: 'Madrid',
        country: 'ES',
        notes: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      lines: [
        {
          id: 'line1',
          tenantId,
          invoiceId: 'preview',
          productId: null,
          description: 'Servicio de consultoría',
          quantity: 5,
          unitPrice: 100,
          subtotal: 500,
          taxRate: 21,
          taxAmount: 105,
          lineTotal: 500,
          hideQty: false,
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'line2',
          tenantId,
          invoiceId: 'preview',
          productId: null,
          description: 'Desarrollo de software',
          quantity: 10,
          unitPrice: 50,
          subtotal: 500,
          taxRate: 21,
          taxAmount: 105,
          lineTotal: 500,
          hideQty: false,
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
  }
}
