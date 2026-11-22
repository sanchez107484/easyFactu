'use client';

import { openCookieSettings } from './Analytics';

interface CookieSettingsButtonProps {
  className?: string;
}

/** Lets visitors change their cookie choice at any time, as the GDPR requires. */
export function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Configurar cookies
    </button>
  );
}
