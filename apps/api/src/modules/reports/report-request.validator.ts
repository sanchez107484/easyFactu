import { BadRequestException } from '@nestjs/common';
import {
  ReportComparison,
  ReportDimension,
  ReportOptions,
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
  | 'supplierIds';

const ALLOWED_DIMENSIONS: Record<ReportType, ReportDimension[]> = {
  [ReportType.SUMMARY]: [],
  [ReportType.SALES]: [ReportDimension.CUSTOMER, ReportDimension.PRODUCT, ReportDimension.PERIOD],
  [ReportType.EXPENSES]: [
    ReportDimension.CATEGORY,
    ReportDimension.SUPPLIER,
    ReportDimension.PERIOD,
  ],
};

const ALLOWED_FILTERS: Record<ReportType, FilterKey[]> = {
  [ReportType.SUMMARY]: [],
  [ReportType.SALES]: [
    'customerIds',
    'productIds',
    'seriesCodes',
    'paymentStatuses',
    'productType',
  ],
  [ReportType.EXPENSES]: ['categoryIds', 'supplierIds'],
};

const ALL_FILTERS: FilterKey[] = [
  'customerIds',
  'productIds',
  'seriesCodes',
  'paymentStatuses',
  'productType',
  'categoryIds',
  'supplierIds',
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
  const allowed = ALLOWED_DIMENSIONS[dto.type];
  const options: ReportOptions = {
    timeGrouping: dto.timeGrouping ?? ReportTimeGrouping.MONTH,
    comparison: dto.comparison ?? ReportComparison.NONE,
  };

  if (allowed.length === 0) {
    if (dto.groupBy || dto.breakdownBy || dto.topN) {
      throw new BadRequestException('Este informe no admite agrupaciones');
    }
    return options;
  }

  if (!dto.groupBy) throw new BadRequestException('Indica cómo agrupar el informe');
  assertDimensionAllowed(dto.groupBy, allowed);
  if (dto.breakdownBy) {
    assertDimensionAllowed(dto.breakdownBy, allowed);
    if (dto.breakdownBy === dto.groupBy) {
      throw new BadRequestException('El desglose debe ser distinto de la agrupación');
    }
  }

  return {
    ...options,
    groupBy: dto.groupBy,
    breakdownBy: dto.breakdownBy,
    // Periods are chronological, a "top N months" makes no sense.
    topN: dto.groupBy === ReportDimension.PERIOD ? undefined : dto.topN,
  };
}

function assertDimensionAllowed(dimension: ReportDimension, allowed: ReportDimension[]): void {
  if (!allowed.includes(dimension)) {
    throw new BadRequestException('Agrupación no disponible para este tipo de informe');
  }
}

export function assertFiltersAllowed(dto: ReportRequestDto): void {
  const allowed = ALLOWED_FILTERS[dto.type];
  const invalid = ALL_FILTERS.filter((key) => hasValue(dto[key]) && !allowed.includes(key));
  if (invalid.length > 0) {
    throw new BadRequestException('Hay filtros que no aplican a este tipo de informe');
  }
}

function hasValue(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : value !== undefined;
}
