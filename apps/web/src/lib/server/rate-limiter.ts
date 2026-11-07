interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

interface WindowCounter {
  count: number;
  resetsAt: number;
}

export interface RateLimitResult {
  isAllowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter kept in this process's memory. On serverless each instance counts on its
 * own, so the effective limit can be higher under load: it stops abuse from one client, but it is
 * not a global quota.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const counters = new Map<string, WindowCounter>();

  const removeExpiredCounters = (now: number) => {
    for (const [key, counter] of counters) {
      if (counter.resetsAt <= now) counters.delete(key);
    }
  };

  return function consume(key: string): RateLimitResult {
    const now = Date.now();
    removeExpiredCounters(now);

    const counter = counters.get(key) ?? { count: 0, resetsAt: now + windowMs };
    counter.count += 1;
    counters.set(key, counter);

    return {
      isAllowed: counter.count <= limit,
      retryAfterSeconds: Math.ceil((counter.resetsAt - now) / 1000),
    };
  };
}
