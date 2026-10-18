import {
  PaymentMethod,
  PaymentStatus,
  ProductType,
  ReportComparison,
  ReportSortBy,
  ReportType,
} from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { PAYMENT_STATUS_CONFIG } from '@/components/common/payment-status-badge';
import {
  PRODUCT_TYPE_LABELS,
  SORT_LABELS,
  TIME_GROUPING_LABELS,
  getDimensionLabel,
} from './report-config';
import { ReportDraft, ReportFilterFields, ReportFilterKey } from './report-draft';

const REPORT_SUBJECT: Record<ReportType, string> = {
  [ReportType.SUMMARY]: 'Ingresos, gastos y resultado',
  [ReportType.SALES]: 'Ventas',
  [ReportType.EXPENSES]: 'Gastos',
  [ReportType.COLLECTIONS]: 'Cobros recibidos',
  [ReportType.RECEIVABLES]: 'Facturas pendientes de cobro',
};

const COMPARISON_PHRASES: Record<ReportComparison, string> = {
  [ReportComparison.NONE]: '',
  [ReportComparison.PREVIOUS_PERIOD]: ', frente al periodo anterior',
  [ReportComparison.PREVIOUS_YEAR]: ', frente al mismo periodo del año anterior',
};

const dateFormat = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Parses YYYY-MM-DD as a local date (avoids the UTC shift of `new Date(iso)`). */
function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormat.format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

function describeGrouping({ type, options }: ReportDraft): string {
  const { groupBy, breakdownBy, timeGrouping, topN } = options;
  if (type === ReportType.SUMMARY || !groupBy) {
    return ` por ${TIME_GROUPING_LABELS[timeGrouping].toLowerCase()}`;
  }
  const byGroup = ` por ${getDimensionLabel(groupBy, timeGrouping).toLowerCase()}`;
  const byBreakdown = breakdownBy
    ? `, con el detalle por ${getDimensionLabel(breakdownBy, timeGrouping).toLowerCase()}`
    : '';
  const top = topN ? ` (solo los ${topN} primeros)` : '';
  const sortBy = options.sortBy;
  const sorted =
    sortBy && sortBy !== ReportSortBy.AMOUNT
      ? `, ordenado por ${SORT_LABELS[sortBy].toLowerCase()}`
      : '';
  return `${byGroup}${top}${sorted}${byBreakdown}`;
}

/** e.g. "Ventas por cliente, con el detalle por artículo, del 1 ene 2026 al 31 mar 2026." */
export function describeReport(draft: ReportDraft): string {
  if (draft.type === ReportType.RECEIVABLES) {
    return `${REPORT_SUBJECT[draft.type]} a ${formatIsoDate(draft.range.toDate)}, por cliente y antigüedad de la deuda.`;
  }
  const period = `del ${formatIsoDate(draft.range.fromDate)} al ${formatIsoDate(draft.range.toDate)}`;
  return `${REPORT_SUBJECT[draft.type]}${describeGrouping(draft)}, ${period}${COMPARISON_PHRASES[draft.options.comparison]}.`;
}

export interface ReportFilterChip {
  key: ReportFilterKey;
  value: string;
  label: string;
}

const FILTER_KEYS: ReportFilterKey[] = [
  'paymentMethods',
  'customerIds',
  'productIds',
  'productType',
  'seriesCodes',
  'paymentStatuses',
  'categoryIds',
  'supplierIds',
];

const ENTITY_FALLBACK_LABELS: Partial<Record<ReportFilterKey, string>> = {
  customerIds: 'Cliente',
  productIds: 'Artículo',
  categoryIds: 'Categoría',
  supplierIds: 'Proveedor',
};

function chipLabel(key: ReportFilterKey, value: string, labels: Record<string, string>): string {
  switch (key) {
    case 'seriesCodes':
      return `Serie ${value}`;
    case 'paymentStatuses': {
      const status = Object.values(PaymentStatus).find((candidate) => candidate === value);
      return status ? PAYMENT_STATUS_CONFIG[status].label : value;
    }
    case 'paymentMethods': {
      const method = Object.values(PaymentMethod).find((candidate) => candidate === value);
      return method ? PAYMENT_METHOD_LABELS[method] : value;
    }
    case 'productType': {
      const productType = Object.values(ProductType).find((candidate) => candidate === value);
      return productType ? PRODUCT_TYPE_LABELS[productType] : value;
    }
    default:
      return labels[value] ?? ENTITY_FALLBACK_LABELS[key] ?? value;
  }
}

/** One removable chip per active filter value. */
export function getFilterChips({ filters, labels }: ReportDraft): ReportFilterChip[] {
  return FILTER_KEYS.flatMap((key) => {
    const raw = filters[key];
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return values.map((value) => ({ key, value, label: chipLabel(key, value, labels) }));
  });
}

export function removeFilterValue(
  filters: ReportFilterFields,
  { key, value }: Pick<ReportFilterChip, 'key' | 'value'>,
): ReportFilterFields {
  const current = filters[key];
  if (!Array.isArray(current)) return { ...filters, [key]: undefined };
  return { ...filters, [key]: current.filter((item) => item !== value) };
}
