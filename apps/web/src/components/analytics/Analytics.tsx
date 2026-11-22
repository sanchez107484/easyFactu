'use client';

import { useEffect } from 'react';

const OPEN_COOKIE_SETTINGS_EVENT = 'ef:open-cookie-settings';
const ANALYTICS_COOKIE_PREFIX = '_ga';

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

/**
 * Call this after the user rejects cookies in the CookieBanner. It also covers
 * a visitor who accepted earlier and now withdraws consent.
 */
export function denyAnalyticsConsent(): void {
  try {
    localStorage.setItem('ef_consent', 'no');
  } catch {
    /* ignore */
  }
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
  deleteAnalyticsCookies();
}

/** GA4 sets its cookies on the root domain, so try every parent domain of the host. */
function deleteAnalyticsCookies(): void {
  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name.startsWith(ANALYTICS_COOKIE_PREFIX));
  const hostParts = window.location.hostname.split('.');
  const domains = hostParts.map((_, index) => hostParts.slice(index).join('.'));
  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
    }
  }
}

/** Reopens the cookie banner so the visitor can change a previous choice. */
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/** Subscribes to openCookieSettings() calls; returns the unsubscribe function. */
export function onOpenCookieSettings(listener: () => void): () => void {
  window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);
  return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);
}
