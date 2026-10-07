'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useMyAgencies } from '@/hooks/use-agency';
import { AgencyConnectionModal } from './agency-connection-modal';
import { Building2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccountType } from '@easyfactura/shared-types';

interface AgencyInfoBannerProps {
  className?: string;
}

const DISMISSED_KEY = 'agency-banner-dismissed';
const DISMISSED_DAYS = 7;

function isRecentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSinceDismissed < DISMISSED_DAYS;
}

function setDismissed() {
  localStorage.setItem(DISMISSED_KEY, Date.now().toString());
}

export function AgencyInfoBanner({ className }: AgencyInfoBannerProps) {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissedState] = useState(() => isRecentlyDismissed());

  const { data: myAgencies = [], isLoading: loadingMyAgencies } = useMyAgencies();
  const hasAgenciesLinked = myAgencies.length > 0;

  const handleDismiss = () => {
    setDismissed();
    setDismissedState(true);
  };

  const showBanner =
    !isAgency && !hasAgenciesLinked && !loadingMyAgencies && !dismissed;

  if (!showBanner) return null;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-agency-200 bg-agency-50/70 dark:border-agency-800/50 dark:bg-agency-950/30 px-4 py-2.5 text-sm',
          className,
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agency-100 text-agency-600 dark:bg-agency-950">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="text-agency-900 dark:text-agency-200 flex-1">
          Tu asesor puede ver tus facturas automáticamente
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1 text-agency-600 hover:text-agency-700 hover:bg-agency-100 dark:text-agency-400 dark:hover:bg-agency-900/50 shrink-0"
          onClick={() => setShowModal(true)}
        >
          <Info className="h-3.5 w-3.5" />
          Más info
        </Button>
        <Button
          size="sm"
          className="h-7 bg-agency-600 hover:bg-agency-700 text-white shrink-0"
          onClick={() => router.push('/dashboard/ajustes/asesorias')}
        >
          Añadir asesor
        </Button>
        <button
          onClick={handleDismiss}
          className="ml-1 shrink-0 rounded-md p-1 text-agency-400 hover:text-agency-600 hover:bg-agency-100 dark:hover:text-agency-300 dark:hover:bg-agency-900/50 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <AgencyConnectionModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
