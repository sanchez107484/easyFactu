const DEFAULT_SSO_DESTINATION = '/dashboard';

/**
 * Reads the ERP SSO token from the URL (`/sso#token=…`, or `?token=…` as a fallback) and
 * removes it from the address bar and history so it is not left behind or shared.
 */
export function takeSsoTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  const fromFragment = new URLSearchParams(url.hash.replace(/^#/, '')).get('token');
  const token = fromFragment ?? url.searchParams.get('token');
  window.history.replaceState(null, '', url.pathname);
  return token?.trim() || null;
}

/** The API already validates the destination; this only guards against leaving the app. */
export function toSafeDashboardPath(redirectTo: string | undefined): string {
  if (!redirectTo) return DEFAULT_SSO_DESTINATION;
  const isDashboardPath =
    redirectTo === DEFAULT_SSO_DESTINATION || redirectTo.startsWith(`${DEFAULT_SSO_DESTINATION}/`);
  return isDashboardPath && !redirectTo.includes('//') ? redirectTo : DEFAULT_SSO_DESTINATION;
}
