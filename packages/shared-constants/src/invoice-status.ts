import { InvoiceStatus } from '@easyfactura/shared-types';

// Re-export so consumers can get the enum from shared-constants directly.
export { InvoiceStatus };

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Borrador',
  [InvoiceStatus.PROFORMA]: 'Proforma',
  [InvoiceStatus.CONFIRMED]: 'Confirmada',
  [InvoiceStatus.SENT]: 'Enviada',
  [InvoiceStatus.PAID]: 'Pagada',
  [InvoiceStatus.RECTIFIED]: 'Rectificada',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'gray',
  [InvoiceStatus.PROFORMA]: 'orange',
  [InvoiceStatus.CONFIRMED]: 'blue',
  [InvoiceStatus.SENT]: 'yellow',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.RECTIFIED]: 'red',
};
