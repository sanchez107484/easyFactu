import { Injectable, Logger } from '@nestjs/common';
import { InvoiceStatus, TaxRegime } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceDto, CreateInvoiceLineDto } from '../../invoices/dto/create-invoice.dto';
import { InvoiceService } from '../../invoices/invoice.service';
import { IntegrationInvoiceResponse } from '../dto/integration-responses.dto';
import { InvoicePayerDto, IssueInvoiceDto } from '../dto/issue-invoice.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { toCents } from '../utils/decimal';
import { IntegrationCustomersService } from './integration-customers.service';
import {
  INTEGRATION_INVOICE_SELECT,
  toIntegrationInvoiceResponse,
} from './integration-invoice.mapper';
import {
  assertSimplifiedLimit,
  fiscalRule,
  invoiceNotFound,
  resolveOperationDate,
  todayInSpain,
  UUID_PATTERN,
  validationError,
} from './integration-invoice-rules';
import { IntegrationUrlsService } from './integration-urls.service';
import { PriceWithTaxConverter } from './price-with-tax.converter';

export { todayInSpain } from './integration-invoice-rules';

/**
 * Issues invoices for the ERP by orchestrating the existing services: the payer becomes the
 * customer, prices with tax are converted to net prices, InvoiceService creates and confirms
 * (numbering, snapshots and VeriFactu run exactly as for the web app).
 */
@Injectable()
export class IntegrationInvoicesService {
  private readonly logger = new Logger(IntegrationInvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly customers: IntegrationCustomersService,
    private readonly converter: PriceWithTaxConverter,
    private readonly urls: IntegrationUrlsService
  ) {}

  async issue(tenantId: string, dto: IssueInvoiceDto): Promise<IntegrationInvoiceResponse> {
    if (dto.invoiceType === 'standard') assertIdentifiedPayer(dto.customer);
    const operationDate = resolveOperationDate(dto.operationDate);
    const { simplifiedInvoiceLimit } = await this.loadIssuingTenant(tenantId);
    await this.releaseExternalRef(tenantId, dto.externalRef);

    const converted = this.converter.convertInvoice(dto.lines);
    if (dto.invoiceType === 'simplified') {
      assertSimplifiedLimit(converted.chargedCents, simplifiedInvoiceLimit);
    }
    const payer = await this.customers.upsertPayer(tenantId, dto.customer);
    const draft = await this.invoiceService.create(
      tenantId,
      null,
      buildCreateDto(payer.id, converted.lines, dto),
      { externalRef: dto.externalRef, operationDate }
    );
    return this.confirmIfMatches(tenantId, draft, converted.chargedCents);
  }

  async findOne(tenantId: string, invoiceId: string): Promise<IntegrationInvoiceResponse> {
    if (!UUID_PATTERN.test(invoiceId)) throw invoiceNotFound();
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
        externalRef: { not: null },
        status: { not: InvoiceStatus.DRAFT },
      },
      select: INTEGRATION_INVOICE_SELECT,
    });
    if (!invoice) throw invoiceNotFound();
    return toIntegrationInvoiceResponse(invoice, this.urls.invoiceAppUrl(invoice.id));
  }

  async findByExternalRef(
    tenantId: string,
    externalRef: string
  ): Promise<{ data: IntegrationInvoiceResponse[] }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, externalRef, status: { not: InvoiceStatus.DRAFT } },
      select: INTEGRATION_INVOICE_SELECT,
    });
    return {
      data: invoice
        ? [toIntegrationInvoiceResponse(invoice, this.urls.invoiceAppUrl(invoice.id))]
        : [],
    };
  }

  /** Ensures the invoice exists for this tenant and was issued through the API before exposing it. */
  async assertIssuedInvoice(
    tenantId: string,
    invoiceId: string
  ): Promise<IntegrationInvoiceResponse> {
    return this.findOne(tenantId, invoiceId);
  }

  async loadIssuingTenant(tenantId: string): Promise<{ simplifiedInvoiceLimit: number }> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { taxRegime: true, simplifiedInvoiceLimit: true },
    });
    if (tenant.taxRegime === TaxRegime.REAGYP) {
      throw fiscalRule('El régimen especial agrario (REAGYP) no está disponible en la API v1');
    }
    return { simplifiedInvoiceLimit: Number(tenant.simplifiedInvoiceLimit) };
  }

  /**
   * A previous attempt that failed before confirming leaves a draft with the same externalRef:
   * it is discarded and issued again. A confirmed one is a duplicate the ERP must look up.
   */
  async releaseExternalRef(tenantId: string, externalRef: string): Promise<void> {
    const existing = await this.prisma.invoice.findFirst({
      where: { tenantId, externalRef },
      select: { id: true, status: true },
    });
    if (!existing) return;
    if (existing.status === InvoiceStatus.DRAFT) {
      await this.invoiceService.remove(tenantId, existing.id);
      return;
    }
    throw new IntegrationException(
      IntegrationErrorCode.DUPLICATE_EXTERNAL_REF,
      'Ya existe una factura emitida con ese externalRef. Recupérala con GET /invoices?externalRef=',
      { extensions: { invoiceId: existing.id } }
    );
  }

  /**
   * Confirms (irreversible) a draft only when its total is exactly the expected amount
   * (negative for a return); otherwise the draft is discarded and nothing is issued.
   */
  async confirmIfMatches(
    tenantId: string,
    draft: { id: string; total: unknown },
    expectedCents: bigint
  ): Promise<IntegrationInvoiceResponse> {
    const totalCents = toCents(Number(draft.total));
    if (totalCents !== expectedCents) {
      await this.invoiceService.remove(tenantId, draft.id);
      this.logger.error(
        `Draft ${draft.id} total ${totalCents} differs from expected ${expectedCents}; discarded`
      );
      throw new IntegrationException(
        IntegrationErrorCode.INTERNAL,
        'Error interno al cuadrar los importes. No se ha emitido la factura.'
      );
    }
    await this.invoiceService.confirm(tenantId, draft.id);
    return this.findOne(tenantId, draft.id);
  }
}

/** A complete invoice (F1, F3) identifies the recipient: NIF and address are mandatory. */
export function assertIdentifiedPayer(payer: InvoicePayerDto | undefined): void {
  if (!payer) {
    throw validationError(
      'La factura completa exige los datos del pagador',
      'customer',
      'Obligatorio en facturas completas'
    );
  }
  if (!payer.nif) {
    throw validationError(
      'La factura completa exige el NIF del pagador',
      'customer.nif',
      'Obligatorio en facturas completas'
    );
  }
  if (!payer.address) {
    throw validationError(
      'La factura completa exige el domicilio del pagador',
      'customer.address',
      'Obligatorio en facturas completas'
    );
  }
}

export function buildCreateDto(
  customerId: string,
  lines: CreateInvoiceLineDto[],
  options: {
    invoiceType: 'standard' | 'simplified';
    paymentMethod?: IssueInvoiceDto['paymentMethod'];
  }
): CreateInvoiceDto {
  const createDto = new CreateInvoiceDto();
  createDto.customerId = customerId;
  createDto.issueDate = todayInSpain();
  createDto.invoiceType = options.invoiceType;
  createDto.paymentMethod = options.paymentMethod;
  createDto.lines = lines;
  return createDto;
}
