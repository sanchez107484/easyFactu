'use client';

import { cn, formatCurrency } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  Settings,
  ShieldOff,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExportContaPlus } from '@/hooks/use-agency';
import type { AgencyClientWithDetails, FiscalAlertSummaryItem } from '@easyfactura/shared-types';

interface ClientCardProps {
  relation: AgencyClientWithDetails;
  fiscalAlert: FiscalAlertSummaryItem | undefined;
  onSwitchToClient: (id: string) => Promise<void>;
}

type CertStatus = 'expired' | 'warning' | 'ok';

function getCertificateStatus(expiry: string | null | undefined): CertStatus {
  if (!expiry) return 'ok';
  const daysUntil = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 0) return 'expired';
  if (daysUntil <= 30) return 'warning';
  return 'ok';
}

function getLastActivityLabel(lastActivity: string | null | undefined): string {
  if (!lastActivity) return '';
  const diffDays = Math.floor(
    (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 30) return `hace ${diffDays} días`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  return new Date(lastActivity).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

function ExportDropdown({ clientTenantId }: { clientTenantId: string }) {
  const { mutate: exportContaPlus, isPending } = useExportContaPlus();
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const year = now.getFullYear();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Exportar datos del cliente"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => exportContaPlus({ clientTenantId, params: { year, quarter } })}
          >
            Exportar T{quarter} {year}
          </DropdownMenuItem>
          {quarter > 1 && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() =>
                exportContaPlus({ clientTenantId, params: { year, quarter: quarter - 1 } })
              }
            >
              Exportar T{quarter - 1} {year}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => exportContaPlus({ clientTenantId, params: { year } })}
          >
            Exportar año {year} completo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ClientCard({ relation, fiscalAlert, onSwitchToClient }: ClientCardProps) {
  const name = relation.clientTenant?.businessName ?? '';
  const nif = relation.clientTenant?.nif ?? '';
  const city = relation.clientTenant?.city;
  const setupCompleted = relation.clientTenant?.setupCompleted;
  const certStatus = getCertificateStatus(relation.clientTenant?.certificateExpiry);
  const pending = relation.stats?.pendingInvoices ?? 0;
  const monthlyRevenue = relation.stats?.monthlyRevenue ?? 0;
  const lastActivityLabel = getLastActivityLabel(relation.stats?.lastActivity);
  const hasErrors = (fiscalAlert?.errorCount ?? 0) > 0;
  const hasWarning =
    (fiscalAlert?.warningCount ?? 0) > 0 || pending > 0 || certStatus !== 'ok' || !setupCompleted;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card transition-all hover:shadow-md',
        hasErrors
          ? 'border-destructive/40 hover:border-destructive/60'
          : hasWarning
            ? 'border-amber-200 hover:border-amber-300 dark:border-amber-800/50 dark:hover:border-amber-700'
            : 'hover:border-indigo-300 dark:hover:border-indigo-700',
      )}
    >
      {/* Export trigger — top-right corner, outside the clickable button */}
      <div className="absolute right-3 top-3 z-10">
        <ExportDropdown clientTenantId={relation.clientTenantId} />
      </div>

      {/* Main clickable area */}
      <button
        type="button"
        className="flex flex-col gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        onClick={() => onSwitchToClient(relation.clientTenantId)}
      >
        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{name}</p>
            <p className="text-xs text-muted-foreground">{nif}</p>
          </div>
        </div>

        {/* Status badges */}
        {(!setupCompleted ||
          certStatus !== 'ok' ||
          pending > 0 ||
          hasErrors ||
          (fiscalAlert?.warningCount ?? 0) > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {!setupCompleted && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Settings className="h-3 w-3" />
                Sin configurar
              </span>
            )}
            {certStatus === 'expired' && (
              <span className="flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <ShieldOff className="h-3 w-3" />
                Cert. caducado
              </span>
            )}
            {certStatus === 'warning' && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <ShieldOff className="h-3 w-3" />
                Cert. caduca pronto
              </span>
            )}
            {pending > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                {pending} pendiente{pending > 1 ? 's' : ''}
              </span>
            )}
            {hasErrors && (
              <span className="flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                {fiscalAlert!.errorCount} error{fiscalAlert!.errorCount > 1 ? 'es' : ''}
              </span>
            )}
            {(fiscalAlert?.warningCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {fiscalAlert!.warningCount} aviso{fiscalAlert!.warningCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Footer: city, last activity, monthly revenue, arrow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {city}
              </span>
            )}
            {lastActivityLabel && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {lastActivityLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {monthlyRevenue > 0 && (
              <span className="text-xs font-semibold">{formatCurrency(monthlyRevenue)}</span>
            )}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </div>
        </div>
      </button>
    </div>
  );
}
