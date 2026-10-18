import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ReportAppliedFilters,
  ReportOptions,
  ReportType,
  ReceivablesReport,
} from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildRevenueInvoiceFilter } from '../invoices/invoice-revenue-filter';
import { sqlInList } from './report-sql.helpers';
import { toIsoDate } from './report-period.helpers';
import { ReceivableInvoiceRow, buildCustomerRows, sumReceivables } from './receivables.helpers';

/** Pending invoices are listed one by one, so they are capped harder than groups. */
const MAX_PENDING_INVOICES = 5000;

/**
 * Outstanding balance at a date. Unlike the other reports this is a stock, not a
 * flow: every invoice issued up to `asOf` that is not fully paid by `asOf` counts,
 * whatever its issue date. Credit notes (negative totals) reduce the balance.
 */
@Injectable()
export class ReportsReceivablesService {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    tenantId: string,
    asOf: Date,
    options: ReportOptions,
    filters: ReportAppliedFilters
  ): Promise<ReceivablesReport> {
    const invoiceRows = await this.fetchPendingInvoices(tenantId, asOf, filters);
    if (invoiceRows.length > MAX_PENDING_INVOICES) {
      throw new BadRequestException(
        'Hay demasiadas facturas pendientes para un solo informe. Filtra por cliente o serie.'
      );
    }

    const rows = buildCustomerRows(invoiceRows, asOf);
    return {
      type: ReportType.RECEIVABLES,
      options,
      asOfDate: toIsoDate(asOf),
      totals: sumReceivables(rows),
      rows,
    };
  }

  private fetchPendingInvoices(tenantId: string, asOf: Date, filters: ReportAppliedFilters) {
    const conditions = [
      Prisma.sql`i.tenant_id = ${tenantId}`,
      buildRevenueInvoiceFilter('i'),
      Prisma.sql`i.issue_date <= ${asOf}`,
      Prisma.sql`ABS(i.total - COALESCE(paid.amount, 0)) >= 0.01`,
    ];
    if (filters.customers) {
      conditions.push(
        Prisma.sql`i.customer_id IN (${sqlInList(filters.customers.map((c) => c.id))})`
      );
    }
    if (filters.seriesCodes) {
      conditions.push(Prisma.sql`s.code IN (${sqlInList(filters.seriesCodes)})`);
    }

    return this.prisma.$queryRaw<ReceivableInvoiceRow[]>(Prisma.sql`
      WITH paid AS (
        SELECT p.invoice_id, SUM(p.amount) AS amount
        FROM payments p
        WHERE p.tenant_id = ${tenantId} AND p.payment_date <= ${asOf}
        GROUP BY p.invoice_id
      )
      SELECT
        i.id,
        i.number,
        i.issue_date,
        COALESCE(i.due_date, i.issue_date)  AS due_date,
        i.total::text                       AS total,
        COALESCE(paid.amount, 0)::text      AS paid,
        c.id                                AS customer_id,
        c.name                              AS customer_name,
        c.nif                               AS customer_nif
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN invoice_series s ON s.id = i.series_id
      LEFT JOIN paid ON paid.invoice_id = i.id
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY due_date ASC, i.number ASC
      LIMIT ${MAX_PENDING_INVOICES + 1}
    `);
  }
}
