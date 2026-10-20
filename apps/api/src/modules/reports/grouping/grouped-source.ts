import { Prisma } from '@prisma/client';
import { ReportDimension, ReportTimeGrouping } from '@easyfactura/shared-types';

/** SQL expressions that identify and describe one group for a dimension. */
export interface DimensionSql {
  key: Prisma.Sql;
  label: Prisma.Sql;
  sublabel: Prisma.Sql;
}

/**
 * A data source the grouping engine can aggregate. Dimensions are a closed,
 * hard-coded whitelist — user input never reaches the SQL text.
 */
export interface GroupedSource {
  /** `FROM ... JOIN ...` clause. */
  from: Prisma.Sql;
  /** Distinct-counted to produce `cnt` (invoices for sales, expenses for expenses). */
  rowId: Prisma.Sql;
  units: Prisma.Sql;
  amount: Prisma.Sql;
  /** Optional boolean expression; rows where it holds are counted as `flagged`. */
  flag?: Prisma.Sql;
  dimension(dimension: ReportDimension, grouping: ReportTimeGrouping): DimensionSql;
}

export interface GroupedQuery {
  source: GroupedSource;
  where: Prisma.Sql;
  groupBy: ReportDimension;
  breakdownBy?: ReportDimension;
  timeGrouping: ReportTimeGrouping;
}

export interface RawGroupedRow {
  k1: string | null;
  l1: string | null;
  s1: string | null;
  k2: string | null;
  l2: string | null;
  s2: string | null;
  amount: string | null;
  units: string | null;
  cnt: bigint;
  flagged: bigint | null;
  g1: number;
  g2: number;
}

export interface GroupedQueryResult {
  totals: RawGroupedRow | undefined;
  groups: RawGroupedRow[];
  breakdown: RawGroupedRow[];
}

export const NULL_TEXT_SQL = Prisma.sql`NULL::text`;
