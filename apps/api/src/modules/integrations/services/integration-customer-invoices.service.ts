import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CUSTOMER_INVOICES_DEFAULT_LIMIT,
  CustomerInvoicesQueryDto,
} from '../dto/customer-invoices-query.dto';
import { EXTERNAL_ID_PATTERN } from '../dto/issue-invoice.dto';
import { IntegrationCustomerInvoicesResponse } from '../dto/integration-responses.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import {
  INTEGRATION_INVOICE_SELECT,
  toIntegrationInvoiceResponse,
} from './integration-invoice.mapper';
import { IntegrationUrlsService } from './integration-urls.service';

function payerNotFound(): IntegrationException {
  return new IntegrationException(IntegrationErrorCode.NOT_FOUND, 'Cliente no encontrado');
}

/** Invoices issued through the API to one payer, newest first (returns, exchanges, cancellations). */
@Injectable()
export class IntegrationCustomerInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly urls: IntegrationUrlsService
  ) {}

  async list(
    tenantId: string,
    externalId: string,
    query: CustomerInvoicesQueryDto
  ): Promise<IntegrationCustomerInvoicesResponse> {
    if (!EXTERNAL_ID_PATTERN.test(externalId)) throw payerNotFound();
    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, externalId },
      select: { id: true },
    });
    if (!customer) throw payerNotFound();

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? CUSTOMER_INVOICES_DEFAULT_LIMIT);
    const where = {
      tenantId,
      customerId: customer.id,
      externalRef: { not: null },
      status: { not: InvoiceStatus.DRAFT },
    };
    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        select: INTEGRATION_INVOICE_SELECT,
        orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: invoices.map((invoice) =>
        toIntegrationInvoiceResponse(invoice, this.urls.invoiceAppUrl(invoice.id))
      ),
      meta: { total, page, limit },
    };
  }
}
