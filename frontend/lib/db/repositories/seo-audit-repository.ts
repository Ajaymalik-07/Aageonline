/**
 * AageOnline — PostgreSQL SEO Audit Repository
 *
 * Persists durable SEO audit records and operational findings.
 * Includes in-memory fallback for local dev/testing environments.
 */

import type pg from 'pg';
import type { SeoAuditRun, SeoOperationalSummary } from '../../../types/seo.ts';
import { getDbPool, isDatabaseConfigured } from '../client.ts';
import { assertProductionPersistence, isProductionPersistenceRequired } from '../guard.ts';
import { searchConsoleAdapter } from '../../seo/search-console.ts';

const MEMORY_SEO_AUDIT_RUNS: Map<string, SeoAuditRun> = new Map();

export class PostgresSeoAuditRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async createAuditRun(run: SeoAuditRun, client?: pg.PoolClient): Promise<SeoAuditRun> {
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        await db.query(
          `INSERT INTO seo_audit_runs (
            id, run_type, total_candidates, eligible_urls, excluded_urls,
            findings_count, exclusions_by_reason, findings, sitemap_checksum,
            created_at, completed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            run.id,
            run.runType,
            run.totalCandidates,
            run.eligibleUrls,
            run.excludedUrls,
            run.findingsCount,
            JSON.stringify(run.exclusionsByReason),
            JSON.stringify(run.findings),
            run.sitemapChecksum || null,
            new Date(run.createdAt),
            run.completedAt ? new Date(run.completedAt) : null,
          ]
        );
      } catch (err: unknown) {
        if (isProductionPersistenceRequired()) {
          throw new Error(
            `CRITICAL PERSISTENCE FAILURE: Failed to persist SEO audit run in production: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    } else if (isProductionPersistenceRequired()) {
      assertProductionPersistence();
    }

    MEMORY_SEO_AUDIT_RUNS.set(run.id, { ...run });
    return run;
  }

  async getLatestAuditRun(): Promise<SeoAuditRun | null> {
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT id, run_type AS "runType", total_candidates AS "totalCandidates",
                  eligible_urls AS "eligibleUrls", excluded_urls AS "excludedUrls",
                  findings_count AS "findingsCount", exclusions_by_reason AS "exclusionsByReason",
                  findings, sitemap_checksum AS "sitemapChecksum",
                  created_at AS "createdAt", completed_at AS "completedAt"
           FROM seo_audit_runs
           ORDER BY created_at DESC
           LIMIT 1`
        );

        if (res.rows[0]) {
          return this.mapRow(res.rows[0]);
        }
      } catch (err: unknown) {
        if (isProductionPersistenceRequired()) {
          throw new Error(
            `CRITICAL PERSISTENCE FAILURE: Failed to query latest SEO audit run in production: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    } else if (isProductionPersistenceRequired()) {
      assertProductionPersistence();
    }

    const runs = Array.from(MEMORY_SEO_AUDIT_RUNS.values());
    if (runs.length === 0) return null;
    runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { ...runs[0] };
  }

  async listAuditRuns(limit = 20): Promise<SeoAuditRun[]> {
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT id, run_type AS "runType", total_candidates AS "totalCandidates",
                  eligible_urls AS "eligibleUrls", excluded_urls AS "excludedUrls",
                  findings_count AS "findingsCount", exclusions_by_reason AS "exclusionsByReason",
                  findings, sitemap_checksum AS "sitemapChecksum",
                  created_at AS "createdAt", completed_at AS "completedAt"
           FROM seo_audit_runs
           ORDER BY created_at DESC
           LIMIT $1`,
          [limit]
        );

        return res.rows.map((r) => this.mapRow(r));
      } catch (err: unknown) {
        if (isProductionPersistenceRequired()) {
          throw new Error(
            `CRITICAL PERSISTENCE FAILURE: Failed to list SEO audit runs in production: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    } else if (isProductionPersistenceRequired()) {
      assertProductionPersistence();
    }

    const runs = Array.from(MEMORY_SEO_AUDIT_RUNS.values());
    runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return runs.slice(0, limit).map((r) => ({ ...r }));
  }

  async getOperationalSummary(): Promise<SeoOperationalSummary> {
    const latest = await this.getLatestAuditRun();
    const scStatus = await searchConsoleAdapter.getStatus();

    if (!latest) {
      return {
        totalCandidates: 0,
        eligibleUrls: 0,
        excludedUrls: 0,
        exclusionsByReason: {},
        criticalFindingsCount: 0,
        warningFindingsCount: 0,
        searchConsoleStatus: scStatus,
      };
    }

    const criticalCount = latest.findings.filter((f) => f.severity === 'CRITICAL').length;
    const warningCount = latest.findings.filter((f) => f.severity === 'WARNING').length;

    return {
      totalCandidates: latest.totalCandidates,
      eligibleUrls: latest.eligibleUrls,
      excludedUrls: latest.excludedUrls,
      exclusionsByReason: latest.exclusionsByReason,
      criticalFindingsCount: criticalCount,
      warningFindingsCount: warningCount,
      lastAuditAt: latest.completedAt || latest.createdAt,
      sitemapLastGeneratedAt: latest.completedAt || latest.createdAt,
      searchConsoleStatus: scStatus,
    };
  }

  private mapRow(row: Record<string, unknown>): SeoAuditRun {
    return {
      id: String(row.id),
      runType: row.runType as SeoAuditRun['runType'],
      totalCandidates: Number(row.totalCandidates || 0),
      eligibleUrls: Number(row.eligibleUrls || 0),
      excludedUrls: Number(row.excludedUrls || 0),
      findingsCount: Number(row.findingsCount || 0),
      exclusionsByReason: (row.exclusionsByReason as Record<string, number>) || {},
      findings: (row.findings as SeoAuditRun['findings']) || [],
      sitemapChecksum: row.sitemapChecksum ? String(row.sitemapChecksum) : undefined,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      completedAt: row.completedAt ? (row.completedAt instanceof Date ? row.completedAt.toISOString() : String(row.completedAt)) : undefined,
    };
  }
}

export function resetSeoAuditStoreForTesting(): void {
  MEMORY_SEO_AUDIT_RUNS.clear();
}
