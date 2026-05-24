import { useEffect } from 'react';

/**
 * Module-level flag — survives across client-side navigations within the same
 * page load, so the warmup request fires at most once per browser session.
 * Resets on full reload (which is fine: Vercel function may have gone cold).
 */
let warmupTriggered = false;

/**
 * Fires a fire-and-forget request to the PDF endpoint with `?warmup=1` to
 * pre-launch the Chromium browser singleton inside the Vercel function.
 *
 * Rationale: the first real PDF download otherwise pays the cost of
 * (1) Vercel function cold start, (2) @sparticuz/chromium extraction,
 * (3) Chromium launch — totalling 3-5s before any real work begins. By
 * warming the function as soon as the user enters the dashboard we move
 * that cost off the critical path of the user's click.
 *
 * The endpoint accepts any path id (it is ignored in warmup mode), so we
 * use the literal "warmup" placeholder.
 */
export function usePdfWarmup(): void {
  useEffect(() => {
    if (warmupTriggered) return;
    if (typeof window === 'undefined') return;
    warmupTriggered = true;

    // No auth header needed — warmup mode skips the auth check.
    // keepalive lets the request survive even if the user navigates away.
    fetch('/api/invoices/warmup/pdf?warmup=1', {
      method: 'GET',
      keepalive: true,
    }).catch(() => {
      // Warmup is best-effort; failures are non-fatal and silently ignored.
      warmupTriggered = false;
    });
  }, []);
}
