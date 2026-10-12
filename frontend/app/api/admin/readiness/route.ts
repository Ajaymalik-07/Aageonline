/**
 * AageOnline — Production Readiness Check API Endpoint
 *
 * GET /api/admin/readiness
 *
 * Returns operational status of database connectivity, migrations, payment gateways,
 * worker heartbeats, and recovery queues.
 */

import { NextResponse } from 'next/server';
import { checkProductionReadiness } from '../../../../lib/db/readiness.ts';
import { authService } from '../../../../data-access/auth/index.ts';
import { isPlatformAdmin } from '../../../../lib/auth/admin-guard.ts';

export async function GET() {
  try {
    const report = await checkProductionReadiness();
    const user = await authService.getCurrentUser().catch(() => null);
    const isAdmin = isPlatformAdmin(user);

    const status = report.ready ? 200 : 503;

    // Detailed diagnostic response for authenticated administrators
    if (isAdmin) {
      return NextResponse.json({ data: report }, { status });
    }

    // Public sanitized summary
    return NextResponse.json(
      {
        data: {
          ready: report.ready,
          environment: report.environment,
          operationalStatus: report.operationalStatus,
        },
      },
      { status }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: 'READINESS_CHECK_FAILED',
          message: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}
