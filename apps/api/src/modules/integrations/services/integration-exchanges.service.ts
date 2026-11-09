import { Injectable } from '@nestjs/common';
import { InvoiceStatus, InvoiceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceLineDto } from '../../invoices/dto/create-invoice.dto';
import { InvoiceService } from '../../invoices/invoice.service';
import { IntegrationInvoiceResponse } from '../dto/integration-responses.dto';
import { ExchangeSimplifiedInvoicesDto } from '../dto/invoice-records.dto';
import { toCents } from '../utils/decimal';
import { IntegrationCustomersService } from './integration-customers.service';
import {
  fiscalRule,
  invalidState,
  invoiceNotFound,
  todayInSpain,
} from './integration-invoice-rules';
import {
  assertIdentifiedPayer,
  buildCreateDto,
  IntegrationInvoicesService,
} from './integration-invoices.service';

const EXCHANGEABLE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
];

const SIMPLIFIED_TO_EXCHANGE_SELECT = {
  id: true,
  number: true,
  status: true,
  invoiceType: true,
  isRectificative: true,
  issueDate: true,
  operationDate: true,
  total: true,
  exchangedByInvoiceId: true,
  rectificativeInvoices: {
    where: { status: { notIn: [InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED] } },
    select: { id: true },
  },
  lines: {
    orderBy: { sortOrder: 'asc' },
    select: {
      description: true,
      quantity: true,
      unitPrice: true,
      taxRate: true,
      discountPercent: true,
      hideQty: true,
    },
  },
} satisfies Prisma.InvoiceSelect;

type SimplifiedToExchange = Prisma.InvoiceGetPayload<{
  select: typeof SIMPLIFIED_TO_EXCHANGE_SELECT;
}>;

/**
 * Exchange (canje, art. 15 RD 1619/2012): the customer asks for a complete invoice for one or
 * more simplified invoices already issued. The F3 copies their lines and identifies the
 * customer; the simplified invoices stay registered and point to the F3 that replaces them.
 */
@Injectable()
export class IntegrationExchangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly invoices: IntegrationInvoicesService,
    private readonly customers: IntegrationCustomersService
  ) {}

  async exchange(
    tenantId: string,
    dto: ExchangeSimplifiedInvoicesDto
  ): Promise<IntegrationInvoiceResponse> {
    assertIdentifiedPayer(dto.customer);
    await this.invoices.loadIssuingTenant(tenantId);
    const simplified = await this.loadExchangeable(tenantId, dto.invoiceIds);
    await this.invoices.releaseExternalRef(tenantId, dto.externalRef);

    const payer = await this.customers.upsertPayer(tenantId, dto.customer);
    const draft = await this.invoiceService.create(
      tenantId,
      null,
      buildCreateDto(payer.id, copyLines(simplified), {
        invoiceType: 'standard',
        paymentMethod: dto.paymentMethod,
      }),
      { externalRef: dto.externalRef, operationDate: commonOperationDate(simplified) }
    );
    await this.linkToExchange(tenantId, draft.id, dto.invoiceIds);
    const expectedCents = simplified.reduce((sum, inv) => sum + toCents(Number(inv.total)), 0n);
    return this.invoices.confirmIfMatches(tenantId, draft, expectedCents);
  }

  private async loadExchangeable(
    tenantId: string,
    invoiceIds: string[]
  ): Promise<SimplifiedToExchange[]> {
    const found = await this.prisma.invoice.findMany({
      where: { id: { in: invoiceIds }, tenantId, externalRef: { not: null } },
      select: SIMPLIFIED_TO_EXCHANGE_SELECT,
    });
    if (found.length !== invoiceIds.length) throw invoiceNotFound();
    found.forEach(assertExchangeable);
    const byId = new Map(found.map((invoice) => [invoice.id, invoice]));
    return invoiceIds.flatMap((id) => byId.get(id) ?? []);
  }

  /**
   * Links the simplified invoices to the F3 draft before confirming it, so its VeriFactu
   * record already lists them. Only free invoices are linked: if another exchange took one in
   * the meantime, the draft is removed (which unlinks the rest) and nothing is issued.
   */
  private async linkToExchange(
    tenantId: string,
    draftId: string,
    invoiceIds: string[]
  ): Promise<void> {
    const linked = await this.prisma.invoice.updateMany({
      where: {
        id: { in: invoiceIds },
        tenantId,
        exchangedByInvoiceId: null,
        status: { in: EXCHANGEABLE_STATUSES },
      },
      data: { exchangedByInvoiceId: draftId },
    });
    if (linked.count === invoiceIds.length) return;
    await this.invoiceService.remove(tenantId, draftId);
    throw invalidState('Alguna de las facturas se ha canjeado o modificado a la vez. Reintenta.');
  }
}

function assertExchangeable(invoice: SimplifiedToExchange): void {
  const label = `La factura ${invoice.number ?? invoice.id}`;
  if (invoice.invoiceType !== InvoiceType.simplified || invoice.isRectificative) {
    throw fiscalRule(`${label} no es una factura simplificada`, 'invoiceIds');
  }
  if (invoice.exchangedByInvoiceId) {
    throw invalidState(`${label} ya se canjeó por una factura completa`);
  }
  if (!EXCHANGEABLE_STATUSES.includes(invoice.status)) {
    throw invalidState(`${label} está anulada o sustituida y no se puede canjear`);
  }
  if (invoice.rectificativeInvoices.length > 0) {
    throw invalidState(`${label} tiene devoluciones; no se puede canjear`);
  }
}

function copyLines(simplified: SimplifiedToExchange[]): CreateInvoiceLineDto[] {
  return simplified.flatMap((invoice) =>
    invoice.lines.map((source) => {
      const line = new CreateInvoiceLineDto();
      line.description = source.description;
      line.quantity = Number(source.quantity);
      line.unitPrice = Number(source.unitPrice);
      line.taxRate = Number(source.taxRate);
      if (source.discountPercent != null) line.discountPercent = Number(source.discountPercent);
      if (source.hideQty) line.hideQty = true;
      return line;
    })
  );
}

/** The F3 keeps the operation date when every replaced invoice shares one other than today. */
function commonOperationDate(simplified: SimplifiedToExchange[]): string | undefined {
  const dates = new Set(
    simplified.map((invoice) =>
      (invoice.operationDate ?? invoice.issueDate).toISOString().slice(0, 10)
    )
  );
  const [only] = [...dates];
  return dates.size === 1 && only !== todayInSpain() ? only : undefined;
}
