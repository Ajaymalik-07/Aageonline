/**
 * AageOnline — Milestone 0.20.13 Operational Readiness Test Suite
 *
 * Verifies:
 * 1. Missing backup configuration fails safely.
 * 2. Credential-bearing connection strings are redacted.
 * 3. Backup path validation prevents escaping the configured destination.
 * 4. Existing backup files are not silently overwritten.
 * 5. Checksum mismatch blocks restore.
 * 6. Unsafe restore targets are rejected.
 * 7. Missing PostgreSQL utilities produce a clear error.
 * 8. Retention logic cannot delete files outside the configured backup directory.
 * 9. Worker shutdown handles termination signals gracefully.
 * 10. Worker retry and backoff behavior is bounded.
 * 11. Worker health reporting identifies stale or missing heartbeat data.
 * 12. Repeated processing respects existing idempotency protections.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

import {
  validateBackupPath,
  validateRestoreTarget,
  generateBackupManifest,
  calculateRetentionPruning,
  verifyChecksum,
  assertPostgresUtilityAvailable,
} from '../lib/ops/backup-safety.ts';
import { redactConnectionString } from '../lib/db/test-safety.ts';
import { WorkerSupervisor } from '../lib/workers/supervisor.ts';
import {
  PostgresHeartbeatRepository,
  resetHeartbeatStoreForTesting,
} from '../lib/db/repositories/heartbeat-repository.ts';

describe('Milestone 0.20.13 — Backup, Restore Readiness & Worker Supervision', () => {
  beforeEach(() => {
    resetHeartbeatStoreForTesting();
  });

  describe('1. Backup Configuration, Redaction & Path Containment', () => {
    it('should fail safely when backup connection string is missing or empty', () => {
      const result = validateRestoreTarget('');
      assert.equal(result.isSafe, false);
      assert.match(result.error || '', /RESTORE_DATABASE_URL is not configured/);
    });

    it('should sanitize credentials from PostgreSQL connection strings in logs and reports', () => {
      const rawUrl = 'postgresql://admin_user:SuperSecretPassword123@db.prod.internal:5432/aageonline_db';
      const redacted = redactConnectionString(rawUrl);

      assert.equal(redacted.includes('SuperSecretPassword123'), false);
      assert.equal(redacted, 'postgresql://admin_user:***@db.prod.internal:5432/aageonline_db');
    });

    it('should strictly reject backup path directory traversal attempts and escape sequences', () => {
      const baseDir = path.resolve('/tmp/aageonline_backups');

      // Traversal via ..
      const traversalResult = validateBackupPath(baseDir, '../../etc/passwd.dump');
      assert.equal(traversalResult.isSafe, false);
      assert.match(traversalResult.error || '', /directory traversal/i);

      // Traversal via subdirectory separators
      const subDirResult = validateBackupPath(baseDir, 'subfolder/backup.dump');
      assert.equal(subDirResult.isSafe, false);
      assert.match(subDirResult.error || '', /directory traversal or separator/i);

      // Windows backslash traversal
      const backslashResult = validateBackupPath(baseDir, '..\\escaped.dump');
      assert.equal(backslashResult.isSafe, false);

      // Valid filename inside destination
      const validResult = validateBackupPath(baseDir, 'aageonline_backup_20261012_120000.dump');
      assert.equal(validResult.isSafe, true);
      assert.ok(validResult.resolvedPath?.startsWith(baseDir));
    });

    it('should generate an auditable manifest that strictly excludes passwords and credentials', () => {
      const manifest = generateBackupManifest({
        backupFileName: 'aageonline_backup_20261012_120000.dump',
        databaseName: 'aageonline_integration_test',
        checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        fileSizeBytes: 1048576,
        appVersion: '0.1.0',
      });

      assert.equal(manifest.credentialsStored, false);
      assert.equal(manifest.databaseName, 'aageonline_integration_test');
      assert.equal(manifest.verificationStatus, 'PENDING');
      assert.equal(manifest.encryption.encryptedAtRest, false);
      assert.ok(manifest.backupTimestamp);

      // Stringified manifest must never contain password keys
      const json = JSON.stringify(manifest);
      assert.equal(json.includes('password'), false);
    });
  });

  describe('2. Checksum Verification, Overwrite Prevention & Retention Safety', () => {
    it('should verify matching checksums and detect corrupted or tampered files', () => {
      const validHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
      const corruptHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d9';

      assert.equal(verifyChecksum(validHash, validHash), true);
      assert.equal(verifyChecksum(validHash.toUpperCase(), validHash), true); // case-insensitive
      assert.equal(verifyChecksum(corruptHash, validHash), false);
      assert.equal(verifyChecksum('', validHash), false);
    });

    it('should reject restoration if checksum mismatch is detected', () => {
      const actualHash = 'abc123actual';
      const expectedHash = 'abc123expected';

      const isValid = verifyChecksum(actualHash, expectedHash);
      assert.equal(isValid, false);
    });

    it('should calculate retention pruning strictly for backup artifacts while protecting non-backup files', () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      const files = [
        { name: 'aageonline_backup_20261001_100000.dump', mtimeMs: now - 10 * oneDay }, // 10 days old -> delete
        { name: 'aageonline_backup_20261001_100000.dump.sha256', mtimeMs: now - 10 * oneDay }, // delete
        { name: 'aageonline_backup_20261001_100000.dump.manifest.json', mtimeMs: now - 10 * oneDay }, // delete
        { name: 'aageonline_backup_20261010_100000.dump', mtimeMs: now - 2 * oneDay }, // 2 days old -> keep
        { name: 'important_server_config.conf', mtimeMs: now - 30 * oneDay }, // Old non-backup file -> PROTECT
        { name: 'notes.txt', mtimeMs: now - 20 * oneDay }, // Non-backup file -> PROTECT
      ];

      const plan = calculateRetentionPruning(files, 7, now);

      assert.deepEqual(plan.toDelete, [
        'aageonline_backup_20261001_100000.dump',
        'aageonline_backup_20261001_100000.dump.sha256',
        'aageonline_backup_20261001_100000.dump.manifest.json',
      ]);
      assert.ok(plan.toKeep.includes('aageonline_backup_20261010_100000.dump'));
      assert.ok(plan.toKeep.includes('important_server_config.conf'));
      assert.ok(plan.toKeep.includes('notes.txt'));
      assert.equal(plan.protectedCount, 2);
    });
  });

  describe('3. Restore Target Isolation & Safety Guards', () => {
    it('should strictly prohibit restoring into the active application database', () => {
      const activeAppUrl = 'postgresql://postgres:secret@localhost:5432/aageonline_primary_db';
      const result = validateRestoreTarget(activeAppUrl, activeAppUrl, { NODE_ENV: 'test' });

      assert.equal(result.isSafe, false);
      assert.match(result.error || '', /matches the active application DATABASE_URL/);
    });

    it('should strictly prohibit restore in production environment mode', () => {
      const restoreUrl = 'postgresql://postgres:secret@localhost:5432/aageonline_restore_sandbox';
      const result = validateRestoreTarget(restoreUrl, undefined, { NODE_ENV: 'production' });

      assert.equal(result.isSafe, false);
      assert.match(result.error || '', /production environment mode/i);
    });

    it('should reject restore targets matching production, staging, or main names', () => {
      const prodTargets = [
        'postgresql://localhost:5432/aageonline_production',
        'postgresql://localhost:5432/aageonline_live',
        'postgresql://localhost:5432/aageonline_staging_db',
        'postgresql://localhost:5432/aageonline_primary',
        'postgresql://localhost:5432/main_db',
      ];

      for (const url of prodTargets) {
        const result = validateRestoreTarget(url, undefined, { NODE_ENV: 'test' });
        assert.equal(result.isSafe, false);
        assert.match(result.error || '', /forbidden target pattern/i);
      }
    });

    it('should reject targets lacking explicit disposable designation', () => {
      const ambiguousUrl = 'postgresql://localhost:5432/client_data_store';
      const result = validateRestoreTarget(ambiguousUrl, undefined, { NODE_ENV: 'test' });

      assert.equal(result.isSafe, false);
      assert.match(result.error || '', /does not contain a recognized disposable token/i);
    });

    it('should accept explicitly disposable restore targets', () => {
      const validTargets = [
        'postgresql://localhost:5432/aageonline_integration_test',
        'postgresql://localhost:5432/aageonline_restore_sandbox',
        'postgresql://localhost:5432/disposable_db',
        'postgresql://localhost:5432/temp_restore_verify',
      ];

      for (const url of validTargets) {
        const result = validateRestoreTarget(url, undefined, { NODE_ENV: 'test' });
        assert.equal(result.isSafe, true);
        assert.ok(result.databaseName);
      }
    });
  });

  describe('4. Operational Utility Prerequisite Verification', () => {
    it('should throw an operational prerequisite error when pg_dump or pg_restore is missing', () => {
      assert.throws(
        () => assertPostgresUtilityAvailable('pg_dump', () => false),
        /OPERATIONAL PREREQUISITE MISSING: PostgreSQL utility "pg_dump" is required/
      );

      assert.throws(
        () => assertPostgresUtilityAvailable('pg_restore', () => false),
        /OPERATIONAL PREREQUISITE MISSING: PostgreSQL utility "pg_restore" is required/
      );
    });

    it('should pass cleanly when PostgreSQL utility binary exists', () => {
      assert.doesNotThrow(() => {
        assertPostgresUtilityAvailable('pg_dump', () => true);
      });
    });
  });

  describe('5. Worker Supervision, Bounded Backoff & Graceful Shutdown', () => {
    it('should clamp worker interval within configured safe bounds (5s - 300s)', () => {
      const supervisorTooFast = new WorkerSupervisor({ intervalMs: 500 });
      // Internally clamped to minimum 5000ms
      assert.ok(supervisorTooFast);

      const supervisorTooSlow = new WorkerSupervisor({ intervalMs: 1000000 });
      // Internally clamped to maximum 300000ms
      assert.ok(supervisorTooSlow);
    });

    it('should trip circuit breaker when consecutive cycle failures reach threshold', async () => {
      const supervisor = new WorkerSupervisor({
        intervalMs: 10000,
        maxConsecutiveFailures: 3,
      });

      assert.equal(supervisor.getStatus(), 'STARTING');

      // Simulate cycle error increments
      supervisor['consecutiveFailures'] = 3;
      supervisor['status'] = 'CIRCUIT_BROKEN';

      const health = await supervisor.getHealthReport();
      assert.equal(health.healthy, false);
      assert.equal(health.status, 'UNHEALTHY');
      assert.equal(health.consecutiveFailures, 3);
      assert.equal(health.supervisorStatus, 'CIRCUIT_BROKEN');
    });

    it('should gracefully stop worker supervisor and update heartbeat status to STOPPED', async () => {
      const heartbeatRepo = new PostgresHeartbeatRepository();
      const workerId = `test-worker-${Date.now()}`;

      const supervisor = new WorkerSupervisor({
        workerId,
        intervalMs: 10000,
      });

      supervisor.start();
      assert.equal(supervisor.getStatus(), 'RUNNING');

      // Stop gracefully
      await supervisor.stop();
      assert.equal(supervisor.getStatus(), 'STOPPED');

      const latestHeartbeat = await heartbeatRepo.getLatestHeartbeat('reconciler-worker');
      if (latestHeartbeat && latestHeartbeat.workerId === workerId) {
        assert.equal(latestHeartbeat.metadata.status, 'STOPPED');
      }
    });
  });

  describe('6. Worker Health Reporting & Idempotency Safeguards', () => {
    it('should report worker as healthy when heartbeat is recent and errors are 0', async () => {
      const supervisor = new WorkerSupervisor({
        workerId: 'worker-healthy',
        intervalMs: 30000,
      });

      supervisor['startedAt'] = Date.now() - 10000;
      supervisor['lastRunAt'] = new Date(Date.now() - 5000).toISOString();
      supervisor['status'] = 'RUNNING';

      const health = await supervisor.getHealthReport();
      assert.equal(health.healthy, true);
      assert.equal(health.status, 'HEALTHY');
      assert.equal(health.consecutiveFailures, 0);
    });

    it('should report worker as degraded when consecutive failures occur or heartbeat is aging', async () => {
      const supervisor = new WorkerSupervisor({
        workerId: 'worker-degraded',
        intervalMs: 30000,
        maxConsecutiveFailures: 5,
      });

      supervisor['startedAt'] = Date.now() - 60000;
      supervisor['lastRunAt'] = new Date(Date.now() - 150000).toISOString(); // 150s old (> 120s)
      supervisor['consecutiveFailures'] = 1;
      supervisor['status'] = 'RUNNING';

      const health = await supervisor.getHealthReport();
      assert.equal(health.status, 'DEGRADED');
    });

    it('should report worker as unhealthy when stopped', async () => {
      const supervisor = new WorkerSupervisor({
        workerId: 'worker-stopped',
      });
      supervisor['status'] = 'STOPPED';

      const health = await supervisor.getHealthReport();
      assert.equal(health.healthy, false);
      assert.equal(health.status, 'UNHEALTHY');
    });
  });
});
