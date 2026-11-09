import { Injectable } from '@nestjs/common';
import { InvoiceStatus, RectificationType as PrismaRectificationType } from '@prisma/client';
import { RectificationType } from '@easyfactura/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceLineDto } from '../../invoices/dto/create-invoice.dto';
import { RectifyInvoiceDto } from '../../invoices/dto/rectify-invoice.dto';
import { InvoiceService } from '../../invoices/invoice.service';
import { IntegrationInvoiceResponse } from '../dto/integration-responses.dto';
import { RectifyIssuedInvoiceDto } from '../dto/invoice-records.dto';
import { toCents } from '../utils/decimal';
import {
  fiscalRule,
  invalidState,
  resolveOperationDate,
  todayInSpain,
} from './integration-invoice-rules';
import { IntegrationInvoicesService } from './integration-invoices.service';
import { PriceWithTaxConverter } from './price-with-tax.converter';

const ISSUED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CONFIRMED,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
  InvoiceStatus.RECTIFIED,
];

/**
 * Returns (devoluciones) through the API: a rectificative by differences of an invoice issued
 * through the API, with negative amounts. A simplified original yields an R5; a complete one
 * an R4. The sum of returns can never exceed what the original invoice charged.
 */
@Injectable()
export class IntegrationRectificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly invoices: IntegrationInvoicesService,
    private readonly converter: PriceWithTaxConverter
  ) {}

  async rectify(
    tenantId: string,
    originalId: string,
    dto: RectifyIssuedInvoiceDto
  ): Promise<IntegrationInvoiceResponse> {
    const original = await this.invoices.assertIssuedInvoice(tenantId, originalId);
    if (original.rectifiedInvoiceId) {
      throw invalidState(
        'Una devolución se registra sobre la factura original, no sobre otra rectificativa'
      );
    }
    const operationDate = resolveOperationDate(dto.operationDate);
    await this.invoices.loadIssuingTenant(tenantId);
    await this.invoices.releaseExternalRef(tenantId, dto.externalRef);

    const converted = this.converter.convertInvoice(dto.lines, -1n);
    assertRatesExistInOriginal(
      dto,
      original.taxBreakdown.map((row) => Number(row.rate))
    );
    await this.assertWithinRefundableAmount(tenantId, original, converted.chargedCents);

    const draft = await this.invoiceService.rectify(
      tenantId,
      originalId,
      toRectifyDto(dto.reason, converted.lines),
      { externalRef: dto.externalRef, operationDate, issueDate: todayInSpain() }
    );
    return this.invoices.confirmIfMatches(tenantId, draft, -converted.chargedCents);
  }

  /** Original total plus every issued return (negative) must stay ≥ 0 after this one. */
  private async assertWithinRefundableAmount(
    tenantId: string,
    original: IntegrationInvoiceResponse,
    refundCents: bigint
  ): Promise<void> {
    const previous = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        rectifiedInvoiceId: original.id,
        rectificationType: PrismaRectificationType.DIFFERENCES,
        status: { in: ISSUED_STATUSES },
      },
      _sum: { total: true },
    });
    const refundableCents =
      toCents(Number(original.totals.total)) + toCents(Number(previous._sum.total ?? 0));
    if (refundCents > refundableCents) {
      throw fiscalRule(
        `La devolución supera el importe pendiente de devolver de la factura (${(Number(refundableCents) / 100).toFixed(2)} €)`,
        'lines'
      );
    }
  }
}

function assertRatesExistInOriginal(dto: RectifyIssuedInvoiceDto, originalRates: number[]): void {
  dto.lines.forEach((line, index) => {
    if (!originalRates.includes(Number(line.taxRate))) {
      throw fiscalRule(
        `La factura original no tiene líneas al ${Number(line.taxRate)} % de IVA`,
        `lines[${index}].taxRate`
      );
    }
  });
}

function toRectifyDto(reason: string, lines: CreateInvoiceLineDto[]): RectifyInvoiceDto {
  const rectifyDto = new RectifyInvoiceDto();
  rectifyDto.rectificationReason = reason;
  rectifyDto.rectificationType = RectificationType.DIFFERENCES;
  rectifyDto.lines = lines;
  return rectifyDto;
}
