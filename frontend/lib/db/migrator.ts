/**
 * AageOnline — Database Migration Runner
 *
 * Programmatic, version-controlled PostgreSQL schema migration runner.
 * Tracks applied migrations in `schema_migrations` and applies pending migrations atomically.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { getDbPool, withTransaction } from './client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationFile {
  version: string;
  name: string;
  sql: string;
}

export interface MigrationRecord {
  version: string;
  name: string;
  applied_at: string;
}

export interface MigrationResult {
  appliedCount: number;
  appliedMigrations: string[];
  alreadyAppliedCount: number;
}

/**
 * Loads all .sql files from migrations directory sorted by version prefix.
 */
export function loadMigrationFiles(): MigrationFile[] {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => {
    const version = file.split('_')[0];
    const name = file;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    return { version, name, sql };
  });
}

/**
 * Ensures the `schema_migrations` tracking table exists.
 */
export async function ensureMigrationTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * Returns list of already applied migrations.
 */
export async function getAppliedMigrations(client: pg.PoolClient): Promise<MigrationRecord[]> {
  await ensureMigrationTable(client);
  const result = await client.query<MigrationRecord>(
    'SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC'
  );
  return result.rows;
}

export const MIGRATION_ADVISORY_LOCK_ID = 94827104;

/**
 * Runs all pending migrations in order within transactions.
 */
export async function runMigrations(): Promise<MigrationResult> {
  const migrationFiles = loadMigrationFiles();
  const appliedMigrations: string[] = [];
  let alreadyAppliedCount = 0;

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    // Acquire session-level advisory lock to serialize migration execution across concurrent instances
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_ID]);

    await ensureMigrationTable(client);
    const existing = await getAppliedMigrations(client);
    const existingSet = new Set(existing.map((m) => m.version));
    alreadyAppliedCount = existing.length;

    for (const migration of migrationFiles) {
      if (existingSet.has(migration.version)) {
        continue;
      }

      console.log(`Applying migration ${migration.name}...`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())',
          [migration.version, migration.name]
        );
        await client.query('COMMIT');
        appliedMigrations.push(migration.name);
        console.log(`Applied migration ${migration.name} successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration ${migration.name}:`, err);
        throw err;
      }
    }

    return {
      appliedCount: appliedMigrations.length,
      appliedMigrations,
      alreadyAppliedCount,
    };
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_ID]).catch(() => {});
    client.release();
  }
}
