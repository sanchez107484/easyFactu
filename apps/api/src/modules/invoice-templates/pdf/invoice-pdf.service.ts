import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  DEFAULT_INVOICE_LAYOUT,
  Invoice,
  InvoiceTemplate,
  Tenant,
} from '@easyfactura/shared-types';
import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class InvoicePdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        customer: true,
        lines: { orderBy: { sortOrder: 'asc' } },
        series: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura con id ${invoiceId} no encontrada`);
    }

    const [tenant, template] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.invoiceTemplate.findFirst({
        where: { tenantId, isDefault: true },
      }),
    ]);

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const resolvedTemplate = template ?? {
      id: 'default',
      tenantId,
      name: 'Plantilla predeterminada',
      isDefault: true,
      layout: DEFAULT_INVOICE_LAYOUT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.renderPdf(
      invoice as unknown as Invoice,
      resolvedTemplate as unknown as InvoiceTemplate,
      tenant as unknown as Tenant
    );
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
    const logoAbsolutePath = this.resolveLogoPath(tenant.logoUrl);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Logo
    if (logoAbsolutePath) {
      try {
        const logo = readFileSync(logoAbsolutePath);
        doc.image(logo, 40, 40, { width: 120 });
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
    doc.moveDown(2);
    doc.fontSize(14).text(`Factura Nº: ${invoice.number}`, 40, undefined, { align: 'left' });
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
    doc.text('Descripción                Cantidad   Precio   IVA   Total');
    doc.moveDown(0.2);
    if (Array.isArray(invoice.lines)) {
      invoice.lines.forEach((line) => {
        doc.text(
          `${(line.description || '').padEnd(25).slice(0, 25)}  ${line.quantity?.toString().padStart(3)}   ${line.unitPrice?.toFixed(2).padStart(7)}   ${line.taxRate?.toFixed(0).padStart(2)}%   ${line.lineTotal?.toFixed(2).padStart(7)}`
        );
      });
    }

    // Totales
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Totales:', 40, undefined);
    doc.fontSize(10);
    doc.text(`Subtotal: ${invoice.subtotal?.toFixed(2) || '0.00'} €`);
    doc.text(`IVA: ${invoice.taxTotal?.toFixed(2) || '0.00'} €`);
    if (invoice.irpfTotal) doc.text(`IRPF: ${invoice.irpfTotal.toFixed(2)} €`);
    if (invoice.discountAmount) doc.text(`Descuento: ${invoice.discountAmount.toFixed(2)} €`);
    doc.text(`Total: ${invoice.total?.toFixed(2) || '0.00'} €`);

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

  private resolveLogoPath(logoUrl: string | null): string | undefined {
    if (!logoUrl) return undefined;

    const relativePath = logoUrl.replace(/^\/uploads\//, '');
    const absolutePath = join(process.cwd(), 'uploads', relativePath);

    return existsSync(absolutePath) ? absolutePath : undefined;
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
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
  }
}
