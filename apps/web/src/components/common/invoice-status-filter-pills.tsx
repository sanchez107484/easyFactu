import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvoiceStatus, PaymentStatus } from '@easyfactura/shared-types';
import { INVOICE_STATUS_CONFIG } from './invoice-status-badge';
import { PAYMENT_STATUS_CONFIG } from './payment-status-badge';

export const INVOICE_STATUS_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: InvoiceStatus.DRAFT, label: 'Borradores' },
  { value: InvoiceStatus.PROFORMA, label: 'Proformas' },
  { value: InvoiceStatus.CONFIRMED, label: 'Confirmadas' },
  { value: InvoiceStatus.SENT, label: 'Enviadas' },
  { value: InvoiceStatus.PAID, label: 'Pagadas' },
  { value: InvoiceStatus.RECTIFIED, label: 'Rectificadas' },
];

interface InvoiceStatusFilterPillsProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Pill-style filter buttons for invoice status.
 * Includes a "Limpiar" button when a filter is active.
 *
 * Usage:
 *   <InvoiceStatusFilterPills value={statusFilter} onChange={setStatusFilter} />
 */
export function InvoiceStatusFilterPills({ value, onChange }: InvoiceStatusFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {INVOICE_STATUS_FILTERS.map((f) => {
        const active = value === f.value;
        const cfg = f.value !== 'ALL' ? INVOICE_STATUS_CONFIG[f.value as InvoiceStatus] : null;

        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
            )}
          >
            {cfg && (
              <span
                className={cn(
                  'mr-1.5 h-1.5 w-1.5 rounded-full',
                  active ? 'bg-primary-foreground' : cfg.dot,
                )}
              />
            )}
            {f.label}
          </button>
        );
      })}

      {value !== 'ALL' && (
        <button
          onClick={() => onChange('ALL')}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      )}
    </div>
  );
}

// ==================== PAYMENT STATUS FILTER ====================

export const PAYMENT_STATUS_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: PaymentStatus.UNPAID, label: 'Pendiente de cobro' },
  { value: PaymentStatus.PARTIALLY_PAID, label: 'Cobro parcial' },
  { value: PaymentStatus.PAID, label: 'Cobrada' },
];

interface PaymentStatusFilterPillsProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentStatusFilterPills({ value, onChange }: PaymentStatusFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAYMENT_STATUS_FILTERS.map((f) => {
        const active = value === f.value;
        const cfg = f.value !== 'ALL' ? PAYMENT_STATUS_CONFIG[f.value as PaymentStatus] : null;

        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
            )}
          >
            {cfg && (
              <span
                className={cn(
                  'mr-1.5 h-1.5 w-1.5 rounded-full',
                  active ? 'bg-primary-foreground' : cfg.dot,
                )}
              />
            )}
            {f.label}
          </button>
        );
      })}

      {value !== 'ALL' && (
        <button
          onClick={() => onChange('ALL')}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      )}
    </div>
  );
}
