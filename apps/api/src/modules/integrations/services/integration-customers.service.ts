import { Injectable } from '@nestjs/common';
import { CustomerType, Prisma } from '@prisma/client';
import { getNifType, NifType } from '@easyfactura/shared-validators';
import { PrismaService } from '../../../prisma/prisma.service';
import { InvoicePayerDto } from '../dto/issue-invoice.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';

interface ExistingPayer {
  id: string;
  nif: string | null;
  externalId: string | null;
  hasEquivalenceSurcharge: boolean;
}

const PAYER_SELECT = {
  id: true,
  nif: true,
  externalId: true,
  hasEquivalenceSurcharge: true,
} as const;

/**
 * Customer of simplified invoices issued without payer. The "@" cannot appear in an ERP
 * externalId, so it never collides with a real payer.
 */
export const ANONYMOUS_PAYER_EXTERNAL_ID = '@consumidor-final';
export const ANONYMOUS_PAYER_NAME = 'Consumidor final';

export function normalizeNif(nif: string): string {
  return nif
    .toUpperCase()
    .trim()
    .replace(/[\s.-]/g, '');
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * The invoice customer is always the payer sent by the ERP. It is found by the ERP id
 * (externalId) and, failing that, by NIF, so payers already created in NovaFactura are
 * reused and linked instead of duplicated. The ERP is the source of truth for its data.
 */
@Injectable()
export class IntegrationCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Without payer (simplified invoice only) the invoice goes to the tenant's "Consumidor final".
   * A payer without NIF keeps the NIF already known for it: a ticket never erases it.
   */
  async upsertPayer(tenantId: string, payer: InvoicePayerDto | undefined): Promise<{ id: string }> {
    if (!payer) return this.upsertAnonymousPayer(tenantId);
    const nif = payer.nif ? normalizeNif(payer.nif) : null;
    const existing = await this.findPayer(tenantId, payer.externalId, nif);
    if (!existing) return this.createPayer(tenantId, payer, nif);

    this.assertNoEquivalenceSurcharge(existing);
    if (nif && existing.nif !== nif) await this.assertNifFree(tenantId, nif, existing.id);
    await this.prisma.customer.update({
      where: { id: existing.id },
      data: {
        ...this.payerData(payer, nif ?? existing.nif),
        externalId: existing.externalId ?? payer.externalId,
        isActive: true,
      },
    });
    return { id: existing.id };
  }

  private async upsertAnonymousPayer(tenantId: string): Promise<{ id: string }> {
    const anonymous: InvoicePayerDto = {
      externalId: ANONYMOUS_PAYER_EXTERNAL_ID,
      name: ANONYMOUS_PAYER_NAME,
    };
    const existing = await this.findPayer(tenantId, ANONYMOUS_PAYER_EXTERNAL_ID, null);
    if (existing) return { id: existing.id };
    return this.createPayer(tenantId, anonymous, null);
  }

  private async findPayer(
    tenantId: string,
    externalId: string,
    nif: string | null
  ): Promise<ExistingPayer | null> {
    const byExternalId = await this.prisma.customer.findFirst({
      where: { tenantId, externalId },
      select: PAYER_SELECT,
    });
    if (byExternalId || !nif) return byExternalId;
    return this.prisma.customer.findFirst({
      where: { tenantId, nif: { equals: nif, mode: 'insensitive' } },
      select: PAYER_SELECT,
    });
  }

  /** Two concurrent sales for a new payer race on the unique keys: the loser reuses the winner's row. */
  private async createPayer(
    tenantId: string,
    payer: InvoicePayerDto,
    nif: string | null
  ): Promise<{ id: string }> {
    try {
      return await this.prisma.customer.create({
        data: {
          tenantId,
          ...this.payerData(payer, nif),
          type: this.customerTypeFor(nif),
          externalId: payer.externalId,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const winner = await this.findPayer(tenantId, payer.externalId, nif);
      if (!winner) throw error;
      return { id: winner.id };
    }
  }

  private payerData(payer: InvoicePayerDto, nif: string | null) {
    return {
      name: payer.name.trim(),
      nif,
      email: payer.email?.trim().toLowerCase() ?? null,
      address: payer.address?.line1.trim() ?? null,
      postalCode: payer.address?.postalCode ?? null,
      city: payer.address?.city.trim() ?? null,
      province: payer.address?.province?.trim() ?? null,
    };
  }

  private customerTypeFor(nif: string | null): CustomerType {
    return nif && getNifType(nif) === NifType.CIF ? CustomerType.COMPANY : CustomerType.INDIVIDUAL;
  }

  private async assertNifFree(tenantId: string, nif: string, payerId: string): Promise<void> {
    const owner = await this.prisma.customer.findFirst({
      where: { tenantId, nif: { equals: nif, mode: 'insensitive' }, id: { not: payerId } },
      select: { id: true },
    });
    if (owner) {
      throw new IntegrationException(
        IntegrationErrorCode.INVALID_STATE,
        'El NIF enviado ya pertenece a otro cliente de la clínica con distinto externalId',
        { errors: [{ field: 'customer.nif', message: 'NIF ya asignado a otro cliente' }] }
      );
    }
  }

  /** Totals must equal what was charged; a surcharge (recargo de equivalencia) would add to them. */
  private assertNoEquivalenceSurcharge(payer: ExistingPayer): void {
    if (payer.hasEquivalenceSurcharge) {
      throw new IntegrationException(
        IntegrationErrorCode.FISCAL_RULE,
        'El cliente tiene recargo de equivalencia, que la API v1 no admite. Emite esta factura desde NovaFactura.'
      );
    }
  }
}
