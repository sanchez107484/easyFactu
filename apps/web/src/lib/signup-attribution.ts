import type { SignupAttribution } from '@easyfactura/shared-types';

const STORAGE_KEY = 'nf_signup_attribution';

const UTM_PARAMS = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_term: 'utmTerm',
  utm_content: 'utmContent',
} as const satisfies Record<string, keyof SignupAttribution>;

function readUtmParams(search: string): Partial<SignupAttribution> {
  const params = new URLSearchParams(search);
  const utms: Partial<SignupAttribution> = {};
  for (const [param, field] of Object.entries(UTM_PARAMS)) {
    const value = params.get(param);
    if (value) utms[field] = value;
  }
  return utms;
}

/** Referrers from our own site say nothing about where the visitor came from. */
function externalReferrer(referrer: string, currentHost: string): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).host === currentHost ? undefined : referrer;
  } catch {
    return undefined;
  }
}

function isSignupAttribution(value: unknown): value is SignupAttribution {
  return typeof value === 'object' && value !== null && 'landingUrl' in value;
}

export function readSignupAttribution(): SignupAttribution | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return isSignupAttribution(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Stores the first-touch data once; later visits never overwrite it. */
export function captureFirstVisitAttribution(): void {
  if (readSignupAttribution()) return;
  const { href, search, host } = window.location;
  const attribution: SignupAttribution = {
    landingUrl: href,
    referrer: externalReferrer(document.referrer, host),
    ...readUtmParams(search),
    firstVisitAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage blocked (private mode): registration still works without attribution.
  }
}
