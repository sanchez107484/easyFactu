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
  RectificationType as PrismaRectificationType,
} from '@prisma/client';
import { CreateInvoiceDto, CreateInvoiceLineDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RectifyInvoiceDto } from './dto/rectify-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import {
  InvoiceStatus,
  PaymentStatus,
  SeriesType,
  RectificationType,
} from '@easyfactura/shared-types';
import { UpdateInvoiceNotesDto } from './dto/update-invoice-notes.dto';
import { VerifactuService } from '../verifactu/services/verifactu.service';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceCalculationService } from './invoice-calculation.service';
import { withTransactionRetry } from '../../prisma/with-transaction-retry';

const RECTIFIABLE_STATUSES = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PAID];
const EDITABLE_STATUSES = [InvoiceStatus.DRAFT, InvoiceStatus.PROFORMA, InvoiceStatus.QUOTE];

// Interactive transactions need headroom beyond Prisma's defaults (maxWait 2s, timeout 5s).
// On Vercel serverless the first query after a cold start includes the TLS + pooler handshake,
// and with connection_limit=1 a concurrent request must wait for the single connection.
// An expiring transaction is rolled back mid-callback and surfaces as "Transaction not found".
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 15_000 } as const;

// Prisma 6.2 does not re-export the interactive-transaction options type.
type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

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
   * Runs an interactive transaction with the shared serverless-tuned options and
   * bounded retries on transient errors (pool exhaustion, serialization conflicts,
   * stalled transactions). The transaction is the atomic unit of retry: it either
   * commits or rolls back as a whole, so a retry is invisible to the user.
   */
  private runTransaction<T>(
    context: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    return withTransactionRetry(
      () => this.prisma.$transaction(fn, { ...TRANSACTION_OPTIONS, ...options }),
      context
    );
  }

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
    calculatedLines: {
      subtotal: number;
      taxAmount: number;
      surchargeRate: number;
      surchargeAmount: number;
      lineTotal: number;
    }[]
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
      ...(line.discountPercent != null && line.discountPercent > 0
        ? { discountPercent: line.discountPercent }
        : {}),
      // Recargo de Equivalencia per-line — server-computed (Art. 161 LIVA) and persisted
      // for fiscal traceability. Never trust the client's `surchargeRate`: the backend
      // recomputes it from the tax-rate map and stamps the result on the line.
      ...(calculatedLines[index]!.surchargeAmount > 0
        ? {
            surchargeRate: calculatedLines[index]!.surchargeRate,
            surchargeAmount: calculatedLines[index]!.surchargeAmount,
          }
        : {}),
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
    calculatedLines: {
      subtotal: number;
      taxAmount: number;
      surchargeRate: number;
      surchargeAmount: number;
      lineTotal: number;
    }[]
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
              discountPercent:
                line.discountPercent != null && Number(line.discountPercent) > 0
                  ? line.discountPercent
                  : null,
              irpfRate: line.irpfRate ?? null,
              surchargeRate:
                calculatedLines[index]!.surchargeAmount > 0
                  ? calculatedLines[index]!.surchargeRate
                  : null,
              surchargeAmount:
                calculatedLines[index]!.surchargeAmount > 0
                  ? calculatedLines[index]!.surchargeAmount
                  : null,
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
            ...(line.discountPercent != null && Number(line.discountPercent) > 0
              ? { discountPercent: line.discountPercent }
              : {}),
            ...(calc.surchargeAmount > 0
              ? { surchargeRate: calc.surchargeRate, surchargeAmount: calc.surchargeAmount }
              : {}),
            hideQty: line.hideQty ?? false,
            sortOrder: index,
          };
        }),
      });
    }
  }

  // ==================== SNAPSHOT HELPERS ====================

  /**
   * Builds a customer snapshot object from the customer's current billing data.
   * Called exclusively at confirmation time — the legally binding, irreversible moment.
   */
  private buildCustomerSnapshot(customer: {
    name: string;
    legalName: string | null;
    nif: string;
    type: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    province: string | null;
    country: string;
  }) {
    return {
      customerSnapshotName: customer.name,
      customerSnapshotLegalName: customer.legalName,
      customerSnapshotNif: customer.nif,
      customerSnapshotType: customer.type,
      customerSnapshotEmail: customer.email,
      customerSnapshotPhone: customer.phone,
      customerSnapshotAddress: customer.address,
      customerSnapshotPostalCode: customer.postalCode,
      customerSnapshotCity: customer.city,
      customerSnapshotProvince: customer.province,
      customerSnapshotCountry: customer.country,
    };
  }

  /**
   * Fetches the tenant's current billing data and builds an issuer snapshot object.
   * Called exclusively at confirmation time — the legally binding, irreversible moment.
   */
  private async fetchIssuerSnapshot(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        businessName: true,
        legalName: true,
        nif: true,
        email: true,
        phone: true,
        address: true,
        postalCode: true,
        city: true,
        province: true,
        country: true,
      },
    });
    return {
      issuerSnapshotName: tenant.businessName,
      issuerSnapshotLegalName: tenant.legalName,
      issuerSnapshotNif: tenant.nif,
      issuerSnapshotEmail: tenant.email,
      issuerSnapshotPhone: tenant.phone,
      issuerSnapshotAddress: tenant.address,
      issuerSnapshotPostalCode: tenant.postalCode,
      issuerSnapshotCity: tenant.city,
      issuerSnapshotProvince: tenant.province,
      issuerSnapshotCountry: tenant.country,
    };
  }

  /**
   * Fetches a customer's current data for snapshot purposes.
   * Unlike validateCustomer, this does not require isActive = true — a customer
   * may have been deactivated after the draft was created but before confirmation.
   */
  private async fetchCustomerForSnapshot(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        name: true,
        legalName: true,
        nif: true,
        type: true,
        email: true,
        phone: true,
        address: true,
        postalCode: true,
        city: true,
        province: true,
        country: true,
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  // ==================== END SNAPSHOT HELPERS ====================

  private async resolveSeriesId(
    tenantId: string,
    seriesId?: string,
    expectedType?: SeriesType
  ): Promise<string> {
    if (seriesId) {
      const series = await this.invoiceNumberService.validateSeries(
        tenantId,
        seriesId,
        expectedType
      );
      return series.id;
    }
    const defaultSeries = await this.invoiceNumberService.findDefaultSeries(
      tenantId,
      expectedType ?? SeriesType.INVOICE
    );
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

  /**
   * Valida los importes de las líneas según el tipo de factura.
   * - Normal/proforma/quote: quantity > 0, unitPrice >= 0 (regla de negocio estándar).
   * - Rectificativa: sin restricciones de signo — permite negativos para reflejar
   *   ajustes (abonos) respecto a la factura original.
   */
  private validateLineAmounts(lines: CreateInvoiceLineDto[], isRectificative: boolean): void {
    if (isRectificative) return;
    for (const line of lines) {
      if (Number(line.quantity) <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a 0');
      }
      if (Number(line.unitPrice) < 0) {
        throw new BadRequestException('El precio debe ser mayor o igual a 0');
      }
    }
  }

  /**
   * Returns the agrarian compensation rate (%) to apply to the invoice, or undefined
   * if the regime is GENERAL or compensation does not apply to this customer.
   *
   * Rules (Arts. 124-134 LIVA):
   *  - Tenant must be in REAGYP regime and have a reaypRate configured.
   *  - Customer must NOT be marked as isReagyp = true (B2B exemption between two REAGYP entities).
   *  - Customer type INDIVIDUAL receives compensation (they pay more for the produce).
   */
  private async resolveCompensacionPercent(
    tenantId: string,
    customerId: string
  ): Promise<number | undefined> {
    const [tenant, customer] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { taxRegime: true, reaypRate: true },
      }),
      this.prisma.customer.findFirst({
        where: { id: customerId, tenantId },
        select: { isReagyp: true },
      }),
    ]);

    if (tenant.taxRegime !== 'REAGYP') return undefined;
    if (!tenant.reaypRate) return undefined;
    // If the customer is also in REAGYP, no compensation is applied
    if (customer?.isReagyp) return undefined;

    return Number(tenant.reaypRate);
  }

  /**
   * Checks whether the customer has the Recargo de Equivalencia flag set.
   * Returns the surcharge rate map (taxRate → surchargeRate) when applicable,
   * or an empty object if RE does not apply (REAGYP customers can't have RE).
   */
  private async resolveEquivalenceSurchargeRates(
    tenantId: string,
    customerId: string,
    isReagyp: boolean,
    client: Prisma.TransactionClient | PrismaService = this.prisma
  ): Promise<Record<number, number>> {
    // RE is incompatible with REAGYP regime
    if (isReagyp) return {};

    const customer = await client.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { hasEquivalenceSurcharge: true },
    });

    if (!customer?.hasEquivalenceSurcharge) return {};

    return { 21: 5.2, 10: 1.4, 4: 0.5, 0: 0 };
  }

  // ==================== PUBLIC CRUD ====================

  async create(tenantId: string, createdByUserId: string | null, dto: CreateInvoiceDto) {
    const isQuote = dto.invoiceType === 'quote';
    const isProforma = dto.invoiceType === 'proforma';

    // For quotes the series is auto-resolved inside the transaction; skip the default lookup.
    // If the frontend sends compensacionPercent (including 0), use it directly.
    // Otherwise derive it from the tenant/customer fiscal regime.
    const useFrontendCompensacion = dto.compensacionPercent !== undefined;
    const [seriesId, resolvedCompensacion] = await Promise.all([
      isQuote
        ? Promise.resolve('')
        : this.resolveSeriesId(tenantId, dto.seriesId, SeriesType.INVOICE),
      useFrontendCompensacion
        ? Promise.resolve(dto.compensacionPercent)
        : this.resolveCompensacionPercent(tenantId, dto.customerId),
      this.validateCustomer(tenantId, dto.customerId),
      this.validateProductIds(tenantId, dto.lines),
    ]);
    const compensacionPercent = resolvedCompensacion;
    // create() nunca genera facturas rectificativas (esas solo salen de rectify()),
    // así que aquí siempre aplican las reglas normales.
    this.validateLineAmounts(dto.lines, false);

    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      dto.customerId,
      compensacionPercent != null && compensacionPercent > 0
    );

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

    const totals = this.calculationService.calculateTotals(dto.lines, {
      discountPercent: dto.discountPercent,
      irpfPercent: dto.irpfPercent,
      compensacionPercent,
      equivalenceSurchargeRates,
    });

    return this.runTransaction('InvoiceService.create', async (tx) => {
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
          compensacionPercent: compensacionPercent ?? null,
          compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
          surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
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
      isReagyp,
      searchLines,
      minUnitPrice,
      maxUnitPrice,
    } = query;

    if (searchLines) {
      return this.searchInvoiceLines(tenantId, {
        search,
        customerId,
        fromDate,
        toDate,
        minUnitPrice,
        maxUnitPrice,
        page,
        limit,
      });
    }

    if (search) {
      return this.searchInvoicesWithUnaccent(tenantId, query);
    }

    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { tenantId };

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

    if (isReagyp !== undefined) {
      where.compensacionPercent = isReagyp ? { not: null } : null;
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
          surchargeTotal: true,
          total: true,
          amountPaid: true,
          paymentMethod: true,
          notes: true,
          hash: true,
          compensacionPercent: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
          customerSnapshotName: true,
          customerSnapshotNif: true,
          customer: { select: { id: true, name: true, nif: true } },
          series: { select: { id: true, name: true, prefix: true } },
          isRectificative: true,
          rectifiedInvoiceId: true,
          rectificationReason: true,
          rectificationType: true,
          rectifiedInvoice: { select: { id: true, number: true, issueDate: true } },
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

  private async searchInvoicesWithUnaccent(tenantId: string, query: QueryInvoiceDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      customerId,
      fromDate,
      toDate,
      sortBy = 'issueDate',
      sortOrder = 'desc',
    } = query;
    const offset = (page - 1) * limit;
    const pattern = `%${search}%`;

    const statusFilter = status
      ? Prisma.sql`AND i.status = ${status}::text::"InvoiceStatus"`
      : Prisma.sql`AND i.status != 'QUOTE'::text::"InvoiceStatus"`;

    const paymentStatusFilter = paymentStatus
      ? Prisma.sql`AND i.payment_status = ${paymentStatus}::text::"PaymentStatus"`
      : Prisma.empty;

    const customerFilter = customerId
      ? Prisma.sql`AND i.customer_id = ${customerId}`
      : Prisma.empty;

    const dateFilter = Prisma.sql`
      ${fromDate ? Prisma.sql`AND i.issue_date >= ${fromDate}::date` : Prisma.empty}
      ${toDate ? Prisma.sql`AND i.issue_date <= ${toDate}::date` : Prisma.empty}
    `;

    const sortColumn =
      sortBy === 'customer'
        ? Prisma.sql`c.name`
        : sortBy === 'number'
          ? Prisma.sql`i.number`
          : sortBy === 'total'
            ? Prisma.sql`i.total`
            : Prisma.sql`i.issue_date`;
    const sortDir = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          i.id, i.tenant_id AS "tenantId", i.number, i.invoice_type AS "invoiceType",
          i.status, i.payment_status AS "paymentStatus",
          i.quote_acceptance_status AS "quoteAcceptanceStatus",
          i.issue_date AS "issueDate", i.due_date AS "dueDate",
          i.valid_until AS "validUntil",
          i.subtotal, i.tax_total AS "taxTotal", i.irpf_total AS "irpfTotal",
          i.surcharge_total AS "surchargeTotal", i.total,
          i.amount_paid AS "amountPaid", i.payment_method AS "paymentMethod",
          i.notes, i.hash, i.compensacion_percent AS "compensacionPercent",
          i.is_rectificative AS "isRectificative",
          i.rectified_invoice_id AS "rectifiedInvoiceId",
          i.rectification_reason AS "rectificationReason",
          i.rectification_type AS "rectificationType",
          i.created_at AS "createdAt", i.updated_at AS "updatedAt",
          i.created_by_user_id AS "createdByUserId",
          i.customer_snapshot_name AS "customerSnapshotName",
          i.customer_snapshot_nif AS "customerSnapshotNif",
          json_build_object('id', c.id, 'name', c.name, 'nif', c.nif) AS customer,
          json_build_object('id', s.id, 'name', s.name, 'prefix', s.prefix) AS series
        FROM invoices i
        JOIN customers c ON c.id = i.customer_id
        LEFT JOIN invoice_series s ON s.id = i.series_id
        WHERE i.tenant_id = ${tenantId}
          AND (
            i.number ILIKE ${pattern}
            OR f_unaccent(c.name) ILIKE f_unaccent(${pattern})
            OR c.nif ILIKE ${pattern}
            OR f_unaccent(i.customer_snapshot_name) ILIKE f_unaccent(${pattern})
            OR i.customer_snapshot_nif ILIKE ${pattern}
          )
          ${statusFilter}
          ${paymentStatusFilter}
          ${customerFilter}
          ${dateFilter}
        ORDER BY ${sortColumn} ${sortDir}
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM invoices i
        JOIN customers c ON c.id = i.customer_id
        WHERE i.tenant_id = ${tenantId}
          AND (
            i.number ILIKE ${pattern}
            OR f_unaccent(c.name) ILIKE f_unaccent(${pattern})
            OR c.nif ILIKE ${pattern}
            OR f_unaccent(i.customer_snapshot_name) ILIKE f_unaccent(${pattern})
            OR i.customer_snapshot_nif ILIKE ${pattern}
          )
          ${statusFilter}
          ${paymentStatusFilter}
          ${customerFilter}
          ${dateFilter}
      `,
    ]);

    const total = Number(countResult[0].count);
    const agencyUserIds = Array.from(
      new Set(
        rows
          .map((r) => r.createdByUserId as string | null)
          .filter((id): id is string => id !== null && id !== undefined)
      )
    );
    const agencyMap = await this.loadAgencyInfoMap(agencyUserIds);

    const data = rows.map(({ createdByUserId, ...invoice }) => ({
      ...invoice,
      createdByAgency: createdByUserId ? (agencyMap.get(createdByUserId as string) ?? null) : null,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async searchInvoiceLines(
    tenantId: string,
    params: {
      search?: string;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
      minUnitPrice?: number;
      maxUnitPrice?: number;
      page: number;
      limit: number;
    }
  ) {
    const { search, customerId, fromDate, toDate, minUnitPrice, maxUnitPrice, page, limit } =
      params;
    const offset = (page - 1) * limit;
    const pattern = search ? `%${search}%` : null;
    const numericPattern = search ? `%${search.replace(',', '.')}%` : null;

    const textFilter = pattern
      ? Prisma.sql`AND (
          f_unaccent(il.description) ILIKE f_unaccent(${pattern})
          OR f_unaccent(p.name) ILIKE f_unaccent(${pattern})
          OR f_unaccent(p.reference) ILIKE f_unaccent(${pattern})
          OR il.unit_price::text LIKE ${numericPattern}
          OR il.line_total::text LIKE ${numericPattern}
        )`
      : Prisma.empty;

    const customerFilter = customerId
      ? Prisma.sql`AND i.customer_id = ${customerId}`
      : Prisma.empty;

    const dateFilter = Prisma.sql`
      ${fromDate ? Prisma.sql`AND i.issue_date >= ${fromDate}::date` : Prisma.empty}
      ${toDate ? Prisma.sql`AND i.issue_date <= ${toDate}::date` : Prisma.empty}
    `;

    const priceFilter = Prisma.sql`
      ${minUnitPrice !== undefined ? Prisma.sql`AND il.unit_price >= ${minUnitPrice}` : Prisma.empty}
      ${maxUnitPrice !== undefined ? Prisma.sql`AND il.unit_price <= ${maxUnitPrice}` : Prisma.empty}
    `;

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          i.id AS "invoiceId", i.number AS "invoiceNumber",
          i.issue_date AS "issueDate", i.status AS "invoiceStatus",
          c.id AS "customerId", c.name AS "customerName", c.nif AS "customerNif",
          il.id AS "lineId", il.description AS "lineDescription",
          il.unit_price AS "unitPrice", il.quantity,
          il.discount_percent AS "discountPercent",
          il.tax_rate AS "taxRate", il.line_total AS "lineTotal",
          il.sort_order AS "sortOrder",
          p.id AS "productId", p.name AS "productName",
          p.reference AS "productReference"
        FROM invoice_lines il
        JOIN invoices i ON i.id = il.invoice_id
        JOIN customers c ON c.id = i.customer_id
        LEFT JOIN products p ON p.id = il.product_id
        WHERE i.tenant_id = ${tenantId}
          AND i.status != 'QUOTE'::text::"InvoiceStatus"
          ${textFilter}
          ${customerFilter}
          ${dateFilter}
          ${priceFilter}
        ORDER BY i.issue_date DESC, il.sort_order ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM invoice_lines il
        JOIN invoices i ON i.id = il.invoice_id
        LEFT JOIN products p ON p.id = il.product_id
        WHERE i.tenant_id = ${tenantId}
          AND i.status != 'QUOTE'::text::"InvoiceStatus"
          ${textFilter}
          ${customerFilter}
          ${dateFilter}
          ${priceFilter}
      `,
    ]);

    const total = Number(countResult[0].count);

    const invoiceMap = new Map<
      string,
      {
        id: string;
        number: string | null;
        issueDate: Date;
        status: string;
        customer: { id: string; name: string; nif: string };
        matchedLines: Record<string, unknown>[];
      }
    >();

    for (const row of rows) {
      const invoiceId = row.invoiceId as string;
      if (!invoiceMap.has(invoiceId)) {
        invoiceMap.set(invoiceId, {
          id: invoiceId,
          number: row.invoiceNumber as string | null,
          issueDate: row.issueDate as Date,
          status: row.invoiceStatus as string,
          customer: {
            id: row.customerId as string,
            name: row.customerName as string,
            nif: row.customerNif as string,
          },
          matchedLines: [],
        });
      }
      invoiceMap.get(invoiceId)!.matchedLines.push({
        id: row.lineId,
        description: row.lineDescription,
        unitPrice: row.unitPrice,
        quantity: row.quantity,
        discountPercent: row.discountPercent,
        taxRate: row.taxRate,
        lineTotal: row.lineTotal,
        sortOrder: row.sortOrder,
        product: row.productId
          ? { id: row.productId, name: row.productName, reference: row.productReference }
          : null,
      });
    }

    return {
      data: Array.from(invoiceMap.values()),
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
        compensacionPercent: true,
        surchargeTotal: true,
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
        rectificationReason: true,
        rectificationType: true,
        validUntil: true,
        quoteAcceptanceStatus: true,
        series: { select: { id: true, type: true } },
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
            discountPercent: true,
            irpfRate: true,
            irpfAmount: true,
            surchargeRate: true,
            surchargeAmount: true,
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
          compensacionPercent: true,
          compensacionAmount: true,
          surchargeTotal: true,
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
          rectificationType: true,
          isRectificative: true,
          templateId: true,
          layoutOverride: true,
          verifactuQr: true,
          convertedToInvoiceId: true,
          createdAt: true,
          updatedAt: true,
          createdByUserId: true,
          // Customer snapshot
          customerSnapshotName: true,
          customerSnapshotLegalName: true,
          customerSnapshotNif: true,
          customerSnapshotType: true,
          customerSnapshotEmail: true,
          customerSnapshotPhone: true,
          customerSnapshotAddress: true,
          customerSnapshotPostalCode: true,
          customerSnapshotCity: true,
          customerSnapshotProvince: true,
          customerSnapshotCountry: true,
          // Issuer snapshot
          issuerSnapshotName: true,
          issuerSnapshotLegalName: true,
          issuerSnapshotNif: true,
          issuerSnapshotEmail: true,
          issuerSnapshotPhone: true,
          issuerSnapshotAddress: true,
          issuerSnapshotPostalCode: true,
          issuerSnapshotCity: true,
          issuerSnapshotProvince: true,
          issuerSnapshotCountry: true,
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
          rectifiedInvoice: {
            select: {
              id: true,
              number: true,
              issueDate: true,
            },
          },
          rectificativeInvoices: {
            select: {
              id: true,
              number: true,
              issueDate: true,
              status: true,
              rectificationType: true,
            },
            orderBy: { createdAt: 'desc' },
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

    // Defensive: a rectificative series must always be paired with isRectificative=true.
    // If this ever happens it means the invoice metadata was corrupted externally.
    if (invoice.series?.type === SeriesType.RECTIFICATIVE && !invoice.isRectificative) {
      throw new ConflictException(
        'Inconsistencia detectada: la factura usa una serie rectificativa pero no está marcada como rectificativa.'
      );
    }

    // Rectificatives are tied to the original invoice's customer. Changing the customer
    // would create a legally inconsistent document (a credit note for someone else's invoice).
    if (invoice.isRectificative && dto.customerId && dto.customerId !== invoice.customerId) {
      throw new BadRequestException(
        'No se puede cambiar el cliente de una factura rectificativa. ' +
          'La rectificativa debe pertenecer al mismo cliente que la factura original.'
      );
    }

    // Rectificatives cannot be turned into proformas or quotes.
    if (
      invoice.isRectificative &&
      dto.invoiceType &&
      (dto.invoiceType === 'proforma' || dto.invoiceType === 'quote')
    ) {
      throw new BadRequestException(
        'No se puede convertir una factura rectificativa en proforma o presupuesto.'
      );
    }

    const customerId = dto.customerId ?? invoice.customerId;
    const expectedSeriesType = invoice.isRectificative
      ? SeriesType.RECTIFICATIVE
      : SeriesType.INVOICE;
    const seriesId = dto.seriesId
      ? await this.resolveSeriesId(tenantId, dto.seriesId, expectedSeriesType)
      : invoice.seriesId;

    const linesToUse = dto.lines ?? (invoice.lines as unknown as CreateInvoiceLineDto[]);
    if (dto.lines) {
      await this.validateProductIds(tenantId, dto.lines);
      this.validateLineAmounts(dto.lines, invoice.isRectificative);
    }

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

    // Re-derive compensation on every update: customer may have changed and tenant
    // regime may have been updated since the draft was created.
    // If the frontend sends compensacionPercent (including 0), honour the override.
    const compensacionPercent =
      dto.compensacionPercent !== undefined
        ? dto.compensacionPercent
        : await this.resolveCompensacionPercent(tenantId, customerId);

    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      customerId,
      compensacionPercent != null && compensacionPercent > 0
    );

    const totals = this.calculationService.calculateTotals(linesToUse, {
      discountPercent: currentDiscount,
      irpfPercent: currentIrpf,
      compensacionPercent,
      equivalenceSurchargeRates,
    });

    return this.runTransaction('InvoiceService.update', async (tx: Prisma.TransactionClient) => {
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
        compensacionPercent: compensacionPercent ?? null,
        compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
        surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
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
        // Defensive: rectification metadata must never be dropped by an update.
        isRectificative: invoice.isRectificative,
        rectifiedInvoiceId: invoice.rectifiedInvoiceId,
        rectificationReason: invoice.rectificationReason,
        rectificationType: invoice.rectificationType as PrismaRectificationType | undefined,
      };

      return tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          series: true,
          rectifiedInvoice: { select: { id: true, number: true, issueDate: true } },
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

    // Defensive: a rectificative series must always be paired with isRectificative=true.
    if (invoice.series?.type === SeriesType.RECTIFICATIVE && !invoice.isRectificative) {
      throw new ConflictException(
        'Inconsistencia detectada: la factura usa una serie rectificativa pero no está marcada como rectificativa.'
      );
    }

    // Validación específica para facturas rectificativas
    if (invoice.isRectificative) {
      const lines = invoice.lines as unknown as CreateInvoiceLineDto[];
      if (!lines || lines.length === 0) {
        throw new BadRequestException(
          'La factura rectificativa debe tener al menos una línea antes de confirmar.'
        );
      }

      // Defensive: a rectificative invoice must always reference the original invoice
      // and carry its type + reason. If any of these is missing the document is invalid.
      if (!invoice.rectifiedInvoiceId || !invoice.rectificationType || !invoice.rectificationReason) {
        throw new BadRequestException(
          'La factura rectificativa no tiene completa la información de rectificación ' +
            '(factura original, tipo o motivo). Crea una nueva rectificativa desde la factura original.'
        );
      }

      // Para rectificativas por abonos, el total no puede ser 0
      if (invoice.rectificationType === RectificationType.DIFFERENCES) {
        const total = Number(invoice.total);
        if (total === 0) {
          throw new BadRequestException(
            'Una factura rectificativa por abonos no puede tener un total de 0€. ' +
              'Debe reflejar un ajuste positivo o negativo respecto a la factura original.'
          );
        }
      }
    }

    const lines = invoice.lines as unknown as CreateInvoiceLineDto[];

    // Re-take both snapshots at confirmation time — this is the legally binding moment.
    // Even if the customer or tenant data changed since the draft was created, the
    // confirmed invoice will always reflect the data as it was at confirmation.
    const [customerForSnapshot, issuerSnapshot] = await Promise.all([
      this.fetchCustomerForSnapshot(tenantId, invoice.customerId),
      this.fetchIssuerSnapshot(tenantId),
    ]);
    const customerSnapshot = this.buildCustomerSnapshot(customerForSnapshot);

    const confirmedInvoice = await this.runTransaction(
      'InvoiceService.confirm',
      async (tx: Prisma.TransactionClient) => {
        const invoiceNumber = await this.invoiceNumberService.generateNextNumber(
          tenantId,
          invoice.seriesId,
          tx
        );

        // Use the stored compensacionPercent from the draft — it was set at create/update time
        // based on the tenant's taxRegime at that point. This ensures the confirmed invoice
        // exactly matches what the user previewed before confirming.
        const storedCompensacion = invoice.compensacionPercent
          ? Number(invoice.compensacionPercent)
          : undefined;

        // Re-derive surcharge from the customer at confirmation time
        const surchargeRates = await this.resolveEquivalenceSurchargeRates(
          tenantId,
          invoice.customerId,
          storedCompensacion != null && storedCompensacion > 0,
          tx
        );

        const totals = this.calculationService.calculateTotals(lines, {
          discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
          irpfPercent: invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined,
          compensacionPercent: storedCompensacion,
          equivalenceSurchargeRates: surchargeRates,
        });

        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });

        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            number: invoiceNumber,
            status: PrismaInvoiceStatus.CONFIRMED,
            subtotal: totals.subtotal,
            discountAmount: totals.discountAmount > 0 ? totals.discountAmount : null,
            taxTotal: totals.taxTotal,
            irpfTotal: totals.irpfTotal > 0 ? totals.irpfTotal : null,
            compensacionPercent: storedCompensacion ?? null,
            compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
            surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
            total: totals.total,
            ...customerSnapshot,
            ...issuerSnapshot,
            lines: {
              create: this.buildLineCreateData(tenantId, lines, totals.lines),
            },
          },
          include: {
            lines: { orderBy: { sortOrder: 'asc' } },
            customer: true,
            series: true,
            rectifiedInvoice: { select: { id: true, number: true, issueDate: true } },
          },
        });

        // Mark the original invoice as RECTIFIED so the user can see it has been
        // rectified, regardless of whether it is a substitution or a credit note.
        // Aggregates handle the two cases differently (see getStats/getReports).
        if (invoice.isRectificative && invoice.rectifiedInvoiceId) {
          await tx.invoice.update({
            where: { id: invoice.rectifiedInvoiceId },
            data: { status: PrismaInvoiceStatus.RECTIFIED },
          });
        }

        return updatedInvoice;
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

    return this.runTransaction('InvoiceService.markAsPaid', async (tx) => {
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

    return this.runTransaction('InvoiceService.unmarkAsPaid', async (tx) => {
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
    // Re-derive compensation: duplicate creates a new draft — use current tenant config
    const compensacionPercent = await this.resolveCompensacionPercent(
      tenantId,
      original.customerId
    );
    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      original.customerId,
      compensacionPercent != null && compensacionPercent > 0
    );
    const totals = this.calculationService.calculateTotals(lines, {
      discountPercent: original.discountPercent ? Number(original.discountPercent) : undefined,
      irpfPercent: original.irpfPercent ? Number(original.irpfPercent) : undefined,
      compensacionPercent,
      equivalenceSurchargeRates,
    });

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
        compensacionPercent: compensacionPercent ?? null,
        compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
        surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
        total: totals.total,
        paymentMethod: original.paymentMethod as any,
        ...(paymentDetails != null ? { paymentDetails } : {}),
        notes: original.notes,
        ...(original.isRectificative
          ? {
              isRectificative: true,
              rectifiedInvoiceId: original.rectifiedInvoiceId,
              rectificationReason: original.rectificationReason,
              rectificationType: original.rectificationType,
            }
          : {}),
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

    // Verificar si ya existe un borrador de rectificativa para esta factura
    const existingDraft = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        rectifiedInvoiceId: id,
        status: InvoiceStatus.DRAFT,
        isRectificative: true,
      },
    });

    if (existingDraft) {
      throw new ConflictException({
        message:
          'Ya existe un borrador de factura rectificativa para esta factura. Edita o elimina el borrador existente antes de crear uno nuevo.',
        existingDraftId: existingDraft.id,
      });
    }

    // Siempre requerir al menos una línea (tanto para SUBSTITUTION como DIFFERENCES)
    if (dto.lines.length === 0) {
      throw new BadRequestException('La factura rectificativa debe tener al menos una línea');
    }

    const rectificativeSeries = await this.invoiceNumberService.findDefaultSeries(
      tenantId,
      SeriesType.RECTIFICATIVE
    );

    await this.validateProductIds(tenantId, dto.lines);

    const compensacionPercent = await this.resolveCompensacionPercent(
      tenantId,
      original.customerId
    );
    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      original.customerId,
      compensacionPercent != null && compensacionPercent > 0
    );
    const totals = this.calculationService.calculateTotals(dto.lines, {
      compensacionPercent,
      equivalenceSurchargeRates,
    });

    const paymentDetails = original.paymentDetails;

    return this.runTransaction(
      'InvoiceService.createRectificative',
      async (tx: Prisma.TransactionClient) => {
        // NO cambiar el estado de la original todavía.
        // La original solo pasa a RECTIFIED cuando la rectificativa se confirma.
        // Si el usuario abandona/elimina el borrador, la original permanece intacta.

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
            rectificationType: dto.rectificationType,
            subtotal: totals.subtotal,
            taxTotal: totals.taxTotal,
            compensacionPercent: compensacionPercent ?? null,
            compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
            surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
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
            rectifiedInvoice: { select: { id: true, number: true, issueDate: true } },
          },
        });
      }
    );
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

    if (invoice.isRectificative) {
      throw new ConflictException('Las facturas rectificativas no se pueden convertir a proforma.');
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
    const compensacionPercent = await this.resolveCompensacionPercent(tenantId, invoice.customerId);
    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      invoice.customerId,
      compensacionPercent != null && compensacionPercent > 0
    );
    const totals = this.calculationService.calculateTotals(lines, {
      discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
      irpfPercent: invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined,
      compensacionPercent,
      equivalenceSurchargeRates,
    });

    const paymentDetails = invoice.paymentDetails;

    // Crear la factura ordinaria (borrador) y eliminar la proforma en la misma transacción.
    // La proforma es un documento no vinculante: una vez convertida a oficial deja de tener
    // sentido y se elimina para evitar confusión. Las líneas, logs y notas se borran en
    // cascada según las relaciones definidas en el schema de Prisma.
    return this.runTransaction(
      'InvoiceService.convertToOfficial',
      async (tx: Prisma.TransactionClient) => {
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
            compensacionPercent: compensacionPercent ?? null,
            compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
            surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
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
      }
    );
  }

  // ==================== NOTE OPERATIONS ====================

  async updateNotes(tenantId: string, userId: string, id: string, dto: UpdateInvoiceNotesDto) {
    const invoice = await this.findForMutation(tenantId, id);

    const previousNotes = invoice.notes ?? null;
    const newNotes = dto.notes !== undefined ? (dto.notes ?? null) : previousNotes;

    // Atomic: update + audit log either both succeed or both fail.
    return this.runTransaction(
      'InvoiceService.updateNotes',
      async (tx: Prisma.TransactionClient) => {
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
      }
    );
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
    const compensacionPercent = await this.resolveCompensacionPercent(tenantId, invoice.customerId);
    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      invoice.customerId,
      compensacionPercent != null && compensacionPercent > 0
    );
    const totals = this.calculationService.calculateTotals(lines, {
      discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
      irpfPercent: invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined,
      compensacionPercent,
      equivalenceSurchargeRates,
    });
    const paymentDetails = invoice.paymentDetails;

    return this.runTransaction(
      'InvoiceService.convertQuoteToProforma',
      async (tx: Prisma.TransactionClient) => {
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
            compensacionPercent: compensacionPercent ?? null,
            compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
            surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
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
      }
    );
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
    const compensacionPercent = await this.resolveCompensacionPercent(tenantId, invoice.customerId);
    const equivalenceSurchargeRates = await this.resolveEquivalenceSurchargeRates(
      tenantId,
      invoice.customerId,
      compensacionPercent != null && compensacionPercent > 0
    );
    const totals = this.calculationService.calculateTotals(lines, {
      discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : undefined,
      irpfPercent: invoice.irpfPercent ? Number(invoice.irpfPercent) : undefined,
      compensacionPercent,
      equivalenceSurchargeRates,
    });
    const paymentDetails = invoice.paymentDetails;

    return this.runTransaction(
      'InvoiceService.convertQuoteToOfficial',
      async (tx: Prisma.TransactionClient) => {
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
            compensacionPercent: compensacionPercent ?? null,
            compensacionAmount: totals.compensacionAmount > 0 ? totals.compensacionAmount : null,
            surchargeTotal: totals.surchargeTotal > 0 ? totals.surchargeTotal : null,
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
      }
    );
  }

  // ==================== STATS & REPORTS ====================

  /**
   * Returns a SQL predicate that selects:
   * - Normal confirmed/sent/paid invoices.
   - Invoices marked as RECTIFIED whose confirmed rectificatives are **only**
   *   credit notes (DIFFERENCES). Those originals remain economically valid and
   *   must be summed algebraically with their credit notes.
   * - It excludes RECTIFIED invoices that were substituted (SUBSTITUTION), because
   *   the substitute invoice already replaces them in the aggregates.
   */
  private buildRectificationAwareStatusFilter(alias: string = 'i'): Prisma.Sql {
    const prefix = alias ? `${alias}.` : '';
    return Prisma.sql`
      (
        ${Prisma.raw(`${prefix}status`)} IN ('CONFIRMED', 'SENT', 'PAID')
        OR (
          ${Prisma.raw(`${prefix}status`)} = 'RECTIFIED'
          AND EXISTS (
            SELECT 1 FROM invoices r
            WHERE r.rectified_invoice_id = ${Prisma.raw(`${prefix}id`)}
              AND r.rectification_type = 'DIFFERENCES'
              AND r.status IN ('CONFIRMED', 'SENT', 'PAID')
          )
          AND NOT EXISTS (
            SELECT 1 FROM invoices r
            WHERE r.rectified_invoice_id = ${Prisma.raw(`${prefix}id`)}
              AND r.rectification_type = 'SUBSTITUTION'
              AND r.status IN ('CONFIRMED', 'SENT', 'PAID')
          )
        )
      )
    `;
  }

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
    type VatRow = { vat: string | null; surcharge: string | null };

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
          EXTRACT(MONTH FROM i.issue_date)::int AS month,
          SUM(i.total)::text                    AS total
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${yearStart}
          AND i.issue_date <  ${yearEnd}
        GROUP BY month
      `),
      this.prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          EXTRACT(MONTH FROM i.issue_date)::int AS month,
          SUM(i.total)::text                    AS total
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${prevYearStart}
          AND i.issue_date <  ${prevYearEnd}
        GROUP BY month
      `),
      this.prisma.$queryRaw<KpiRow[]>(Prisma.sql`
        SELECT
          SUM(i.total) FILTER (WHERE i.issue_date >= ${thisMonthStart} AND i.issue_date < ${nextMonthStart})::text AS this_month_total,
          COUNT(*)     FILTER (WHERE i.issue_date >= ${thisMonthStart} AND i.issue_date < ${nextMonthStart})       AS this_month_count,
          SUM(i.total) FILTER (WHERE i.issue_date >= ${lastMonthStart} AND i.issue_date < ${thisMonthStart})::text AS last_month_total
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${lastMonthStart}
          AND i.issue_date <  ${nextMonthStart}
      `),
      this.prisma.$queryRaw<PendingRow[]>(Prisma.sql`
        SELECT SUM(i.total - i.amount_paid)::text AS pending
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.payment_status IN ('UNPAID', 'PARTIALLY_PAID')
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
          COUNT(*)::bigint                 AS count,
          SUM(i.total - i.amount_paid)::text AS amount
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.payment_status IN ('UNPAID', 'PARTIALLY_PAID')
          AND i.due_date IS NOT NULL
          AND i.due_date < ${today}
      `),
      this.prisma.$queryRaw<VatRow[]>(Prisma.sql`
        SELECT SUM(i.tax_total)::text AS vat, SUM(i.surcharge_total)::text AS surcharge
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${thisQuarterStart}
          AND i.issue_date < ${nextQuarterStart}
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
      surchargeThisQuarter: Math.round(Number(vatRows[0]?.surcharge ?? 0) * 100) / 100,
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
      total_surcharge: string | null;
      invoices_count: bigint;
    };

    // 3 parallel SQL aggregates — replaces full-range findMany + JS aggregation.
    const [monthlyRows, customerRows, summaryRows] = await Promise.all([
      this.prisma.$queryRaw<MonthlyRow[]>(Prisma.sql`
        SELECT
          TO_CHAR(i.issue_date, 'YYYY-MM') AS month,
          SUM(i.total)::text               AS revenue,
          COUNT(*)                         AS invoices
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${from}
          AND i.issue_date <= ${to}
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
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${from}
          AND i.issue_date <= ${to}
        GROUP BY c.id, c.name
        ORDER BY SUM(i.total) DESC NULLS LAST
        LIMIT 10
      `),
      this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
        SELECT
          SUM(i.subtotal)::text        AS total_subtotal,
          SUM(i.tax_total)::text       AS total_iva,
          SUM(i.irpf_total)::text      AS total_irpf,
          SUM(i.surcharge_total)::text AS total_surcharge,
          COUNT(*)                     AS invoices_count
        FROM invoices i
        WHERE i.tenant_id = ${tenantId}
          AND ${this.buildRectificationAwareStatusFilter('i')}
          AND i.issue_date >= ${from}
          AND i.issue_date <= ${to}
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
        totalSurcharge: Math.round(Number(summary?.total_surcharge ?? 0) * 100) / 100,
        invoicesCount: Number(summary?.invoices_count ?? 0),
      },
    };
  }
}
