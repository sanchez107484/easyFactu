import type { AccountType } from '@easyfactura/shared-types';

/**
 * Events pushed to the GTM dataLayer. GTM decides which tags fire for each one,
 * and Consent Mode keeps them from storing cookies until the visitor accepts.
 */
type AnalyticsEvent =
  | { event: 'sign_up'; method: 'email'; account_type: string }
  | { event: 'cta_click'; cta_location: string; cta_text: string; link_url: string };

export function trackEvent(payload: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

export function trackSignUp(accountType: AccountType): void {
  trackEvent({ event: 'sign_up', method: 'email', account_type: accountType.toLowerCase() });
}
