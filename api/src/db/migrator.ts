/**
 * AageOnline API — Automated PostgreSQL Migration Runner
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withTransaction, query, getPool } from './client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationResult {
  applied: string[];
  skipped: string[];
  total: number;
}

export function getMigrationsDir(): string {
  // Try relative to api root first, or fallback to frontend/lib/db/migrations
  const candidates = [
    path.resolve(__dirname, '../../../frontend/lib/db/migrations'),
    path.resolve(__dirname, '../../../../frontend/lib/db/migrations'),
    path.resolve(process.cwd(), 'frontend/lib/db/migrations'),
    path.resolve(process.cwd(), '../frontend/lib/db/migrations'),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }

  throw new Error(`Migrations directory not found in any expected location: ${candidates.join(', ')}`);
}

export const MIGRATION_ADVISORY_LOCK_ID = 94827104;

export async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function getAppliedMigrations(): Promise<Set<string>> {
  await ensureMigrationsTable();
  const res = await query<{ version: string; name: string }>(
    'SELECT version, name FROM schema_migrations ORDER BY version ASC'
  );
  return new Set(res.rows.map((r) => r.name));
}

export async function runMigrations(): Promise<MigrationResult> {
  const dir = getMigrationsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // Acquire session-level advisory lock to serialize migrations across concurrent instances
  const pool = getPool();
  const lockClient = await pool.connect();
  await lockClient.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_ID]);

  try {
    const appliedSet = await getAppliedMigrations();
    const applied: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      if (appliedSet.has(file)) {
        skipped.push(file);
        continue;
      }

      const filePath = path.join(dir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const version = file.split('_')[0];

      await withTransaction(async (client) => {
        console.log(`[API Migrator] Applying migration: ${file}`);
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())',
          [version, file]
        );
      });

      applied.push(file);
    }

    return {
      applied,
      skipped,
      total: files.length,
    };
  } finally {
    await lockClient.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_ID]).catch(() => {});
    lockClient.release();
  }
}
