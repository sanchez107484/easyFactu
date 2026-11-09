import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateIntegrationSettingsDto } from '../dto/integration-settings.dto';
import { IntegrationSettingsResponse } from '../dto/integration-responses.dto';
import { formatMoney } from '../utils/decimal';
import { MAX_SIMPLIFIED_INVOICE_LIMIT, validationError } from './integration-invoice-rules';

/** Fiscal settings of the clinic the ERP may change: today, the simplified invoice limit. */
@Injectable()
export class IntegrationSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string): Promise<IntegrationSettingsResponse> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { simplifiedInvoiceLimit: true },
    });
    return { simplifiedInvoiceLimit: formatMoney(tenant.simplifiedInvoiceLimit) };
  }

  async update(
    tenantId: string,
    dto: UpdateIntegrationSettingsDto
  ): Promise<IntegrationSettingsResponse> {
    const limit = Number(dto.simplifiedInvoiceLimit);
    if (limit <= 0 || limit > MAX_SIMPLIFIED_INVOICE_LIMIT) {
      throw validationError(
        `El límite de la factura simplificada debe estar entre 0,01 y ${MAX_SIMPLIFIED_INVOICE_LIMIT} €`,
        'simplifiedInvoiceLimit',
        `Entre 0.01 y ${MAX_SIMPLIFIED_INVOICE_LIMIT}`
      );
    }
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { simplifiedInvoiceLimit: dto.simplifiedInvoiceLimit },
    });
    return { simplifiedInvoiceLimit: formatMoney(limit) };
  }
}
