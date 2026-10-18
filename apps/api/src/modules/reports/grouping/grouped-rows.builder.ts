import { ReportDimension, ReportGroupRow } from '@easyfactura/shared-types';
import { formatBucketLabel } from '../report-period.helpers';
import { GroupedQueryResult, RawGroupedRow } from './grouped-source';

/** How a report source turns raw aggregates into its own metrics type. */
export interface MetricsOps<M> {
  fromRaw(raw: RawGroupedRow): M;
  zero(): M;
  add(a: M, b: M): M;
}

export interface GroupedTree<M> {
  totals: M;
  rows: ReportGroupRow<M>[];
}

export interface TreeDimensions {
  groupBy: ReportDimension;
  breakdownBy?: ReportDimension;
}

const OTHER_GROUP_KEY = '__other__';

function toRow<M>(
  key: string | null,
  label: string | null,
  sublabel: string | null,
  dimension: ReportDimension | undefined,
  metrics: M
): ReportGroupRow<M> {
  const safeKey = key ?? '';
  const isPeriod = dimension === ReportDimension.PERIOD;
  return {
    key: safeKey,
    label: isPeriod ? formatBucketLabel(safeKey) : (label ?? ''),
    sublabel,
    metrics,
  };
}

function sortChronologically<M>(rows: ReportGroupRow<M>[]): ReportGroupRow<M>[] {
  return [...rows].sort((a, b) => a.key.localeCompare(b.key));
}

/** Builds the group → breakdown tree. SQL already sorted groups by amount. */
export function buildTree<M>(
  result: GroupedQueryResult,
  dimensions: TreeDimensions,
  ops: MetricsOps<M>
): GroupedTree<M> {
  const childrenByGroup = new Map<string, ReportGroupRow<M>[]>();
  for (const raw of result.breakdown) {
    const child = toRow(raw.k2, raw.l2, raw.s2, dimensions.breakdownBy, ops.fromRaw(raw));
    const siblings = childrenByGroup.get(raw.k1 ?? '') ?? [];
    siblings.push(child);
    childrenByGroup.set(raw.k1 ?? '', siblings);
  }

  const rows = result.groups.map((raw) => {
    const row = toRow(raw.k1, raw.l1, raw.s1, dimensions.groupBy, ops.fromRaw(raw));
    const children = childrenByGroup.get(row.key);
    if (!dimensions.breakdownBy || !children) return row;
    const isPeriod = dimensions.breakdownBy === ReportDimension.PERIOD;
    return { ...row, children: isPeriod ? sortChronologically(children) : children };
  });

  return {
    totals: result.totals ? ops.fromRaw(result.totals) : ops.zero(),
    rows: dimensions.groupBy === ReportDimension.PERIOD ? sortChronologically(rows) : rows,
  };
}

/** Adds zero rows for buckets without activity so charts keep a continuous axis. */
export function fillPeriodBuckets<M>(
  rows: ReportGroupRow<M>[],
  bucketKeys: string[],
  ops: MetricsOps<M>
): ReportGroupRow<M>[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return bucketKeys.map(
    (key) =>
      byKey.get(key) ?? {
        key,
        label: formatBucketLabel(key),
        sublabel: null,
        metrics: ops.zero(),
      }
  );
}

export interface ComparisonKeyMaps {
  /** Translates comparison-period keys to current keys (only for PERIOD dimensions). */
  group?: Map<string, string>;
  breakdown?: Map<string, string>;
}

function indexRows<M>(rows: ReportGroupRow<M>[], keyMap?: Map<string, string>) {
  return new Map(rows.map((row) => [keyMap?.get(row.key) ?? row.key, row]));
}

/** Attaches the comparison-period metrics to the matching groups and breakdown rows. */
export function attachComparison<M>(
  current: ReportGroupRow<M>[],
  previous: ReportGroupRow<M>[],
  keyMaps: ComparisonKeyMaps
): ReportGroupRow<M>[] {
  const previousByKey = indexRows(previous, keyMaps.group);

  return current.map((row) => {
    const match = previousByKey.get(row.key);
    if (!match) return row;

    const children =
      row.children && match.children
        ? attachComparison(row.children, match.children, { group: keyMaps.breakdown })
        : row.children;
    return { ...row, previous: match.metrics, children };
  });
}

/** Ranks groups (and their breakdown) by the chosen metric, highest first. */
export function sortRows<M>(
  rows: ReportGroupRow<M>[],
  sortValue: (metrics: M) => number
): ReportGroupRow<M>[] {
  const byValue = (a: ReportGroupRow<M>, b: ReportGroupRow<M>) =>
    sortValue(b.metrics) - sortValue(a.metrics);
  return [...rows]
    .sort(byValue)
    .map((row) => (row.children ? { ...row, children: [...row.children].sort(byValue) } : row));
}

/**
 * Keeps the first `topN` groups and folds the rest into a single "Otros" row.
 * Counts in "Otros" are summed per group, so an invoice spanning several folded
 * groups (e.g. several products) is counted once per group.
 */
export function applyTopN<M>(
  rows: ReportGroupRow<M>[],
  topN: number | undefined,
  ops: MetricsOps<M>
): ReportGroupRow<M>[] {
  if (!topN || rows.length <= topN) return rows;

  const kept = rows.slice(0, topN);
  const folded = rows.slice(topN);
  const sumPrevious = folded.some((row) => row.previous)
    ? folded.reduce((acc, row) => ops.add(acc, row.previous ?? ops.zero()), ops.zero())
    : undefined;

  const otherRow: ReportGroupRow<M> = {
    key: OTHER_GROUP_KEY,
    label: `Otros (${folded.length})`,
    sublabel: null,
    isOther: true,
    metrics: folded.reduce((acc, row) => ops.add(acc, row.metrics), ops.zero()),
    previous: sumPrevious,
  };
  return [...kept, otherRow];
}
