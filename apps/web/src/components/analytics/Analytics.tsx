'use client';

import { useEffect } from 'react';

/**
 * Fired once on mount for returning visitors: if they already accepted,
 * update GTM Consent Mode so GA4 tags fire immediately without waiting
 * for the banner (which won't show again).
 */
export default function Analytics(): null {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ef_consent');
      if (stored === 'yes' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
      }
    } catch {
      // localStorage not available (SSR guard, private mode, etc.)
    }
  }, []);

  return null;
}

/** Call this after the user accepts cookies in the CookieBanner. */
export function grantAnalyticsConsent(): void {
  try {
    localStorage.setItem('ef_consent', 'yes');
  } catch {
    /* ignore */
  }
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
  }
}

/** Call this after the user rejects cookies in the CookieBanner. */
export function denyAnalyticsConsent(): void {
  try {
    localStorage.setItem('ef_consent', 'no');
  } catch {
    /* ignore */
  }
}
