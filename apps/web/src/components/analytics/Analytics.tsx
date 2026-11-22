'use client';

import { useEffect } from 'react';
import { applyConsentMode, needsConsentPrompt, readCookieConsent } from '@/lib/cookie-consent';

/**
 * Re-applies a returning visitor's stored choice once GTM's gtag is available.
 * The inline script in app/layout.tsx already sets the defaults before GTM loads;
 * this covers the case where that script could not read storage in time.
 */
export default function Analytics(): null {
  useEffect(() => {
    if (!needsConsentPrompt()) applyConsentMode(readCookieConsent());
  }, []);

  return null;
}
