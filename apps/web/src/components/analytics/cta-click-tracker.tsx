'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

const SIGNUP_PATH = /^\/registro(\/|$)/;
const MAX_CTA_TEXT_LENGTH = 100;

function findSignupLink(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return null;
  const isSameSite = link.host === window.location.host;
  return isSameSite && SIGNUP_PATH.test(link.pathname) ? link : null;
}

/** An explicit data-cta-location wins; otherwise the nearest landmark or section id. */
function resolveCtaLocation(link: HTMLAnchorElement): string {
  const explicit = link.closest('[data-cta-location]')?.getAttribute('data-cta-location');
  if (explicit) return explicit;
  if (link.closest('header')) return 'header';
  if (link.closest('footer')) return 'footer';
  return link.closest('section[id]')?.id || 'body';
}

function handleDocumentClick(event: MouseEvent): void {
  const link = findSignupLink(event.target);
  if (!link) return;
  trackEvent({
    event: 'cta_click',
    cta_location: resolveCtaLocation(link),
    cta_text: (link.textContent ?? '').trim().slice(0, MAX_CTA_TEXT_LENGTH),
    link_url: link.pathname,
  });
}

/** Tracks every click on a link to the signup pages, without tagging each link. */
export function CtaClickTracker() {
  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true });
  }, []);
  return null;
}
