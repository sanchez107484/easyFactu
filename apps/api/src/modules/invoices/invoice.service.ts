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
  InvoiceType as PrismaInvoiceType,
  PaymentStatus as PrismaPaymentStatus,
  QuoteAcceptanceStatus as PrismaQuoteAcceptanceStatus,
} from '@prisma/client';
import { CreateInvoiceDto, CreateInvoiceLineDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RectifyInvoiceDto } from './dto/rectify-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { InvoiceStatus, PaymentStatus, SeriesType } from '@easyfactura/shared-types';
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

  /**
   * Builds agency info from a createdByUser relation.
   * createdByUserId is only stored when the creator is NOT the tenant owner,
   * so if the relation exists it is always an agency user.
   */
  private buildAgencyInfo(
    createdByUser: {
      firstName: string;
      lastName: string;
      tenantUsers: Array<{ tenant: { businessName: string } }>;
    } | null
  ): { userName: string; agencyName: string } | null {
    if (!createdByUser) return null;

    const agencyTenant = createdByUser.tenantUsers[0];
    if (!agencyTenant) return null;

    return {
      userName: `${createdByUser.firstName} ${createdByUser.lastName}`.trim(),
      agencyName: agencyTenant.tenant.businessName,
    };
  }

  private buildLineCreateData(
    tenantId: string,
    lines: CreateInvoiceLineDto[],
    calculatedLines: { subtotal: number; taxAmount: number; lineTotal: number }[]
  ) {
    return lines.map((line, index) => ({
      tenantId,
      ...(line.productId ? { product: { connect: { id: line.productId } } } : {}),
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      subtotal: calculatedLines[index]!.subtotal,
      taxAmount: calculatedLines[index]!.taxAmount,
      lineTotal: calculatedLines[index]!.lineTotal,
      // BUG-03 fix: persist per-line irpfRate so it survives duplication/scheduler generation
      ...(line.irpfRate != null ? { irpfRate: line.irpfRate } : {}),
      hideQty: line.hideQty ?? false,
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

  async create(tenantId: string, createdByUserId: string | null, dto: CreateInvoiceDto) {
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

      // Only store createdByUserId when the creator is NOT the tenant owner.
      // If the owner creates a document we leave it null (the owner is implicit).
      let resolvedCreatedByUserId: string | null = null;
      if (createdByUserId) {
        const isOwner = await tx.tenantUser.findFirst({
          where: { userId: createdByUserId, tenantId, isOwner: true },
          select: { id: true },
        });
        resolvedCreatedByUserId = isOwner ? null : createdByUserId;
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
          invoiceType: (dto.invoiceType ?? 'standard') as PrismaInvoiceType,
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
          createdByUserId: resolvedCreatedByUserId,
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
      paymentStatus,
      customerId,
      fromDate,
      toDate,
      quoteAcceptanceStatus,
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

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as PrismaPaymentStatus;
    }

    if (quoteAcceptanceStatus) {
      where.quoteAcceptanceStatus = quoteAcceptanceStatus as PrismaQuoteAcceptanceStatus;
    }

    const validSortFields: Record<string, true> = {
      number: true,
      issueDate: true,
      dueDate: true,
      validUntil: true,
      total: true,
      createdAt: true,
    };
    const orderBy: Prisma.InvoiceOrderByWithRelationInput =
      sortBy === 'customer'
        ? { customer: { name: sortOrder } }
        : { [validSortFields[sortBy] ? sortBy : 'issueDate']: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, name: true, prefix: true } },
          payments: {
            select: { id: true, amount: true, paymentDate: true, paymentMethod: true, notes: true },
            orderBy: { paymentDate: 'desc' },
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              tenantUsers: {
                where: { isOwner: true },
                select: {
                  tenant: { select: { businessName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const mappedData = data.map(({ createdByUser, ...invoice }) => ({
      ...invoice,
      createdByAgency: this.buildAgencyInfo(createdByUser),
    }));

    return {
      data: mappedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // findForMutation: versión ligera de findOne para operaciones internas (update, confirm,
  // duplicate, etc.). No carga customer, series ni verifactuLogs — esas relaciones solo
  // son necesarias para devolver la respuesta al controlador, no para la lógica de mutación.
  private async findForMutation(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        invoiceType: true,
        seriesId: true,
        customerId: true,
        number: true,
        issueDate: true,
        dueDate: true,
        subtotal: true,
        discountPercent: true,
        discountAmount: true,
        taxTotal: true,
        irpfPercent: true,
        irpfTotal: true,
        total: true,
        paymentMethod: true,
        paymentDetails: true,
        amountPaid: true,
        paymentStatus: true,
        notes: true,
        templateId: true,
        layoutOverride: true,
        isRectificative: true,
        rectifiedInvoiceId: true,
        validUntil: true,
        quoteAcceptanceStatus: true,
        lines: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            taxRate: true,
            taxAmount: true,
            subtotal: true,
            lineTotal: true,
            irpfRate: true,
            irpfAmount: true,
            hideQty: true,
            sortOrder: true,
            productId: true,
          },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    return invoice;
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: { select: { id: true, name: true, reference: true } },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            legalName: true,
            nif: true,
            email: true,
            phone: true,
            address: true,
            postalCode: true,
            city: true,
            province: true,
            country: true,
            type: true,
            notes: true,
          },
        },
        series: {
          select: {
            id: true,
            code: true,
            name: true,
            prefix: true,
            type: true,
            nextNumber: true,
            digits: true,
          },
        },
        verifactuLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tenantUsers: {
              where: { isOwner: true },
              select: {
                tenant: { select: { businessName: true } },
              },
            },
          },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    const { createdByUser, ...invoiceData } = invoice;
    return {
      ...invoiceData,
      createdByAgency: this.buildAgencyInfo(createdByUser),
    };
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findForMutation(tenantId, id);

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
        invoiceType:
          dto.invoiceType !== undefined ? (dto.invoiceType as PrismaInvoiceType) : undefined,
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
    const invoice = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

    const payableStatuses = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT];
    if (!payableStatuses.includes(invoice.status as InvoiceStatus)) {
      throw new ConflictException(
        'Solo se pueden marcar como pagadas las facturas confirmadas o enviadas'
      );
    }

    const invoiceTotal = Number(invoice.total);
    const currentPaid = Number(invoice.amountPaid);
    const remaining = Math.round((invoiceTotal - currentPaid) * 100) / 100;

    return this.prisma.$transaction(async (tx) => {
      if (remaining > 0) {
        await tx.payment.create({
          data: {
            tenantId,
            invoiceId: id,
            amount: remaining,
            paymentDate: new Date(),
            paymentMethod: invoice.paymentMethod ?? undefined,
          },
        });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          status: PrismaInvoiceStatus.PAID,
          amountPaid: invoiceTotal,
          paymentStatus: PrismaPaymentStatus.PAID,
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });
    });
  }

  async unmarkAsPaid(tenantId: string, id: string) {
    const invoice = await this.findForMutation(tenantId, id);

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new ConflictException(
        'Solo se pueden desmarcar como pagadas las facturas con estado "Pagada"'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { invoiceId: id, tenantId } });

      return tx.invoice.update({
        where: { id },
        data: {
          status: PrismaInvoiceStatus.CONFIRMED,
          amountPaid: 0,
          paymentStatus: PrismaPaymentStatus.UNPAID,
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });
    });
  }

  async markAsSent(tenantId: string, id: string) {
    const invoice = await this.findForMutation(tenantId, id);

    if (invoice.status !== InvoiceStatus.CONFIRMED) {
      throw new ConflictException('Solo se pueden marcar como enviadas las facturas confirmadas');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: PrismaInvoiceStatus.SENT },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async unmarkAsSent(tenantId: string, id: string) {
    const invoice = await this.findForMutation(tenantId, id);

    if (invoice.status !== InvoiceStatus.SENT) {
      throw new ConflictException(
        'Solo se pueden desmarcar como enviadas las facturas con estado "Enviada"'
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: PrismaInvoiceStatus.CONFIRMED },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        customer: true,
        series: true,
      },
    });
  }

  async linkToRecurringInvoice(invoiceId: string, recurringInvoiceId: string) {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { recurringInvoiceId },
    });
  }

  async duplicate(tenantId: string, id: string) {
    const original = await this.findForMutation(tenantId, id);

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
    const original = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

    if (!EDITABLE_STATUSES.includes(invoice.status as InvoiceStatus)) {
      throw new ConflictException(
        'No se puede eliminar una factura confirmada. Crea una factura rectificativa.'
      );
    }

    await this.prisma.invoice.delete({ where: { id } });
  }

  // ==================== PROFORMA CONVERSION ====================

  async convertDraftToProforma(tenantId: string, id: string) {
    const invoice = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

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
    const invoice = await this.findForMutation(tenantId, id);

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

  // ==================== STATS & REPORTS ====================

  async getStats(tenantId: string, year?: number) {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();

    const ACTIVE_STATUSES = [
      PrismaInvoiceStatus.CONFIRMED,
      PrismaInvoiceStatus.SENT,
      PrismaInvoiceStatus.PAID,
    ];

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear + 1, 0, 1);

    const [yearInvoices, pendingResult, totalCustomers, totalProducts] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ACTIVE_STATUSES },
          issueDate: { gte: yearStart, lt: yearEnd },
        },
        select: { total: true, issueDate: true },
      }),
      // Pending collection: total minus amount already paid for non-fully-paid invoices
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: [PrismaInvoiceStatus.CONFIRMED, PrismaInvoiceStatus.SENT] },
          paymentStatus: { in: [PrismaPaymentStatus.UNPAID, PrismaPaymentStatus.PARTIALLY_PAID] },
        },
        select: { total: true, amountPaid: true },
      }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
    ]);

    // Calculate pending collection as sum of (total - amountPaid) for unpaid/partially paid invoices
    const pendingCollection = pendingResult.reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
      0
    );

    // Build monthly chart from year invoices
    const monthlyMap: Record<number, number> = {};
    for (const inv of yearInvoices) {
      const month = new Date(inv.issueDate).getMonth();
      monthlyMap[month] = (monthlyMap[month] ?? 0) + Number(inv.total);
    }

    // For KPIs use year invoices if same year, else fetch just the two relevant months
    const kpiInvoices =
      targetYear === now.getFullYear()
        ? yearInvoices
        : await this.prisma.invoice.findMany({
            where: {
              tenantId,
              status: { in: ACTIVE_STATUSES },
              issueDate: { gte: lastMonthStart, lt: nextMonthStart },
            },
            select: { total: true, issueDate: true },
          });

    let billedThisMonth = 0;
    let billedLastMonth = 0;
    let invoicesThisMonth = 0;

    for (const inv of kpiInvoices) {
      const invDate = new Date(inv.issueDate);
      const amount = Number(inv.total);
      if (invDate >= thisMonthStart && invDate < nextMonthStart) {
        billedThisMonth += amount;
        invoicesThisMonth += 1;
      } else if (invDate >= lastMonthStart && invDate < thisMonthStart) {
        billedLastMonth += amount;
      }
    }

    const MONTH_NAMES = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ] as const;
    const monthlyChart = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES[i]!,
      importe: Math.round((monthlyMap[i] ?? 0) * 100) / 100,
    }));

    return {
      billedThisMonth: Math.round(billedThisMonth * 100) / 100,
      billedLastMonth: Math.round(billedLastMonth * 100) / 100,
      pendingCollection: Math.round(pendingCollection * 100) / 100,
      invoicesThisMonth,
      monthlyChart,
      totalCustomers,
      totalProducts,
    };
  }

  async getReports(tenantId: string, fromDate: string, toDate: string) {
    const ACTIVE_STATUSES = [
      PrismaInvoiceStatus.CONFIRMED,
      PrismaInvoiceStatus.SENT,
      PrismaInvoiceStatus.PAID,
    ];

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ACTIVE_STATUSES },
        issueDate: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      select: {
        issueDate: true,
        subtotal: true,
        taxTotal: true,
        irpfTotal: true,
        total: true,
        customer: { select: { id: true, name: true } },
      },
    });

    const monthlyMap = new Map<string, { revenue: number; invoices: number }>();
    const customerMap = new Map<string, { name: string; invoices: number; total: number }>();
    let totalSubtotal = 0;
    let totalIva = 0;
    let totalIrpf = 0;

    for (const inv of invoices) {
      const invDate = new Date(inv.issueDate);
      const monthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
      const amount = Number(inv.total);

      const monthEntry = monthlyMap.get(monthKey) ?? { revenue: 0, invoices: 0 };
      monthlyMap.set(monthKey, {
        revenue: monthEntry.revenue + amount,
        invoices: monthEntry.invoices + 1,
      });

      const customerId = inv.customer.id;
      const customerEntry = customerMap.get(customerId) ?? {
        name: inv.customer.name,
        invoices: 0,
        total: 0,
      };
      customerMap.set(customerId, {
        name: inv.customer.name,
        invoices: customerEntry.invoices + 1,
        total: customerEntry.total + amount,
      });

      totalSubtotal += Number(inv.subtotal);
      totalIva += Number(inv.taxTotal);
      totalIrpf += Number(inv.irpfTotal ?? 0);
    }

    const monthlyRevenue = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue * 100) / 100,
        invoices: data.invoices,
      }));

    const topCustomers = Array.from(customerMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        invoices: data.invoices,
        total: Math.round(data.total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      monthlyRevenue,
      topCustomers,
      taxSummary: {
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalIva: Math.round(totalIva * 100) / 100,
        totalIrpf: Math.round(totalIrpf * 100) / 100,
        invoicesCount: invoices.length,
      },
    };
  }
}
