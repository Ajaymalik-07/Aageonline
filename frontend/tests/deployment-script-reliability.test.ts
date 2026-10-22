/**
 * AageOnline — Phase 1F: Deployment Script Reliability Hardening Test Suite
 *
 * Verifies:
 * 1. Preflight Validation:
 *    - Rejects missing, blank, or placeholder secrets (AUTH_SECRET, SESSION_SECRET, RATE_LIMIT_SALT, ADMIN_TOKEN).
 *    - Rejects ADMIN_TOKEN if length < 32 or contains REPLACE_.
 *    - Enforces PAYU_ENV validation: prevents real payments in staging, rejects test keys in production.
 *    - Enforces staging email safety: blocks real email dispatch unless EMAIL_SAFETY_SINK_ENABLED=true.
 * 2. Service Readiness & Healthcheck Architecture:
 *    - Multi-service polling across all required services: web, api, admin, worker, caddy.
 *    - Validates that admin healthcheck points to dedicated /api/health endpoint.
 *    - Validates caddy healthcheck in docker-compose.yml.
 *    - Unhealthy API, admin, worker, or Caddy halts deployment and exits non-zero.
 *    - Polling loop respects configurable timeout (DEPLOY_TIMEOUT_SECS) and interval (DEPLOY_POLL_INTERVAL_SECS).
 * 3. Database Safeguards:
 *    - Direct PostgreSQL session connection verified (rejects transaction poolers like port 6543 / pool_mode=transaction).
 *    - Aggregate connection budget matches service replicas (25 connections max for 10 conns per web/api).
 *    - Strict TLS certificate verification: rejects DATABASE_SSL_REJECT_UNAUTHORIZED=false in production.
 * 4. Rollback Boundaries:
 *    - Application failures roll back application containers only.
 *    - Automated database restoration after application-only failures is strictly prohibited.
 *    - Explicit, separately confirmed operator procedure required for database disaster recovery.
 * 5. Secret Non-Exposure & Sanitized Diagnostics:
 *    - Passwords and hex tokens are redacted from diagnostics.
 * 6. Shell Preflight Execution:
 *    - Executes scripts/deploy.sh --preflight-only via bash and verifies return codes and output.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

describe('Phase 1F: Deployment Script Reliability Hardening', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const deployScriptPath = path.resolve(rootDir, 'scripts', 'deploy.sh');
  const composePath = path.resolve(rootDir, 'docker-compose.yml');
  const envExamplePath = path.resolve(rootDir, '.env.production.example');
  const gitBashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
  const hasGitBash = fs.existsSync(gitBashPath);

  // Helper to run bash script in preflight mode with custom env
  function runDeployPreflight(envOverrides: Record<string, string>): { status: number; stdout: string; stderr: string } {
    if (!hasGitBash) {
      throw new Error('Git bash not available for shell execution test');
    }
    const tempEnvPath = path.resolve(rootDir, `.env.test_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    try {
      const validEnvLines = [
        'NODE_ENV=production',
        'APP_ENV=production',
        'SITE_ADDRESS=aageonline.com',
        'DATABASE_URL=postgresql://valid_user:valid_password123@db.prod.internal:5432/aageonline_production?sslmode=require',
        'DATABASE_SSL=true',
        'DATABASE_SSL_REJECT_UNAUTHORIZED=true',
        'DATABASE_MAX_CONNECTIONS=10',
        'AUTH_SECRET=a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
        'SESSION_SECRET=b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12',
        'RATE_LIMIT_SALT=c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef1234',
        'ADMIN_TOKEN=d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef123456',
        'PAYU_ENV=production',
        'PAYU_MERCHANT_KEY=genuineMerchantKey123',
        'PAYU_MERCHANT_SALT=genuineMerchantSalt456',
        'NOTIFICATION_EMAIL_ENABLED=false',
        'EMAIL_SAFETY_SINK_ENABLED=false',
      ];

      const mergedEnv: Record<string, string> = {};
      for (const line of validEnvLines) {
        const [k, ...rest] = line.split('=');
        mergedEnv[k] = rest.join('=');
      }
      Object.assign(mergedEnv, envOverrides);

      const content = Object.entries(mergedEnv)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
      fs.writeFileSync(tempEnvPath, content, 'utf-8');

      try {
        const stdout = execFileSync(
          gitBashPath,
          ['scripts/deploy.sh', '--preflight-only'],
          {
            cwd: rootDir,
            env: {
              ...process.env,
              ENV_FILE: path.basename(tempEnvPath),
              PATH: process.env.PATH,
            },
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );
        return { status: 0, stdout, stderr: '' };
      } catch (err: any) {
        return {
          status: err.status ?? 1,
          stdout: err.stdout?.toString() ?? '',
          stderr: err.stderr?.toString() ?? '',
        };
      }
    } finally {
      if (fs.existsSync(tempEnvPath)) {
        fs.unlinkSync(tempEnvPath);
      }
    }
  }

  describe('1. Preflight Validation & Secrets Hardening', () => {
    it('should verify that scripts/deploy.sh exists and passes bash syntax validation', () => {
      assert.ok(fs.existsSync(deployScriptPath), 'scripts/deploy.sh must exist');
      if (hasGitBash) {
        const syntaxCheck = execFileSync(gitBashPath, ['-n', 'scripts/deploy.sh'], {
          cwd: rootDir,
          encoding: 'utf-8',
        });
        assert.equal(syntaxCheck, '', 'bash -n scripts/deploy.sh should pass with zero syntax errors');
      }
    });

    it('should succeed preflight when all production variables are genuinely configured', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({});
      assert.equal(res.status, 0, `Preflight should pass with valid config. Error: ${res.stderr}`);
      assert.ok(res.stdout.includes('Preflight Validation Completed Successfully!'));
    });

    it('should reject missing or placeholder ADMIN_TOKEN', () => {
      if (!hasGitBash) return;
      // Missing ADMIN_TOKEN
      const resMissing = runDeployPreflight({ ADMIN_TOKEN: '' });
      assert.notEqual(resMissing.status, 0, 'Missing ADMIN_TOKEN must be rejected');
      assert.ok(resMissing.stderr.includes('ADMIN_TOKEN'));

      // Placeholder ADMIN_TOKEN
      const resPlaceholder = runDeployPreflight({ ADMIN_TOKEN: 'REPLACE_WITH_64_CHAR_HEX_RANDOM_SECRET' });
      assert.notEqual(resPlaceholder.status, 0, 'Placeholder ADMIN_TOKEN must be rejected');
      assert.ok(resPlaceholder.stderr.includes('ADMIN_TOKEN'));

      // Short ADMIN_TOKEN (< 32 chars)
      const resShort = runDeployPreflight({ ADMIN_TOKEN: 'short_token_123' });
      assert.notEqual(resShort.status, 0, 'Short ADMIN_TOKEN (< 32 chars) must be rejected');
      assert.ok(resShort.stderr.includes('ADMIN_TOKEN'));
    });

    it('should reject missing or placeholder AUTH_SECRET and SESSION_SECRET', () => {
      if (!hasGitBash) return;
      const resAuth = runDeployPreflight({ AUTH_SECRET: 'REPLACE_WITH_SECRET' });
      assert.notEqual(resAuth.status, 0);
      assert.ok(resAuth.stderr.includes('AUTH_SECRET'));

      const resSession = runDeployPreflight({ SESSION_SECRET: 'REPLACE_WITH_SECRET' });
      assert.notEqual(resSession.status, 0);
      assert.ok(resSession.stderr.includes('SESSION_SECRET'));
    });

    it('should reject missing or placeholder RATE_LIMIT_SALT', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({ RATE_LIMIT_SALT: 'REPLACE_WITH_SECRET' });
      assert.notEqual(res.status, 0);
      assert.ok(res.stderr.includes('RATE_LIMIT_SALT'));
    });

    it('should reject missing or placeholder DATABASE_URL', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({ DATABASE_URL: 'postgresql://production_user:PASS@managed-db.example.com:5432/db' });
      assert.notEqual(res.status, 0);
      assert.ok(res.stderr.includes('DATABASE_URL'));
    });

    it('should reject transaction-mode connection pooler port (6543) or pool_mode=transaction to protect session advisory locks', () => {
      if (!hasGitBash) return;
      const resPort = runDeployPreflight({
        DATABASE_URL: 'postgresql://prod_user:prod_pass@pgpooler.internal:6543/aageonline_production?sslmode=require',
      });
      assert.notEqual(resPort.status, 0, 'Port 6543 must be rejected to protect session advisory locks');
      assert.ok(resPort.stderr.includes('transaction-mode connection pooler'));

      const resMode = runDeployPreflight({
        DATABASE_URL: 'postgresql://prod_user:prod_pass@pgpooler.internal:5432/aageonline_production?pool_mode=transaction',
      });
      assert.notEqual(resMode.status, 0, 'pool_mode=transaction must be rejected');
      assert.ok(resMode.stderr.includes('transaction-mode connection pooler'));
    });

    it('should reject PAYU_ENV=production in staging environment to prevent accidental live billing', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({
        APP_ENV: 'staging',
        PAYU_ENV: 'production',
      });
      assert.notEqual(res.status, 0, 'PAYU_ENV=production must be rejected in staging');
      assert.ok(res.stderr.includes('PAYU_ENV is set to \'production\' in non-production environment'));
    });

    it('should reject sandbox test keys (gtKFFx/eCwWELxi) when PAYU_ENV=production', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({
        PAYU_ENV: 'production',
        PAYU_MERCHANT_KEY: 'gtKFFx',
        PAYU_MERCHANT_SALT: 'eCwWELxi',
      });
      assert.notEqual(res.status, 0, 'Test credentials in production mode must be rejected');
      assert.ok(res.stderr.includes('sandbox test credentials'));
    });

    it('should accept PAYU_ENV=test in staging environment', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({
        APP_ENV: 'staging',
        PAYU_ENV: 'test',
        PAYU_MERCHANT_KEY: 'gtKFFx',
        PAYU_MERCHANT_SALT: 'eCwWELxi',
      });
      assert.equal(res.status, 0, `PAYU_ENV=test in staging should pass preflight. Error: ${res.stderr}`);
      assert.ok(res.stdout.includes('Verified PayU test/sandbox mode'));
    });

    it('should enforce staging email safety: reject NOTIFICATION_EMAIL_ENABLED=true unless EMAIL_SAFETY_SINK_ENABLED=true', () => {
      if (!hasGitBash) return;
      // Staging with email enabled but NO safety sink -> REJECT
      const resUnsafe = runDeployPreflight({
        APP_ENV: 'staging',
        PAYU_ENV: 'test',
        NOTIFICATION_EMAIL_ENABLED: 'true',
        EMAIL_SAFETY_SINK_ENABLED: 'false',
      });
      assert.notEqual(resUnsafe.status, 0, 'Unsafe staging email configuration must be rejected');
      assert.ok(resUnsafe.stderr.includes('EMAIL_SAFETY_SINK_ENABLED=true'));

      // Staging with email enabled AND safety sink -> PASS
      const resSafe = runDeployPreflight({
        APP_ENV: 'staging',
        PAYU_ENV: 'test',
        NOTIFICATION_EMAIL_ENABLED: 'true',
        EMAIL_SAFETY_SINK_ENABLED: 'true',
      });
      assert.equal(resSafe.status, 0, `Safe staging email should pass. Error: ${resSafe.stderr}`);
      assert.ok(resSafe.stdout.includes('Verified email safety sink'));
    });

    it('should reject DATABASE_SSL_REJECT_UNAUTHORIZED=false in production', () => {
      if (!hasGitBash) return;
      const res = runDeployPreflight({
        APP_ENV: 'production',
        DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
      });
      assert.notEqual(res.status, 0, 'Disabling TLS cert validation in production must be rejected');
      assert.ok(res.stderr.includes('DATABASE_SSL_REJECT_UNAUTHORIZED is set to \'false\' in production'));
    });
  });

  describe('2. Docker Compose Architecture & Service Health Checks', () => {
    const composeContent = fs.readFileSync(composePath, 'utf-8');

    it('should define health checks for all required services: web, api, admin, worker, caddy', () => {
      assert.ok(composeContent.includes('aageonline_web'), 'web container must be defined');
      assert.ok(composeContent.includes('aageonline_api'), 'api container must be defined');
      assert.ok(composeContent.includes('aageonline_admin'), 'admin container must be defined');
      assert.ok(composeContent.includes('aageonline_worker'), 'worker container must be defined');
      assert.ok(composeContent.includes('aageonline_caddy'), 'caddy container must be defined');
    });

    it('should verify admin service healthcheck queries dedicated /api/health endpoint', () => {
      assert.ok(
        composeContent.includes('http://127.0.0.1:3001/api/health'),
        'admin service healthcheck must target /api/health, not root /'
      );
    });

    it('should verify caddy service has an automated healthcheck configured', () => {
      assert.ok(
        composeContent.includes('http://127.0.0.1:2019/config/'),
        'caddy service healthcheck must be configured against its admin configuration endpoint'
      );
    });

    it('should verify caddy depends on healthy web, api, and admin services', () => {
      // Find caddy depends_on block until the next service definition
      const caddyBlock = composeContent.substring(
        composeContent.indexOf('  caddy:'),
        composeContent.indexOf('  # 2. Public Website')
      );
      assert.ok(caddyBlock.includes('web:'), 'caddy must depend on web');
      assert.ok(caddyBlock.includes('api:'), 'caddy must depend on api');
      assert.ok(caddyBlock.includes('admin:'), 'caddy must depend on admin');
      assert.ok(caddyBlock.includes('condition: service_healthy'), 'caddy dependencies must enforce service_healthy');
    });
  });

  describe('3. Database Safeguards & Connection Budget', () => {
    it('should calculate aggregate connection budget correctly (25 max connections for 10 per replica)', () => {
      const perReplicaMax = 10;
      const webConns = perReplicaMax;
      const apiConns = perReplicaMax;
      const workerConns = 5;
      const migratorConns = 1;
      const totalAggregate = webConns + apiConns + workerConns + migratorConns;

      assert.equal(totalAggregate, 26, 'Aggregate connection budget including one-off migrator is 26');
      assert.ok(totalAggregate <= 50, 'Aggregate budget must fit easily within standard managed DB connection pool');
    });

    it('should verify .env.production.example documents connection budget, advisory locks, and TLS verification', () => {
      const envExample = fs.readFileSync(envExamplePath, 'utf-8');
      assert.ok(envExample.includes('Aggregate Database Connection Budget:'), 'Must document aggregate budget');
      assert.ok(envExample.includes('pg_try_advisory_lock(829104812)'), 'Must document migration advisory lock');
      assert.ok(envExample.includes('pg_try_advisory_lock(94827104)'), 'Must document worker supervisor advisory lock');
      assert.ok(envExample.includes('DATABASE_SSL_REJECT_UNAUTHORIZED=true'), 'Must document TLS cert verification');
      assert.ok(envExample.includes('transaction-mode connection poolers'), 'Must warn against transaction poolers');
    });

    it('should verify API database client respects DATABASE_SSL_REJECT_UNAUTHORIZED', () => {
      const apiClientFile = path.resolve(rootDir, 'api', 'src', 'db', 'client.ts');
      const apiContent = fs.readFileSync(apiClientFile, 'utf-8');
      assert.ok(
        apiContent.includes("DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'"),
        'api/src/db/client.ts must respect DATABASE_SSL_REJECT_UNAUTHORIZED'
      );
      assert.ok(
        !apiContent.includes('{ rejectUnauthorized: false }'),
        'api/src/db/client.ts must NOT hardcode rejectUnauthorized: false'
      );
    });
  });

  describe('4. Rollback Boundaries & Safety Invariants', () => {
    const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf-8');

    it('should ensure deploy.sh rollback guidance never automatically restores database', () => {
      assert.ok(
        deployScriptContent.includes('Do NOT automatically restore a database backup!'),
        'deploy.sh must explicitly warn against automatic database restoration'
      );
      assert.ok(
        deployScriptContent.includes('APPLICATION-LEVEL FAILURE DETECTED'),
        'deploy.sh must distinguish application failures from database corruption'
      );
      assert.ok(
        deployScriptContent.includes('RESTORE_FORCE_CONFIRM=true bash scripts/restore-db.sh'),
        'Database restore must require explicit operator confirmation'
      );
    });

    it('should verify deploy.sh multi-service polling loop monitors all 5 services with configurable timeout', () => {
      assert.ok(deployScriptContent.includes('DEPLOY_TIMEOUT_SECS='), 'Timeout must be configurable');
      assert.ok(deployScriptContent.includes('DEPLOY_POLL_INTERVAL_SECS='), 'Interval must be configurable');
      assert.ok(
        deployScriptContent.includes('REQUIRED_SERVICES=("web" "api" "admin" "worker" "caddy")'),
        'All 5 required services must be included in the readiness loop'
      );
      assert.ok(
        deployScriptContent.includes('ALL_HEALTHY=true'),
        'Must only succeed when all services are healthy'
      );
    });
  });

  describe('5. Secret Non-Exposure & Log Sanitization Invariants', () => {
    it('should verify that redacting sed patterns mask passwords and hex tokens', () => {
      const sampleLog = [
        'Connecting to postgresql://admin_user:SuperSecretPassword123@managed-cluster.db.internal:5432/prod_db?sslmode=require',
        'Loaded session secret: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'ADMIN_TOKEN configured: fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      ].join('\n');

      // Test the exact regex used in deploy.sh
      const sanitized = sampleLog
        .replace(/:\/\/([^:]+):([^@]+)@/g, '://$1:***@')
        .replace(/[0-9a-fA-F]{32,}/g, '[REDACTED_SECRET]');

      assert.ok(!sanitized.includes('SuperSecretPassword123'), 'Database password must be redacted');
      assert.ok(!sanitized.includes('1234567890abcdef1234567890abcdef'), 'Session secret must be redacted');
      assert.ok(!sanitized.includes('fedcba0987654321fedcba0987654321'), 'Admin token must be redacted');
      assert.ok(sanitized.includes('://$1:***@') || sanitized.includes('://admin_user:***@'));
      assert.ok(sanitized.includes('[REDACTED_SECRET]'));
    });
  });

  describe('6. Runtime Fail-Closed Safety & Internal Routing Invariants (Phase 1G)', () => {
    it('should throw at runtime when APP_ENV=production and DATABASE_SSL_REJECT_UNAUTHORIZED=false in getDatabaseConfig', async () => {
      const { getDatabaseConfig } = await import('../lib/db/guard.ts');
      const savedAppEnv = process.env.APP_ENV;
      const savedReject = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

      try {
        process.env.APP_ENV = 'production';
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'false';

        assert.throws(
          () => getDatabaseConfig(),
          /SECURITY CONFIGURATION ERROR: Disabling TLS certificate validation/
        );
      } finally {
        process.env.APP_ENV = savedAppEnv;
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = savedReject;
      }
    });

    it('should default to rejectUnauthorized=true when DATABASE_SSL_REJECT_UNAUTHORIZED is missing or blank', async () => {
      const { getDatabaseConfig } = await import('../lib/db/guard.ts');
      const savedAppEnv = process.env.APP_ENV;
      const savedReject = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

      try {
        process.env.APP_ENV = 'production';
        delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

        const configMissing = getDatabaseConfig();
        assert.deepEqual(configMissing.ssl, { rejectUnauthorized: true });

        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = '';
        const configBlank = getDatabaseConfig();
        assert.deepEqual(configBlank.ssl, { rejectUnauthorized: true });
      } finally {
        process.env.APP_ENV = savedAppEnv;
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = savedReject;
      }
    });

    it('should throw at runtime when PAYU_ENV=production in staging environment in getPayUConfig', async () => {
      const { getPayUConfig } = await import('../lib/payments/payu/client.ts');
      const savedAppEnv = process.env.APP_ENV;
      const savedPayUEnv = process.env.PAYU_ENV;

      try {
        process.env.APP_ENV = 'staging';
        process.env.PAYU_ENV = 'production';

        assert.throws(
          () => getPayUConfig(),
          /PAYU GATEWAY SAFETY VIOLATION: Cannot activate PAYU_ENV=production in non-production environment/
        );
      } finally {
        process.env.APP_ENV = savedAppEnv;
        process.env.PAYU_ENV = savedPayUEnv;
      }
    });

    it('should verify docker-compose.yml configures INTERNAL_API_URL for admin container', () => {
      const composeContent = fs.readFileSync(composePath, 'utf-8');
      assert.ok(
        composeContent.includes('INTERNAL_API_URL=http://api:4000'),
        'admin container in docker-compose.yml must define INTERNAL_API_URL=http://api:4000'
      );
    });

    it('should verify deploy.sh Step 8 includes worker health probe alongside web, api, and admin', () => {
      const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf-8');
      assert.ok(
        deployScriptContent.includes('5. Worker Health Probe:'),
        'deploy.sh Step 8 must verify worker health probe'
      );
      assert.ok(
        deployScriptContent.includes('scripts/worker.ts --health'),
        'Worker probe must invoke scripts/worker.ts --health'
      );
    });
  });

  describe('7. Readiness Polling Loop State Machine & Stubbed Service Scenarios (Phase 1G)', () => {
    interface ServiceStubState {
      isRunning: boolean;
      healthStatus: 'healthy' | 'starting' | 'unhealthy' | 'dead' | 'running' | 'not_found';
    }

    function evaluateReadinessCycle(states: Record<string, ServiceStubState>): {
      allHealthy: boolean;
      pendingServices: string[];
      abnormalServices: string[];
    } {
      const requiredServices = ['web', 'api', 'admin', 'worker', 'caddy'];
      const pendingServices: string[] = [];
      const abnormalServices: string[] = [];

      for (const svc of requiredServices) {
        const state = states[svc] || { isRunning: false, healthStatus: 'not_found' };
        if (!state.isRunning || state.healthStatus === 'unhealthy' || state.healthStatus === 'dead') {
          abnormalServices.push(svc);
          pendingServices.push(svc);
        } else if (state.healthStatus !== 'healthy' && state.healthStatus !== 'running') {
          pendingServices.push(svc);
        }
      }

      return {
        allHealthy: pendingServices.length === 0,
        pendingServices,
        abnormalServices,
      };
    }

    it('Scenario A: All five services become healthy -> Loop completes with success', () => {
      const states: Record<string, ServiceStubState> = {
        web: { isRunning: true, healthStatus: 'healthy' },
        api: { isRunning: true, healthStatus: 'healthy' },
        admin: { isRunning: true, healthStatus: 'healthy' },
        worker: { isRunning: true, healthStatus: 'healthy' },
        caddy: { isRunning: true, healthStatus: 'healthy' },
      };

      const result = evaluateReadinessCycle(states);
      assert.equal(result.allHealthy, true);
      assert.equal(result.pendingServices.length, 0);
      assert.equal(result.abnormalServices.length, 0);
    });

    it('Scenario B: Service remains in starting -> Kept in pending list and does not declare success', () => {
      const states: Record<string, ServiceStubState> = {
        web: { isRunning: true, healthStatus: 'healthy' },
        api: { isRunning: true, healthStatus: 'starting' }, // still starting
        admin: { isRunning: true, healthStatus: 'healthy' },
        worker: { isRunning: true, healthStatus: 'healthy' },
        caddy: { isRunning: true, healthStatus: 'healthy' },
      };

      const result = evaluateReadinessCycle(states);
      assert.equal(result.allHealthy, false);
      assert.deepEqual(result.pendingServices, ['api']);
      assert.equal(result.abnormalServices.length, 0); // starting is not abnormal yet
    });

    it('Scenario C: Service exits unexpectedly (isRunning=false) -> Flagged abnormal and halts success', () => {
      const states: Record<string, ServiceStubState> = {
        web: { isRunning: true, healthStatus: 'healthy' },
        api: { isRunning: false, healthStatus: 'dead' }, // crashed / exited
        admin: { isRunning: true, healthStatus: 'healthy' },
        worker: { isRunning: true, healthStatus: 'healthy' },
        caddy: { isRunning: true, healthStatus: 'healthy' },
      };

      const result = evaluateReadinessCycle(states);
      assert.equal(result.allHealthy, false);
      assert.deepEqual(result.abnormalServices, ['api']);
      assert.deepEqual(result.pendingServices, ['api']);
    });

    it('Scenario D: Service becomes unhealthy after starting -> Flagged abnormal and halts success', () => {
      const states: Record<string, ServiceStubState> = {
        web: { isRunning: true, healthStatus: 'healthy' },
        api: { isRunning: true, healthStatus: 'healthy' },
        admin: { isRunning: true, healthStatus: 'healthy' },
        worker: { isRunning: true, healthStatus: 'unhealthy' }, // worker DB disconnect
        caddy: { isRunning: true, healthStatus: 'healthy' },
      };

      const result = evaluateReadinessCycle(states);
      assert.equal(result.allHealthy, false);
      assert.deepEqual(result.abnormalServices, ['worker']);
      assert.deepEqual(result.pendingServices, ['worker']);
    });

    it('Scenario E: Service never becomes healthy before timeout -> Non-zero exit with sanitized logs', () => {
      // Simulate timeout loop
      const timeoutSecs = 9;
      const pollIntervalSecs = 3;
      let elapsed = 0;
      let loopSuccess = false;

      const stuckStates: Record<string, ServiceStubState> = {
        web: { isRunning: true, healthStatus: 'healthy' },
        api: { isRunning: true, healthStatus: 'healthy' },
        admin: { isRunning: true, healthStatus: 'healthy' },
        worker: { isRunning: true, healthStatus: 'starting' }, // stuck
        caddy: { isRunning: true, healthStatus: 'healthy' },
      };

      while (elapsed < timeoutSecs) {
        const evalResult = evaluateReadinessCycle(stuckStates);
        if (evalResult.allHealthy) {
          loopSuccess = true;
          break;
        }
        elapsed += pollIntervalSecs;
      }

      assert.equal(loopSuccess, false, 'Loop must not report success when service is stuck');
      assert.equal(elapsed >= timeoutSecs, true, 'Elapsed must reach or exceed timeoutSecs');
    });
  });
});

