import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CollectionsReport,
  ReportAppliedFilters,
  ReportDimension,
  ReportOptions,
  ReportSortBy,
  ReportType,
} from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportPeriod } from './report-period.helpers';
import { toAmount } from './report-sql.helpers';
import { GroupedReportService } from './grouping/grouped-report.service';
import { buildSalesInvoiceConditions } from './grouping/sales-source';
import {
  COLLECTIONS_SOURCE,
  COLLECTION_METRICS_OPS,
  buildCollectionsWhere,
} from './grouping/collections-source';

/** Cash received by payment date, grouped by customer / payment method / period. */
@Injectable()
export class ReportsCollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupedReport: GroupedReportService
  ) {}

  async build(
    tenantId: string,
    period: ReportPeriod,
    options: ReportOptions & { groupBy: ReportDimension },
    filters: ReportAppliedFilters
  ): Promise<CollectionsReport> {
    const [output, invoicedGross] = await Promise.all([
      this.groupedReport.build({
        period,
        options,
        ops: COLLECTION_METRICS_OPS,
        sortValue: options.sortBy === ReportSortBy.COUNT ? (m) => m.count : undefined,
        buildQuery: (queryPeriod) => ({
          source: COLLECTIONS_SOURCE,
          where: buildCollectionsWhere(tenantId, queryPeriod, filters),
          groupBy: options.groupBy,
          breakdownBy: options.breakdownBy,
          timeGrouping: options.timeGrouping,
        }),
      }),
      this.fetchInvoicedGross(tenantId, period, filters),
    ]);

    return {
      type: ReportType.COLLECTIONS,
      options,
      comparisonPeriod: output.comparisonPeriod,
      totals: output.totals,
      previousTotals: output.previousTotals,
      rows: output.rows,
      invoicedGross,
    };
  }

  /** Invoice totals (incl. taxes) issued in the period — the "facturado" side of the KPI. */
  private async fetchInvoicedGross(
    tenantId: string,
    period: ReportPeriod,
    filters: ReportAppliedFilters
  ): Promise<number> {
    const where = Prisma.join(
      buildSalesInvoiceConditions(tenantId, period, { ...filters, paymentStatuses: undefined }),
      ' AND '
    );
    const [row] = await this.prisma.$queryRaw<{ total: string | null }[]>(Prisma.sql`
      SELECT SUM(i.total)::text AS total
      FROM invoices i
      JOIN invoice_series s ON s.id = i.series_id
      WHERE ${where}
    `);
    return toAmount(row?.total);
  }
}
