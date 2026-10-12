/**
 * AageOnline — Process-Local Performance & Caching Metrics
 * Milestone 0.19.0: Production Readiness, Distributed State & Live Infrastructure Verification
 *
 * Provides bounded-cardinality in-memory telemetry for:
 * - Request / operation latencies (min, max, avg, sample count)
 * - Cache hit / miss rates
 * - Database query latencies & connection pool utilization
 * - Cache invalidation outcomes
 * - Edge rate-limit rejection counters
 *
 * Operational Boundary:
 * These counters represent process-local diagnostics for the current Node/Edge instance.
 * For global durable state across horizontally scaled pods, query PostgreSQL outbox repositories.
 * Privacy Invariant: Zero secret, token, or IP address logging.
 */

import { getPoolMetrics, type DbPoolMetrics } from '../db/client.ts';
import { getRecentInvalidations } from '../cache/invalidation.ts';

interface LatencyStats {
  samples: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
}

class PerformanceMetricsCollector {
  private latencies: Map<string, LatencyStats> = new Map();
  private cacheHits: Map<string, number> = new Map();
  private cacheMisses: Map<string, number> = new Map();
  private rateLimitRejections = 0;
  private rankingInvalidationsCount = 0;
  private rankingInvalidationFailuresCount = 0;

  recordLatency(operation: string, durationMs: number): void {
    const existing = this.latencies.get(operation);
    if (!existing) {
      this.latencies.set(operation, {
        samples: 1,
        totalMs: durationMs,
        minMs: durationMs,
        maxMs: durationMs,
      });
      return;
    }

    existing.samples++;
    existing.totalMs += durationMs;
    existing.minMs = Math.min(existing.minMs, durationMs);
    existing.maxMs = Math.max(existing.maxMs, durationMs);
  }

  recordCacheHit(cacheName: string): void {
    this.cacheHits.set(cacheName, (this.cacheHits.get(cacheName) || 0) + 1);
  }

  recordCacheMiss(cacheName: string): void {
    this.cacheMisses.set(cacheName, (this.cacheMisses.get(cacheName) || 0) + 1);
  }

  recordRateLimitRejection(): void {
    this.rateLimitRejections++;
  }

  recordInvalidationSuccess(): void {
    this.rankingInvalidationsCount++;
  }

  recordInvalidationFailure(): void {
    this.rankingInvalidationFailuresCount++;
  }

  getMetricsSummary() {
    const latencySummary: Record<string, { samples: number; avgMs: number; minMs: number; maxMs: number }> = {};
    for (const [op, stats] of this.latencies.entries()) {
      latencySummary[op] = {
        samples: stats.samples,
        avgMs: Math.round((stats.totalMs / stats.samples) * 100) / 100,
        minMs: Math.round(stats.minMs * 100) / 100,
        maxMs: Math.round(stats.maxMs * 100) / 100,
      };
    }

    const cacheSummary: Record<string, { hits: number; misses: number; hitRatioPercent: number }> = {};
    const allCacheNames = new Set([...this.cacheHits.keys(), ...this.cacheMisses.keys()]);
    for (const name of allCacheNames) {
      const hits = this.cacheHits.get(name) || 0;
      const misses = this.cacheMisses.get(name) || 0;
      const total = hits + misses;
      const hitRatioPercent = total > 0 ? Math.round((hits / total) * 10000) / 100 : 0;
      cacheSummary[name] = { hits, misses, hitRatioPercent };
    }

    const poolMetrics: DbPoolMetrics | null = getPoolMetrics();
    const recentInvalidationsCount = getRecentInvalidations(100).length;

    return {
      scope: 'PROCESS_LOCAL',
      note: 'Process-local metrics. Cluster totals reside in durable PostgreSQL tables.',
      latencies: latencySummary,
      caches: cacheSummary,
      rateLimitRejections: this.rateLimitRejections,
      rankingInvalidations: {
        total: this.rankingInvalidationsCount,
        failures: this.rankingInvalidationFailuresCount,
        recentBuffered: recentInvalidationsCount,
      },
      databasePool: poolMetrics,
      collectedAt: new Date().toISOString(),
    };
  }

  resetForTesting(): void {
    this.latencies.clear();
    this.cacheHits.clear();
    this.cacheMisses.clear();
    this.rateLimitRejections = 0;
    this.rankingInvalidationsCount = 0;
    this.rankingInvalidationFailuresCount = 0;
  }
}

export const metricsCollector = new PerformanceMetricsCollector();
