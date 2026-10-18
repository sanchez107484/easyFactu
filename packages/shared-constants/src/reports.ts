import { ReceivableAgingBucket } from '@easyfactura/shared-types';

/** Allowed "Top N" values for grouped reports. */
export const REPORT_TOP_N_OPTIONS = [5, 10, 20, 50] as const;

/** Maximum span of a single report, in months. */
export const REPORT_MAX_PERIOD_MONTHS = 24;

export const AGING_BUCKET_LABELS: Record<ReceivableAgingBucket, string> = {
  [ReceivableAgingBucket.NOT_DUE]: 'Sin vencer',
  [ReceivableAgingBucket.DAYS_1_30]: '1-30 días',
  [ReceivableAgingBucket.DAYS_31_60]: '31-60 días',
  [ReceivableAgingBucket.DAYS_61_90]: '61-90 días',
  [ReceivableAgingBucket.OVER_90]: 'Más de 90 días',
};
