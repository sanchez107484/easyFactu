'use client';

import { useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';

/**
 * Wraps the Zustand `switchTenant` action with two critical side effects:
 *
 * 1. **Cache invalidation**: Clears the entire TanStack Query cache on every
 *    tenant switch. Each tenant has its own data boundary — stale data from
 *    the previous tenant must never be shown in the new context.
 *
 * 2. **Concurrent call guard**: Uses a ref-based flag to prevent race conditions
 *    if the user triggers the action multiple times before it resolves.
 *
 * All tenant-switching operations across the app must use this hook instead of
 * calling `useAuthStore((s) => s.switchTenant)` directly.
 */
export function useSwitchTenant() {
  const queryClient = useQueryClient();
  const storeSwitchTenant = useAuthStore((state) => state.switchTenant);

  // Ref-based guard: keeps useCallback stable (no boolean state in deps array)
  const isPendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const switchTenant = useCallback(
    async (tenantId: string): Promise<void> => {
      if (isPendingRef.current) return;

      isPendingRef.current = true;
      setIsPending(true);

      try {
        await storeSwitchTenant(tenantId);
        // Clear all cached queries after the new JWT is in place.
        // This guarantees components refetch against the new tenantId.
        queryClient.clear();
      } finally {
        isPendingRef.current = false;
        setIsPending(false);
      }
    },
    [storeSwitchTenant, queryClient],
  );

  return { switchTenant, isPending };
}
