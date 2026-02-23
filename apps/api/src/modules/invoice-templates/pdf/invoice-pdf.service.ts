import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  DEFAULT_INVOICE_LAYOUT,
  Invoice,
  InvoiceTemplate,
  Tenant,
} from '@easyfactura/shared-types';
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

    // Dynamic imports required: @react-pdf/renderer v4 is ESM-only and cannot
    // be statically require()'d from a CommonJS NestJS build.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [renderer, { createInvoicePdfElement }] = await Promise.all([
      import('@react-pdf/renderer') as Promise<any>,
      import('./invoice-pdf.document'),
    ]);

    const element = createInvoicePdfElement(renderer, {
      invoice,
      template,
      tenant,
      logoAbsolutePath,
    });

    return renderer.renderToBuffer(element) as Promise<Buffer>;
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
