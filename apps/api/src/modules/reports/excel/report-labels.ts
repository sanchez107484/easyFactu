import {
  PaymentStatus,
  ProductType,
  ReportComparison,
  ReportDateRange,
  ReportDimension,
  ReportParameters,
  ReportSortBy,
  ReportTimeGrouping,
} from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';

const PERIOD_LABELS: Record<ReportTimeGrouping, string> = {
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

/** Header for the secondary text of a dimension (NIF, reference...), if it has one. */
const SUBLABEL_HEADERS: Partial<Record<ReportDimension, string>> = {
  [ReportDimension.CUSTOMER]: 'NIF',
  [ReportDimension.PRODUCT]: 'Referencia',
  [ReportDimension.SUPPLIER]: 'NIF/CIF',
};

const SORT_LABELS: Record<ReportSortBy, string> = {
  [ReportSortBy.AMOUNT]: 'importe',
  [ReportSortBy.UNITS]: 'unidades',
  [ReportSortBy.COUNT]: 'número de documentos',
  [ReportSortBy.MARGIN]: 'margen',
};

const COMPARISON_LABELS: Record<ReportComparison, string> = {
  [ReportComparison.NONE]: 'Sin comparación',
  [ReportComparison.PREVIOUS_PERIOD]: 'Periodo anterior',
  [ReportComparison.PREVIOUS_YEAR]: 'Mismo periodo del año anterior',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Pendiente',
  [PaymentStatus.PARTIALLY_PAID]: 'Cobro parcial',
  [PaymentStatus.PAID]: 'Cobrada',
};

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.PRODUCT]: 'Productos',
  [ProductType.SERVICE]: 'Servicios',
};

export function dimensionLabel(dimension: ReportDimension, grouping: ReportTimeGrouping): string {
  return dimension === ReportDimension.PERIOD
    ? PERIOD_LABELS[grouping]
    : DIMENSION_LABELS[dimension];
}

export function sublabelHeader(dimension: ReportDimension | undefined): string | undefined {
  return dimension ? SUBLABEL_HEADERS[dimension] : undefined;
}

export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateRange({ fromDate, toDate }: ReportDateRange): string {
  return `${formatIsoDate(fromDate)} – ${formatIsoDate(toDate)}`;
}

/** Human-readable lines describing grouping, comparison and filters. */
export function describeParameters(
  { options, filters }: ReportParameters,
  comparisonPeriod?: ReportDateRange
): string[] {
  const lines: string[] = [];
  const { groupBy, breakdownBy, timeGrouping } = options;

  if (groupBy) {
    const breakdown = breakdownBy ? ` › ${dimensionLabel(breakdownBy, timeGrouping)}` : '';
    lines.push(`Agrupado por: ${dimensionLabel(groupBy, timeGrouping)}${breakdown}`);
    if (options.sortBy && options.sortBy !== ReportSortBy.AMOUNT) {
      lines.push(`Ordenado por: ${SORT_LABELS[options.sortBy]}`);
    }
  }
  if (comparisonPeriod) {
    lines.push(
      `Comparado con: ${COMPARISON_LABELS[options.comparison]} (${formatDateRange(comparisonPeriod)})`
    );
  }

  const filterParts = [
    filters.customers && `Clientes: ${filters.customers.map((c) => c.name).join(', ')}`,
    filters.products && `Artículos: ${filters.products.map((p) => p.name).join(', ')}`,
    filters.categories && `Categorías: ${filters.categories.map((c) => c.name).join(', ')}`,
    filters.suppliers && `Proveedores: ${filters.suppliers.map((s) => s.name).join(', ')}`,
    filters.seriesCodes && `Series: ${filters.seriesCodes.join(', ')}`,
    filters.paymentStatuses &&
      `Cobro: ${filters.paymentStatuses.map((s) => PAYMENT_STATUS_LABELS[s]).join(', ')}`,
    filters.productType && `Tipo: ${PRODUCT_TYPE_LABELS[filters.productType]}`,
    filters.paymentMethods &&
      `Forma de pago: ${filters.paymentMethods.map((m) => PAYMENT_METHOD_LABELS[m]).join(', ')}`,
    options.topN && `Mostrando los ${options.topN} primeros`,
  ].filter((part): part is string => Boolean(part));

  if (filterParts.length > 0) lines.push(`Filtros: ${filterParts.join(' · ')}`);
  return lines;
}
