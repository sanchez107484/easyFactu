import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  SSO_ALGORITHM,
  SSO_CLOCK_TOLERANCE_SECONDS,
  SSO_ENV,
  SSO_MAX_CLAIM_LENGTH,
  SSO_TOKEN_MAX_LIFETIME_SECONDS,
} from './sso.constants';

/** Verified content of an ERP SSO token. */
export interface SsoClaims {
  /** `sub`: user id in the ERP — the only identity used to find the user. */
  erpUserId: string;
  jti: string;
  expiresAt: Date;
  /** `account_id`: the clinic's erpAccountId given at provisioning. */
  erpAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** `dest`: page to open; validated against the allow-list later. */
  destination?: string;
}

const INVALID_TOKEN_MESSAGE = 'El enlace de acceso no es válido o ha caducado';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class InvalidSsoTokenError extends Error {}

function readString(payload: Record<string, unknown>, claim: string): string {
  const value = payload[claim];
  if (typeof value !== 'string' || !value.trim() || value.length > SSO_MAX_CLAIM_LENGTH) {
    throw new InvalidSsoTokenError(`claim ${claim} missing or invalid`);
  }
  return value.trim();
}

function readOptionalString(payload: Record<string, unknown>, claim: string): string | undefined {
  return payload[claim] === undefined ? undefined : readString(payload, claim);
}

function readNumber(payload: Record<string, unknown>, claim: string): number {
  const value = payload[claim];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidSsoTokenError(`claim ${claim} missing or invalid`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifies the short-lived ES256 token signed by the ERP. NovaFactura only holds the
 * public key, so it can check tokens but never mint them.
 */
@Injectable()
export class SsoTokenVerifierService {
  private readonly logger = new Logger(SsoTokenVerifierService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async verify(token: string, now: Date = new Date()): Promise<SsoClaims> {
    // Read before the try: a missing configuration is a 503, not an invalid token.
    const publicKey = this.publicKey();
    const issuer = this.requiredConfig(SSO_ENV.ISSUER);
    const audience = this.requiredConfig(SSO_ENV.AUDIENCE);
    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        publicKey,
        algorithms: [SSO_ALGORITHM],
        issuer,
        audience,
        clockTimestamp: Math.floor(now.getTime() / 1000),
        clockTolerance: SSO_CLOCK_TOLERANCE_SECONDS,
      });
      if (!isRecord(payload)) throw new InvalidSsoTokenError('payload is not an object');
      return this.toClaims(payload, now);
    } catch (error) {
      // Only the reason is logged, never the token.
      this.logger.warn(`SSO token rejected: ${error instanceof Error ? error.message : 'unknown'}`);
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }
  }

  private toClaims(payload: Record<string, unknown>, now: Date): SsoClaims {
    const expiresAt = this.assertShortLived(payload, now);
    const email = readString(payload, 'email').toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new InvalidSsoTokenError('claim email invalid');
    return {
      erpUserId: readString(payload, 'sub'),
      jti: readString(payload, 'jti'),
      expiresAt,
      erpAccountId: readString(payload, 'account_id'),
      email,
      firstName: readString(payload, 'given_name'),
      lastName: readOptionalString(payload, 'family_name') ?? '',
      destination: readOptionalString(payload, 'dest'),
    };
  }

  /** exp and iat are mandatory, iat cannot be in the future and the token lives ≤ 60 s. */
  private assertShortLived(payload: Record<string, unknown>, now: Date): Date {
    const issuedAt = readNumber(payload, 'iat');
    const expiresAt = readNumber(payload, 'exp');
    const nowSeconds = now.getTime() / 1000;
    if (issuedAt > nowSeconds + SSO_CLOCK_TOLERANCE_SECONDS) {
      throw new InvalidSsoTokenError('iat in the future');
    }
    if (expiresAt - issuedAt > SSO_TOKEN_MAX_LIFETIME_SECONDS) {
      throw new InvalidSsoTokenError('lifetime above 60 s');
    }
    return new Date(expiresAt * 1000);
  }

  private publicKey(): string {
    const configured = this.config.get<string>(SSO_ENV.PUBLIC_KEY)?.trim();
    if (!configured) {
      throw new ServiceUnavailableException('El acceso desde el ERP no está habilitado');
    }
    // Env files often store the PEM on one line with literal "\n".
    return configured.replace(/\\n/g, '\n');
  }

  private requiredConfig(name: string): string {
    const value = this.config.get<string>(name)?.trim();
    if (!value) {
      throw new ServiceUnavailableException('El acceso desde el ERP no está habilitado');
    }
    return value;
  }
}
