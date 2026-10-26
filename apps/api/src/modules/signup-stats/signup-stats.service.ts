import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const SIGNUP_STATS_TTL_SECONDS = 60 * 60;

export interface SignupStats {
  registeredCount: number;
  updatedAt: string;
}

interface CachedSignupStats {
  value: SignupStats;
  expiresAt: number;
}

/**
 * Public registration counter used by the "plazas gratuitas" widgets.
 * Cached in memory for at most one hour per instance.
 */
@Injectable()
export class SignupStatsService {
  private cache: CachedSignupStats | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<SignupStats> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.value;

    const value: SignupStats = {
      registeredCount: await this.countRegisteredAccounts(),
      updatedAt: new Date(now).toISOString(),
    };
    this.cache = { value, expiresAt: now + SIGNUP_STATS_TTL_SECONDS * 1000 };
    return value;
  }

  /** Each self-registration creates one user who owns their tenant; invited members are excluded. */
  private countRegisteredAccounts(): Promise<number> {
    return this.prisma.user.count({
      where: { tenantUsers: { some: { isOwner: true } } },
    });
  }
}
