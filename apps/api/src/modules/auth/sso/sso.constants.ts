/** Environment variables read by the ERP SSO (HU-21D). */
export const SSO_ENV = {
  /** PEM of the ERP's ES256 (P-256) public key. Empty disables SSO on this deployment. */
  PUBLIC_KEY: 'ERP_SSO_PUBLIC_KEY',
  /** Expected `iss` claim. */
  ISSUER: 'ERP_SSO_ISSUER',
  /** Expected `aud` claim. */
  AUDIENCE: 'ERP_SSO_AUDIENCE',
} as const;

export const SSO_ALGORITHM = 'ES256';

/** Maximum lifetime of an SSO token (exp - iat). */
export const SSO_TOKEN_MAX_LIFETIME_SECONDS = 60;

/** Clock skew tolerated between the ERP and NovaFactura. */
export const SSO_CLOCK_TOLERANCE_SECONDS = 5;

export const SSO_DEFAULT_DESTINATION = '/dashboard';

export const SSO_MAX_CLAIM_LENGTH = 255;

/** Exchanged jti rows are purged once they are this old (well past any token lifetime). */
export const SSO_JTI_RETENTION_MS = 24 * 60 * 60 * 1000;
