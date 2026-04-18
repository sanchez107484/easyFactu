'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { AgencyClientWithDetails, FiscalAlertSummaryItem } from '@easyfactura/shared-types';

interface ClientsNeedingAttentionProps {
  clients: AgencyClientWithDetails[];
  alertsMap: Map<string, FiscalAlertSummaryItem>;
  onSwitchToClient: (id: string) => Promise<void>;
}

export function ClientsNeedingAttention({
  clients,
  alertsMap,
  onSwitchToClient,
}: ClientsNeedingAttentionProps) {
  const urgent = clients.filter((c) => {
    const alert = alertsMap.get(c.clientTenantId);
    return (alert?.errorCount ?? 0) > 0 || (alert?.warningCount ?? 0) > 0;
  });

  if (urgent.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Requieren atención ({urgent.length})
      </h2>
      <div className="overflow-hidden rounded-xl border divide-y">
        {urgent.map((relation) => {
          const name = relation.clientTenant?.businessName ?? '';
          const alert = alertsMap.get(relation.clientTenantId);
          const hasErrors = (alert?.errorCount ?? 0) > 0;

          return (
            <button
              key={relation.id}
              type="button"
              onClick={() => onSwitchToClient(relation.clientTenantId)}
              className="group flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  hasErrors ? 'bg-destructive/10' : 'bg-amber-100 dark:bg-amber-950/40',
                )}
              >
                {hasErrors ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {(alert?.errorCount ?? 0) > 0 &&
                    `${alert!.errorCount} error${alert!.errorCount > 1 ? 'es' : ''}`}
                  {(alert?.errorCount ?? 0) > 0 && (alert?.warningCount ?? 0) > 0 && ' · '}
                  {(alert?.warningCount ?? 0) > 0 &&
                    `${alert!.warningCount} aviso${alert!.warningCount > 1 ? 's' : ''}`}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
