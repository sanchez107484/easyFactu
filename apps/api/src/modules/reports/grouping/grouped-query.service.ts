import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MAX_GROUPED_ROWS, MAX_GROUPS } from '../report-sql.helpers';
import {
  DimensionSql,
  GroupedQuery,
  GroupedQueryResult,
  NULL_TEXT_SQL,
  RawGroupedRow,
} from './grouped-source';

const EMPTY_DIMENSION: DimensionSql = {
  key: NULL_TEXT_SQL,
  label: NULL_TEXT_SQL,
  sublabel: NULL_TEXT_SQL,
};

/**
 * Runs one aggregate query that returns the grand total, the first-level groups
 * and (optionally) the breakdown rows at once, using GROUPING SETS.
 */
@Injectable()
export class GroupedQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async run(query: GroupedQuery): Promise<GroupedQueryResult> {
    const rows = await this.prisma.$queryRaw<RawGroupedRow[]>(this.buildSql(query));

    if (rows.length > MAX_GROUPED_ROWS) {
      throw new BadRequestException(
        'El informe tiene demasiadas combinaciones. Reduce el periodo o añade filtros.'
      );
    }

    const groups = rows.filter((row) => row.g1 === 0 && row.g2 === 1);
    if (groups.length > MAX_GROUPS) {
      throw new BadRequestException(
        `El informe supera ${MAX_GROUPS} grupos. Usa "Mostrar los primeros" o añade filtros.`
      );
    }

    return {
      totals: rows.find((row) => row.g1 === 1),
      groups,
      breakdown: rows.filter((row) => row.g1 === 0 && row.g2 === 0),
    };
  }

  private buildSql({ source, where, groupBy, breakdownBy, timeGrouping }: GroupedQuery) {
    const first = source.dimension(groupBy, timeGrouping);
    const second = breakdownBy ? source.dimension(breakdownBy, timeGrouping) : EMPTY_DIMENSION;

    const groupingSets = breakdownBy
      ? Prisma.sql`(k1, l1, s1, k2, l2, s2), (k1, l1, s1), ()`
      : Prisma.sql`(k1, l1, s1), ()`;
    // Without a breakdown, k2/l2/s2 are in no grouping set, so they can be neither
    // selected as columns nor passed to GROUPING().
    const secondColumns = breakdownBy
      ? Prisma.sql`k2, l2, s2`
      : Prisma.sql`NULL::text AS k2, NULL::text AS l2, NULL::text AS s2`;
    const secondGrouping = breakdownBy ? Prisma.sql`GROUPING(k2)` : Prisma.sql`1`;

    return Prisma.sql`
      WITH base AS (
        SELECT
          ${first.key} AS k1, ${first.label} AS l1, ${first.sublabel} AS s1,
          ${second.key} AS k2, ${second.label} AS l2, ${second.sublabel} AS s2,
          ${source.rowId} AS row_id,
          ${source.units} AS units,
          ${source.amount} AS amount,
          ${source.flag ?? Prisma.sql`false`} AS flag
        ${source.from}
        WHERE ${where}
      )
      SELECT
        k1, l1, s1, ${secondColumns},
        SUM(amount)::text       AS amount,
        SUM(units)::text        AS units,
        COUNT(DISTINCT row_id)  AS cnt,
        COUNT(*) FILTER (WHERE flag) AS flagged,
        GROUPING(k1)::int       AS g1,
        ${secondGrouping}::int  AS g2
      FROM base
      GROUP BY GROUPING SETS (${groupingSets})
      ORDER BY g1 DESC, g2 DESC, SUM(amount) DESC NULLS LAST, l1 ASC, l2 ASC
      LIMIT ${MAX_GROUPED_ROWS + 1}
    `;
  }
}
