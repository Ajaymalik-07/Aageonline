/**
 * AageOnline — Production Machine-Checkable Health & Readiness API
 * Milestone 0.19.0: Production Readiness, Distributed State & Live Infrastructure Verification
 *
 * GET /api/health?mode=liveness | readiness | operational
 *
 * Separate check boundaries:
 * 1. Liveness: Process is alive and accepting HTTP traffic (Kube/Docker liveness probe).
 * 2. Readiness: Mandatory production dependencies (PostgreSQL, schema migrations 001-010, persistence guards) are ready.
 *    Returns HTTP 503 if mandatory database dependencies fail in production.
 * 3. Operational: Background recovery, heartbeats, and queue backlog status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkProductionReadiness } from '../../../lib/db/readiness.ts';
import { checkDatabaseHealth, isProductionPersistenceRequired } from '../../../lib/db/client.ts';

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode') || 'liveness';

  // 1. Liveness Probe
  if (mode === 'liveness') {
    return NextResponse.json(
      {
        status: 'UP',
        service: 'aageonline-platform',
        mode: 'liveness',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // 2. Readiness Probe
  if (mode === 'readiness') {
    const readiness = await checkProductionReadiness();
    const isProd = isProductionPersistenceRequired();
    const isReady = readiness.ready && (!isProd || (readiness.checks.databaseReachable && readiness.checks.migrationsApplied));

    const statusCode = isReady ? 200 : 503;

    return NextResponse.json(
      {
        status: isReady ? 'UP' : 'DOWN',
        service: 'aageonline-platform',
        mode: 'readiness',
        environment: readiness.environment,
        ready: isReady,
        checks: {
          databaseReachable: readiness.checks.databaseReachable,
          migrationsApplied: readiness.checks.migrationsApplied,
          missingMigrations: readiness.checks.missingMigrations,
          productionPersistenceRequired: readiness.checks.productionPersistenceRequired,
          payuConfigured: readiness.checks.payuConfigured,
        },
        errors: readiness.errors,
        timestamp: new Date().toISOString(),
      },
      {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // 3. Operational Health Probe
  if (mode === 'operational') {
    const readiness = await checkProductionReadiness();
    const dbHealth = await checkDatabaseHealth();

    const isHealthy =
      dbHealth.healthy &&
      readiness.operationalStatus.recoveryQueue !== 'FAIL' &&
      readiness.operationalStatus.workerHeartbeat !== 'FAIL';

    return NextResponse.json(
      {
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        service: 'aageonline-platform',
        mode: 'operational',
        operationalStatus: readiness.operationalStatus,
        metrics: {
          databaseLatencyMs: dbHealth.latencyMs,
          overdueRecoveryJobsCount: readiness.checks.overdueRecoveryJobsCount,
          unresolvedConfirmedPaymentsCount: readiness.checks.unresolvedConfirmedPaymentsCount,
          lastWorkerHeartbeatAt: readiness.checks.lastWorkerHeartbeatAt,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INVALID_HEALTH_MODE',
        message: 'Unsupported health check mode. Use "liveness", "readiness", or "operational".',
      },
    },
    { status: 400 }
  );
}
