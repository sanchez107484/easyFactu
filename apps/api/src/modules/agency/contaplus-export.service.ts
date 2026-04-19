import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface ContaPlusLine {
  fecha: string; // DD/MM/AAAA
  numero: string; // Invoice number
  cuenta: string; // Client NIF → account code
  concepto: string; // Description
  debe: string; // Debit (invoice total)
  haber: string; // Credit (always empty for invoices)
  nif: string; // Client NIF
  nombre: string; // Client business name
  baseImponible: string;
  cuotaIva: string;
  tipoIva: string; // IVA %
  cuotaIrpf: string;
}

@Injectable()
export class ContaPlusExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a ContaPlus-compatible .txt export of a client's confirmed invoices.
   * Format: pipe-separated fields, one invoice per line, UTF-8 with BOM for Excel compatibility.
   *
   * @param agencyTenantId - The requesting agency tenant (verified by guard)
   * @param clientTenantId - The client whose invoices to export
   * @param requestedByUserId - User triggering the export (for audit log)
   * @param year - Fiscal year (e.g. 2026)
   * @param quarter - Optional 1-4; null means full year
   */
  async generateContaPlusExport(
    agencyTenantId: string,
    clientTenantId: string,
    requestedByUserId: string,
    year: number,
    quarter?: number
  ): Promise<{ content: string; filename: string; invoicesCount: number; totalRevenue: number }> {
    this.validateExportParams(year, quarter);

    // Verify the agency-client relationship is active
    const relation = await this.prisma.agencyClientRelation.findUnique({
      where: { agencyTenantId_clientTenantId: { agencyTenantId, clientTenantId } },
      select: { clientTenant: { select: { businessName: true, nif: true } } },
    });

    if (!relation) {
      throw new NotFoundException('Cliente no encontrado en tu cartera');
    }

    const { fromDate, toDate } = this.buildDateRange(year, quarter);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: clientTenantId,
        status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
        issueDate: { gte: fromDate, lte: toDate },
      },
      include: {
        customer: { select: { name: true, nif: true } },
        lines: { select: { subtotal: true, taxRate: true, taxAmount: true } },
      },
      orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
    });

    if (invoices.length === 0) {
      throw new BadRequestException(
        `No hay facturas confirmadas en el período seleccionado (${year}${quarter ? ` T${quarter}` : ''})`
      );
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const lines = invoices.map((inv) => this.buildContaPlusLine(inv));
    const content = this.formatContaPlusFile(lines, relation.clientTenant, year, quarter);

    // Write the audit log (non-blocking — don't await to keep export fast)
    this.logExport({
      agencyTenantId,
      clientTenantId,
      requestedByUserId,
      year,
      quarter,
      invoicesCount: invoices.length,
      totalRevenue,
    }).catch(() => {
      // Log failures are non-critical
    });

    const filename = this.buildFilename(relation.clientTenant.nif, year, quarter);

    return { content, filename, invoicesCount: invoices.length, totalRevenue };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private validateExportParams(year: number, quarter?: number): void {
    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      throw new BadRequestException(`Año inválido: ${year}`);
    }
    if (quarter !== undefined && (quarter < 1 || quarter > 4)) {
      throw new BadRequestException('El trimestre debe ser 1, 2, 3 o 4');
    }
  }

  private buildDateRange(year: number, quarter?: number): { fromDate: Date; toDate: Date } {
    if (!quarter) {
      return {
        fromDate: new Date(year, 0, 1), // Jan 1
        toDate: new Date(year, 11, 31), // Dec 31
      };
    }

    // Quarter ranges: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;

    return {
      fromDate: new Date(year, startMonth, 1),
      toDate: new Date(year, endMonth + 1, 0), // Last day of end month
    };
  }

  private buildContaPlusLine(invoice: {
    number: string | null;
    issueDate: Date;
    total: Decimal;
    subtotal: Decimal;
    taxTotal: Decimal;
    irpfTotal: Decimal | null;
    customer: { name: string; nif: string | null } | null;
    lines: { subtotal: Decimal; taxRate: Decimal; taxAmount: Decimal }[];
  }): ContaPlusLine {
    const customerName = invoice.customer?.name ?? 'Cliente desconocido';
    const customerNif = invoice.customer?.nif ?? '';

    // ContaPlus uses the NIF as the account code (vendor/client account)
    const cuenta = customerNif
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .substring(0, 10);

    // Aggregate tax rates: if multiple rates, use the dominant one for the export line
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

    // Pick the tax rate with the highest total tax amount
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
    year: number,
    quarter?: number
  ): string {
    // ContaPlus header line
    const period = quarter ? `T${quarter}/${year}` : `${year}`;
    const header = `CONTAPLUS|FACTURAS_EMITIDAS|${clientTenant.nif}|${clientTenant.businessName.toUpperCase().substring(0, 40)}|${period}`;

    // Column headers
    const columns =
      'FECHA|NUMERO|CUENTA|CONCEPTO|DEBE|HABER|NIF|NOMBRE|BASE_IMPONIBLE|CUOTA_IVA|TIPO_IVA|CUOTA_IRPF';

    const dataLines = lines.map(
      (l) =>
        `${l.fecha}|${l.numero}|${l.cuenta}|${l.concepto}|${l.debe}|${l.haber}|${l.nif}|${l.nombre}|${l.baseImponible}|${l.cuotaIva}|${l.tipoIva}|${l.cuotaIrpf}`
    );

    // Totals line
    const totalDebe = lines.reduce((sum, l) => sum + Number(l.debe.replace(',', '.')), 0);
    const totalBase = lines.reduce((sum, l) => sum + Number(l.baseImponible.replace(',', '.')), 0);
    const totalIva = lines.reduce((sum, l) => sum + Number(l.cuotaIva.replace(',', '.')), 0);
    const totalsLine = `TOTAL|||TOTAL ${lines.length} FACTURAS|${this.formatDecimal(totalDebe)}|0,00|||${this.formatDecimal(totalBase)}|${this.formatDecimal(totalIva)}||`;

    // BOM + content (UTF-8 BOM for Windows compatibility with Excel/ContaPlus)
    const bom = '\uFEFF';
    return bom + [header, columns, ...dataLines, totalsLine].join('\r\n');
  }

  private buildFilename(clientNif: string, year: number, quarter?: number): string {
    const period = quarter ? `T${quarter}_${year}` : `${year}`;
    const nifClean = clientNif.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `ContaPlus_${nifClean}_${period}.txt`;
  }

  private async logExport(params: {
    agencyTenantId: string;
    clientTenantId: string;
    requestedByUserId: string;
    year: number;
    quarter?: number;
    invoicesCount: number;
    totalRevenue: number;
  }): Promise<void> {
    await this.prisma.agencyExportLog.create({
      data: {
        agencyTenantId: params.agencyTenantId,
        clientTenantId: params.clientTenantId,
        requestedByUserId: params.requestedByUserId,
        format: 'CONTAPLUS',
        year: params.year,
        quarter: params.quarter ?? null,
        invoicesCount: params.invoicesCount,
        totalRevenue: params.totalRevenue,
      },
    });
  }
}
