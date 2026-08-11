import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Invoice, InvoiceLine, Customer, Tenant } from '@prisma/client';
import { RectificationType } from '@easyfactura/shared-types';

interface InvoiceWithRelations extends Invoice {
  customer: Customer;
  lines: InvoiceLine[];
  rectifiedInvoice?: Invoice | null;
}

@Injectable()
export class VerifactuXmlService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate VeriFactu XML according to AEAT specification
   */
  async generateXml(tenantId: string, invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        customer: true,
        lines: true,
        rectifiedInvoice: true,
      },
    });

    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    if (!invoice.number) {
      throw new Error('Solo se puede generar XML para facturas con número asignado (confirmadas)');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    return this.buildXml(tenant, invoice as InvoiceWithRelations);
  }

  /**
   * Build XML structure according to VeriFactu specification.
   *
   * Issuer and customer data are resolved from the immutable snapshot fields captured
   * at confirmation time. This guarantees the XML is always consistent with the legally
   * binding moment, even if the tenant or customer data changes after confirmation or
   * if VeriFactu submission is retried days later.
   *
   * Falls back to live tenant/customer data for invoices created before the snapshot
   * migration (backwards compatibility).
   */
  private buildXml(tenant: Tenant, invoice: InvoiceWithRelations): string {
    const issueDate = this.formatDate(invoice.issueDate);

    const issuerNif = invoice.issuerSnapshotNif ?? tenant.nif ?? '';
    const issuerName =
      invoice.issuerSnapshotLegalName ??
      invoice.issuerSnapshotName ??
      tenant.legalName ??
      tenant.businessName;

    const custName = invoice.customerSnapshotName ?? invoice.customer.name;
    const custNif = invoice.customerSnapshotNif ?? invoice.customer.nif ?? '';

    const tipoFactura = invoice.isRectificative ? 'R4' : 'F1';
    const tipoRectificativa = invoice.isRectificative
      ? invoice.rectificationType === RectificationType.SUBSTITUTION
        ? 'I'
        : 'S'
      : null;

    const facturasRectificadas = this.buildFacturasRectificadas(invoice);
    const importeRectificacion = this.buildImporteRectificacion(invoice);

    return `<?xml version="1.0" encoding="UTF-8"?>
<ven:VeriFactu xmlns:ven="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd">
  <Cabecera>
    <ObligadoEmision>
      <NombreRazon>${this.escapeXml(issuerName)}</NombreRazon>
      <NIF>${issuerNif}</NIF>
    </ObligadoEmision>
  </Cabecera>
  <RegistroFactura>
    <IDFactura>
      <IDEmisorFactura>
        <NIF>${issuerNif}</NIF>
      </IDEmisorFactura>
      <NumSerieFactura>${this.escapeXml(invoice.number!)}</NumSerieFactura>
      <FechaExpedicionFactura>${issueDate}</FechaExpedicionFactura>
    </IDFactura>
    <TipoFactura>${tipoFactura}</TipoFactura>
    ${tipoRectificativa ? `<TipoRectificativa>${tipoRectificativa}</TipoRectificativa>` : ''}
    ${facturasRectificadas}
    ${invoice.compensacionPercent != null ? '<ClaveRegimenEspecial>02</ClaveRegimenEspecial>' : ''}
    <Destinatarios>
      <IDDestinatario>
        <NombreRazon>${this.escapeXml(custName)}</NombreRazon>
        <NIF>${custNif}</NIF>
      </IDDestinatario>
    </Destinatarios>
    <Desglose>
      ${this.buildTaxBreakdown(invoice)}
    </Desglose>
    <ImporteTotal>${invoice.total.toFixed(2)}</ImporteTotal>
    ${importeRectificacion}
    <Huella>
      <Hash>${invoice.hash}</Hash>
      ${invoice.prevHash ? `<HashAnterior>${invoice.prevHash}</HashAnterior>` : ''}
    </Huella>
  </RegistroFactura>
</ven:VeriFactu>`;
  }

  /**
   * Build tax breakdown section.
   *
   * For REAGYP invoices (compensacionPercent is set), emits a single block with
   * the agrarian compensation data (no IVA, regime code already added by buildXml).
   * For standard invoices, groups lines by tax rate and emits one block per rate.
   */
  private buildTaxBreakdown(invoice: InvoiceWithRelations): string {
    // ── REAGYP path ────────────────────────────────────────────────────────────
    if (invoice.compensacionPercent != null && invoice.compensacionAmount != null) {
      const base = invoice.lines.reduce((s, l) => s + Number(l.subtotal), 0);
      const discountedBase = invoice.discountAmount ? base - Number(invoice.discountAmount) : base;
      const compensacionPercent = Number(invoice.compensacionPercent);
      const compensacionAmount = Number(invoice.compensacionAmount);
      const irpfAmount = invoice.irpfTotal ? Number(invoice.irpfTotal) : 0;

      return `<DetalleDesglose>
        <BaseImponible>${discountedBase.toFixed(2)}</BaseImponible>
        <TipoImpositivo>${compensacionPercent.toFixed(2)}</TipoImpositivo>
        <CuotaImpuesto>${compensacionAmount.toFixed(2)}</CuotaImpuesto>
        ${
          irpfAmount > 0
            ? `<BaseRetencion>${(discountedBase + compensacionAmount).toFixed(2)}</BaseRetencion>
        <RetencionSoportada>${irpfAmount.toFixed(2)}</RetencionSoportada>`
            : ''
        }
      </DetalleDesglose>`;
    }

    // ── General IVA path ───────────────────────────────────────────────────────
    // Group lines by tax rate, tracking surcharge data alongside
    const taxGroups = new Map<
      number,
      { base: number; tax: number; irpf: number; surchargeAmount: number; surchargeRate: number }
    >();

    for (const line of invoice.lines) {
      const key = Number(line.taxRate);
      const current = taxGroups.get(key) || {
        base: 0,
        tax: 0,
        irpf: 0,
        surchargeAmount: 0,
        surchargeRate: 0,
      };
      const lineSurcharge = Number(line.surchargeAmount || 0);

      taxGroups.set(key, {
        base: current.base + Number(line.subtotal),
        tax: current.tax + Number(line.taxAmount),
        irpf: current.irpf + Number(line.irpfAmount || 0),
        surchargeAmount: current.surchargeAmount + lineSurcharge,
        surchargeRate:
          lineSurcharge > 0 && current.surchargeRate === 0
            ? Number(line.surchargeRate || 0)
            : current.surchargeRate,
      });
    }

    // Build XML for each tax group
    const breakdowns = Array.from(taxGroups.entries()).map(([rate, amounts]) => {
      const hasSurcharge = amounts.surchargeAmount > 0;
      return `<DetalleDesglose>
        <BaseImponible>${amounts.base.toFixed(2)}</BaseImponible>
        <TipoImpositivo>${rate.toFixed(2)}</TipoImpositivo>
        <CuotaImpuesto>${amounts.tax.toFixed(2)}</CuotaImpuesto>
        ${
          hasSurcharge
            ? `<RecargoEquivalencia>
          <BaseImponible>${amounts.base.toFixed(2)}</BaseImponible>
          <TipoImpositivo>${amounts.surchargeRate.toFixed(2)}</TipoImpositivo>
          <CuotaImpuesto>${amounts.surchargeAmount.toFixed(2)}</CuotaImpuesto>
        </RecargoEquivalencia>`
            : ''
        }
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

  private buildFacturasRectificadas(invoice: InvoiceWithRelations): string {
    if (!invoice.isRectificative || !invoice.rectifiedInvoice) {
      return '';
    }

    const original = invoice.rectifiedInvoice;
    const originalDate = this.formatDate(original.issueDate);
    const originalNumber = original.number ?? '';
    const originalIssuerNif = original.issuerSnapshotNif ?? '';

    return `<FacturasRectificadas>
      <IDFacturaRectificada>
        <IDEmisorFactura>
          <NIF>${originalIssuerNif}</NIF>
        </IDEmisorFactura>
        <NumSerieFactura>${this.escapeXml(originalNumber)}</NumSerieFactura>
        <FechaExpedicionFactura>${originalDate}</FechaExpedicionFactura>
      </IDFacturaRectificada>
    </FacturasRectificadas>`;
  }

  private buildImporteRectificacion(invoice: InvoiceWithRelations): string {
    if (
      !invoice.isRectificative ||
      invoice.rectificationType !== RectificationType.DIFFERENCES
    ) {
      return '';
    }

    return `<ImporteRectificacion>${invoice.total.toFixed(2)}</ImporteRectificacion>`;
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
