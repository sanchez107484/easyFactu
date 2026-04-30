'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSwitchTenant } from '@/hooks/use-switch-tenant';
import { AccountType } from '@easyfactura/shared-types';
import { toast } from 'sonner';
import type { Tenant } from '@easyfactura/shared-types';

/**
 * Single source of truth for the agency/acting-as context.
 *
 * Rules:
 * - `isAgencyUser`      → user owns at least one AGENCY tenant
 * - `isOnAgencyTenant`  → currently viewing the agency's own data
 * - `isActingAsClient`  → currently viewing a managed client's data
 *
 * Also exposes `returnToAgency` — the canonical way to switch back to the
 * agency panel from any component. Using this instead of calling switchTenant
 * directly ensures cache invalidation and navigation are always paired.
 */
export interface AgencyContext {
  /** The AGENCY tenant owned by this user (null if not an agency user) */
  agencyTenant: Tenant | null;
  /** True when the logged-in user owns an AGENCY tenant */
  isAgencyUser: boolean;
  /** True when currentTenant IS the agency's own tenant */
  isOnAgencyTenant: boolean;
  /** True when currentTenant is a managed CLIENT tenant (acting as) */
  isActingAsClient: boolean;
  /**
   * Switch back to the agency tenant and navigate.
   * @param redirectTo — destination after switch (default: '/dashboard/asesoria')
   */
  returnToAgency: (redirectTo?: string) => Promise<void>;
  /** True while the return-to-agency transition is in progress */
  isReturning: boolean;
}

export function useAgencyContext(): AgencyContext {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const tenants = useAuthStore((state) => state.tenants);
  const { switchTenant } = useSwitchTenant();

  // Ref-based guard: keeps useCallback stable without putting isReturning in deps
  const isReturningRef = useRef(false);
  const [isReturning, setIsReturning] = useState(false);

  const { agencyTenant, isAgencyUser, isOnAgencyTenant, isActingAsClient } = useMemo(() => {
    const agencyEntry = tenants.find(
      (t) => t.tenant.accountType === AccountType.AGENCY && t.isOwner,
    );

    const agencyTenant = agencyEntry?.tenant ?? null;
    const isAgencyUser = agencyTenant !== null;
    const isOnAgencyTenant = isAgencyUser && currentTenant?.id === agencyTenant!.id;
    const isActingAsClient =
      isAgencyUser && currentTenant !== null && currentTenant.id !== agencyTenant!.id;

    return { agencyTenant, isAgencyUser, isOnAgencyTenant, isActingAsClient };
  }, [currentTenant, tenants]);

  const returnToAgency = useCallback(
    async (redirectTo = '/dashboard/asesoria') => {
      // agencyTenant and isActingAsClient are captured from the outer scope.
      // isReturningRef prevents concurrent invocations without adding state to deps.
      if (!agencyTenant || !isActingAsClient || isReturningRef.current) return;

      isReturningRef.current = true;
      setIsReturning(true);

      try {
        // switchTenant already clears the query cache (via useSwitchTenant)
        await switchTenant(agencyTenant.id);
        router.push(redirectTo);
      } catch {
        toast.error('No se pudo volver al panel de asesoría. Inténtalo de nuevo.');
      } finally {
        isReturningRef.current = false;
        setIsReturning(false);
      }
    },
    [agencyTenant, isActingAsClient, switchTenant, router],
  );

  return {
    agencyTenant,
    isAgencyUser,
    isOnAgencyTenant,
    isActingAsClient,
    returnToAgency,
    isReturning,
  };
}
