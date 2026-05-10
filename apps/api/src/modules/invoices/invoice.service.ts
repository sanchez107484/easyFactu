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
  /**
   * Resolves agency info (userName + agencyName) for a list of `createdByUserId`s
   * in a single round trip — replaces the per-row nested
   * `createdByUser → tenantUsers → tenant` JOIN previously done in `findAll`.
   *
   * Returns a Map keyed by userId. Users without an owner TenantUser are absent
   * (in practice every agency-created row has one).
   */
  private async loadAgencyInfoMap(
    userIds: string[]
  ): Promise<Map<string, { userName: string; agencyName: string }>> {
    const result = new Map<string, { userName: string; agencyName: string }>();
    if (userIds.length === 0) return result;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        tenantUsers: {
          where: { isOwner: true },
          select: { tenant: { select: { businessName: true } } },
          take: 1,
        },
      },
    });

    for (const u of users) {
      const ownerTenant = u.tenantUsers[0];
      if (!ownerTenant) continue;
      result.set(u.id, {
        userName: `${u.firstName} ${u.lastName}`.trim(),
        agencyName: ownerTenant.tenant.businessName,
      });
    }

    return result;
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

  /**
   * Applies an id-aware diff between the existing invoice lines and the incoming DTO:
   *   - lines with `id` matching an existing row → UPDATE in place (preserves FKs).
   *   - lines without `id` → CREATE.
   *   - existing rows whose id is missing from the incoming list → DELETE.
   *
   * Backwards compatible: a client that re-sends every line without ids degrades to the
   * previous behaviour (delete-all + create-all) automatically.
   *
   * Throws BadRequestException if the client sends an id that does not belong to this
   * invoice — prevents tenant-cross attacks via crafted line ids.
   */
  private async applyLineDiff(
    tx: Prisma.TransactionClient,
    tenantId: string,
    invoiceId: string,
    lines: CreateInvoiceLineDto[],
    calculatedLines: { subtotal: number; taxAmount: number; lineTotal: number }[]
  ): Promise<void> {
    const existing = await tx.invoiceLine.findMany({
      where: { invoiceId, tenantId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));

    const toUpdate: Array<{ index: number; line: CreateInvoiceLineDto }> = [];
    const toCreateIndexes: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.id) {
        if (!existingIds.has(line.id)) {
          throw new BadRequestException('Una de las líneas no pertenece a esta factura');
        }
        toUpdate.push({ index: i, line });
      } else {
        toCreateIndexes.push(i);
      }
    }

    const keepIds = new Set(toUpdate.map((u) => u.line.id!));
    const toDeleteIds = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);

    if (toDeleteIds.length > 0) {
      await tx.invoiceLine.deleteMany({
        where: { id: { in: toDeleteIds }, invoiceId, tenantId },
      });
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(({ index, line }) =>
          tx.invoiceLine.update({
            where: { id: line.id! },
            data: {
              productId: line.productId ?? null,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate,
              subtotal: calculatedLines[index]!.subtotal,
              taxAmount: calculatedLines[index]!.taxAmount,
              lineTotal: calculatedLines[index]!.lineTotal,
              irpfRate: line.irpfRate ?? null,
              hideQty: line.hideQty ?? false,
              sortOrder: index,
            },
          })
        )
      );
    }

    if (toCreateIndexes.length > 0) {
      await tx.invoiceLine.createMany({
        data: toCreateIndexes.map((index) => {
          const line = lines[index]!;
          const calc = calculatedLines[index]!;
          return {
            tenantId,
            invoiceId,
            productId: line.productId ?? null,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            subtotal: calc.subtotal,
            taxAmount: calc.taxAmount,
            lineTotal: calc.lineTotal,
            ...(line.irpfRate != null ? { irpfRate: line.irpfRate } : {}),
            hideQty: line.hideQty ?? false,
            sortOrder: index,
          };
        }),
      });
    }
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
        select: {
          id: true,
          tenantId: true,
          number: true,
          invoiceType: true,
          status: true,
          paymentStatus: true,
          quoteAcceptanceStatus: true,
          issueDate: true,
          dueDate: true,
          validUntil: true,
          subtotal: true,
          taxTotal: true,
          irpfTotal: true,
          total: true,
          amountPaid: true,
          paymentMethod: true,
          notes: true,
          hash: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, name: true, prefix: true } },
          payments: {
            select: { id: true, amount: true, paymentDate: true, paymentMethod: true, notes: true },
            orderBy: { paymentDate: 'desc' },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Resolve agency info in a single batch query instead of a per-row nested JOIN.
    const agencyUserIds = Array.from(
      new Set(
        data
          .map((d) => d.createdByUserId)
          .filter((id): id is string => id !== null && id !== undefined)
      )
    );
    const agencyMap = await this.loadAgencyInfoMap(agencyUserIds);

    const mappedData = data.map(({ createdByUserId, ...invoice }) => ({
      ...invoice,
      createdByAgency: createdByUserId ? (agencyMap.get(createdByUserId) ?? null) : null,
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
    // Split the previous deep-nested include into parallel targeted queries.
    // Each subquery uses its own index instead of a single big JOIN through
    // 5 relations (lines+product, customer, series, verifactuLogs, payments,
    // createdByUser→tenantUsers→tenant).
    const [invoice, lines, verifactuLogs, payments] = await Promise.all([
      this.prisma.invoice.findFirst({
        where: { id, tenantId },
        select: {
          id: true,
          tenantId: true,
          customerId: true,
          seriesId: true,
          number: true,
          invoiceType: true,
          status: true,
          paymentStatus: true,
          quoteAcceptanceStatus: true,
          issueDate: true,
          dueDate: true,
          validUntil: true,
          subtotal: true,
          discountPercent: true,
          discountAmount: true,
          irpfPercent: true,
          taxTotal: true,
          irpfTotal: true,
          total: true,
          amountPaid: true,
          paymentMethod: true,
          paymentDetails: true,
          notes: true,
          hash: true,
          prevHash: true,
          recurringInvoiceId: true,
          rectifiedInvoiceId: true,
          rectificationReason: true,
          convertedToInvoiceId: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
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
        },
      }),
      this.prisma.invoiceLine.findMany({
        where: { invoiceId: id, tenantId },
        orderBy: { sortOrder: 'asc' },
        include: {
          product: { select: { id: true, name: true, reference: true } },
        },
      }),
      this.prisma.verifactuLog.findMany({
        where: { invoiceId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.payment.findMany({
        where: { invoiceId: id, tenantId },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Resolve agency info in parallel as well — cheap query, only runs when the
    // invoice was created by an agency user.
    const agencyMap = invoice.createdByUserId
      ? await this.loadAgencyInfoMap([invoice.createdByUserId])
      : new Map<string, { userName: string; agencyName: string }>();

    const { createdByUserId, ...invoiceData } = invoice;
    return {
      ...invoiceData,
      lines,
      verifactuLogs,
      payments,
      createdByAgency: createdByUserId ? (agencyMap.get(createdByUserId) ?? null) : null,
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
        await this.applyLineDiff(tx, tenantId, id, dto.lines, totals.lines);
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

    // Atomic: update + audit log either both succeed or both fail.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: { notes: newNotes },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
          verifactuLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });

      await tx.invoiceNoteLog.create({
        data: {
          tenantId,
          invoiceId: id,
          userId,
          previousNotes,
          newNotes,
        },
      });

      return updated;
    });
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

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const nextQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear + 1, 0, 1);
    const prevYearStart = new Date(targetYear - 1, 0, 1);
    const prevYearEnd = new Date(targetYear, 0, 1);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    type MonthlyRow = { month: number; total: string | null };
    type KpiRow = {
      this_month_total: string | null;
      this_month_count: bigint;
      last_month_total: string | null;
    };
    type PendingRow = { pending: string | null };
    type CollectedRow = { collected: string | null };
    type OverdueRow = { count: bigint; amount: string | null };
    type VatRow = { vat: string | null };

    // 9 parallel SQL aggregates
    const [
      monthlyRows,
      prevYearMonthlyRows,
      kpiRows,
      pendingRows,
      totalCustomers,
      totalProducts,
      collectedRows,
      overdueRows,
      vatRows,
    ] = await Promise.all([
      this.prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          EXTRACT(MONTH FROM issue_date)::int AS month,
          SUM(total)::text                    AS total
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT', 'PAID')
          AND issue_date >= ${yearStart}
          AND issue_date <  ${yearEnd}
        GROUP BY month
      `),
      this.prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          EXTRACT(MONTH FROM issue_date)::int AS month,
          SUM(total)::text                    AS total
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT', 'PAID')
          AND issue_date >= ${prevYearStart}
          AND issue_date <  ${prevYearEnd}
        GROUP BY month
      `),
      this.prisma.$queryRaw<KpiRow[]>(Prisma.sql`
        SELECT
          SUM(total) FILTER (WHERE issue_date >= ${thisMonthStart} AND issue_date < ${nextMonthStart})::text AS this_month_total,
          COUNT(*)   FILTER (WHERE issue_date >= ${thisMonthStart} AND issue_date < ${nextMonthStart})       AS this_month_count,
          SUM(total) FILTER (WHERE issue_date >= ${lastMonthStart} AND issue_date < ${thisMonthStart})::text AS last_month_total
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT', 'PAID')
          AND issue_date >= ${lastMonthStart}
          AND issue_date <  ${nextMonthStart}
      `),
      this.prisma.$queryRaw<PendingRow[]>(Prisma.sql`
        SELECT SUM(total - amount_paid)::text AS pending
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT')
          AND payment_status IN ('UNPAID', 'PARTIALLY_PAID')
      `),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.$queryRaw<CollectedRow[]>(Prisma.sql`
        SELECT SUM(amount)::text AS collected
        FROM payments
        WHERE tenant_id = ${tenantId}
          AND payment_date >= ${thisMonthStart}
          AND payment_date <  ${nextMonthStart}
      `),
      this.prisma.$queryRaw<OverdueRow[]>(Prisma.sql`
        SELECT
          COUNT(*)::bigint         AS count,
          SUM(total - amount_paid)::text AS amount
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT')
          AND payment_status IN ('UNPAID', 'PARTIALLY_PAID')
          AND due_date IS NOT NULL
          AND due_date < ${today}
      `),
      this.prisma.$queryRaw<VatRow[]>(Prisma.sql`
        SELECT SUM(tax_total)::text AS vat
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT', 'PAID')
          AND issue_date >= ${thisQuarterStart}
          AND issue_date <  ${nextQuarterStart}
      `),
    ]);

    const monthlyMap = new Map<number, number>(
      monthlyRows.map((r) => [r.month - 1, Number(r.total ?? 0)])
    );

    const prevYearMonthlyMap = new Map<number, number>(
      prevYearMonthlyRows.map((r) => [r.month - 1, Number(r.total ?? 0)])
    );

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
      importe: Math.round((monthlyMap.get(i) ?? 0) * 100) / 100,
    }));

    const monthlyChartPrevYear = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES[i]!,
      importe: Math.round((prevYearMonthlyMap.get(i) ?? 0) * 100) / 100,
    }));

    const kpi = kpiRows[0];
    const billedThisMonth = Number(kpi?.this_month_total ?? 0);
    const billedLastMonth = Number(kpi?.last_month_total ?? 0);
    const invoicesThisMonth = Number(kpi?.this_month_count ?? 0);
    const pendingCollection = Number(pendingRows[0]?.pending ?? 0);

    return {
      billedThisMonth: Math.round(billedThisMonth * 100) / 100,
      billedLastMonth: Math.round(billedLastMonth * 100) / 100,
      pendingCollection: Math.round(pendingCollection * 100) / 100,
      invoicesThisMonth,
      monthlyChart,
      monthlyChartPrevYear,
      totalCustomers,
      totalProducts,
      collectedThisMonth: Math.round(Number(collectedRows[0]?.collected ?? 0) * 100) / 100,
      overdueCount: Number(overdueRows[0]?.count ?? 0),
      overdueAmount: Math.round(Number(overdueRows[0]?.amount ?? 0) * 100) / 100,
      ticketMedioThisMonth:
        invoicesThisMonth > 0 ? Math.round((billedThisMonth / invoicesThisMonth) * 100) / 100 : 0,
      vatThisQuarter: Math.round(Number(vatRows[0]?.vat ?? 0) * 100) / 100,
    };
  }

  async getReports(tenantId: string, fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    type MonthlyRow = { month: string; revenue: string | null; invoices: bigint };
    type CustomerRow = {
      id: string;
      name: string;
      invoices: bigint;
      total: string | null;
    };
    type SummaryRow = {
      total_subtotal: string | null;
      total_iva: string | null;
      total_irpf: string | null;
      invoices_count: bigint;
    };

    // 3 parallel SQL aggregates — replaces full-range findMany + JS aggregation.
    const [monthlyRows, customerRows, summaryRows] = await Promise.all([
      this.prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          TO_CHAR(issue_date, 'YYYY-MM') AS month,
          SUM(total)::text               AS revenue,
          COUNT(*)                       AS invoices
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT', 'PAID')
          AND issue_date >= ${from}
          AND issue_date <= ${to}
        GROUP BY month
        ORDER BY month ASC
      `),
      this.prisma.$queryRaw<CustomerRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.name,
          COUNT(i.id) AS invoices,
          SUM(i.total)::text AS total
        FROM invoices i
        JOIN customers c ON c.id = i.customer_id
        WHERE i.tenant_id = ${tenantId}
          AND i.status IN ('CONFIRMED', 'SENT', 'PAID')
          AND i.issue_date >= ${from}
          AND i.issue_date <= ${to}
        GROUP BY c.id, c.name
        ORDER BY SUM(i.total) DESC NULLS LAST
        LIMIT 10
      `),
      this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
        SELECT
          SUM(subtotal)::text  AS total_subtotal,
          SUM(tax_total)::text AS total_iva,
          SUM(irpf_total)::text AS total_irpf,
          COUNT(*)             AS invoices_count
        FROM invoices
        WHERE tenant_id = ${tenantId}
          AND status IN ('CONFIRMED', 'SENT', 'PAID')
          AND issue_date >= ${from}
          AND issue_date <= ${to}
      `),
    ]);

    const monthlyRevenue = monthlyRows.map((r) => ({
      month: r.month,
      revenue: Math.round(Number(r.revenue ?? 0) * 100) / 100,
      invoices: Number(r.invoices),
    }));

    const topCustomers = customerRows.map((r) => ({
      id: r.id,
      name: r.name,
      invoices: Number(r.invoices),
      total: Math.round(Number(r.total ?? 0) * 100) / 100,
    }));

    const summary = summaryRows[0];
    return {
      monthlyRevenue,
      topCustomers,
      taxSummary: {
        totalSubtotal: Math.round(Number(summary?.total_subtotal ?? 0) * 100) / 100,
        totalIva: Math.round(Number(summary?.total_iva ?? 0) * 100) / 100,
        totalIrpf: Math.round(Number(summary?.total_irpf ?? 0) * 100) / 100,
        invoicesCount: Number(summary?.invoices_count ?? 0),
      },
    };
  }
}
