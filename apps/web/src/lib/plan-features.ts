/**
 * Single source of truth for what each plan includes.
 *
 * Used by the in-app plan selector (Ajustes → Plan) and by every marketing
 * page, so the public site can never promise something the app does not give.
 * Plans differ by features, not by invoice volume: both have unlimited invoices.
 */
export const PLAN_NAMES = {
  basic: 'Básico',
  pro: 'PRO',
} as const;

export const PLAN_DESCRIPTIONS = {
  basic: 'Para empezar a facturar sin complicaciones.',
  pro: 'Todo lo del Básico más gastos, proveedores, rentabilidad e informes.',
} as const;

export const BASIC_PLAN_FEATURES = [
  'VeriFactu',
  'Facturas ilimitadas',
  'Clientes y productos ilimitados',
  'Presupuestos y proformas',
  'Rectificativas y abonos',
  'Facturación recurrente',
  'Plantillas personalizadas',
  'Tu asesor tiene tus facturas siempre al día',
] as const;

export const PRO_ONLY_FEATURES = [
  'Gestión avanzada de gastos',
  'Análisis de rentabilidad',
  'Lectura inteligente de gastos (pronto)',
  'Gestión de proveedores',
  'Automatizaciones con IA (pronto)',
  'Informes profesionales en segundos',
  'Soporte prioritario',
] as const;

export const ALL_PLAN_FEATURES = [...BASIC_PLAN_FEATURES, ...PRO_ONLY_FEATURES] as const;

/** Features already available today (excludes the ones marked "(pronto)"). */
export const PRO_ONLY_AVAILABLE_FEATURES = PRO_ONLY_FEATURES.filter(
  (feature) => !feature.endsWith('(pronto)'),
);
