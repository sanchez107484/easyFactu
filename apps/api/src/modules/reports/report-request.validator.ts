import { BadRequestException } from '@nestjs/common';
import {
  ReportComparison,
  ReportDimension,
  ReportOptions,
  ReportSortBy,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';
import { REPORT_MAX_PERIOD_MONTHS } from '@easyfactura/shared-constants';
import { ReportRequestDto } from './dto/report-request.dto';
import { ReportPeriod } from './report-period.helpers';

type FilterKey =
  | 'customerIds'
  | 'productIds'
  | 'seriesCodes'
  | 'paymentStatuses'
  | 'productType'
  | 'categoryIds'
  | 'supplierIds'
  | 'paymentMethods';

interface ReportTypeRules {
  dimensions: ReportDimension[];
  filters: FilterKey[];
  sortBy: ReportSortBy[];
  supportsComparison: boolean;
}

const RULES: Record<ReportType, ReportTypeRules> = {
  [ReportType.SUMMARY]: { dimensions: [], filters: [], sortBy: [], supportsComparison: true },
  [ReportType.SALES]: {
    dimensions: [ReportDimension.CUSTOMER, ReportDimension.PRODUCT, ReportDimension.PERIOD],
    filters: ['customerIds', 'productIds', 'seriesCodes', 'paymentStatuses', 'productType'],
    sortBy: [ReportSortBy.AMOUNT, ReportSortBy.UNITS, ReportSortBy.COUNT, ReportSortBy.MARGIN],
    supportsComparison: true,
  },
  [ReportType.EXPENSES]: {
    dimensions: [ReportDimension.CATEGORY, ReportDimension.SUPPLIER, ReportDimension.PERIOD],
    filters: ['categoryIds', 'supplierIds'],
    sortBy: [ReportSortBy.AMOUNT, ReportSortBy.COUNT],
    supportsComparison: true,
  },
  [ReportType.COLLECTIONS]: {
    dimensions: [ReportDimension.CUSTOMER, ReportDimension.PAYMENT_METHOD, ReportDimension.PERIOD],
    filters: ['customerIds', 'seriesCodes', 'paymentMethods'],
    sortBy: [ReportSortBy.AMOUNT, ReportSortBy.COUNT],
    supportsComparison: true,
  },
  // A balance at a date: no grouping options and nothing to compare against.
  [ReportType.RECEIVABLES]: {
    dimensions: [],
    filters: ['customerIds', 'seriesCodes'],
    sortBy: [],
    supportsComparison: false,
  },
};

const ALL_FILTERS: FilterKey[] = [
  'customerIds',
  'productIds',
  'seriesCodes',
  'paymentStatuses',
  'productType',
  'categoryIds',
  'supplierIds',
  'paymentMethods',
];

export function parseReportPeriod(fromDate: string, toDate: string): ReportPeriod {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (from > to) {
    throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  const maxTo = new Date(from);
  maxTo.setUTCMonth(maxTo.getUTCMonth() + REPORT_MAX_PERIOD_MONTHS);
  if (to >= maxTo) {
    throw new BadRequestException(`El periodo no puede superar ${REPORT_MAX_PERIOD_MONTHS} meses`);
  }

  return { from, to };
}

/** Validates grouping options for the report type and applies defaults. */
export function normalizeReportOptions(dto: ReportRequestDto): ReportOptions {
  const rules = RULES[dto.type];
  const options: ReportOptions = {
    timeGrouping: dto.timeGrouping ?? ReportTimeGrouping.MONTH,
    comparison: rules.supportsComparison
      ? (dto.comparison ?? ReportComparison.NONE)
      : ReportComparison.NONE,
  };

  if (rules.dimensions.length === 0) {
    if (dto.groupBy || dto.breakdownBy || dto.topN || dto.sortBy) {
      throw new BadRequestException('Este informe no admite agrupaciones');
    }
    return options;
  }

  if (!dto.groupBy) throw new BadRequestException('Indica cómo agrupar el informe');
  assertAllowed(
    dto.groupBy,
    rules.dimensions,
    'Agrupación no disponible para este tipo de informe'
  );
  if (dto.breakdownBy) {
    assertAllowed(
      dto.breakdownBy,
      rules.dimensions,
      'Agrupación no disponible para este tipo de informe'
    );
    if (dto.breakdownBy === dto.groupBy) {
      throw new BadRequestException('El desglose debe ser distinto de la agrupación');
    }
  }
  if (dto.sortBy) assertAllowed(dto.sortBy, rules.sortBy, 'Orden no disponible para este informe');

  // Periods are chronological: neither "top N months" nor re-sorting makes sense.
  const isByPeriod = dto.groupBy === ReportDimension.PERIOD;
  return {
    ...options,
    groupBy: dto.groupBy,
    breakdownBy: dto.breakdownBy,
    topN: isByPeriod ? undefined : dto.topN,
    sortBy: isByPeriod ? undefined : dto.sortBy,
  };
}

function assertAllowed<T>(value: T, allowed: T[], message: string): void {
  if (!allowed.includes(value)) throw new BadRequestException(message);
}

export function assertFiltersAllowed(dto: ReportRequestDto): void {
  const allowed = RULES[dto.type].filters;
  const invalid = ALL_FILTERS.filter((key) => hasValue(dto[key]) && !allowed.includes(key));
  if (invalid.length > 0) {
    throw new BadRequestException('Hay filtros que no aplican a este tipo de informe');
  }
}

function hasValue(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : value !== undefined;
}
