/**
 * AageOnline — Production Payment Readiness & Safety Switch
 *
 * Enforces strict pre-flight checks before permitting live real-money payment initiation.
 * Prevents running in-memory or unmigrated persistence in production.
 */

import { checkDatabaseHealth, isDatabaseConfigured, isProductionPersistenceRequired } from './client.ts';
import { getDbPool } from './client.ts';
import { getAppliedMigrations, loadMigrationFiles } from './migrator.ts';
import { PostgresHeartbeatRepository } from './repositories/heartbeat-repository.ts';
import { PostgresRecoveryRepository } from './repositories/recovery-repository.ts';
import { PostgresPaymentRepository } from './repositories/payment-repository.ts';

export type CheckStatus = 'PASS' | 'FAIL' | 'DEGRADED' | 'NOT_CONFIGURED' | 'NOT_VERIFIED';

export interface ReadinessCheckResult {
  ready: boolean;
  environment: string;
  checks: {
    databaseConfigured: boolean;
    databaseReachable: boolean;
    migrationsApplied: boolean;
    missingMigrations?: string[];
    productionPersistenceRequired: boolean;
    payuConfigured: boolean;
    payuEnvironment: string;
    workerHeartbeatStatus?: CheckStatus;
    lastWorkerHeartbeatAt?: string;
    overdueRecoveryJobsCount?: number;
    unresolvedConfirmedPaymentsCount?: number;
  };
  operationalStatus: {
    database: CheckStatus;
    migrations: CheckStatus;
    payu: CheckStatus;
    workerHeartbeat: CheckStatus;
    recoveryQueue: CheckStatus;
  };
  errors: string[];
}

const heartbeatRepo = new PostgresHeartbeatRepository();
const recoveryRepo = new PostgresRecoveryRepository();
const paymentRepo = new PostgresPaymentRepository();

/**
 * Performs a comprehensive readiness and operational audit.
 */
export async function checkProductionReadiness(): Promise<ReadinessCheckResult> {
  const envName = process.env.NODE_ENV || process.env.APP_ENV || 'development';
  const errors: string[] = [];

  const dbConfigured = isDatabaseConfigured();
  const dbHealth = await checkDatabaseHealth();
  const prodRequired = isProductionPersistenceRequired();

  let migrationsApplied = false;
  let missingMigrations: string[] = [];

  let workerHeartbeatStatus: CheckStatus = 'NOT_CONFIGURED';
  let lastWorkerHeartbeatAt: string | undefined;
  let overdueRecoveryJobsCount = 0;
  let unresolvedConfirmedPaymentsCount = 0;

  if (dbConfigured && dbHealth.healthy) {
    try {
      const pool = getDbPool();
      const client = await pool.connect();
      try {
        const applied = await getAppliedMigrations(client);
        const appliedSet = new Set(applied.map((m) => m.version));
        const allFiles = loadMigrationFiles();
        missingMigrations = allFiles.filter((f) => !appliedSet.has(f.version)).map((f) => f.name);
        migrationsApplied = missingMigrations.length === 0;
      } finally {
        client.release();
      }

      // Check worker heartbeat
      const latestHeartbeat = await heartbeatRepo.getLatestHeartbeat('reconciler-worker');
      if (latestHeartbeat) {
        lastWorkerHeartbeatAt = latestHeartbeat.lastHeartbeatAt;
        const ageMs = Date.now() - new Date(latestHeartbeat.lastHeartbeatAt).getTime();
        if (ageMs <= 15 * 60 * 1000) {
          workerHeartbeatStatus = 'PASS';
        } else {
          workerHeartbeatStatus = 'DEGRADED';
        }
      } else {
        workerHeartbeatStatus = 'NOT_CONFIGURED';
      }

      // Check recovery queue stats
      const recoveryStats = await recoveryRepo.getRecoveryStats();
      overdueRecoveryJobsCount = recoveryStats.overdueEligibleCount;

      const paymentStats = await paymentRepo.getPaymentOperationalStats();
      unresolvedConfirmedPaymentsCount = paymentStats.confirmedUnsettledCount;
    } catch (err) {
      errors.push(`Failed to inspect database operational state: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // PayU configuration
  const payuKey = process.env.PAYU_MERCHANT_KEY;
  const payuSalt = process.env.PAYU_MERCHANT_SALT;
  const payuEnv = process.env.PAYU_ENV || 'test';
  const payuConfigured = Boolean(payuKey && payuSalt && payuSalt.trim().length > 0);

  if (prodRequired) {
    if (!dbConfigured) {
      errors.push('Production environment requires DATABASE_URL to be set.');
    }
    if (!dbHealth.healthy) {
      errors.push(`Database connection failed: ${dbHealth.error}`);
    }
    if (!migrationsApplied) {
      errors.push(`Pending database migrations detected: ${missingMigrations.join(', ')}`);
    }
    if (!payuConfigured) {
      errors.push('PayU merchant credentials (PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT) are incomplete.');
    }
    if (payuEnv !== 'production') {
      errors.push(`PAYU_ENV is set to "${payuEnv}". Live money requires PAYU_ENV=production.`);
    }
  }

  const dbStatus: CheckStatus = dbHealth.healthy ? 'PASS' : dbConfigured ? 'FAIL' : 'NOT_CONFIGURED';
  const migrationStatus: CheckStatus = migrationsApplied ? 'PASS' : dbHealth.healthy ? 'FAIL' : 'NOT_VERIFIED';
  const payuStatus: CheckStatus = payuConfigured ? (payuEnv === 'production' || !prodRequired ? 'PASS' : 'DEGRADED') : 'NOT_CONFIGURED';
  const recoveryQueueStatus: CheckStatus = overdueRecoveryJobsCount > 0 ? 'DEGRADED' : 'PASS';

  return {
    ready: errors.length === 0,
    environment: envName,
    checks: {
      databaseConfigured: dbConfigured,
      databaseReachable: dbHealth.healthy,
      migrationsApplied,
      missingMigrations: missingMigrations.length > 0 ? missingMigrations : undefined,
      productionPersistenceRequired: prodRequired,
      payuConfigured,
      payuEnvironment: payuEnv,
      workerHeartbeatStatus,
      lastWorkerHeartbeatAt,
      overdueRecoveryJobsCount,
      unresolvedConfirmedPaymentsCount,
    },
    operationalStatus: {
      database: dbStatus,
      migrations: migrationStatus,
      payu: payuStatus,
      workerHeartbeat: workerHeartbeatStatus,
      recoveryQueue: recoveryQueueStatus,
    },
    errors,
  };
}

/**
 * Asserts readiness, throwing an operational error if live money cannot safely proceed.
 */
export async function assertLivePaymentReady(): Promise<void> {
  const check = await checkProductionReadiness();
  if (!check.ready && check.checks.productionPersistenceRequired) {
    throw new Error(
      `UNSAFE PAYMENT INITIATION BLOCKED: System failed production readiness audit. Reasons:\n- ${check.errors.join(
        '\n- '
      )}`
    );
  }
}
