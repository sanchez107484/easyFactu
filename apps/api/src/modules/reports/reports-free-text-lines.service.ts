import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FreeTextSalesLine, ReportAppliedFilters } from '@easyfactura/shared-types';
import { REPORT_FREE_TEXT_LINE_LIMIT } from '@easyfactura/shared-constants';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportPeriod } from './report-period.helpers';
import { LINE_NET_BASE_SQL, toAmount } from './report-sql.helpers';
import { buildSalesInvoiceConditions } from './grouping/sales-source';
import {
  MATCHED_PRODUCT_LATERAL_SQL,
  SUGGESTED_PRODUCT_LATERAL_SQL,
} from './grouping/product-match.sql';

interface FreeTextLineRow {
  invoice_id: string;
  invoice_number: string | null;
  issue_date: Date;
  customer_name: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  amount: string;
  suggested_id: string | null;
  suggested_name: string | null;
  suggested_score: number | null;
}

/** Lines behind the "Sin artículo" row: no product selected and no description match. */
@Injectable()
export class ReportsFreeTextLinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string,
    period: ReportPeriod,
    filters: ReportAppliedFilters
  ): Promise<FreeTextSalesLine[]> {
    // Product filters exclude free-text lines from the report, so there is nothing to list.
    if (filters.products || filters.productType) return [];

    const rows = await this.fetch(tenantId, period, filters);
    return rows.map(toFreeTextLine);
  }

  private fetch(tenantId: string, period: ReportPeriod, filters: ReportAppliedFilters) {
    const conditions = [
      Prisma.sql`l.tenant_id = ${tenantId}`,
      ...buildSalesInvoiceConditions(tenantId, period, filters),
      Prisma.sql`l.product_id IS NULL`,
      Prisma.sql`matched.id IS NULL`,
    ];

    return this.prisma.$queryRaw<FreeTextLineRow[]>(Prisma.sql`
      SELECT
        i.id                          AS invoice_id,
        i.number                      AS invoice_number,
        i.issue_date,
        c.name                        AS customer_name,
        l.description,
        l.quantity::text              AS quantity,
        l.unit_price::text            AS unit_price,
        l.tax_rate::text              AS tax_rate,
        (${LINE_NET_BASE_SQL})::text  AS amount,
        suggested.id                  AS suggested_id,
        suggested.name                AS suggested_name,
        suggested.score               AS suggested_score
      FROM invoice_lines l
      JOIN invoices i ON i.id = l.invoice_id AND i.tenant_id = l.tenant_id
      JOIN customers c ON c.id = i.customer_id
      JOIN invoice_series s ON s.id = i.series_id
      ${MATCHED_PRODUCT_LATERAL_SQL}
      ${SUGGESTED_PRODUCT_LATERAL_SQL}
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY i.issue_date DESC, i.number DESC, l.sort_order ASC
      LIMIT ${REPORT_FREE_TEXT_LINE_LIMIT}
    `);
  }
}

function toFreeTextLine(row: FreeTextLineRow): FreeTextSalesLine {
  return {
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    issueDate: row.issue_date.toISOString().slice(0, 10),
    customerName: row.customer_name,
    description: row.description,
    quantity: toAmount(row.quantity),
    unitPrice: Number(row.unit_price),
    taxRate: Number(row.tax_rate),
    amount: toAmount(row.amount),
    suggestedProduct:
      row.suggested_id && row.suggested_name
        ? {
            id: row.suggested_id,
            name: row.suggested_name,
            similarity: Math.round((row.suggested_score ?? 0) * 100) / 100,
          }
        : null,
  };
}
