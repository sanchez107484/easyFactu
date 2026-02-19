/**
 * Unit of Measurement Constants
 * Unidades de medida para productos y servicios
 */

export enum UnitOfMeasure {
  UNIT = 'UNIT',
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  KG = 'KG',
  GRAM = 'GRAM',
  TON = 'TON',
  LITER = 'LITER',
  METER = 'METER',
  M2 = 'M2',
  M3 = 'M3',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export interface UnitInfo {
  code: UnitOfMeasure;
  label: string;
  singular: string;
  plural: string;
  abbreviation: string;
  category: 'quantity' | 'time' | 'weight' | 'volume' | 'distance' | 'area' | 'service';
}

export const UNITS: Record<UnitOfMeasure, UnitInfo> = {
  [UnitOfMeasure.UNIT]: {
    code: UnitOfMeasure.UNIT,
    label: 'Unidad',
    singular: 'unidad',
    plural: 'unidades',
    abbreviation: 'ud.',
    category: 'quantity',
  },
  [UnitOfMeasure.HOUR]: {
    code: UnitOfMeasure.HOUR,
    label: 'Hora',
    singular: 'hora',
    plural: 'horas',
    abbreviation: 'h',
    category: 'time',
  },
  [UnitOfMeasure.DAY]: {
    code: UnitOfMeasure.DAY,
    label: 'Día',
    singular: 'día',
    plural: 'días',
    abbreviation: 'd',
    category: 'time',
  },
  [UnitOfMeasure.WEEK]: {
    code: UnitOfMeasure.WEEK,
    label: 'Semana',
    singular: 'semana',
    plural: 'semanas',
    abbreviation: 'sem.',
    category: 'time',
  },
  [UnitOfMeasure.MONTH]: {
    code: UnitOfMeasure.MONTH,
    label: 'Mes',
    singular: 'mes',
    plural: 'meses',
    abbreviation: 'mes',
    category: 'time',
  },
  [UnitOfMeasure.KG]: {
    code: UnitOfMeasure.KG,
    label: 'Kilogramo',
    singular: 'kilogramo',
    plural: 'kilogramos',
    abbreviation: 'kg',
    category: 'weight',
  },
  [UnitOfMeasure.GRAM]: {
    code: UnitOfMeasure.GRAM,
    label: 'Gramo',
    singular: 'gramo',
    plural: 'gramos',
    abbreviation: 'g',
    category: 'weight',
  },
  [UnitOfMeasure.TON]: {
    code: UnitOfMeasure.TON,
    label: 'Tonelada',
    singular: 'tonelada',
    plural: 'toneladas',
    abbreviation: 't',
    category: 'weight',
  },
  [UnitOfMeasure.LITER]: {
    code: UnitOfMeasure.LITER,
    label: 'Litro',
    singular: 'litro',
    plural: 'litros',
    abbreviation: 'l',
    category: 'volume',
  },
  [UnitOfMeasure.METER]: {
    code: UnitOfMeasure.METER,
    label: 'Metro',
    singular: 'metro',
    plural: 'metros',
    abbreviation: 'm',
    category: 'distance',
  },
  [UnitOfMeasure.M2]: {
    code: UnitOfMeasure.M2,
    label: 'Metro cuadrado',
    singular: 'metro cuadrado',
    plural: 'metros cuadrados',
    abbreviation: 'm²',
    category: 'area',
  },
  [UnitOfMeasure.M3]: {
    code: UnitOfMeasure.M3,
    label: 'Metro cúbico',
    singular: 'metro cúbico',
    plural: 'metros cúbicos',
    abbreviation: 'm³',
    category: 'area',
  },
  [UnitOfMeasure.SERVICE]: {
    code: UnitOfMeasure.SERVICE,
    label: 'Servicio',
    singular: 'servicio',
    plural: 'servicios',
    abbreviation: 'serv.',
    category: 'service',
  },
  [UnitOfMeasure.OTHER]: {
    code: UnitOfMeasure.OTHER,
    label: 'Otro',
    singular: 'otro',
    plural: 'otros',
    abbreviation: '-',
    category: 'quantity',
  },
};

/**
 * Get unit info by code
 */
export function getUnitInfo(code: UnitOfMeasure): UnitInfo {
  return UNITS[code];
}

/**
 * Get all units by category
 */
export function getUnitsByCategory(category: UnitInfo['category']): UnitInfo[] {
  return Object.values(UNITS).filter((unit) => unit.category === category);
}

/**
 * Get unit label
 */
export function getUnitLabel(code: UnitOfMeasure, quantity?: number): string {
  const unit = UNITS[code];
  if (!unit) return '';

  if (quantity === undefined) {
    return unit.label;
  }

  return quantity === 1 ? unit.singular : unit.plural;
}

/**
 * Get all units as array
 */
export function getAllUnits(): UnitInfo[] {
  return Object.values(UNITS);
}
