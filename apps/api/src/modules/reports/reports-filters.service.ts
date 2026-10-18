import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportAppliedFilters, ReportNamedRef } from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { assertFiltersAllowed } from './report-request.validator';

type NamedRefLookup = (ids: string[]) => Promise<ReportNamedRef[]>;

/** Resolves filter ids to tenant-owned entities (with names for the Excel/history). */
@Injectable()
export class ReportsFiltersService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFilters(tenantId: string, dto: ReportRequestDto): Promise<ReportAppliedFilters> {
    assertFiltersAllowed(dto);

    const [customers, products, categories, suppliers] = await Promise.all([
      this.resolve(dto.customerIds, 'Cliente', (ids) =>
        this.prisma.customer.findMany({ where: { tenantId, id: { in: ids } }, select: NAMED })
      ),
      this.resolve(dto.productIds, 'Artículo', (ids) =>
        this.prisma.product.findMany({ where: { tenantId, id: { in: ids } }, select: NAMED })
      ),
      // Expense categories are a global catalog, so they are not tenant-scoped.
      this.resolve(dto.categoryIds, 'Categoría', (ids) =>
        this.prisma.expenseCategory.findMany({ where: { id: { in: ids } }, select: NAMED })
      ),
      this.resolve(dto.supplierIds, 'Proveedor', (ids) =>
        this.prisma.supplier.findMany({ where: { tenantId, id: { in: ids } }, select: NAMED })
      ),
    ]);

    return {
      customers,
      products,
      categories,
      suppliers,
      seriesCodes: nonEmpty(dto.seriesCodes),
      paymentStatuses: nonEmpty(dto.paymentStatuses),
      productType: dto.productType,
      paymentMethods: nonEmpty(dto.paymentMethods),
    };
  }

  /** Fails when any id does not exist for this tenant (never silently drops a filter). */
  private async resolve(
    ids: string[] | undefined,
    entityLabel: string,
    lookup: NamedRefLookup
  ): Promise<ReportNamedRef[] | undefined> {
    const uniqueIds = [...new Set(ids ?? [])];
    if (uniqueIds.length === 0) return undefined;

    const found = await lookup(uniqueIds);
    if (found.length !== uniqueIds.length) {
      throw new NotFoundException(`${entityLabel} no encontrado`);
    }
    return found;
  }
}

const NAMED = { id: true, name: true } as const;

function nonEmpty<T>(values: T[] | undefined): T[] | undefined {
  return values && values.length > 0 ? [...new Set(values)] : undefined;
}
