'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useResponsiveSidebar } from '@/hooks/use-responsive-sidebar';
import { usePdfWarmup } from '@/hooks/use-pdf-warmup';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { ActingAsBanner } from '@/components/dashboard/acting-as-banner';
import { cn } from '@/lib/utils';

/**
 * Determina si hay tokens en localStorage para decidir si mostrar el spinner
 * o renderizar optimistamente mientras checkAuth() corre en background.
 * - Sin tokens → redirigir inmediatamente (no spinner)
 * - Con tokens + isAuthenticated en Zustand → render inmediato (navegación client-side)
 * - Con tokens pero sin isAuthenticated → spinner mínimo mientras /auth/me resuelve (hard reload)
 */
function hasStoredTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('refreshToken'));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  // Auto-collapse the sidebar on viewports < xl so dashboard tables get the full width.
  useResponsiveSidebar();

  // Pre-warm the PDF Vercel function (Chromium launch) so the first download
  // does not pay the 3-5s cold start. Fires once per browser session.
  usePdfWarmup();

  // Start with true on both server and client to avoid:
  // 1) Hydration mismatch (same value on both sides)
  // 2) Race condition where redirect fires before auth check starts
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Sesión ya activa en Zustand: navegación client-side, sin necesidad de red.
    if (isAuthenticated) {
      setIsChecking(false);
      return;
    }

    // Sin tokens: no tiene sentido llamar a la API, redirigir directamente.
    if (!hasStoredTokens()) {
      setIsChecking(false);
      return;
    }

    // Hard reload con tokens válidos: validar sesión con el servidor.
    checkAuth().finally(() => setIsChecking(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- solo en mount

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.replace('/login?from=' + encodeURIComponent(currentPath));
    }
  }, [isChecking, isAuthenticated, router]);

  // Prevent body-level scrolling while on the dashboard
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
    };
  }, []);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div data-section="dashboard" className="flex h-screen overflow-hidden">
      <DashboardSidebar />

      <div
        className={cn(
          'flex flex-1 min-w-0 flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64',
        )}
      >
        <DashboardHeader />

        <ActingAsBanner />

        <main className="flex-1 overflow-y-auto bg-muted/40">
          <div className="p-6 h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
