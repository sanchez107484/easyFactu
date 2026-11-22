/**
 * Cookie consent per category, stored in localStorage and mirrored to
 * Google Consent Mode v2. The inline script in app/layout.tsx reads the same
 * storage key before GTM loads — keep both in sync when the format changes.
 */

export interface CookieConsent {
  analytics: boolean;
  ads: boolean;
}

interface StoredConsent extends CookieConsent {
  version: number;
  updatedAt: string;
}

export const CONSENT_STORAGE_KEY = 'ef_consent';
/** Bump when a new cookie purpose is added so earlier choices are asked again. */
const CONSENT_VERSION = 2;
const LEGACY_ANALYTICS_ACCEPTED = 'yes';
const OPEN_COOKIE_SETTINGS_EVENT = 'ef:open-cookie-settings';

const COOKIE_PREFIXES: Record<keyof CookieConsent, string[]> = {
  analytics: ['_ga'],
  ads: ['_gcl'],
};

function isStoredConsent(value: unknown): value is StoredConsent {
  if (typeof value !== 'object' || value === null) return false;
  return 'analytics' in value && 'ads' in value && 'version' in value;
}

function readRawConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseStoredConsent(raw: string | null): StoredConsent | null {
  if (!raw?.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** The visitor's current choice, including a v1 "yes"/"no" mapped to analytics only. */
export function readCookieConsent(): CookieConsent {
  const raw = readRawConsent();
  const stored = parseStoredConsent(raw);
  if (stored) return { analytics: stored.analytics === true, ads: stored.ads === true };
  return { analytics: raw === LEGACY_ANALYTICS_ACCEPTED, ads: false };
}

/** True when there is no choice for the current set of purposes yet. */
export function needsConsentPrompt(): boolean {
  return parseStoredConsent(readRawConsent())?.version !== CONSENT_VERSION;
}

export function saveCookieConsent(consent: CookieConsent): void {
  const stored: StoredConsent = {
    ...consent,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage blocked: the choice still applies to this page view.
  }
  applyConsentMode(consent);
  deleteCookiesOfDeniedCategories(consent);
}

export function applyConsentMode(consent: CookieConsent): void {
  if (typeof window.gtag !== 'function') return;
  const analytics = consent.analytics ? 'granted' : 'denied';
  const ads = consent.ads ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
  window.gtag('set', 'ads_data_redaction', !consent.ads);
}

function deleteCookiesOfDeniedCategories(consent: CookieConsent): void {
  const deniedPrefixes = (Object.keys(COOKIE_PREFIXES) as Array<keyof CookieConsent>)
    .filter((category) => !consent[category])
    .flatMap((category) => COOKIE_PREFIXES[category]);
  if (deniedPrefixes.length > 0) deleteCookiesByPrefix(deniedPrefixes);
}

/** Google sets its cookies on the root domain, so try every parent domain of the host. */
function deleteCookiesByPrefix(prefixes: string[]): void {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)));
  const hostParts = window.location.hostname.split('.');
  const domains = hostParts.map((_, index) => hostParts.slice(index).join('.'));
  for (const name of names) {
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
