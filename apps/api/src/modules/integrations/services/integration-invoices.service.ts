import { Injectable, Logger } from '@nestjs/common';
import { InvoiceStatus, TaxRegime } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SIMPLIFIED_INVOICE_LIMIT } from '../../agency/fiscal-validator.service';
import { CreateInvoiceDto, CreateInvoiceLineDto } from '../../invoices/dto/create-invoice.dto';
import { InvoiceService } from '../../invoices/invoice.service';
import { IntegrationInvoiceResponse } from '../dto/integration-responses.dto';
import { IssueInvoiceDto } from '../dto/issue-invoice.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { ISSUE_DATE_TIMEZONE } from '../integrations.constants';
import { toCents } from '../utils/decimal';
import { IntegrationCustomersService } from './integration-customers.service';
import {
  INTEGRATION_INVOICE_SELECT,
  toIntegrationInvoiceResponse,
} from './integration-invoice.mapper';
import { IntegrationUrlsService } from './integration-urls.service';
import { PriceWithTaxConverter } from './price-with-tax.converter';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Today in Spain (YYYY-MM-DD): the issue date of every invoice issued through the API. */
export function todayInSpain(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ISSUE_DATE_TIMEZONE }).format(now);
}

function invoiceNotFound(): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.NOT_FOUND, 'Factura no encontrada');
}

function fiscalRule(detail: string, field?: string): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.FISCAL_RULE, detail, {
    errors: field ? [{ field, message: detail }] : undefined,
  });
}

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
    this.assertRequestRules(dto);
    await this.assertSupportedRegime(tenantId);
    await this.discardUnconfirmedDraft(tenantId, dto.externalRef);

    const converted = this.converter.convertInvoice(dto.lines);
    this.assertSimplifiedLimit(dto, converted.chargedCents);
    const payer = await this.customers.upsertPayer(tenantId, dto.customer);
    const draft = await this.invoiceService.create(
      tenantId,
      null,
      this.toCreateDto(dto, payer.id, converted.lines),
      {
        externalRef: dto.externalRef,
      }
    );
    await this.assertDraftMatchesCharge(
      tenantId,
      draft.id,
      Number(draft.total),
      converted.chargedCents
    );
    await this.invoiceService.confirm(tenantId, draft.id);
    return this.findOne(tenantId, draft.id);
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
  async assertIssuedInvoice(tenantId: string, invoiceId: string): Promise<void> {
    await this.findOne(tenantId, invoiceId);
  }

  private assertRequestRules(dto: IssueInvoiceDto): void {
    if (dto.invoiceType === 'standard' && !dto.customer.address) {
      throw new IntegrationException(
        IntegrationErrorCode.VALIDATION_ERROR,
        'La factura completa exige el domicilio del pagador',
        {
          errors: [{ field: 'customer.address', message: 'Obligatorio en facturas completas' }],
        }
      );
    }
    const today = todayInSpain();
    if (dto.operationDate && dto.operationDate > today) {
      throw fiscalRule('La fecha de operación no puede ser posterior a hoy', 'operationDate');
    }
    if (dto.operationDate && dto.operationDate !== today) {
      throw fiscalRule(
        'Todavía no se admite una fecha de operación distinta de la fecha de expedición',
        'operationDate'
      );
    }
  }

  private async assertSupportedRegime(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { taxRegime: true },
    });
    if (tenant.taxRegime === TaxRegime.REAGYP) {
      throw fiscalRule('El régimen especial agrario (REAGYP) no está disponible en la API v1');
    }
  }

  private assertSimplifiedLimit(dto: IssueInvoiceDto, chargedCents: bigint): void {
    if (dto.invoiceType === 'simplified' && chargedCents > BigInt(SIMPLIFIED_INVOICE_LIMIT * 100)) {
      throw fiscalRule(
        `Una factura simplificada no puede superar ${SIMPLIFIED_INVOICE_LIMIT} €. Emite una factura completa (standard).`,
        'invoiceType'
      );
    }
  }

  /**
   * A previous attempt that failed before confirming leaves a draft with the same externalRef:
   * it is discarded and issued again. A confirmed one is a duplicate the ERP must look up.
   */
  private async discardUnconfirmedDraft(tenantId: string, externalRef: string): Promise<void> {
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

  /** Defensive: never confirm (irreversible) an invoice whose total differs from what was charged. */
  private async assertDraftMatchesCharge(
    tenantId: string,
    draftId: string,
    total: number,
    chargedCents: bigint
  ): Promise<void> {
    if (toCents(total) === chargedCents) return;
    await this.invoiceService.remove(tenantId, draftId);
    this.logger.error(
      `Draft ${draftId} total ${toCents(total)} differs from charged ${chargedCents}; discarded`
    );
    throw new IntegrationException(
      IntegrationErrorCode.INTERNAL,
      'Error interno al cuadrar los importes. No se ha emitido la factura.'
    );
  }

  private toCreateDto(
    dto: IssueInvoiceDto,
    customerId: string,
    lines: CreateInvoiceLineDto[]
  ): CreateInvoiceDto {
    const createDto = new CreateInvoiceDto();
    createDto.customerId = customerId;
    createDto.issueDate = todayInSpain();
    createDto.invoiceType = dto.invoiceType;
    createDto.paymentMethod = dto.paymentMethod;
    createDto.lines = lines;
    return createDto;
  }
}
