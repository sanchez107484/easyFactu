import { BarChart3, Clock, HandCoins, Receipt, ShoppingCart } from 'lucide-react';
import {
  ProductType,
  ReportComparison,
  ReportDimension,
  ReportOptions,
  ReportSortBy,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';

export interface ReportTypeConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Dimensions available for "Ver por" / "Y dentro de cada uno". Empty = not grouped. */
  dimensions: ReportDimension[];
  defaultGroupBy?: ReportDimension;
  sortOptions: ReportSortBy[];
  supportsComparison: boolean;
  /** A balance at a single date instead of a period (e.g. receivables). */
  isSnapshot?: boolean;
}

export const REPORT_TYPE_CONFIG: Record<ReportType, ReportTypeConfig> = {
  [ReportType.SUMMARY]: {
    label: 'Resumen',
    description: 'Ingresos, gastos y resultado',
    icon: BarChart3,
    dimensions: [],
    sortOptions: [],
    supportsComparison: true,
  },
  [ReportType.SALES]: {
    label: 'Ventas',
    description: 'Por cliente, artículo o periodo',
    icon: ShoppingCart,
    dimensions: [ReportDimension.CUSTOMER, ReportDimension.PRODUCT, ReportDimension.PERIOD],
    defaultGroupBy: ReportDimension.CUSTOMER,
    sortOptions: [ReportSortBy.AMOUNT, ReportSortBy.UNITS, ReportSortBy.COUNT, ReportSortBy.MARGIN],
    supportsComparison: true,
  },
  [ReportType.EXPENSES]: {
    label: 'Gastos',
    description: 'Por categoría, proveedor o periodo',
    icon: Receipt,
    dimensions: [ReportDimension.CATEGORY, ReportDimension.SUPPLIER, ReportDimension.PERIOD],
    defaultGroupBy: ReportDimension.CATEGORY,
    sortOptions: [ReportSortBy.AMOUNT, ReportSortBy.COUNT],
    supportsComparison: true,
  },
  [ReportType.COLLECTIONS]: {
    label: 'Cobros',
    description: 'Lo que has cobrado, por fecha de cobro',
    icon: HandCoins,
    dimensions: [ReportDimension.PERIOD, ReportDimension.CUSTOMER, ReportDimension.PAYMENT_METHOD],
    defaultGroupBy: ReportDimension.PERIOD,
    sortOptions: [ReportSortBy.AMOUNT, ReportSortBy.COUNT],
    supportsComparison: true,
  },
  [ReportType.RECEIVABLES]: {
    label: 'Cobros pendientes',
    description: 'Quién te debe dinero y desde cuándo',
    icon: Clock,
    dimensions: [],
    sortOptions: [],
    supportsComparison: false,
    isSnapshot: true,
  },
};

export const REPORT_TYPES: ReportType[] = [
  ReportType.SUMMARY,
  ReportType.SALES,
  ReportType.EXPENSES,
  ReportType.COLLECTIONS,
  ReportType.RECEIVABLES,
];

export const TIME_GROUPING_LABELS: Record<ReportTimeGrouping, string> = {
  [ReportTimeGrouping.MONTH]: 'Mes',
  [ReportTimeGrouping.QUARTER]: 'Trimestre',
  [ReportTimeGrouping.YEAR]: 'Año',
};

const DIMENSION_LABELS: Record<Exclude<ReportDimension, ReportDimension.PERIOD>, string> = {
  [ReportDimension.CUSTOMER]: 'Cliente',
  [ReportDimension.PRODUCT]: 'Artículo',
  [ReportDimension.CATEGORY]: 'Categoría',
  [ReportDimension.SUPPLIER]: 'Proveedor',
  [ReportDimension.PAYMENT_METHOD]: 'Forma de pago',
};

/** PERIOD is labelled after the time grouping ("Mes", "Trimestre", "Año"). */
export function getDimensionLabel(
  dimension: ReportDimension,
  grouping: ReportTimeGrouping,
): string {
  return dimension === ReportDimension.PERIOD
    ? TIME_GROUPING_LABELS[grouping]
    : DIMENSION_LABELS[dimension];
}

/** "Cliente › Artículo" */
export function groupedLabelHeader({ groupBy, breakdownBy, timeGrouping }: ReportOptions): string {
  if (!groupBy) return '';
  const first = getDimensionLabel(groupBy, timeGrouping);
  return breakdownBy ? `${first} › ${getDimensionLabel(breakdownBy, timeGrouping)}` : first;
}

export const SORT_LABELS: Record<ReportSortBy, string> = {
  [ReportSortBy.AMOUNT]: 'Importe',
  [ReportSortBy.UNITS]: 'Unidades',
  [ReportSortBy.COUNT]: 'Nº de documentos',
  [ReportSortBy.MARGIN]: 'Margen',
};

export const COMPARISON_LABELS: Record<ReportComparison, string> = {
  [ReportComparison.NONE]: 'Sin comparación',
  [ReportComparison.PREVIOUS_PERIOD]: 'Periodo anterior',
  [ReportComparison.PREVIOUS_YEAR]: 'Mismo periodo del año anterior',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.PRODUCT]: 'Productos',
  [ProductType.SERVICE]: 'Servicios',
};

export { AGING_BUCKET_LABELS } from '@easyfactura/shared-constants';
