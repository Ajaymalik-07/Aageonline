import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations as runApiMigrations, getAppliedMigrations as getApiApplied, MIGRATION_ADVISORY_LOCK_ID } from '../src/db/migrator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=([^\r\n]+)/);
if (!match) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

process.env.DATABASE_URL = match[1].trim();
const pool = new pg.Pool({ connectionString: match[1].trim() });

async function verifyMigrations() {
  console.log('=== 4. REVIEW MIGRATION CONSISTENCY & CONCURRENCY ===');

  // 1. Current Migration History
  const historyRes = await pool.query('SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC');
  console.log(`Current migrations applied in SQL: ${historyRes.rows.length}`);
  historyRes.rows.forEach(r => {
    console.log(`- ${r.version}: ${r.name} (applied: ${r.applied_at.toISOString()})`);
  });

  // 2. Repeat Migration Idempotency
  console.log('\n--- Repeat Migration Execution ---');
  const repeatRes = await runApiMigrations();
  console.log('Repeat migration result:', repeatRes);
  if (repeatRes.applied.length !== 0 || repeatRes.skipped.length !== 13) {
    throw new Error('Migration idempotency FAILED: Expected 0 applied, 13 skipped');
  }
  console.log('[PASS] Repeat migration idempotency confirmed (0 applied, 13 skipped).');

  // 3. Concurrency Lock Test
  console.log('\n--- Concurrent Migration Contention Test ---');
  const client1 = await pool.connect();
  let lockAcquired = false;

  try {
    // Client 1 holds advisory lock
    await client1.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_ID]);
    lockAcquired = true;
    console.log(`Client 1 acquired advisory lock ${MIGRATION_ADVISORY_LOCK_ID}`);

    // Client 2 attempts non-blocking try_lock
    const client2 = await pool.connect();
    try {
      const tryRes = await client2.query<{ locked: boolean }>('SELECT pg_try_advisory_lock($1) AS locked', [MIGRATION_ADVISORY_LOCK_ID]);
      console.log('Client 2 try_advisory_lock result:', tryRes.rows[0]);
      if (tryRes.rows[0].locked) {
        throw new Error('Concurrency FAILED: Client 2 was able to acquire lock while Client 1 held it');
      }
      console.log('[PASS] Concurrent migration serialization confirmed: Client 2 was blocked by advisory lock.');
    } finally {
      client2.release();
    }
  } finally {
    if (lockAcquired) {
      await client1.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_ID]);
    }
    client1.release();
  }

  // 4. Fresh Database Installation on disposable database
  console.log('\n--- Fresh Database Installation Test ---');
  const postgresConnStr = match[1].trim().replace('://aage_app:', '://postgres:').replace('/aageonline_dev', '/postgres');
  const adminClient = new pg.Client({
    connectionString: postgresConnStr,
  });
  await adminClient.connect();

  const testDbName = 'aageonline_migration_fresh_test';
  await adminClient.query(`DROP DATABASE IF EXISTS ${testDbName}`);
  await adminClient.query(`CREATE DATABASE ${testDbName} OWNER aage_app`);
  console.log(`Created disposable database ${testDbName}`);

  const freshDbUrl = match[1].trim().replace('/aageonline_dev', `/${testDbName}`);
  const origDbUrl = process.env.DATABASE_URL;
  
  const { closePool } = await import('../src/db/client.ts');
  await closePool();
  process.env.DATABASE_URL = freshDbUrl;

  try {
    // Run all migrations on fresh DB
    const freshResult = await runApiMigrations();
    console.log('Fresh DB migration result:', {
      appliedCount: freshResult.applied.length,
      skippedCount: freshResult.skipped.length,
      total: freshResult.total,
    });

    if (freshResult.applied.length !== 13) {
      throw new Error(`Fresh DB migration FAILED: expected 13 applied, got ${freshResult.applied.length}`);
    }

    // Inspect table count in fresh DB
    const freshPool = new pg.Pool({ connectionString: freshDbUrl });
    const tablesRes = await freshPool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
    console.log(`Total tables created in fresh database: ${tablesRes.rows[0].count}`);
    await freshPool.end();

    if (parseInt(tablesRes.rows[0].count, 10) !== 42) {
      throw new Error(`Fresh DB table count mismatch: expected 42 tables, got ${tablesRes.rows[0].count}`);
    }
    console.log('[PASS] Fresh database installation completely successful: 13/13 migrations applied, 42 tables created.');
  } finally {
    await closePool();
    process.env.DATABASE_URL = origDbUrl;
    await adminClient.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await adminClient.end();
    console.log(`Cleaned up disposable database ${testDbName}`);
  }

  await pool.end();
}

verifyMigrations().then(() => {
  console.log('\n>>> Migration Consistency & Concurrency Tests PASSED.');
  process.exit(0);
}).catch(err => {
  console.error('\n>>> Migration Consistency Test FAILED:', err);
  process.exit(1);
});
