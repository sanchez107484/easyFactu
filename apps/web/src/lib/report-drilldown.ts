import { ReportDimension, ReportGroupRow, ReportType } from '@easyfactura/shared-types';
import { REPORT_FREE_TEXT_PRODUCT_KEY } from '@easyfactura/shared-constants';
import { ReportDraft, ReportFilterFields } from './report-draft';
import { getBucketRange } from './report-periods';

/** Group keys that cannot be turned into a filter. */
const UNFILTERABLE_KEYS = new Set([REPORT_FREE_TEXT_PRODUCT_KEY, '__none__', '__other__']);

export interface ReportDrillDown {
  label: string;
  /** The draft to show next (the current one is kept for "Volver"). */
  apply: (draft: ReportDraft) => ReportDraft;
}

interface DrillRule {
  label: string;
  nextGroupBy: ReportDimension;
  filterKey?: keyof ReportFilterFields;
}

const SALES_RULES: Partial<Record<ReportDimension, DrillRule>> = {
  [ReportDimension.CUSTOMER]: {
    label: 'Ver qué compra',
    nextGroupBy: ReportDimension.PRODUCT,
    filterKey: 'customerIds',
  },
  [ReportDimension.PRODUCT]: {
    label: 'Ver quién lo compra',
    nextGroupBy: ReportDimension.CUSTOMER,
    filterKey: 'productIds',
  },
  [ReportDimension.PERIOD]: {
    label: 'Ver clientes',
    nextGroupBy: ReportDimension.CUSTOMER,
  },
};

const EXPENSE_RULES: Partial<Record<ReportDimension, DrillRule>> = {
  [ReportDimension.CATEGORY]: {
    label: 'Ver proveedores',
    nextGroupBy: ReportDimension.SUPPLIER,
    filterKey: 'categoryIds',
  },
  [ReportDimension.SUPPLIER]: {
    label: 'Ver categorías',
    nextGroupBy: ReportDimension.CATEGORY,
    filterKey: 'supplierIds',
  },
  [ReportDimension.PERIOD]: {
    label: 'Ver categorías',
    nextGroupBy: ReportDimension.CATEGORY,
  },
};

const COLLECTION_RULES: Partial<Record<ReportDimension, DrillRule>> = {
  [ReportDimension.CUSTOMER]: {
    label: 'Ver evolución',
    nextGroupBy: ReportDimension.PERIOD,
    filterKey: 'customerIds',
  },
  [ReportDimension.PAYMENT_METHOD]: {
    label: 'Ver clientes',
    nextGroupBy: ReportDimension.CUSTOMER,
    filterKey: 'paymentMethods',
  },
  [ReportDimension.PERIOD]: {
    label: 'Ver clientes',
    nextGroupBy: ReportDimension.CUSTOMER,
  },
};

function rulesFor(type: ReportType): Partial<Record<ReportDimension, DrillRule>> {
  if (type === ReportType.SALES) return SALES_RULES;
  if (type === ReportType.EXPENSES) return EXPENSE_RULES;
  if (type === ReportType.COLLECTIONS) return COLLECTION_RULES;
  return {};
}

/**
 * "Click to dig deeper": a customer row opens its products, a product row its
 * customers, a month its customers for that month, and the expense equivalents.
 */
export function getDrillDown(
  draft: ReportDraft,
  row: ReportGroupRow<unknown>,
): ReportDrillDown | undefined {
  const groupBy = draft.options.groupBy;
  const rule = groupBy ? rulesFor(draft.type)[groupBy] : undefined;
  if (!rule || row.isOther || UNFILTERABLE_KEYS.has(row.key)) return undefined;

  const bucketRange = groupBy === ReportDimension.PERIOD ? getBucketRange(row.key) : null;
  if (groupBy === ReportDimension.PERIOD && !bucketRange) return undefined;

  return {
    label: rule.label,
    apply: (current) => ({
      ...current,
      ...(bucketRange ? { preset: 'custom' as const, range: bucketRange } : {}),
      options: {
        ...current.options,
        groupBy: rule.nextGroupBy,
        breakdownBy: undefined,
        topN: undefined,
      },
      filters: rule.filterKey
        ? { ...current.filters, [rule.filterKey]: [row.key] }
        : current.filters,
      labels: { ...current.labels, [row.key]: row.label },
    }),
  };
}
