/**
 * Invoice status constants
 */

export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  SENT: "SENT",
  PAID: "PAID",
  RECTIFIED: "RECTIFIED",
} as const;

export const INVOICE_STATUS_LABELS: Record<
  keyof typeof INVOICE_STATUS,
  string
> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  SENT: "Enviada",
  PAID: "Pagada",
  RECTIFIED: "Rectificada",
};

export const INVOICE_STATUS_COLORS: Record<
  keyof typeof INVOICE_STATUS,
  string
> = {
  DRAFT: "gray",
  CONFIRMED: "blue",
  SENT: "yellow",
  PAID: "green",
  RECTIFIED: "red",
};
