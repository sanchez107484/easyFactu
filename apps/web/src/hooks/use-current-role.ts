'use client';

import { useAuthStore } from '@/store/auth-store';

const CATALOG_MANAGER_ROLES = new Set(['OWNER', 'ADMIN', 'ACCOUNTANT']);

/** Role of the current user in the active tenant (agencies acting as a client are ADMIN). */
export function useCurrentRole(): string | null {
  return useAuthStore((state) => {
    const tenantId = state.currentTenant?.id;
    return state.tenants.find((entry) => entry.tenant.id === tenantId)?.role ?? null;
  });
}

/** Same roles the API allows for catalog-changing actions. */
export function useCanManageCatalog(): boolean {
  const role = useCurrentRole();
  return role !== null && CATALOG_MANAGER_ROLES.has(role);
}
