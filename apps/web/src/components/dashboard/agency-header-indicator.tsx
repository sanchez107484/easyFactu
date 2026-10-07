'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useMyAgencies, useMyAgencyRequests } from '@/hooks/use-agency';
import { AgencyConnectionModal } from './agency-connection-modal';
import { Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountType } from '@easyfactura/shared-types';

interface AgencyHeaderIndicatorProps {
  className?: string;
}

export function AgencyHeaderIndicator({ className }: AgencyHeaderIndicatorProps) {
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const [showModal, setShowModal] = useState(false);

  const { data: myAgencies = [], isLoading: loadingMyAgencies } = useMyAgencies();
  const hasAgenciesLinked = myAgencies.length > 0;

  const showIndicator = !isAgency && !hasAgenciesLinked && !loadingMyAgencies;

  const { data: pendingData } = useMyAgencyRequests(
    { status: 'PENDING', limit: 1 },
    showIndicator,
  );

  const pendingCount = pendingData?.meta?.total ?? 0;
  const pendingRequest = pendingData?.data?.[0] ?? null;

  if (!showIndicator) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          'flex items-center gap-1.5 rounded-full bg-agency-100 dark:bg-agency-950/50 px-2.5 py-1 text-xs font-medium text-agency-700 dark:text-agency-300 hover:bg-agency-200 dark:hover:bg-agency-900 transition-colors',
          pendingCount > 0 && 'pr-1.5',
          className
        )}
      >
        <span className="relative flex items-center">
          <Building2 className="h-3.5 w-3.5 text-agency-600" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </span>
        <span className="hidden sm:inline">
          {pendingRequest ? `Solicitud a ${pendingRequest.agencyName.split(' ')[0]}` : 'Sin asesoría'}
        </span>
        <span className="sm:hidden">Asesor</span>
        <Info className="h-3 w-3 text-agency-500 opacity-70" />
      </button>

      <AgencyConnectionModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
