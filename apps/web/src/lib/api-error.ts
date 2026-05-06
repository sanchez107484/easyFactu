/**
 * Re-exports the canonical error message helper under the legacy name.
 * The single source of truth is `lib/api-client.ts`.
 */
export { getErrorMessage as getApiErrorMessage } from '@/lib/api-client';
