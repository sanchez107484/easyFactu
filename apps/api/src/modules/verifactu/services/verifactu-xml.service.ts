import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Invoice, InvoiceLine, Customer, Tenant } from '@prisma/client';

interface InvoiceWithRelations extends Invoice {
  customer: Customer;
  lines: InvoiceLine[];
}

@Injectable()
export class VerifactuXmlService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate VeriFactu XML according to AEAT specification
   */
  async generateXml(tenantId: string, invoiceId: string): Promise<string> {
    // Get invoice with all relations
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        customer: true,
        lines: true,
      },
    });

    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    // Get tenant data
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    return this.buildXml(tenant, invoice as InvoiceWithRelations);
  }

  /**
   * Build XML structure according to VeriFactu specification
   */
  private buildXml(tenant: Tenant, invoice: InvoiceWithRelations): string {
    const issueDate = this.formatDate(invoice.issueDate);
    const issueTime = this.formatTime(invoice.issueDate);

    return `<?xml version="1.0" encoding="UTF-8"?>
<ven:VeriFactu xmlns:ven="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd">
  <Cabecera>
    <ObligadoEmision>
      <NombreRazon>${this.escapeXml(tenant.legalName || tenant.businessName)}</NombreRazon>
      <NIF>${tenant.nif}</NIF>
    </ObligadoEmision>
  </Cabecera>
  <RegistroFactura>
    <IDFactura>
      <IDEmisorFactura>
        <NIF>${tenant.nif}</NIF>
      </IDEmisorFactura>
      <NumSerieFactura>${this.escapeXml(invoice.number)}</NumSerieFactura>
      <FechaExpedicionFactura>${issueDate}</FechaExpedicionFactura>
    </IDFactura>
    <TipoFactura>F1</TipoFactura>
    <Destinatarios>
      <IDDestinatario>
        <NombreRazon>${this.escapeXml(invoice.customer.name)}</NombreRazon>
        <NIF>${invoice.customer.nif}</NIF>
      </IDDestinatario>
    </Destinatarios>
    <Desglose>
      ${this.buildTaxBreakdown(invoice)}
    </Desglose>
    <ImporteTotal>${invoice.total.toFixed(2)}</ImporteTotal>
    <Huella>
      <Hash>${invoice.hash}</Hash>
      ${invoice.prevHash ? `<HashAnterior>${invoice.prevHash}</HashAnterior>` : ''}
    </Huella>
  </RegistroFactura>
</ven:VeriFactu>`;
  }

  /**
   * Build tax breakdown section
   * Groups lines by tax rate
   */
  private buildTaxBreakdown(invoice: InvoiceWithRelations): string {
    // Group lines by tax rate
    const taxGroups = new Map<number, { base: number; tax: number; irpf: number }>();

    for (const line of invoice.lines) {
      const key = Number(line.taxRate);
      const current = taxGroups.get(key) || { base: 0, tax: 0, irpf: 0 };

      taxGroups.set(key, {
        base: current.base + Number(line.subtotal),
        tax: current.tax + Number(line.taxAmount),
        irpf: current.irpf + Number(line.irpfAmount || 0),
      });
    }

    // Build XML for each tax group
    const breakdowns = Array.from(taxGroups.entries()).map(([rate, amounts]) => {
      return `<DetalleDesglose>
        <BaseImponible>${amounts.base.toFixed(2)}</BaseImponible>
        <TipoImpositivo>${rate.toFixed(2)}</TipoImpositivo>
        <CuotaImpuesto>${amounts.tax.toFixed(2)}</CuotaImpuesto>
        ${
          amounts.irpf > 0
            ? `<BaseRetencion>${amounts.base.toFixed(2)}</BaseRetencion>
        <RetencionSoportada>${amounts.irpf.toFixed(2)}</RetencionSoportada>`
            : ''
        }
      </DetalleDesglose>`;
    });

    return breakdowns.join('\n      ');
  }

  /**
   * Format date as DD-MM-YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Format time as HH:MM:SS
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Escape special XML characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
