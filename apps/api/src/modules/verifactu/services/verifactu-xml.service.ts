import { Injectable } from '@nestjs/common';
import { Prisma, Tenant } from '@prisma/client';
import { RectificationType } from '@easyfactura/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';
import { resolveInvoiceRecordType } from '../xml/invoice-record-type';
import {
  buildCancellationRecordXml,
  buildInvoiceRecordXml,
  InvoiceRecordXmlData,
  InvoiceReference,
} from '../xml/verifactu-record.xml';

const REFERENCED_INVOICE_SELECT = {
  number: true,
  issueDate: true,
  issuerSnapshotNif: true,
  invoiceType: true,
} satisfies Prisma.InvoiceSelect;

const INVOICE_XML_INCLUDE = {
  customer: { select: { name: true, nif: true } },
  lines: true,
  rectifiedInvoice: { select: REFERENCED_INVOICE_SELECT },
  exchangedInvoices: { select: REFERENCED_INVOICE_SELECT, orderBy: { issueDate: 'asc' } },
} satisfies Prisma.InvoiceInclude;

type InvoiceForXml = Prisma.InvoiceGetPayload<{ include: typeof INVOICE_XML_INCLUDE }>;
type ReferencedInvoice = Prisma.InvoiceGetPayload<{ select: typeof REFERENCED_INVOICE_SELECT }>;

type IssuerSource = Pick<Tenant, 'nif' | 'legalName' | 'businessName'>;

/**
 * Loads invoices and cancellation records and turns them into VeriFactu XML (see
 * verifactu-record.xml.ts for the document itself).
 *
 * Issuer and customer data come from the immutable snapshots captured at confirmation, so the
 * XML always matches the legally binding moment even if a submission is retried days later.
 * Invoices confirmed before the snapshot migration fall back to live tenant/customer data.
 */
@Injectable()
export class VerifactuXmlService {
  constructor(private prisma: PrismaService) {}

  async generateXml(tenantId: string, invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: INVOICE_XML_INCLUDE,
    });
    if (!invoice) throw new Error('Factura no encontrada');
    if (!invoice.number) {
      throw new Error('Solo se puede generar XML para facturas con número asignado (confirmadas)');
    }
    const tenant = await this.findTenant(tenantId);
    return buildInvoiceRecordXml(this.toRecordData(tenant, invoice, invoice.number));
  }

  async generateCancellationXml(tenantId: string, cancellationId: string): Promise<string> {
    const cancellation = await this.prisma.invoiceCancellation.findFirst({
      where: { id: cancellationId, tenantId },
      include: {
        invoice: {
          select: {
            ...REFERENCED_INVOICE_SELECT,
            issuerSnapshotName: true,
            issuerSnapshotLegalName: true,
          },
        },
      },
    });
    if (!cancellation?.hash) throw new Error('Registro de anulación no encontrado o sin huella');
    const tenant = await this.findTenant(tenantId);
    const annulled = this.toReference(cancellation.invoice, tenant);
    return buildCancellationRecordXml({
      issuer: {
        nif: annulled.issuerNif,
        name: this.issuerName(tenant, cancellation.invoice),
      },
      annulled,
      hash: cancellation.hash,
      prevHash: cancellation.prevHash,
    });
  }

  private async findTenant(tenantId: string): Promise<IssuerSource> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nif: true, legalName: true, businessName: true },
    });
    if (!tenant) throw new Error('Tenant no encontrado');
    return tenant;
  }

  private toRecordData(
    tenant: IssuerSource,
    invoice: InvoiceForXml,
    number: string
  ): InvoiceRecordXmlData {
    return {
      issuer: {
        nif: invoice.issuerSnapshotNif ?? tenant.nif,
        name: this.issuerName(tenant, invoice),
      },
      number,
      issueDate: invoice.issueDate,
      operationDate: invoice.operationDate,
      recordType: resolveInvoiceRecordType({
        invoiceType: invoice.invoiceType,
        isRectificative: invoice.isRectificative,
        rectifiedInvoice: invoice.rectifiedInvoice,
        exchangedInvoiceCount: invoice.exchangedInvoices.length,
      }),
      rectification: this.toRectification(tenant, invoice),
      replacedInvoices: invoice.exchangedInvoices.map((replaced) =>
        this.toReference(replaced, tenant)
      ),
      recipient: {
        name: invoice.customerSnapshotName ?? invoice.customer.name,
        nif: invoice.customerSnapshotNif ?? invoice.customer.nif,
      },
      total: invoice.total,
      discountAmount: invoice.discountAmount,
      irpfTotal: invoice.irpfTotal,
      compensacionPercent: invoice.compensacionPercent,
      compensacionAmount: invoice.compensacionAmount,
      lines: invoice.lines,
      hash: invoice.hash,
      prevHash: invoice.prevHash,
    };
  }

  private toRectification(
    tenant: IssuerSource,
    invoice: InvoiceForXml
  ): InvoiceRecordXmlData['rectification'] {
    if (!invoice.isRectificative) return null;
    return {
      type: invoice.rectificationType === RectificationType.SUBSTITUTION ? 'I' : 'S',
      rectified: invoice.rectifiedInvoice
        ? this.toReference(invoice.rectifiedInvoice, tenant)
        : null,
    };
  }

  private toReference(invoice: ReferencedInvoice, tenant: IssuerSource): InvoiceReference {
    return {
      issuerNif: invoice.issuerSnapshotNif ?? tenant.nif,
      number: invoice.number ?? '',
      issueDate: invoice.issueDate,
    };
  }

  private issuerName(
    tenant: IssuerSource,
    invoice: { issuerSnapshotLegalName: string | null; issuerSnapshotName: string | null }
  ): string {
    return (
      invoice.issuerSnapshotLegalName ??
      invoice.issuerSnapshotName ??
      tenant.legalName ??
      tenant.businessName
    );
  }
}
