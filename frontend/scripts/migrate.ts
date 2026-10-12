/**
 * AageOnline — Database Migration CLI Script
 *
 * Usage: npm run db:migrate
 */

import { runMigrations } from '../lib/db/migrator.ts';
import { checkDatabaseHealth } from '../lib/db/client.ts';

async function main() {
  console.log('--- AageOnline Database Migration Runner ---');
  const health = await checkDatabaseHealth();
  if (!health.healthy) {
    console.error('Database connection failed:', health.error);
    process.exit(1);
  }

  console.log(`Connected to PostgreSQL (${health.latencyMs}ms). Applying pending migrations...`);
  const result = await runMigrations();
  console.log(`Migration Summary:`);
  console.log(`- Already applied: ${result.alreadyAppliedCount}`);
  console.log(`- Newly applied:   ${result.appliedCount}`);
  if (result.appliedMigrations.length > 0) {
    console.log(`- Applied files:   ${result.appliedMigrations.join(', ')}`);
  }
  console.log('Database schema is up to date.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
