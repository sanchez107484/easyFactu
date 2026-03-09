'use client';

import { useState, useEffect } from 'react';
import { grantAnalyticsConsent, denyAnalyticsConsent } from './Analytics';

type ConsentChoice = 'yes' | 'no' | null;

function getStoredConsent(): ConsentChoice {
  try {
    const v = localStorage.getItem('ef_consent');
    if (v === 'yes' || v === 'no') return v as ConsentChoice;
    return null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  function handleAccept() {
    grantAnalyticsConsent();
    setVisible(false);
  }

  function handleReject() {
    denyAnalyticsConsent();
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies analíticas propias para mejorar tu experiencia. No compartimos datos con
          terceros con fines publicitarios.{' '}
          <a href="/privacidad" className="underline underline-offset-2 hover:text-foreground">
            Política de privacidad
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleReject}
            className="rounded-md border border-input bg-background px-4 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
