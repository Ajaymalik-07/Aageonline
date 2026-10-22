/**
 * AageOnline — Distributed Rate Limiting (PostgreSQL-backed)
 * Milestone 0.19.0 / Milestone 0.21.0
 *
 * Backed by PostgreSQL `rate_limit_counters` table for multi-instance distributed rate limiting.
 * Isolated from Edge Middleware to maintain zero-driver Edge runtime safety.
 */

import {
  RATE_LIMIT_TIERS,
  checkRateLimit,
  type RateLimitTier,
  type RateLimitCheckResult,
} from './rate-limit.ts';

/**
 * Asynchronous distributed rate limit check backed by PostgreSQL `rate_limit_counters`.
 *
 * Resilience Invariant:
 * If PostgreSQL is unreachable or times out, safely falls back to local in-memory window
 * with `store: 'degraded-local'` so legitimate users are not blocked by a database outage.
 */
export async function checkDistributedRateLimit(
  clientToken: string,
  tier: RateLimitTier,
  isCrawler = false
): Promise<RateLimitCheckResult> {
  const config = RATE_LIMIT_TIERS[tier];
  const maxRequests = isCrawler && tier === 'PUBLIC_DISCOVERY' ? config.maxRequests * 2 : config.maxRequests;
  const windowSeconds = config.windowSeconds;

  try {
    const { isDatabaseConfigured, getDbPool } = await import('../db/client.ts');
    if (!isDatabaseConfigured()) {
      return checkRateLimit(clientToken, tier, isCrawler);
    }

    const pool = getDbPool();
    // Compute aligned window start (e.g. current minute boundary)
    const now = new Date();
    const windowStartEpoch = Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds;
    const windowStartDate = new Date(windowStartEpoch * 1000);

    const result = await pool.query(
      `INSERT INTO rate_limit_counters (token, tier, window_start, count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (token, tier, window_start)
       DO UPDATE SET count = rate_limit_counters.count + 1
       RETURNING count`,
      [clientToken, tier, windowStartDate]
    );

    const currentCount = parseInt(result.rows[0]?.count || '1', 10);
    const elapsedSeconds = Math.floor((now.getTime() - windowStartDate.getTime()) / 1000);
    const resetSeconds = Math.max(1, windowSeconds - elapsedSeconds);
    const allowed = currentCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - currentCount);

    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetSeconds,
      retryAfterSeconds: allowed ? undefined : resetSeconds,
      clientToken,
      store: 'distributed',
    };
  } catch (err) {
    // Database outage failover: Fall back open to local memory with warning
    console.warn('Distributed rate limit store degraded, failing over to local memory:', err);
    const localResult = checkRateLimit(clientToken, tier, isCrawler);
    return {
      ...localResult,
      store: 'degraded-local',
    };
  }
}
