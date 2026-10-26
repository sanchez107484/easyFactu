import type { Prisma } from '@prisma/client';
import type { SignupAttributionDto } from './dto/signup-attribution.dto';

type SignupAttributionColumns = Pick<
  Prisma.UserCreateInput,
  | 'signupLandingUrl'
  | 'signupLandingPath'
  | 'signupReferrer'
  | 'signupUtmSource'
  | 'signupUtmMedium'
  | 'signupUtmCampaign'
  | 'signupUtmTerm'
  | 'signupUtmContent'
  | 'signupFirstVisitAt'
>;

/** Path without query string or trailing slash, so `/precios?utm=x` and `/precios/` group together. */
export function extractLandingPath(landingUrl: string | undefined): string | null {
  if (!landingUrl) return null;
  try {
    const { pathname } = new URL(landingUrl);
    return pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  } catch {
    return null;
  }
}

export function toSignupAttributionColumns(
  attribution: SignupAttributionDto | undefined
): SignupAttributionColumns {
  if (!attribution) return {};
  return {
    signupLandingUrl: attribution.landingUrl ?? null,
    signupLandingPath: extractLandingPath(attribution.landingUrl),
    signupReferrer: attribution.referrer || null,
    signupUtmSource: attribution.utmSource ?? null,
    signupUtmMedium: attribution.utmMedium ?? null,
    signupUtmCampaign: attribution.utmCampaign ?? null,
    signupUtmTerm: attribution.utmTerm ?? null,
    signupUtmContent: attribution.utmContent ?? null,
    signupFirstVisitAt: attribution.firstVisitAt ? new Date(attribution.firstVisitAt) : null,
  };
}
