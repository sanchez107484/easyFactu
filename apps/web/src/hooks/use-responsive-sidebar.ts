'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';

/**
 * Breakpoint at which the sidebar is forced collapsed (icon-rail mode).
 * Set above Tailwind's `xl` (1280px) because typical laptop screens
 * (1366px / 1440px) still cut off invoice tables with the expanded sidebar.
 * At 1440px viewport with the rail mode active, tables get ~1376px of usable width.
 */
const FORCE_COLLAPSE_BELOW_PX = 1440;

/**
 * Auto-collapses the sidebar on viewports < xl and restores the user's
 * preferred state when the viewport grows back above the threshold.
 *
 * - The user's manual choice on large screens is preserved in `sidebarCollapsed` (persisted).
 * - Below the threshold we force-collapse without overwriting the persisted preference.
 *
 * Mount once in the dashboard layout.
 */
export function useResponsiveSidebar(): void {
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${FORCE_COLLAPSE_BELOW_PX - 1}px)`);
    let userPreferredCollapsed = useUIStore.getState().sidebarCollapsed;

    const apply = (matches: boolean) => {
      if (matches) {
        // Snapshot user preference the first time we force-collapse from an expanded state
        if (!useUIStore.getState().sidebarCollapsed) {
          userPreferredCollapsed = false;
        }
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(userPreferredCollapsed);
      }
    };

    apply(mql.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setSidebarCollapsed]);
}
