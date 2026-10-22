/**
 * AageOnline API — Persistence, Migrations & Database Reliability Test Suite
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { server } from '../src/server.ts';
import {
  isDatabaseConfigured,
  isProductionEnvironment,
  assertProductionPersistence,
  checkDatabaseHealth,
  closePool,
} from '../src/db/client.ts';
import { getMigrationsDir } from '../src/db/migrator.ts';
import { paymentsRepository, rankingRepository } from '../src/db/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function withTestServer(fn: (baseUrl: string) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const testServer = http.createServer((req, res) => {
      server.emit('request', req, res);
    });

    testServer.listen(0, '127.0.0.1', async () => {
      const address = testServer.address() as { port: number };
      const baseUrl = `http://127.0.0.1:${address.port}`;
      try {
        await fn(baseUrl);
        testServer.closeAllConnections?.();
        testServer.close(() => resolve());
      } catch (err) {
        testServer.closeAllConnections?.();
        testServer.close(() => reject(err));
      }
    });
  });
}

test('Database Persistence & Architecture Test Suite', async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(async () => {
    process.env = { ...originalEnv };
    await closePool();
  });

  await t.test('1. Migration Integrity: All 12 forward migrations exist and are non-empty', async () => {
    const migrationsDir = getMigrationsDir();
    assert.ok(fs.existsSync(migrationsDir), `Migrations dir should exist: ${migrationsDir}`);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    assert.ok(files.length >= 13, `Expected at least 13 SQL migration scripts, got ${files.length}`);

    const expectedSequence = [
      '001_initial_schema.sql',
      '002_bid_intents.sql',
      '003_payments_and_events.sql',
      '004_ranking_settlements_and_history.sql',
      '005_outbox_and_recovery.sql',
      '006_admin_operations.sql',
      '007_ranking_notifications.sql',
      '008_seo_audits.sql',
      '009_performance_indexes.sql',
      '010_durable_invalidation_and_rate_limits.sql',
      '011_user_sessions.sql',
      '012_admin_content_and_governance.sql',
      '013_lead_scraper_and_email_automation.sql',
    ];

    for (let i = 0; i < expectedSequence.length; i++) {
      assert.equal(files[i], expectedSequence[i], `Migration at index ${i} must match sequence`);
      const content = fs.readFileSync(path.join(migrationsDir, files[i]), 'utf-8');
      assert.ok(content.length > 50, `Migration ${files[i]} must not be empty`);
      assert.ok(content.includes('CREATE TABLE') || content.includes('CREATE INDEX'), `Migration ${files[i]} must declare DDL statements`);
    }
  });

  await t.test('2. Fail-Closed Readiness: Database probe returns HTTP 503 when DATABASE_URL is unreachable', async () => {
    // Configure an unreachable database host to test fail-closed behavior
    process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_pass@127.0.0.1:54329/non_existent_db';

    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(res.status, 503, 'Unreachable DATABASE_URL must fail closed with HTTP 503');
      const json = await res.json();
      assert.equal(json.status, 'DEGRADED');
      assert.equal(json.database, 'DISCONNECTED');
      assert.ok(json.error, 'Expected connection error details in response');
    });
  });

  await t.test('3. Fixture Mode: HTTP 200 READY is permitted when NODE_ENV=test and DATABASE_URL is absent', async () => {
    delete process.env.DATABASE_URL;
    // Explicitly mark this as a test environment so the production guard does not activate
    process.env.NODE_ENV = 'test';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isDatabaseConfigured(), false);
    assert.equal(isProductionEnvironment(), false, 'isProductionEnvironment() must be false for NODE_ENV=test');

    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(res.status, 200, 'Non-production env with no DATABASE_URL must return HTTP 200 (fixture mode)');
      const json = await res.json();
      assert.equal(json.status, 'READY');
      assert.equal(json.mode, 'FIXTURE_MODE');
      assert.ok(json.warning.includes('running in deterministic test fixture mode'));
    });
  });

  await t.test('4. Migration 012 Content & Governance DDL Validation', async () => {
    const migrationsDir = getMigrationsDir();
    const m12Path = path.join(migrationsDir, '012_admin_content_and_governance.sql');
    assert.ok(fs.existsSync(m12Path), 'Migration 012 must exist');
    const sql = fs.readFileSync(m12Path, 'utf-8');

    // Assert that all required admin tables are declared in DDL
    const requiredTables = [
      'discovery_requests',
      'content_blocks',
      'blog_posts',
      'url_redirects',
      'newsletter_subscribers',
      'lead_prospects',
      'admin_users',
      'system_settings',
    ];

    for (const table of requiredTables) {
      assert.ok(
        sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`) || sql.includes(`CREATE TABLE ${table}`),
        `Table "${table}" must be declared in migration 012`
      );
    }
  });

  // ─── Phase 1B Regression Tests: Production Fail-Closed Guard ───────────────

  await t.test('5. Production Guard: HTTP 503 UNAVAILABLE when NODE_ENV=production and DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isDatabaseConfigured(), false);
    assert.equal(isProductionEnvironment(), true, 'isProductionEnvironment() must detect NODE_ENV=production');

    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(res.status, 503, 'Production with missing DATABASE_URL must return HTTP 503 (fail closed)');
      const json = await res.json();
      assert.equal(json.status, 'UNAVAILABLE', 'status must be UNAVAILABLE, never READY');
      assert.equal(json.database, 'UNCONFIGURED');
      assert.notEqual(json.status, 'READY', 'Production must never report READY without a database');
      assert.notEqual(json.mode, 'FIXTURE_MODE', 'FIXTURE_MODE must never appear in production responses');
      assert.ok(json.error, 'An error description must be present');
    });
  });

  await t.test('6. Production Guard: HTTP 503 when NODE_ENV=production and DATABASE_URL is blank', async () => {
    process.env.DATABASE_URL = '   '; // blank / whitespace-only
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isDatabaseConfigured(), false, 'Blank DATABASE_URL must register as unconfigured');
    assert.equal(isProductionEnvironment(), true);

    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(res.status, 503, 'Blank DATABASE_URL in production must return HTTP 503');
      const json = await res.json();
      assert.equal(json.status, 'UNAVAILABLE');
      assert.notEqual(json.status, 'READY');
      assert.notEqual(json.mode, 'FIXTURE_MODE');
    });
  });

  await t.test('7. Production Guard: HTTP 503 when APP_ENV=production and DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
    process.env.APP_ENV = 'production';
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isDatabaseConfigured(), false);
    assert.equal(isProductionEnvironment(), true, 'APP_ENV=production must activate the production guard');

    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(res.status, 503, 'APP_ENV=production with missing DATABASE_URL must return HTTP 503');
      const json = await res.json();
      assert.equal(json.status, 'UNAVAILABLE');
      assert.notEqual(json.status, 'READY');
    });
  });

  await t.test('8. assertProductionPersistence(): throws in production with missing DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isProductionEnvironment(), true);
    assert.equal(isDatabaseConfigured(), false);

    assert.throws(
      () => assertProductionPersistence(),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes('PRODUCTION_PERSISTENCE_GUARD'),
          'Error must contain guard sentinel token'
        );
        // Must not leak credential values or expose raw variable contents
        assert.ok(!err.message.includes('postgresql://'), 'Must not embed URL values');
        assert.ok(!err.message.includes('undefined'), 'Must not embed undefined keyword');
        return true;
      }
    );
  });

  await t.test('9. assertProductionPersistence(): does NOT throw in test environment with missing DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isProductionEnvironment(), false);
    assert.doesNotThrow(
      () => assertProductionPersistence(),
      'assertProductionPersistence() must not throw in test environment'
    );
  });

  await t.test('10. assertProductionPersistence(): does NOT throw when DATABASE_URL is configured in production', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/aageonline_prod';
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isProductionEnvironment(), true);
    assert.equal(isDatabaseConfigured(), true);
    assert.doesNotThrow(
      () => assertProductionPersistence(),
      'assertProductionPersistence() must not throw when DATABASE_URL is properly configured'
    );
  });

  // ─── Phase 1C: Financial & Ranking Mutation Guard Regression Tests ──────

  await t.test('11. Conflicting Environment Semantics: Production signals fail closed against conflicting non-prod variables', () => {
    delete process.env.DATABASE_URL;

    // Case A: NODE_ENV=production with non-production APP_ENV and PERSISTENCE_MODE
    process.env.NODE_ENV = 'production';
    process.env.APP_ENV = 'development';
    process.env.PERSISTENCE_MODE = 'memory';
    assert.equal(isProductionEnvironment(), true, 'NODE_ENV=production must not be overridden by APP_ENV=development');
    assert.throws(() => assertProductionPersistence(), /PRODUCTION_PERSISTENCE_GUARD/);

    // Case B: APP_ENV=production with NODE_ENV=test
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'production';
    delete process.env.PERSISTENCE_MODE;
    assert.equal(isProductionEnvironment(), true, 'APP_ENV=production must not be overridden by NODE_ENV=test');
    assert.throws(() => assertProductionPersistence(), /PRODUCTION_PERSISTENCE_GUARD/);

    // Case C: PERSISTENCE_MODE=postgres with non-production NODE_ENV
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;
    process.env.PERSISTENCE_MODE = 'postgres';
    assert.equal(isProductionEnvironment(), true, 'PERSISTENCE_MODE=postgres must enforce production persistence');
    assert.throws(() => assertProductionPersistence(), /PRODUCTION_PERSISTENCE_GUARD/);

    // Case D: PERSISTENCE_MODE=production with NODE_ENV=test
    process.env.NODE_ENV = 'test';
    delete process.env.APP_ENV;
    process.env.PERSISTENCE_MODE = 'production';
    assert.equal(isProductionEnvironment(), true, 'PERSISTENCE_MODE=production must enforce production persistence');
    assert.throws(() => assertProductionPersistence(), /PRODUCTION_PERSISTENCE_GUARD/);

    // Case E: NODE_ENV=prod alias with missing DATABASE_URL
    process.env.NODE_ENV = 'prod';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;
    assert.equal(isProductionEnvironment(), true, 'NODE_ENV=prod alias must activate production guard');
    assert.throws(() => assertProductionPersistence(), /PRODUCTION_PERSISTENCE_GUARD/);
  });

  await t.test('12. API Financial & Ranking Mutation Routes reject production operation with missing or blank DATABASE_URL', async () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_TOKEN = 'test-token';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    await withTestServer(async (baseUrl) => {
      // 12a. POST /api/bid-intents must fail closed with 503 UNAVAILABLE
      const bidRes = await fetch(`${baseUrl}/api/bid-intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
        }),
      });
      assert.equal(bidRes.status, 503, 'POST /api/bid-intents must return 503 in production without database');
      const bidJson = await bidRes.json();
      assert.equal(bidJson.error, 'UNAVAILABLE');
      assert.ok(bidJson.message.includes('PRODUCTION_PERSISTENCE_GUARD'));

      // 12b. Blank DATABASE_URL must also be rejected
      process.env.DATABASE_URL = '   ';
      const blankRes = await fetch(`${baseUrl}/api/bid-intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
        }),
      });
      assert.equal(blankRes.status, 503, 'Blank DATABASE_URL must also fail closed with 503');
      delete process.env.DATABASE_URL;

      // 12c. POST /api/admin/rankings must fail closed with 503 UNAVAILABLE
      const rankRes = await fetch(`${baseUrl}/api/admin/rankings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
          qualifyingAmountRupees: 2500,
        }),
      });
      assert.equal(rankRes.status, 503, 'POST /api/admin/rankings must return 503 in production without database');
      const rankJson = await rankRes.json();
      assert.equal(rankJson.error, 'UNAVAILABLE');
      assert.ok(rankJson.message.includes('PRODUCTION_PERSISTENCE_GUARD'));
    });
  });

  await t.test('13. API Repositories reject execution in production when DATABASE_URL is missing or blank', async () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    // paymentsRepository.create
    await assert.rejects(
      () =>
        paymentsRepository.create({
          bidIntentId: 'bi-test',
          businessId: 'biz-test',
          marketId: 'mkt-test',
          createdByUserId: 'user-test',
          membershipId: 'mem-test',
          amountRupees: 25000,
          idempotencyKey: 'idem-test',
        }),
      /PRODUCTION_PERSISTENCE_GUARD/
    );

    // paymentsRepository.updateStatus
    await assert.rejects(
      () => paymentsRepository.updateStatus('pay-test', 'PAID'),
      /PRODUCTION_PERSISTENCE_GUARD/
    );

    // rankingRepository.executeAtomicRankingSettlement
    await assert.rejects(
      () =>
        rankingRepository.executeAtomicRankingSettlement({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
          qualifyingAmountRupees: 25000,
        }),
      /PRODUCTION_PERSISTENCE_GUARD/
    );
  });

  await t.test('14. Explicit Test Environment can still use intentional fixtures without error', async () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';
    process.env.ADMIN_TOKEN = 'test-token';
    delete process.env.APP_ENV;
    delete process.env.PERSISTENCE_MODE;

    assert.equal(isProductionEnvironment(), false);

    await withTestServer(async (baseUrl) => {
      // POST /api/bid-intents in test mode creates mock fixture successfully
      const bidRes = await fetch(`${baseUrl}/api/bid-intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
        }),
      });
      assert.equal(bidRes.status, 201);
      const bidJson = await bidRes.json();
      assert.equal(bidJson.status, 'INTENT_CREATED');

      // POST /api/admin/rankings in test mode applies fixture message without error
      const rankRes = await fetch(`${baseUrl}/api/admin/rankings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
          qualifyingAmountRupees: 2500,
        }),
      });
      assert.equal(rankRes.status, 200);
      const rankJson = await rankRes.json();
      assert.ok(rankJson.message.includes('fixture mode'));
    });
  });
});
