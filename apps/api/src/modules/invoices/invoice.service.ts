import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateInvoiceDto, CreateInvoiceLineDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RectifyInvoiceDto } from './dto/rectify-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { InvoiceStatus, SeriesType } from '@easyfactura/shared-types';
import { VerifactuService } from '../verifactu/services/verifactu.service';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceCalculationService } from './invoice-calculation.service';

const RECTIFIABLE_STATUSES = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PAID];

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VerifactuService))
    private verifactuService: VerifactuService,
    private invoiceNumberService: InvoiceNumberService,
    private calculationService: InvoiceCalculationService
  ) {}

  // ==================== PRIVATE HELPERS ====================

  private buildLineCreateData(
    tenantId: string,
    lines: CreateInvoiceLineDto[],
    calculatedLines: { subtotal: number; taxAmount: number; lineTotal: number }[]
  ) {
    return lines.map((line, index) => ({
      tenantId,
      productId: line.productId ?? null,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      subtotal: calculatedLines[index]!.subtotal,
      taxAmount: calculatedLines[index]!.taxAmount,
      lineTotal: calculatedLines[index]!.lineTotal,
      sortOrder: index,
    }));
  }

  private async resolveSeriesId(tenantId: string, seriesId?: string): Promise<string> {
    if (seriesId) {
      const series = await this.invoiceNumberService.validateSeries(tenantId, seriesId);
      return series.id;
    }
    const defaultSeries = await this.invoiceNumberService.findDefaultSeries(tenantId);
    return defaultSeries.id;
  }

  private async validateCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId, isActive: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado o no estÃ¡ activo');
    }
    return customer;
  }

  private async validateProductIds(tenantId: string, lines: CreateInvoiceLineDto[]) {
    const productIds = lines.filter((l) => l.productId).map((l) => l.productId as string);
    if (productIds.length === 0) return;

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Productos no encontrados: ${missing.join(', ')}`);
    }
  }

  // ==================== PUBLIC CRUD ====================

  async create(tenantId: string, dto: CreateInvoiceDto) {
    // Validate all references in parallel; resolveSeriesId falls back to default series
    const [seriesId] = await Promise.all([
      this.resolveSeriesId(tenantId, dto.seriesId),
      this.validateCustomer(tenantId, dto.customerId),
      this.validateProductIds(tenantId, dto.lines),
    ]);

    // RULE: totals are ALWAYS calculated in the backend
    const totals = this.calculationService.calculateTotals(
      dto.lines,
      dto.discountPercent,
      dto.irpfPercent
    );

    return this.prisma.invoice.create({
      data: {
        tenantId,
        seriesId,
        customerId: dto.customerId,
        // RULE: Drafts do not have a definitive number yet
        number: 'BORRADOR',
        issueDate: new Date(dto.issueDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: InvoiceStatus.DRAFT,
        subtotal: totals.subtotal,
        discountPercent: dto.discountPercent ?? null,
        discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
        taxTotal: totals.taxTotal,
        irpfPercent: dto.irpfPercent ?? null,
        irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
        total: totals.total,
        paymentMethod: dto.paymentMethod ?? null,
        notes: dto.notes ?? null,
        lines: {
          create: this.buildLineCreateData(tenantId, dto.lines, totals.lines),
        },
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async findAll(tenantId: string, query: QueryInvoiceDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      customerId,
      fromDate,
      toDate,
      sortBy = 'issueDate',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (fromDate || toDate) {
      where.issueDate = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    const validSortFields: Record<string, string> = {
      number: 'number',
      issueDate: 'issueDate',
      total: 'total',
      createdAt: 'createdAt',
    };
    const orderByField = validSortFields[sortBy] ?? 'issueDate';

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, name: true, prefix: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    console.log(`[InvoiceService] findOne called with tenantId=${tenantId}, id=${id}`);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: { select: { id: true, name: true, reference: true } },
          },
        },
        customer: true,
        series: true,
        verifactuLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!invoice) {
      console.warn(`[InvoiceService] Factura NO encontrada para id=${id}, tenantId=${tenantId}`);
      throw new NotFoundException('Factura no encontrada');
    }
    console.log(
      `[InvoiceService] Factura encontrada: id=${invoice.id}, tenantId=${invoice.tenantId}`
    );
    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException(
        'No se puede editar una factura confirmada. Crea una factura rectificativa si necesitas corregirla.'
      );
    }

    const customerId = dto.customerId ?? invoice.customerId;
    const seriesId = dto.seriesId
      ? await this.resolveSeriesId(tenantId, dto.seriesId)
      : invoice.seriesId;

    if (dto.customerId) await this.validateCustomer(tenantId, dto.customerId);

    const linesToUse = dto.lines ?? (invoice.lines as unknown as CreateInvoiceLineDto[]);
    if (dto.lines) await this.validateProductIds(tenantId, dto.lines);

    const currentDiscount =
      dto.discountPercent !== undefined
        ? dto.discountPercent
        : invoice.discountPercent
          ? Number(invoice.discountPercent)
          : undefined;

    const currentIrpf =
      dto.irpfPercent !== undefined
        ? dto.irpfPercent
        : invoice.irpfPercent
          ? Number(invoice.irpfPercent)
          : undefined;

    const totals = this.calculationService.calculateTotals(
      linesToUse,
      currentDiscount,
      currentIrpf
    );

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (dto.lines) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          customerId,
          seriesId,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          dueDate:
            dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
          discountPercent: dto.discountPercent !== undefined ? dto.discountPercent : undefined,
          discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
          irpfPercent: dto.irpfPercent !== undefined ? dto.irpfPercent : undefined,
          irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
          paymentMethod: dto.paymentMethod !== undefined ? dto.paymentMethod : undefined,
          notes: dto.notes !== undefined ? dto.notes : undefined,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          ...(dto.lines && {
            lines: {
              create: this.buildLineCreateData(tenantId, dto.lines, totals.lines),
            },
          }),
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
        },
      });
    });
  }

  // ==================== STATUS TRANSITIONS ====================

  async confirm(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException(
        'La factura ya estÃ¡ confirmada. Una vez confirmada es irreversible.'
      );
    }

    const lines = invoice.lines as unknown as CreateInvoiceLineDto[];

    const confirmedInvoice = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Assign correlative number atomically (row-level lock via UPDATE)
        const invoiceNumber = await this.invoiceNumberService.generateNextNumber(
          tenantId,
          invoice.seriesId,
          tx
        );

        // 2. Recalculate totals (never trust draft values after potential edits)
        const totals = this.calculationService.calculateTotals(
          lines,
          invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
          invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined
        );

        // 3. Replace lines with freshly calculated values
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });

        // 4. Update: assign number + recalculated totals + status
        return tx.invoice.update({
          where: { id },
          data: {
            number: invoiceNumber,
            status: InvoiceStatus.CONFIRMED,
            subtotal: totals.subtotal,
            discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
            taxTotal: totals.taxTotal,
            irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
            total: totals.total,
            lines: {
              create: this.buildLineCreateData(tenantId, lines, totals.lines),
            },
          },
          include: {
            lines: { orderBy: { sortOrder: 'asc' } },
            customer: true,
            series: true,
          },
        });
      },
      { isolationLevel: 'Serializable' }
    );

    // 5. Trigger VeriFactu processing asynchronously
    this.verifactuService.processInvoice(tenantId, id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[VeriFactu] Error processing invoice ${id}: ${message}`);
    });

    return confirmedInvoice;
  }

  async markAsPaid(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    const payableStatuses = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT];
    if (!payableStatuses.includes(invoice.status as InvoiceStatus)) {
      throw new ConflictException(
        'Solo se pueden marcar como pagadas las facturas confirmadas o enviadas'
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async duplicate(tenantId: string, id: string) {
    const original = await this.findOne(tenantId, id);

    const defaultSeries = await this.invoiceNumberService.findDefaultSeries(
      tenantId,
      original.isRectificative ? SeriesType.RECTIFICATIVE : SeriesType.INVOICE
    );

    const lines = original.lines as unknown as CreateInvoiceLineDto[];
    const totals = this.calculationService.calculateTotals(
      lines,
      original.discountPercent ? Number(original.discountPercent) : undefined,
      original.irpfPercent ? Number(original.irpfPercent) : undefined
    );

    return this.prisma.invoice.create({
      data: {
        tenantId,
        seriesId: defaultSeries.id,
        customerId: original.customerId,
        number: 'BORRADOR',
        issueDate: new Date(),
        dueDate: null,
        status: InvoiceStatus.DRAFT,
        subtotal: totals.subtotal,
        discountPercent: original.discountPercent,
        discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
        taxTotal: totals.taxTotal,
        irpfPercent: original.irpfPercent,
        irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
        total: totals.total,
        paymentMethod: original.paymentMethod,
        notes: original.notes,
        lines: {
          create: this.buildLineCreateData(tenantId, lines, totals.lines),
        },
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async rectify(tenantId: string, id: string, dto: RectifyInvoiceDto) {
    const original = await this.findOne(tenantId, id);

    if (!RECTIFIABLE_STATUSES.includes(original.status as InvoiceStatus)) {
      throw new ConflictException(
        'Solo se pueden rectificar facturas confirmadas, enviadas o pagadas'
      );
    }

    if (original.status === InvoiceStatus.RECTIFIED) {
      throw new ConflictException('Esta factura ya ha sido rectificada');
    }

    const rectificativeSeries = await this.invoiceNumberService.findDefaultSeries(
      tenantId,
      SeriesType.RECTIFICATIVE
    );

    await this.validateProductIds(tenantId, dto.lines);

    const totals = this.calculationService.calculateTotals(dto.lines);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.RECTIFIED },
      });

      return tx.invoice.create({
        data: {
          tenantId,
          seriesId: rectificativeSeries.id,
          customerId: original.customerId,
          number: 'BORRADOR',
          issueDate: new Date(),
          status: InvoiceStatus.DRAFT,
          isRectificative: true,
          rectifiedInvoiceId: id,
          rectificationReason: dto.rectificationReason,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          paymentMethod: original.paymentMethod,
          lines: {
            create: this.buildLineCreateData(tenantId, dto.lines, totals.lines),
          },
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
        },
      });
    });
  }

  async remove(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException(
        'No se puede eliminar una factura confirmada. Crea una factura rectificativa.'
      );
    }

    await this.prisma.invoice.delete({ where: { id } });
  }
}
