'use client';

import { Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { QuarterlyIvaSummary } from '@easyfactura/shared-types';

interface QuarterlyIvaWidgetProps {
  data: QuarterlyIvaSummary | undefined;
  isLoading: boolean;
}

export function QuarterlyIvaWidget({ data, isLoading }: QuarterlyIvaWidgetProps) {
  const quarterLabel = data ? `T${data.quarter} ${data.year}` : '';

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Resumen IVA cartera</h3>
        </div>
        {quarterLabel && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {quarterLabel}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">IVA repercutido</p>
            <p className="text-xl font-bold">{formatCurrency(data?.totalIva ?? 0)}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Base imponible</p>
              <p className="text-sm font-semibold">{formatCurrency(data?.totalRevenue ?? 0)}</p>
            </div>
            {(data?.totalIrpf ?? 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">IRPF retenido</p>
                <p className="text-sm font-semibold text-destructive">
                  −{formatCurrency(data?.totalIrpf ?? 0)}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {data?.invoicesCount ?? 0} factura{(data?.invoicesCount ?? 0) !== 1 ? 's' : ''} ·{' '}
            {data?.clientsWithData ?? 0} cliente{(data?.clientsWithData ?? 0) !== 1 ? 's' : ''} con
            datos
          </p>
        </div>
      )}
    </div>
  );
}
