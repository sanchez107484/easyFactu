import { Prisma } from '@prisma/client';
import {
  ReportAppliedFilters,
  ReportComparison,
  ReportNamedRef,
  ReportParameters,
  ReportTimeGrouping,
} from '@easyfactura/shared-types';

const DEFAULT_OPTIONS: ReportParameters['options'] = {
  timeGrouping: ReportTimeGrouping.MONTH,
  comparison: ReportComparison.NONE,
};

type JsonObject = Prisma.JsonObject;

function isJsonObject(value: Prisma.JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNamedRef(value: Prisma.JsonValue | undefined): value is JsonObject & ReportNamedRef {
  return isJsonObject(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

/** First-version rows stored single refs (`customer`) instead of lists (`customers`). */
function legacyRefList(value: Prisma.JsonValue | undefined): ReportNamedRef[] | undefined {
  return isNamedRef(value) ? [{ id: value.id, name: value.name }] : undefined;
}

function toLegacyFilters(legacy: JsonObject): ReportAppliedFilters {
  return {
    customers: legacyRefList(legacy.customer),
    products: legacyRefList(legacy.product),
    categories: legacyRefList(legacy.category),
    suppliers: legacyRefList(legacy.supplier),
  };
}

/**
 * Reads the `parameters` JSON of a history row. Rows generated before grouped
 * reports existed only stored filters (old `filters` column, no `options`), so
 * they are upgraded to the current shape instead of breaking the history table.
 */
export function parseHistoryParameters(json: Prisma.JsonValue): ReportParameters {
  if (!isJsonObject(json)) return { options: DEFAULT_OPTIONS, filters: {} };

  if (isJsonObject(json.options) && isJsonObject(json.filters)) {
    // Written by ReportsHistoryService.record() with a ReportParameters object.
    return json as unknown as ReportParameters;
  }

  return { options: DEFAULT_OPTIONS, filters: toLegacyFilters(json) };
}
