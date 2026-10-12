/**
 * AageOnline — Admin SEO Audit & Sitemap Automation API
 *
 * GET  /api/admin/seo/audit — Retrieves latest SEO audit summary and findings.
 * POST /api/admin/seo/audit — Triggers an on-demand comprehensive SEO audit sweep.
 *
 * Requires platform administrator authorization.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { authService } from '../../../../../data-access/auth/index.ts';
import { assertAdminOrWorker } from '../../../../../lib/auth/admin-guard.ts';
import { runComprehensiveSeoAudit } from '../../../../../lib/seo/discovery-audit.ts';
import { PostgresSeoAuditRepository } from '../../../../../lib/db/repositories/seo-audit-repository.ts';
import { recordAuditEvent } from '../../../../../lib/audit/store.ts';

const seoAuditRepo = new PostgresSeoAuditRepository();

export async function GET(request: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertAdminOrWorker(request.headers, user);

    const summary = await seoAuditRepo.getOperationalSummary();
    const latestRun = await seoAuditRepo.getLatestAuditRun();

    return NextResponse.json({
      data: {
        summary,
        latestRun,
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'SEO_AUDIT_QUERY_FAILED',
          message: errorObj.message || 'Failed to retrieve SEO audit summary.',
        },
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    const actor = assertAdminOrWorker(request.headers, user);

    recordAuditEvent(
      'SEO_AUDIT_TRIGGERED',
      'SeoAuditRun',
      'manual-trigger',
      actor.actorId,
      { isWorker: actor.isWorker }
    );

    const auditRun = await runComprehensiveSeoAudit('MANUAL');
    await seoAuditRepo.createAuditRun(auditRun);

    recordAuditEvent(
      'SEO_AUDIT_COMPLETED',
      'SeoAuditRun',
      auditRun.id,
      actor.actorId,
      {
        totalCandidates: auditRun.totalCandidates,
        eligibleUrls: auditRun.eligibleUrls,
        excludedUrls: auditRun.excludedUrls,
        findingsCount: auditRun.findingsCount,
        sitemapChecksum: auditRun.sitemapChecksum,
      }
    );

    return NextResponse.json({
      data: {
        auditRun,
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'SEO_AUDIT_EXECUTION_FAILED',
          message: errorObj.message || 'Failed to execute SEO audit sweep.',
        },
      },
      { status: statusCode }
    );
  }
}
