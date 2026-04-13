import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  InvoiceStatus as PrismaInvoiceStatus,
  QuoteAcceptanceStatus as PrismaQuoteAcceptanceStatus,
} from '@prisma/client';
import { CreateInvoiceDto, CreateInvoiceLineDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RectifyInvoiceDto } from './dto/rectify-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { InvoiceStatus, SeriesType } from '@easyfactura/shared-types';
import { UpdateInvoiceNotesDto } from './dto/update-invoice-notes.dto';
import { VerifactuService } from '../verifactu/services/verifactu.service';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceCalculationService } from './invoice-calculation.service';

const RECTIFIABLE_STATUSES = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PAID];
const EDITABLE_STATUSES = [InvoiceStatus.DRAFT, InvoiceStatus.PROFORMA, InvoiceStatus.QUOTE];

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
    return lines.map((line, index) => {
      const subtotal = calculatedLines[index]!.subtotal;
      // Per-line IRPF (BUG-03 fix): calculate irpfAmount when irpfRate is provided
      const irpfRate = line.irpfRate != null ? Number(line.irpfRate) : null;
      const irpfAmount =
        irpfRate != null ? Math.round(subtotal * (irpfRate / 100) * 100) / 100 : null;

      return {
        tenantId,
        ...(line.productId ? { product: { connect: { id: line.productId } } } : {}),
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        subtotal,
        taxAmount: calculatedLines[index]!.taxAmount,
        lineTotal: calculatedLines[index]!.lineTotal,
        hideQty: line.hideQty ?? false,
        sortOrder: index,
        ...(irpfRate != null && { irpfRate }),
        ...(irpfAmount != null && { irpfAmount }),
      };
    });
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
      throw new NotFoundException('Cliente no encontrado o no está activo');
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
    const isQuote = dto.invoiceType === 'quote';
    const isProforma = dto.invoiceType === 'proforma';

    // For quotes the series is auto-resolved inside the transaction; skip the default lookup.
    const [seriesId, customer] = await Promise.all([
      isQuote ? Promise.resolve('') : this.resolveSeriesId(tenantId, dto.seriesId),
      this.validateCustomer(tenantId, dto.customerId),
      this.validateProductIds(tenantId, dto.lines),
    ]);
    let invoiceStatus: PrismaInvoiceStatus;
    if (isProforma) {
      invoiceStatus = PrismaInvoiceStatus.PROFORMA;
    } else if (isQuote) {
      invoiceStatus = PrismaInvoiceStatus.QUOTE;
    } else {
      invoiceStatus = PrismaInvoiceStatus.DRAFT;
    }
    // Proformas and regular DRAFT invoices don't get a legal number at creation.
    // Quotes get a PRE- sequential number immediately.
    const invoiceNumber = null;

    const totals = this.calculationService.calculateTotals(
      dto.lines,
      dto.discountPercent,
      dto.irpfPercent
    );

    return this.prisma.$transaction(async (tx) => {
      let quoteNumber: string | null = invoiceNumber;
      let resolvedSeriesId = seriesId;

      if (isQuote) {
        const quoteSeries = await this.invoiceNumberService.findOrCreateQuoteSeries(tenantId, tx);
        quoteNumber = await this.invoiceNumberService.generateNextNumber(
          tenantId,
          quoteSeries.id,
          tx
        );
        resolvedSeriesId = quoteSeries.id;
      }

      return tx.invoice.create({
        data: {
          tenantId,
          seriesId: resolvedSeriesId,
          customerId: dto.customerId,
          number: quoteNumber,
          issueDate: new Date(dto.issueDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          status: invoiceStatus,
          invoiceType: dto.invoiceType ?? 'standard',
          templateId: dto.templateId ?? null,
          layoutOverride: dto.layoutOverride ? { ...dto.layoutOverride } : undefined,
          validUntil: isQuote && dto.validUntil ? new Date(dto.validUntil) : null,
          quoteAcceptanceStatus: isQuote ? PrismaQuoteAcceptanceStatus.PENDING : null,
          subtotal: totals.subtotal,
          discountPercent: dto.discountPercent ?? null,
          discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
          taxTotal: totals.taxTotal,
          irpfPercent: dto.irpfPercent ?? null,
          irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
          total: totals.total,
          paymentMethod: (dto.paymentMethod ?? null) as any,
          notes: dto.notes ?? null,
          paymentDetails: dto.paymentDetails ? { ...dto.paymentDetails } : undefined,
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

    if (status) {
      where.status = status;
    } else {
      // Exclude quotes from the invoices list — they have their own section
      where.status = { not: PrismaInvoiceStatus.QUOTE };
    }
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
    // Cast a any para que los métodos que usan el resultado accedan a todos los campos
    // sin conflictos de tipos entre versiones de Prisma
    return invoice as any;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(tenantId, id);

    if (!EDITABLE_STATUSES.includes(invoice.status as InvoiceStatus)) {
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

      const updateData: Prisma.InvoiceUncheckedUpdateInput = {
        customerId,
        seriesId: seriesId as string,
        // Auto-correct status if a proforma was erroneously saved as DRAFT
        ...(invoice.invoiceType === 'proforma' ? { status: PrismaInvoiceStatus.PROFORMA } : {}),
        // Auto-correct status if a quote was erroneously saved as DRAFT
        ...(invoice.invoiceType === 'quote' ? { status: PrismaInvoiceStatus.QUOTE } : {}),
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        dueDate:
          dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
        invoiceType: dto.invoiceType !== undefined ? dto.invoiceType : undefined,
        templateId: dto.templateId !== undefined ? dto.templateId : undefined,
        layoutOverride:
          dto.layoutOverride !== undefined
            ? dto.layoutOverride
              ? { ...dto.layoutOverride }
              : Prisma.DbNull
            : undefined,
        discountPercent: dto.discountPercent !== undefined ? dto.discountPercent : undefined,
        discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
        irpfPercent: dto.irpfPercent !== undefined ? dto.irpfPercent : undefined,
        irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
        paymentMethod: (dto.paymentMethod !== undefined ? dto.paymentMethod : null) as any,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        ...(dto.paymentDetails !== undefined ? { paymentDetails: { ...dto.paymentDetails } } : {}),
        ...(dto.validUntil !== undefined
          ? { validUntil: dto.validUntil ? new Date(dto.validUntil) : null }
          : {}),
        ...(dto.quoteAcceptanceStatus !== undefined
          ? { quoteAcceptanceStatus: dto.quoteAcceptanceStatus as PrismaQuoteAcceptanceStatus }
          : {}),
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        ...(dto.lines && {
          lines: {
            create: this.buildLineCreateData(tenantId, dto.lines, totals.lines),
          },
        }),
      };

      return tx.invoice.update({
        where: { id },
        data: updateData,
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

    if (invoice.invoiceType === 'proforma') {
      throw new ConflictException(
        'Las facturas proforma no se pueden confirmar directamente. Primero conviértela a factura oficial.'
      );
    }

    if (invoice.invoiceType === 'quote') {
      throw new ConflictException(
        'Los presupuestos no se pueden confirmar directamente. Primero conviértelo a factura oficial.'
      );
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException(
        'La factura ya está confirmada. Una vez confirmada es irreversible.'
      );
    }

    const lines = invoice.lines as unknown as CreateInvoiceLineDto[];

    const confirmedInvoice = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const invoiceNumber = await this.invoiceNumberService.generateNextNumber(
          tenantId,
          invoice.seriesId,
          tx
        );

        const totals = this.calculationService.calculateTotals(
          lines,
          invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
          invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined
        );

        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });

        return tx.invoice.update({
          where: { id },
          data: {
            number: invoiceNumber,
            status: PrismaInvoiceStatus.CONFIRMED,
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
      data: { status: PrismaInvoiceStatus.PAID },
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

    const paymentDetails = original.paymentDetails;

    return this.prisma.invoice.create({
      data: {
        tenantId,
        seriesId: defaultSeries.id,
        customerId: original.customerId,
        number: null,
        issueDate: new Date(),
        dueDate: null,
        status: PrismaInvoiceStatus.DRAFT,
        templateId: original.templateId ?? null,
        ...(original.layoutOverride != null ? { layoutOverride: original.layoutOverride } : {}),
        subtotal: totals.subtotal,
        discountPercent: original.discountPercent,
        discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
        taxTotal: totals.taxTotal,
        irpfPercent: original.irpfPercent,
        irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
        total: totals.total,
        paymentMethod: original.paymentMethod as any,
        ...(paymentDetails != null ? { paymentDetails } : {}),
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

    const paymentDetails = original.paymentDetails;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoice.update({
        where: { id },
        data: { status: PrismaInvoiceStatus.RECTIFIED },
      });

      return tx.invoice.create({
        data: {
          tenantId,
          seriesId: rectificativeSeries.id,
          customerId: original.customerId,
          number: null,
          issueDate: new Date(),
          status: PrismaInvoiceStatus.DRAFT,
          isRectificative: true,
          rectifiedInvoiceId: id,
          rectificationReason: dto.rectificationReason,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          paymentMethod: original.paymentMethod as any,
          ...(paymentDetails != null ? { paymentDetails } : {}),
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

    if (!EDITABLE_STATUSES.includes(invoice.status as InvoiceStatus)) {
      throw new ConflictException(
        'No se puede eliminar una factura confirmada. Crea una factura rectificativa.'
      );
    }

    await this.prisma.invoice.delete({ where: { id } });
  }

  // ==================== PROFORMA CONVERSION ====================

  async convertDraftToProforma(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceType === 'proforma') {
      throw new ConflictException('La factura ya es una proforma.');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException(
        'Solo se pueden convertir borradores a proforma. Las facturas confirmadas no se pueden convertir.'
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        invoiceType: 'proforma',
        status: PrismaInvoiceStatus.PROFORMA,
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async convertToOfficial(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceType !== 'proforma') {
      throw new ConflictException(
        'Solo se pueden convertir facturas proforma a facturas oficiales'
      );
    }

    const lines = invoice.lines as unknown as CreateInvoiceLineDto[];
    const totals = this.calculationService.calculateTotals(
      lines,
      invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
      invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined
    );

    const paymentDetails = invoice.paymentDetails;

    // Crear la factura ordinaria (borrador) y eliminar la proforma en la misma transacción.
    // La proforma es un documento no vinculante: una vez convertida a oficial deja de tener
    // sentido y se elimina para evitar confusión. Las líneas, logs y notas se borran en
    // cascada según las relaciones definidas en el schema de Prisma.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newInvoice = await tx.invoice.create({
        data: {
          tenantId,
          seriesId: invoice.seriesId,
          customerId: invoice.customerId,
          number: null,
          issueDate: new Date(),
          dueDate: invoice.dueDate ?? null,
          status: PrismaInvoiceStatus.DRAFT,
          invoiceType: 'standard',
          templateId: invoice.templateId ?? null,
          ...(invoice.layoutOverride != null ? { layoutOverride: invoice.layoutOverride } : {}),
          subtotal: totals.subtotal,
          discountPercent: invoice.discountPercent,
          discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
          taxTotal: totals.taxTotal,
          irpfPercent: invoice.irpfPercent,
          irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
          total: totals.total,
          paymentMethod: invoice.paymentMethod as any,
          ...(paymentDetails != null ? { paymentDetails } : {}),
          notes: invoice.notes,
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

      await tx.invoice.delete({ where: { id } });

      return newInvoice;
    });
  }

  // ==================== NOTE OPERATIONS ====================

  async updateNotes(tenantId: string, userId: string, id: string, dto: UpdateInvoiceNotesDto) {
    const invoice = await this.findOne(tenantId, id);

    const previousNotes = invoice.notes ?? null;
    const newNotes = dto.notes !== undefined ? (dto.notes ?? null) : previousNotes;

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { notes: newNotes },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
        verifactuLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    await this.prisma.invoiceNoteLog.create({
      data: {
        tenantId,
        invoiceId: id,
        userId,
        previousNotes,
        newNotes,
      },
    });

    return updated;
  }

  // ==================== QUOTE CONVERSION ====================

  async updateQuoteAcceptanceStatus(
    tenantId: string,
    id: string,
    quoteAcceptanceStatus: PrismaQuoteAcceptanceStatus
  ) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceType !== 'quote') {
      throw new BadRequestException('Solo los presupuestos tienen estado de aceptación');
    }

    if (invoice.quoteAcceptanceStatus === 'CONVERTED') {
      throw new ConflictException('El presupuesto ya ha sido convertido y no se puede modificar');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { quoteAcceptanceStatus },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async convertQuoteToProforma(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceType !== 'quote') {
      throw new BadRequestException('Solo se pueden convertir presupuestos');
    }

    if (invoice.quoteAcceptanceStatus === 'CONVERTED') {
      throw new ConflictException('El presupuesto ya ha sido convertido anteriormente');
    }

    if (!invoice.paymentMethod) {
      throw new BadRequestException(
        'El presupuesto debe tener un método de pago configurado antes de convertirlo a factura'
      );
    }

    const defaultSeries = await this.invoiceNumberService.findDefaultSeries(
      tenantId,
      SeriesType.INVOICE
    );

    const lines = invoice.lines as unknown as CreateInvoiceLineDto[];
    const totals = this.calculationService.calculateTotals(
      lines,
      invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
      invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined
    );
    const paymentDetails = invoice.paymentDetails;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const proforma = await tx.invoice.create({
        data: {
          tenantId,
          seriesId: defaultSeries.id,
          customerId: invoice.customerId,
          number: null,
          issueDate: new Date(),
          dueDate: invoice.dueDate ?? null,
          status: PrismaInvoiceStatus.PROFORMA,
          invoiceType: 'proforma',
          templateId: invoice.templateId ?? null,
          ...(invoice.layoutOverride != null ? { layoutOverride: invoice.layoutOverride } : {}),
          subtotal: totals.subtotal,
          discountPercent: invoice.discountPercent,
          discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
          taxTotal: totals.taxTotal,
          irpfPercent: invoice.irpfPercent,
          irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
          total: totals.total,
          paymentMethod: invoice.paymentMethod as any,
          ...(paymentDetails != null ? { paymentDetails } : {}),
          notes: invoice.notes
            ? `${invoice.notes}\n\nGenerada desde presupuesto ${invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}`
            : `Generada desde presupuesto ${invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}`,
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

      await tx.invoice.update({
        where: { id },
        data: {
          quoteAcceptanceStatus: PrismaQuoteAcceptanceStatus.CONVERTED,
          convertedToInvoiceId: proforma.id,
        },
      });

      return proforma;
    });
  }

  async convertQuoteToOfficial(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceType !== 'quote') {
      throw new BadRequestException('Solo se pueden convertir presupuestos');
    }

    if (invoice.quoteAcceptanceStatus === 'CONVERTED') {
      throw new ConflictException('El presupuesto ya ha sido convertido anteriormente');
    }

    if (!invoice.paymentMethod) {
      throw new BadRequestException(
        'El presupuesto debe tener un método de pago configurado antes de convertirlo a factura'
      );
    }

    const defaultSeries = await this.invoiceNumberService.findDefaultSeries(
      tenantId,
      SeriesType.INVOICE
    );

    const lines = invoice.lines as unknown as CreateInvoiceLineDto[];
    const totals = this.calculationService.calculateTotals(
      lines,
      invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
      invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined
    );
    const paymentDetails = invoice.paymentDetails;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const draft = await tx.invoice.create({
        data: {
          tenantId,
          seriesId: defaultSeries.id,
          customerId: invoice.customerId,
          number: null,
          issueDate: new Date(),
          dueDate: invoice.dueDate ?? null,
          status: PrismaInvoiceStatus.DRAFT,
          invoiceType: 'standard',
          templateId: invoice.templateId ?? null,
          ...(invoice.layoutOverride != null ? { layoutOverride: invoice.layoutOverride } : {}),
          subtotal: totals.subtotal,
          discountPercent: invoice.discountPercent,
          discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
          taxTotal: totals.taxTotal,
          irpfPercent: invoice.irpfPercent,
          irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
          total: totals.total,
          paymentMethod: invoice.paymentMethod as any,
          ...(paymentDetails != null ? { paymentDetails } : {}),
          notes: invoice.notes
            ? `${invoice.notes}\n\nGenerada desde presupuesto ${invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}`
            : `Generada desde presupuesto ${invoice.number ?? invoice.id.slice(0, 8).toUpperCase()}`,
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

      await tx.invoice.update({
        where: { id },
        data: {
          quoteAcceptanceStatus: PrismaQuoteAcceptanceStatus.CONVERTED,
          convertedToInvoiceId: draft.id,
        },
      });

      return draft;
    });
  }
}
