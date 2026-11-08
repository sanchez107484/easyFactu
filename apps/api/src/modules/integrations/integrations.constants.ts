/** Route prefix of every integrations API v1 controller (after the global `api/v1`). */
export const INTEGRATIONS_V1_PATH = 'integrations/v1';

export const API_KEY_PREFIX = { LIVE: 'nfk_live_', TEST: 'nfk_test_' } as const;
/** Characters of the key kept in clear to identify it (prefix + 4). */
export const API_KEY_VISIBLE_CHARS = 13;
/** On rotation the previous key keeps working this long. */
export const API_KEY_ROTATION_OVERLAP_MS = 24 * 60 * 60 * 1000;

export const IDEMPOTENCY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** A request still IN_PROGRESS after this long is considered dead and can be taken over. */
export const IDEMPOTENCY_LOCK_MS = 60 * 1000;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 255;

export const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const CONSENT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ACTIVATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Plan included with the ERP: PRO at no cost, managed by the ERP. */
export const ERP_INCLUDED_PLAN_SLUG = 'PROFESSIONAL_FREE';

/** Timezone used to decide the issue date ("today") of invoices issued through the API. */
export const ISSUE_DATE_TIMEZONE = 'Europe/Madrid';

export const MAX_LINES_PER_INVOICE = 200;

/** Environment variables read by the module. */
export const INTEGRATIONS_ENV = {
  PROVISION_SECRET: 'ERP_PROVISION_SECRET',
  API_URL: 'INTEGRATIONS_API_URL',
  APP_URL: 'INTEGRATIONS_APP_URL',
  ERP_DISPLAY_NAME: 'INTEGRATIONS_ERP_NAME',
  RATE_LIMIT: 'INTEGRATIONS_RATE_LIMIT_PER_MINUTE',
  MAINTENANCE: 'INTEGRATIONS_MAINTENANCE',
  VERIFACTU_ENVIRONMENT: 'VERIFACTU_ENVIRONMENT',
} as const;
