import {
  Coins,
  HandCoins,
  PiggyBank,
  LineChart,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ReportComparison,
  ReportDimension,
  ReportSortBy,
  ReportTimeGrouping,
  ReportType,
} from '@easyfactura/shared-types';
import { ReportFilterFields, ReportOptionFields } from './report-draft';
import { ReportPeriodPreset } from './report-periods';

export interface ReportPreset {
  id: string;
  question: string;
  /** What the user will see, in one short line. */
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
  type: ReportType;
  options: ReportOptionFields;
  filters: ReportFilterFields;
  /** Forces a period when the question implies one ("este año"). */
  period?: ReportPeriodPreset;
}

const MONTHLY: Pick<ReportOptionFields, 'timeGrouping'> = {
  timeGrouping: ReportTimeGrouping.MONTH,
};

/** One-click answers to the questions users actually ask. */
export const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'business-overview',
    question: '¿Cómo va mi negocio este año?',
    answer: 'Ingresos, gastos y resultado comparados con el año pasado',
    icon: TrendingUp,
    type: ReportType.SUMMARY,
    options: { ...MONTHLY, comparison: ReportComparison.PREVIOUS_YEAR },
    filters: {},
    period: 'current-year',
  },
  {
    id: 'sales-trend',
    question: '¿Cómo evolucionan mis ventas?',
    answer: 'Ventas mes a mes comparadas con el año anterior',
    icon: LineChart,
    type: ReportType.SALES,
    options: {
      ...MONTHLY,
      comparison: ReportComparison.PREVIOUS_YEAR,
      groupBy: ReportDimension.PERIOD,
    },
    filters: {},
  },
  {
    id: 'top-customers',
    question: '¿Quién me compra más?',
    answer: 'Todos tus clientes, de más a menos ventas, con margen y cobros',
    icon: Users,
    type: ReportType.SALES,
    options: {
      ...MONTHLY,
      comparison: ReportComparison.NONE,
      groupBy: ReportDimension.CUSTOMER,
    },
    filters: {},
  },
  {
    id: 'top-products',
    question: '¿Qué artículos vendo más?',
    answer: 'Todos tus artículos, del más al menos vendido, con unidades y precio medio',
    icon: Package,
    type: ReportType.SALES,
    options: {
      ...MONTHLY,
      comparison: ReportComparison.NONE,
      groupBy: ReportDimension.PRODUCT,
    },
    filters: {},
  },
  {
    id: 'pending-payments',
    question: '¿Quién me debe dinero?',
    answer: 'Facturas sin cobrar a día de hoy, por cliente y antigüedad',
    icon: Coins,
    type: ReportType.RECEIVABLES,
    options: { ...MONTHLY, comparison: ReportComparison.NONE },
    filters: {},
  },
  {
    id: 'collected',
    question: '¿Cuánto he cobrado?',
    answer: 'Lo cobrado mes a mes frente al año pasado, y frente a lo facturado',
    icon: HandCoins,
    type: ReportType.COLLECTIONS,
    options: {
      ...MONTHLY,
      comparison: ReportComparison.PREVIOUS_YEAR,
      groupBy: ReportDimension.PERIOD,
    },
    filters: {},
  },
  {
    id: 'profitable-customers',
    question: '¿Qué clientes me salen más rentables?',
    answer: 'Todos tus clientes, del más al menos rentable (ventas menos gastos imputados)',
    icon: PiggyBank,
    type: ReportType.SALES,
    options: {
      ...MONTHLY,
      comparison: ReportComparison.NONE,
      groupBy: ReportDimension.CUSTOMER,
      sortBy: ReportSortBy.MARGIN,
    },
    filters: {},
  },
  {
    id: 'top-expenses',
    question: '¿En qué gasto más?',
    answer: 'Tus gastos por categoría, de mayor a menor',
    icon: Receipt,
    type: ReportType.EXPENSES,
    options: { ...MONTHLY, comparison: ReportComparison.NONE, groupBy: ReportDimension.CATEGORY },
    filters: {},
  },
];
