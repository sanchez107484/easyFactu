'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, Mail } from 'lucide-react';
import type { AgencyStats } from '@easyfactura/shared-types';

interface AgencyKpiStripProps {
  stats: AgencyStats | undefined;
  isLoading: boolean;
}

export function AgencyKpiStrip({ stats, isLoading }: AgencyKpiStripProps) {
  const needsAttention = stats?.clientsNeedingAttention ?? 0;
  const pendingInvitations = stats?.pendingInvitations ?? 0;

  const items = [
    {
      label: 'Clientes totales',
      value: stats?.totalClients ?? 0,
      icon: Users,
      color: 'text-customer-600 dark:text-customer-400',
      bg: 'bg-customer-100 dark:bg-customer-950',
    },
    {
      label: 'Clientes activos',
      value: stats?.activeClients ?? 0,
      icon: UserCheck,
      color: 'text-product-600 dark:text-product-400',
      bg: 'bg-product-100 dark:bg-product-950',
    },
    {
      label: 'Necesitan atención',
      value: needsAttention,
      icon: AlertTriangle,
      color:
        needsAttention > 0 ? 'text-proforma-600 dark:text-proforma-400' : 'text-muted-foreground',
      bg: needsAttention > 0 ? 'bg-proforma-100 dark:bg-proforma-950' : 'bg-muted',
    },
    {
      label: 'Invitaciones pendientes',
      value: pendingInvitations,
      icon: Mail,
      color:
        pendingInvitations > 0 ? 'text-agency-600 dark:text-agency-400' : 'text-muted-foreground',
      bg: pendingInvitations > 0 ? 'bg-agency-100 dark:bg-agency-950' : 'bg-muted',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', bg)}>
            <Icon className={cn('h-4 w-4', color)} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
