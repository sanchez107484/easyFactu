import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ExportFormat, InvoiceStatus, Prisma } from '@prisma/client';
import * as iconv from 'iconv-lite';
import { ExportModePrisma, ExportFormatDto } from './dto/export-invoices.dto';
import { AgencyExportCegidService } from './agency-export-cegid.service';
import { AgencyExportDiamaconService } from './agency-export-diamacon.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ContaPlusLine {
  fecha: string;
  numero: string;
  cuenta: string;
  concepto: string;
  debe: string;
  haber: string;
  nif: string;
  nombre: string;
  baseImponible: string;
  cuotaIva: string;
  tipoIva: string;
  cuotaIrpf: string;
}

export interface InvoiceForExportItem {
  id: string;
  number: string | null;
  issueDate: string;
  total: number;
  subtotal: number;
  taxTotal: number;
  irpfTotal: number | null;
  status: string;
  customerName: string;
  customerNif: string;
  /** ISO string of the last export event for this agency, or null if never exported. */
  lastExportedAt: string | null;
  lastExportFormat: string | null;
}

export interface InvoicesForExportResult {
  invoices: InvoiceForExportItem[];
  pendingCount: number;
  totalCount: number;
  clientBusinessName: string;
  clientNif: string;
}

export interface ExportResult {
  /** Raw encoded file buffer ready to send as HTTP response body. */
  fileBuffer: Buffer;
  filename: string;
  invoicesCount: number;
  totalRevenue: number;
}

export type ExportableInvoice = {
  id: string;
  number: string | null;
  issueDate: Date;
  dueDate: Date | null;
  total: Decimal;
  subtotal: Decimal;
  taxTotal: Decimal;
  irpfTotal: Decimal | null;
  irpfPercent: Decimal | null;
  discountPercent: Decimal | null;
  status: string;
  isRectificative: boolean;
  notes: string | null;
  rectifiedInvoice: { number: string | null } | null;
  series: { name: string; code: string } | null;
  customer: {
    name: string;
    legalName: string | null;
    type: string;
    nif: string;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    province: string | null;
    country: string;
    phone: string | null;
    email: string | null;
  } | null;
  lines: {
    description: string;
    quantity: Decimal;
    unitPrice: Decimal;
    subtotal: Decimal;
    taxRate: Decimal;
    taxAmount: Decimal;
    irpfRate: Decimal | null;
    irpfAmount: Decimal | null;
  }[];
  payments: {
    paymentDate: Date;
    amount: Decimal;
    paymentMethod: string | null;
  }[];
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AgencyExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cegidService: AgencyExportCegidService,
    private readonly diamaconService: AgencyExportDiamaconService
  ) {}

  /**
   * Returns invoices for the export preview modal, with their export status.
   * Used to populate the Step 2 preview before the user confirms the export.
   * Total DB cost: 2 queries (relation check + invoice fetch with events included).
   */
  async getInvoicesForExport(
    agencyTenantId: string,
    clientTenantId: string,
    mode: ExportModePrisma,
    dateFrom?: string,
    dateTo?: string
  ): Promise<InvoicesForExportResult> {
    // 1 query — verify ownership and get client metadata
    const clientTenant = await this.assertAndGetClient(agencyTenantId, clientTenantId);

    // 1 query — invoices with their most recent export event for this agency included
    const invoices = await this.fetchPreviewInvoices(
      agencyTenantId,
      clientTenantId,
      mode,
      dateFrom,
      dateTo
    );

    if (invoices.length === 0) {
      return {
        invoices: [],
        pendingCount: 0,
        totalCount: 0,
        clientBusinessName: clientTenant.businessName,
        clientNif: clientTenant.nif,
      };
    }

    const items = invoices.map((inv): InvoiceForExportItem => {
      const event = inv.exportEvents[0] ?? null;
      return {
        id: inv.id,
        number: inv.number,
        issueDate: inv.issueDate.toISOString(),
        total: Number(inv.total),
        subtotal: Number(inv.subtotal),
        taxTotal: Number(inv.taxTotal),
        irpfTotal: inv.irpfTotal ? Number(inv.irpfTotal) : null,
        status: inv.status,
        customerName: inv.customer?.name ?? 'Cliente desconocido',
        customerNif: inv.customer?.nif ?? '',
        lastExportedAt: event?.exportedAt.toISOString() ?? null,
        lastExportFormat: event?.format ?? null,
      };
    });

    const pendingCount = items.filter((i) => i.lastExportedAt === null).length;

    return {
      invoices: items,
      pendingCount,
      totalCount: items.length,
      clientBusinessName: clientTenant.businessName,
      clientNif: clientTenant.nif,
    };
  }

  /**
   * Runs the export: generates the file content, creates InvoiceExportEvents for
   * every exported invoice, and writes the AgencyExportLog entry.
   * Total DB cost: 3 operations (relation check, invoice fetch, write transaction).
   */
  async exportInvoices(
    agencyTenantId: string,
    clientTenantId: string,
    requestedByUserId: string,
    format: ExportFormatDto,
    mode: ExportModePrisma,
    dateFrom?: string,
    dateTo?: string,
    invoiceIds?: string[]
  ): Promise<ExportResult> {
    // 1 query — verify ownership and get client metadata
    const clientTenant = await this.assertAndGetClient(agencyTenantId, clientTenantId);

    // Deduplicate manual invoice IDs to prevent duplicate export events
    const uniqueInvoiceIds = invoiceIds ? [...new Set(invoiceIds)] : undefined;

    // 1 query — fetch invoices with lines for file generation
    const invoices = await this.fetchInvoicesForActualExport(
      agencyTenantId,
      clientTenantId,
      mode,
      dateFrom,
      dateTo,
      uniqueInvoiceIds
    );

    if (invoices.length === 0) {
      throw new BadRequestException(
        'No hay facturas confirmadas para exportar con los criterios seleccionados'
      );
    }

    const fileBuffer = await this.generateFileBuffer(
      format,
      invoices,
      clientTenant,
      dateFrom,
      dateTo
    );
    const filename = this.buildFilename(format, clientTenant.nif, dateFrom, dateTo);
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // 1 transaction — write log + invoice events atomically
    await this.writeExportRecord({
      agencyTenantId,
      clientTenantId,
      requestedByUserId,
      format,
      mode,
      dateFrom,
      dateTo,
      invoices,
    });

    return { fileBuffer, filename, invoicesCount: invoices.length, totalRevenue };
  }

  /**
   * Returns the preferred export format for an agency tenant, or CONTAPLUS as default.
   */
  async getPreferredFormat(agencyTenantId: string): Promise<ExportFormatDto | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: agencyTenantId },
      select: { preferredExportFormat: true },
    });
    return (tenant?.preferredExportFormat as ExportFormatDto) ?? null;
  }

  /**
   * Updates the preferred export format for an agency tenant.
   */
  async updatePreferredFormat(agencyTenantId: string, format: ExportFormatDto): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: agencyTenantId },
      data: { preferredExportFormat: format as unknown as ExportFormat },
    });
  }

  // ─── Private: data fetching ───────────────────────────────────────────────

  /**
   * Single query that verifies the client belongs to this agency's portfolio
   * and returns the client's display info. Throws 404 if the relation doesn't exist.
   * Replaces the previous two-query pattern (assertClientRelation + getClientTenant).
   */
  private async assertAndGetClient(
    agencyTenantId: string,
    clientTenantId: string
  ): Promise<{ businessName: string; nif: string }> {
    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
      select: {
        clientTenant: { select: { businessName: true, nif: true } },
      },
    });
    if (!relation) {
      throw new NotFoundException('Cliente no encontrado en tu cartera');
    }
    return relation.clientTenant;
  }

  /**
   * Fetches invoices for the preview modal, including the most recent export event
   * for this agency in the same query (Prisma nested select with take: 1).
   * Replaces the previous fetchInvoicesByMode + getExportEventsForInvoices pattern.
   */
  private async fetchPreviewInvoices(
    agencyTenantId: string,
    clientTenantId: string,
    mode: ExportModePrisma,
    dateFrom?: string,
    dateTo?: string
  ) {
    // Prisma.validator preserves literal types so findMany resolves the correct
    // overload and returns the narrowed type (with relations) instead of the full model.
    const baseSelect = Prisma.validator<Prisma.InvoiceSelect>()({
      id: true,
      number: true,
      issueDate: true,
      total: true,
      subtotal: true,
      taxTotal: true,
      irpfTotal: true,
      status: true,
      customer: { select: { name: true, nif: true } },
      exportEvents: {
        where: { agencyTenantId },
        orderBy: { exportedAt: 'desc' as const },
        take: 1,
        select: { exportedAt: true, format: true },
      },
    } satisfies Prisma.InvoiceSelect);

    // Use enum values — 'as const' would make the array readonly which Prisma rejects.
    const statusFilter = {
      in: [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PAID],
    };

    // Optional date range applied to every mode when provided
    const dateRangeFilter =
      dateFrom && dateTo
        ? { issueDate: { gte: new Date(dateFrom), lte: this.endOfDay(dateTo) } }
        : {};

    if (mode === ExportModePrisma.PENDING) {
      return this.prisma.invoice.findMany({
        where: {
          tenantId: clientTenantId,
          status: statusFilter,
          exportEvents: { none: { agencyTenantId } },
          ...dateRangeFilter,
        },
        select: baseSelect,
        orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
      });
    }

    if (mode === ExportModePrisma.PERIOD) {
      this.validateDateRange(dateFrom, dateTo);
      return this.prisma.invoice.findMany({
        where: {
          tenantId: clientTenantId,
          status: statusFilter,
          issueDate: { gte: new Date(dateFrom!), lte: this.endOfDay(dateTo!) },
        },
        select: baseSelect,
        orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
      });
    }

    // MANUAL: return confirmed invoices, applying date filter when provided (max 200)
    return this.prisma.invoice.findMany({
      where: { tenantId: clientTenantId, status: statusFilter, ...dateRangeFilter },
      select: baseSelect,
      orderBy: [{ issueDate: 'desc' }],
      take: 200,
    });
  }

  /** Fetches invoices with their lines for actual file generation. */
  private async fetchInvoicesForActualExport(
    agencyTenantId: string,
    clientTenantId: string,
    mode: ExportModePrisma,
    dateFrom?: string,
    dateTo?: string,
    invoiceIds?: string[]
  ): Promise<ExportableInvoice[]> {
    const baseWhere = {
      tenantId: clientTenantId,
      status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
    };

    let where: object;

    if (mode === ExportModePrisma.PENDING) {
      where = {
        ...baseWhere,
        exportEvents: { none: { agencyTenantId } },
      };
    } else if (mode === ExportModePrisma.PERIOD) {
      this.validateDateRange(dateFrom, dateTo);
      where = {
        ...baseWhere,
        issueDate: { gte: new Date(dateFrom!), lte: new Date(dateTo!) },
      };
    } else {
      // MANUAL
      if (!invoiceIds?.length) {
        throw new BadRequestException(
          'La exportación manual requiere al menos una factura seleccionada'
        );
      }
      where = {
        ...baseWhere,
        id: { in: invoiceIds },
      };
    }

    return this.prisma.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        issueDate: true,
        dueDate: true,
        total: true,
        subtotal: true,
        taxTotal: true,
        irpfTotal: true,
        irpfPercent: true,
        discountPercent: true,
        status: true,
        isRectificative: true,
        notes: true,
        rectifiedInvoice: { select: { number: true } },
        series: { select: { name: true, code: true } },
        customer: {
          select: {
            name: true,
            legalName: true,
            type: true,
            nif: true,
            address: true,
            postalCode: true,
            city: true,
            province: true,
            country: true,
            phone: true,
            email: true,
          },
        },
        lines: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            taxRate: true,
            taxAmount: true,
            irpfRate: true,
            irpfAmount: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          select: { paymentDate: true, amount: true, paymentMethod: true },
          orderBy: { paymentDate: 'asc' },
        },
      },
      orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
    });
  }

  // ─── Private: file generation ─────────────────────────────────────────────

  private async generateFileBuffer(
    format: ExportFormatDto,
    invoices: ExportableInvoice[],
    clientTenant: { businessName: string; nif: string },
    dateFrom?: string,
    dateTo?: string
  ): Promise<Buffer> {
    switch (format) {
      case ExportFormatDto.CONTAPLUS:
        return this.generateContaPlusBuffer(invoices, clientTenant, dateFrom, dateTo);
      case ExportFormatDto.CEGID:
        return this.cegidService.generate(invoices);
      case ExportFormatDto.DIAMACON:
        return this.diamaconService.generate(invoices);
      case ExportFormatDto.A3CON:
        throw new BadRequestException(`El formato ${format} aún no está disponible. Próximamente.`);
    }
  }

  private generateContaPlusBuffer(
    invoices: ExportableInvoice[],
    clientTenant: { businessName: string; nif: string },
    dateFrom?: string,
    dateTo?: string
  ): Buffer {
    const lines = invoices.map((inv) => this.buildContaPlusLine(inv));
    const text = this.formatContaPlusFile(lines, clientTenant, dateFrom, dateTo);
    // ContaPlus is legacy Windows software that expects Windows-1252 (Latin-1).
    // Sending UTF-8 would corrupt accented characters (á, é, í, ó, ú, ñ, ü).
    return iconv.encode(text, 'win1252');
  }

  private buildContaPlusLine(invoice: ExportableInvoice): ContaPlusLine {
    const customerName = invoice.customer?.name ?? 'Cliente desconocido';
    const customerNif = invoice.customer?.nif ?? '';
    // ContaPlus requires a non-empty account code — fall back to a generic code
    // when the customer has no NIF (e.g. soft-deleted customer records)
    const cuenta = customerNif
      ? customerNif
          .replace(/[^A-Z0-9]/gi, '')
          .toUpperCase()
          .substring(0, 10)
      : 'CLIENTE';

    const dominantTaxRate = this.getDominantTaxRate(invoice.lines);
    const issueDate = new Date(invoice.issueDate);
    const fecha = `${String(issueDate.getDate()).padStart(2, '0')}/${String(issueDate.getMonth() + 1).padStart(2, '0')}/${issueDate.getFullYear()}`;

    return {
      fecha,
      numero: invoice.number ?? '',
      cuenta,
      concepto: `Fra. ${invoice.number ?? 'BORRADOR'} - ${customerName.substring(0, 40)}`,
      debe: this.formatDecimal(invoice.total),
      haber: '0,00',
      nif: customerNif,
      nombre: customerName.substring(0, 40),
      baseImponible: this.formatDecimal(invoice.subtotal),
      cuotaIva: this.formatDecimal(invoice.taxTotal),
      tipoIva: String(dominantTaxRate),
      cuotaIrpf: this.formatDecimal(invoice.irpfTotal ?? new Decimal(0)),
    };
  }

  private getDominantTaxRate(lines: { taxRate: Decimal; taxAmount: Decimal }[]): number {
    if (lines.length === 0) return 0;
    const byRate = lines.reduce<Record<string, number>>((acc, line) => {
      const rate = Number(line.taxRate);
      acc[rate] = (acc[rate] ?? 0) + Number(line.taxAmount);
      return acc;
    }, {});
    return Number(Object.entries(byRate).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 0);
  }

  private formatDecimal(value: Decimal | number): string {
    return Number(value).toFixed(2).replace('.', ',');
  }

  private formatContaPlusFile(
    lines: ContaPlusLine[],
    clientTenant: { businessName: string; nif: string },
    dateFrom?: string,
    dateTo?: string
  ): string {
    const period = this.buildPeriodLabel(dateFrom, dateTo);
    const header = `CONTAPLUS|FACTURAS_EMITIDAS|${clientTenant.nif}|${clientTenant.businessName.toUpperCase().substring(0, 40)}|${period}`;
    const columns =
      'FECHA|NUMERO|CUENTA|CONCEPTO|DEBE|HABER|NIF|NOMBRE|BASE_IMPONIBLE|CUOTA_IVA|TIPO_IVA|CUOTA_IRPF';

    const dataLines = lines.map(
      (l) =>
        `${l.fecha}|${l.numero}|${l.cuenta}|${l.concepto}|${l.debe}|${l.haber}|${l.nif}|${l.nombre}|${l.baseImponible}|${l.cuotaIva}|${l.tipoIva}|${l.cuotaIrpf}`
    );

    const totalDebe = lines.reduce((sum, l) => sum + Number(l.debe.replace(',', '.')), 0);
    const totalBase = lines.reduce((sum, l) => sum + Number(l.baseImponible.replace(',', '.')), 0);
    const totalIva = lines.reduce((sum, l) => sum + Number(l.cuotaIva.replace(',', '.')), 0);
    const totalsLine = `TOTAL|||TOTAL ${lines.length} FACTURAS|${this.formatDecimal(totalDebe)}|0,00|||${this.formatDecimal(totalBase)}|${this.formatDecimal(totalIva)}||`;

    // No BOM — Windows-1252 encoding does not use a BOM.
    return [header, columns, ...dataLines, totalsLine].join('\r\n');
  }

  private buildPeriodLabel(dateFrom?: string, dateTo?: string): string {
    if (!dateFrom || !dateTo) return 'PENDIENTES';
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return `${String(from.getDate()).padStart(2, '0')}${String(from.getMonth() + 1).padStart(2, '0')}${from.getFullYear()}-${String(to.getDate()).padStart(2, '0')}${String(to.getMonth() + 1).padStart(2, '0')}${to.getFullYear()}`;
  }

  private buildFilename(
    format: ExportFormatDto,
    clientNif: string,
    dateFrom?: string,
    dateTo?: string
  ): string {
    const nifClean = clientNif.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const period =
      dateFrom && dateTo
        ? `${dateFrom.substring(0, 10).replace(/-/g, '')}_${dateTo.substring(0, 10).replace(/-/g, '')}`
        : `pendientes_${new Date().toISOString().substring(0, 10).replace(/-/g, '')}`;

    const ext = format === ExportFormatDto.CONTAPLUS ? 'txt' : 'xlsx';
    const prefix = format === ExportFormatDto.CEGID ? 'CEGID' : format;
    return `${prefix}_${nifClean}_${period}.${ext}`;
  }

  // ─── Private: database writes ─────────────────────────────────────────────

  private async writeExportRecord(params: {
    agencyTenantId: string;
    clientTenantId: string;
    requestedByUserId: string;
    format: ExportFormatDto;
    mode: ExportModePrisma;
    dateFrom?: string;
    dateTo?: string;
    invoices: ExportableInvoice[];
  }): Promise<void> {
    const {
      agencyTenantId,
      clientTenantId,
      requestedByUserId,
      format,
      mode,
      dateFrom,
      dateTo,
      invoices,
    } = params;
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    await this.prisma.$transaction(async (tx) => {
      const log = await tx.agencyExportLog.create({
        data: {
          agencyTenantId,
          clientTenantId,
          requestedByUserId,
          format: format as unknown as ExportFormat,
          mode,
          dateFrom: dateFrom ? new Date(dateFrom) : null,
          dateTo: dateTo ? new Date(dateTo) : null,
          invoicesCount: invoices.length,
          totalRevenue,
        },
        select: { id: true },
      });

      await tx.invoiceExportEvent.createMany({
        data: invoices.map((inv) => ({
          invoiceId: inv.id,
          agencyTenantId,
          clientTenantId,
          exportLogId: log.id,
          format: format as unknown as ExportFormat,
          exportedByUserId: requestedByUserId,
        })),
      });
    });
  }

  // ─── Private: validation ──────────────────────────────────────────────────

  /**
   * Returns a Date set to 23:59:59.999 of the given date string.
   * Ensures invoices issued anywhere during `dateTo` are included.
   */
  private endOfDay(dateStr: string): Date {
    const d = new Date(dateStr);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  private validateDateRange(dateFrom?: string, dateTo?: string): void {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('El modo Período requiere fecha de inicio y fecha de fin');
    }
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Las fechas no tienen un formato válido');
    }
    if (from > to) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 366) {
      throw new BadRequestException('El rango de fechas no puede superar los 366 días');
    }
  }
}
