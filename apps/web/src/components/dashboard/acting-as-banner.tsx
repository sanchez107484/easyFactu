'use client';

import { useAuthStore } from '@/store/auth-store';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Persistent banner shown when an agency user is operating inside a client
 * tenant context ("acting as"). Complements the sidebar "Volver" button by
 * keeping the context visible at the top of the main content area.
 *
 * Uses `returnToAgency` from `useAgencyContext` — the single canonical action
 * that handles JWT switch + cache invalidation + navigation atomically.
 */
export function ActingAsBanner() {
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const { isActingAsClient, returnToAgency, isReturning } = useAgencyContext();

  if (!isActingAsClient) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-customer-200 bg-customer-600 px-4 py-2.5 text-white dark:border-customer-700 dark:bg-customer-700">
      <div className="flex min-w-0 items-center gap-2.5">
        <Eye className="h-4 w-4 shrink-0 text-customer-200" />
        <span className="text-sm text-customer-100">Actuando en nombre de</span>
        <span className="truncate text-sm font-semibold">{currentTenant?.businessName}</span>
        <span className="hidden text-xs text-customer-300 sm:block">({currentTenant?.nif})</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => returnToAgency('/dashboard/asesoria/clientes')}
        disabled={isReturning}
        className="shrink-0 border border-customer-400/30 text-white hover:bg-customer-500 hover:text-white disabled:opacity-70"
      >
        {isReturning ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        )}
        Cambiar de cliente
      </Button>
    </div>
  );
}
