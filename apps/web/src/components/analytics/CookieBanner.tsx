'use client';

import { useEffect, useState } from 'react';
import {
  needsConsentPrompt,
  onOpenCookieSettings,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsent,
} from '@/lib/cookie-consent';
import { CookiePreferencesPanel } from './cookie-preferences-panel';

const ALL_ACCEPTED: CookieConsent = { analytics: true, ads: true };
const ALL_REJECTED: CookieConsent = { analytics: false, ads: false };

const SECONDARY_BUTTON =
  'rounded-md border border-input bg-background px-4 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground';
const PRIMARY_BUTTON =
  'rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [draft, setDraft] = useState<CookieConsent>(ALL_REJECTED);

  useEffect(() => {
    if (needsConsentPrompt()) setIsVisible(true);
    return onOpenCookieSettings(() => {
      setDraft(readCookieConsent());
      setIsConfiguring(true);
      setIsVisible(true);
    });
  }, []);

  if (!isVisible) return null;

  function decide(consent: CookieConsent) {
    saveCookieConsent(consent);
    setIsVisible(false);
    setIsConfiguring(false);
  }

  function startConfiguring() {
    setDraft(readCookieConsent());
    setIsConfiguring(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Usamos cookies de Google Analytics para entender cómo se usa la web y, si lo aceptas,
            de Google Ads para medir qué anuncios funcionan.{' '}
            <a href="/cookies" className="underline underline-offset-2 hover:text-foreground">
              Política de cookies
            </a>
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button onClick={() => decide(ALL_REJECTED)} className={SECONDARY_BUTTON}>
              Rechazar
            </button>
            {isConfiguring ? (
              <button onClick={() => decide(draft)} className={SECONDARY_BUTTON}>
                Guardar selección
              </button>
            ) : (
              <button onClick={startConfiguring} className={SECONDARY_BUTTON}>
                Configurar
              </button>
            )}
            <button onClick={() => decide(ALL_ACCEPTED)} className={PRIMARY_BUTTON}>
              Aceptar todas
            </button>
          </div>
        </div>
        {isConfiguring && <CookiePreferencesPanel consent={draft} onChange={setDraft} />}
      </div>
    </div>
  );
}
