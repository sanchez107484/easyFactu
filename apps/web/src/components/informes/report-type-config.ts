import { BarChart3, Receipt, ShoppingCart } from 'lucide-react';
import {
  ProductType,
  ReportComparison,
  ReportDimension,
  ReportOptions,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';

export interface ReportTypeConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Dimensions available for "Agrupar por" / "Desglosar por". Empty = not grouped. */
  dimensions: ReportDimension[];
  defaultGroupBy?: ReportDimension;
}

export const REPORT_TYPE_CONFIG: Record<ReportType, ReportTypeConfig> = {
  [ReportType.SUMMARY]: {
    label: 'Resumen',
    description: 'Ingresos, gastos y resultado',
    icon: BarChart3,
    dimensions: [],
  },
  [ReportType.SALES]: {
    label: 'Ventas',
    description: 'Por cliente, artículo o periodo',
    icon: ShoppingCart,
    dimensions: [ReportDimension.CUSTOMER, ReportDimension.PRODUCT, ReportDimension.PERIOD],
    defaultGroupBy: ReportDimension.CUSTOMER,
  },
  [ReportType.EXPENSES]: {
    label: 'Gastos',
    description: 'Por categoría, proveedor o periodo',
    icon: Receipt,
    dimensions: [ReportDimension.CATEGORY, ReportDimension.SUPPLIER, ReportDimension.PERIOD],
    defaultGroupBy: ReportDimension.CATEGORY,
  },
};

export const REPORT_TYPES: ReportType[] = [
  ReportType.SUMMARY,
  ReportType.SALES,
  ReportType.EXPENSES,
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

export const COMPARISON_LABELS: Record<ReportComparison, string> = {
  [ReportComparison.NONE]: 'Sin comparación',
  [ReportComparison.PREVIOUS_PERIOD]: 'Periodo anterior',
  [ReportComparison.PREVIOUS_YEAR]: 'Mismo periodo del año anterior',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.PRODUCT]: 'Productos',
  [ProductType.SERVICE]: 'Servicios',
};
