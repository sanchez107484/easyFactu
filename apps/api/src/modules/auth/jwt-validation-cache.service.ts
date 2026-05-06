import { Injectable, Logger } from '@nestjs/common';

/**
 * Cached value returned by `JwtStrategy.validate()`. Stored as the exact shape
 * Passport injects as `request.user`.
 */
export interface CachedJwtUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  isOwner: boolean;
  firstName: string;
  lastName: string;
  actingAsClient: boolean;
  agencyTenantId: string | undefined;
  impersonationLogId: string | undefined;
}

interface CacheEntry {
  value: CachedJwtUser;
  expiresAt: number;
}

const TTL_MS = 60_000; // 60s — short enough for role/tenant changes to take effect quickly.
const MAX_ENTRIES = 10_000; // Hard cap to prevent unbounded growth.

/**
 * In-memory cache for resolved JWT validations.
 *
 * Avoids running 1-2 Prisma queries on every authenticated request. Entries are
 * keyed by `userId:tenantId:actingAsClient` and expire after 60 s. Mutating
 * operations (logout, switchTenant, role changes) MUST call `invalidateUser()`
 * so stale permissions are not served.
 */
@Injectable()
export class JwtValidationCacheService {
  private readonly logger = new Logger(JwtValidationCacheService.name);
  private readonly cache = new Map<string, CacheEntry>();

  private buildKey(userId: string, tenantId: string, actingAsClient: boolean): string {
    return `${userId}:${tenantId}:${actingAsClient ? '1' : '0'}`;
  }

  get(userId: string, tenantId: string, actingAsClient: boolean): CachedJwtUser | null {
    const key = this.buildKey(userId, tenantId, actingAsClient);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(value: CachedJwtUser): void {
    const key = this.buildKey(value.id, value.tenantId, value.actingAsClient);

    // Evict the oldest entry when at capacity (Map preserves insertion order).
    if (this.cache.size >= MAX_ENTRIES && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  }

  /**
   * Invalidates every cached entry for a given user across all tenants and
   * impersonation modes. Call from logout, switchTenant, role/permission
   * updates, account deactivation, and tenant deactivation.
   */
  invalidateUser(userId: string): void {
    const prefix = `${userId}:`;
    let removed = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        removed += 1;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Invalidated ${removed} JWT cache entries for user ${userId}`);
    }
  }

  /** Drops every cached entry. Test/admin escape hatch. */
  clear(): void {
    this.cache.clear();
  }
}
