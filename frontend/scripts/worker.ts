/**
 * AageOnline — Background Reconciler Worker CLI Script
 *
 * Usage:
 *   Continuous daemon: npm run worker
 *   Single execution:  npm run worker:once
 *   Health probe:      node --experimental-strip-types scripts/worker.ts --health
 */

import { runSingleReconcilerCycle } from '../lib/workers/reconciler-worker.ts';
import { WorkerSupervisor } from '../lib/workers/supervisor.ts';
import { checkDatabaseHealth } from '../lib/db/client.ts';
import { PostgresHeartbeatRepository } from '../lib/db/repositories/heartbeat-repository.ts';

const isOnce = process.argv.includes('--once');
const isHealth = process.argv.includes('--health');

async function main() {
  // 1. Health Probe Mode (Used by Docker / container supervisor healthchecks)
  if (isHealth) {
    const dbHealth = await checkDatabaseHealth();
    const heartbeatRepo = new PostgresHeartbeatRepository();
    const latestHeartbeat = await heartbeatRepo.getLatestHeartbeat('reconciler-worker');

    let isHealthy = dbHealth.healthy;
    let heartbeatAgeSeconds: number | null = null;

    if (latestHeartbeat) {
      heartbeatAgeSeconds = Math.floor(
        (Date.now() - new Date(latestHeartbeat.lastHeartbeatAt).getTime()) / 1000
      );
      if (latestHeartbeat.status === 'STOPPED') {
        isHealthy = false;
      } else if (heartbeatAgeSeconds > 300) {
        // Heartbeat older than 5 minutes is considered unhealthy
        isHealthy = false;
      }
    }

    const healthReport = {
      healthy: isHealthy,
      database: dbHealth.healthy ? 'CONNECTED' : 'DISCONNECTED',
      databaseLatencyMs: dbHealth.latencyMs,
      workerType: 'reconciler-worker',
      lastHeartbeatAt: latestHeartbeat?.lastHeartbeatAt || null,
      heartbeatAgeSeconds,
      status: isHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(healthReport));
    process.exit(isHealthy ? 0 : 1);
  }

  console.log('--- AageOnline Background Reconciler & Recovery Worker ---');

  const health = await checkDatabaseHealth();
  if (health.healthy) {
    console.log(`Connected to PostgreSQL database (${health.latencyMs}ms).`);
  } else {
    console.warn(`Warning: PostgreSQL not connected (${health.error}). Running in fallback mode.`);
  }

  // 2. Single Run Mode
  if (isOnce) {
    console.log('Running single reconciler cycle (--once)...');
    const result = await runSingleReconcilerCycle('cli-worker-once');
    if ('skipped' in result) {
      console.log(`Cycle skipped: ${result.reason}`);
    } else {
      console.log('Cycle completed successfully:');
      console.log(`- Duration: ${result.durationMs}ms`);
      console.log(`- Payment candidates: ${result.paymentReconciliation.candidateCount}`);
      console.log(`- Payments confirmed: ${result.paymentReconciliation.confirmedCount}`);
      console.log(`- Settlements recovered: ${result.settlementRecovery.recoveredCount}`);
      console.log(`- Settlement retryable: ${result.settlementRecovery.retryableCount}`);
      console.log(`- Terminal failures: ${result.settlementRecovery.terminalFailedCount}`);
      console.log(`- Invalidations recovered: ${result.invalidationRecovery?.recoveredCount || 0}`);
      console.log(`- Invalidations remaining: ${result.invalidationRecovery?.remainingCount || 0}`);
    }
    process.exit(0);
  }

  // 3. Continuous Supervised Daemon Mode
  const intervalMs = process.env.WORKER_INTERVAL_MS
    ? parseInt(process.env.WORKER_INTERVAL_MS, 10)
    : 30000;

  const supervisor = new WorkerSupervisor({
    intervalMs,
    onCycleComplete: (summary) => {
      if ('skipped' in summary) {
        console.log(`[Supervisor] ${summary.reason}`);
      } else {
        console.log(
          `[Supervisor] Cycle completed in ${summary.durationMs}ms. Payments confirmed: ${summary.paymentReconciliation.confirmedCount}, Settlements recovered: ${summary.settlementRecovery.recoveredCount}.`
        );
      }
    },
    onError: (err, count) => {
      console.error(`[Supervisor] Cycle error (attempt ${count}):`, err);
    },
  });

  supervisor.start();

  const shutdown = async () => {
    console.log('\nReceived termination signal, shutting down worker supervisor gracefully...');
    await supervisor.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
