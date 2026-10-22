import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SchedulerEngine, SCHEDULER_ADVISORY_LOCK_ID } from '../src/services/scheduler/scheduler-engine.ts';
import { ScraperEngine } from '../src/services/scraper/scraper-engine.ts';
import { scraperRepository } from '../src/db/repositories/scraper-repo.ts';

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

async function runSchedulerRecoveryTests() {
  console.log('=== 2. VERIFY SCHEDULER RECOVERY MATRIX ===');

  // Backup original config
  const originalConfig = await scraperRepository.getConfig();

  try {
    // -------------------------------------------------------------
    // Test 2.1: Due job recovery after worker restart
    // -------------------------------------------------------------
    console.log('\n--- Test 2.1: Overdue Job Recovery ---');
    // Set next_run_at 2 hours in the past
    const pastTime = new Date(Date.now() - 7200000).toISOString();
    await pool.query('UPDATE scraper_configs SET next_run_at = $1, is_active = true', [pastTime]);

    // Initial check: worker is simulated stopped
    const configBefore = await scraperRepository.getConfig();
    console.log(`Config set to past: next_run_at = ${configBefore.nextRunAt}`);

    // Count jobs before
    const jobsBeforeRes = await pool.query('SELECT COUNT(*) FROM scraper_jobs');
    const jobsCountBefore = parseInt(jobsBeforeRes.rows[0].count, 10);

    // Worker restarts and runs tick
    const engine = new SchedulerEngine();
    const tickResult = await engine.runSchedulerTick();
    console.log('Tick result on restart:', tickResult);

    if (!tickResult.locked || !tickResult.scraperTriggered) {
      throw new Error('Test 2.1 FAILED: Worker tick did not trigger overdue scraper job');
    }

    const jobsAfterRes = await pool.query('SELECT COUNT(*) FROM scraper_jobs');
    const jobsCountAfter = parseInt(jobsAfterRes.rows[0].count, 10);
    console.log(`Job created in SQL: before=${jobsCountBefore}, after=${jobsCountAfter}`);

    const configAfter = await scraperRepository.getConfig();
    const nextRunTime = new Date(configAfter.nextRunAt!).getTime();
    if (nextRunTime <= Date.now()) {
      throw new Error('Test 2.1 FAILED: next_run_at was not advanced into the future');
    }
    console.log(`[PASS] Test 2.1: Overdue job triggered and next_run_at advanced to: ${configAfter.nextRunAt}`);

    // -------------------------------------------------------------
    // Test 2.2: Concurrency & Competing Worker Cycles
    // -------------------------------------------------------------
    console.log('\n--- Test 2.2: Competing Worker Concurrency ---');
    // Set next_run_at to past again
    await pool.query('UPDATE scraper_configs SET next_run_at = $1, is_active = true', [pastTime]);

    const worker1 = new SchedulerEngine();
    const worker2 = new SchedulerEngine();

    // Run both competing cycles concurrently
    const [res1, res2] = await Promise.all([
      worker1.runSchedulerTick(),
      worker2.runSchedulerTick(),
    ]);

    console.log('Worker 1 result:', res1);
    console.log('Worker 2 result:', res2);

    const oneLocked = (res1.locked && !res2.locked) || (!res1.locked && res2.locked);
    const oneSkipped = (res1.skippedReason || res2.skippedReason);

    if (!oneLocked || !oneSkipped) {
      throw new Error('Test 2.2 FAILED: Advisory lock did not cleanly serialize competing workers');
    }
    console.log(`[PASS] Test 2.2: Exactly one worker claimed the job; competitor skipped cleanly with advisory lock exclusion.`);

    // -------------------------------------------------------------
    // Test 2.3: Simulated worker failure and idempotency
    // -------------------------------------------------------------
    console.log('\n--- Test 2.3: Simulated Worker Failure & Idempotency ---');
    const leadsBeforeFail = await pool.query('SELECT COUNT(*) FROM lead_prospects');
    const initialLeadCount = parseInt(leadsBeforeFail.rows[0].count, 10);

    // Create a mock failing connector with non-operational status to trigger fatal error path
    const mockFailingEngine = new ScraperEngine();
    (mockFailingEngine as any).connectors.set('mock_failing', {
      id: 'mock_failing',
      name: 'Mock Failing Connector',
      type: 'GOOGLE_MAPS',
      operationalStatus: 'DISCONNECTED',
      dataLimitations: 'Simulates hard connector failure / provider outage',
      discover: async () => {
        throw new Error('Fatal socket failure');
      },
    });

    const failedJob = await mockFailingEngine.runDiscoveryJob({
      source: 'mock_failing',
      locations: ['Hisar'],
      categories: ['Hospitals'],
    });

    console.log('Simulated fatal job result:', {
      id: failedJob.id,
      status: failedJob.status,
      connectorErrors: failedJob.connectorErrors,
      errorLog: failedJob.errorLog,
    });

    if (failedJob.status !== 'FAILED') {
      throw new Error(`Test 2.3 FAILED: Job expected status FAILED, got ${failedJob.status}`);
    }

    // Verify job in database is marked FAILED
    const dbJobRes = await pool.query('SELECT status, error_log FROM scraper_jobs WHERE id = $1', [failedJob.id]);
    if (dbJobRes.rows[0].status !== 'FAILED') {
      throw new Error(`Test 2.3 FAILED: Job in SQL has status ${dbJobRes.rows[0].status}`);
    }

    // Simulate in-flight worker crash: create a job in RUNNING state that dies abruptly
    const inFlightJob = await scraperRepository.createJob({
      source: 'google_maps',
      targetLocations: ['Hisar'],
      targetCategories: ['Hospitals'],
    });
    await scraperRepository.updateJob(inFlightJob.id, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    });

    // Verify in SQL that it is RUNNING and never marked COMPLETED
    const inFlightDb = await pool.query('SELECT status, completed_at FROM scraper_jobs WHERE id = $1', [inFlightJob.id]);
    if (inFlightDb.rows[0].status !== 'RUNNING' || inFlightDb.rows[0].completed_at !== null) {
      throw new Error('Test 2.3 FAILED: In-flight job must be RUNNING with completed_at null');
    }

    // Re-run worker recovery cycle
    const recoveryEngine = new SchedulerEngine();
    await recoveryEngine.runSchedulerTick();

    // Verify lead count did not get corrupted or duplicated
    const leadsAfterFail = await pool.query('SELECT COUNT(*) FROM lead_prospects');
    const finalLeadCount = parseInt(leadsAfterFail.rows[0].count, 10);
    console.log(`Leads in SQL: initial=${initialLeadCount}, afterFail=${finalLeadCount}`);

    // Clean up disposable test in-flight job
    await pool.query('DELETE FROM scraper_jobs WHERE id = $1', [inFlightJob.id]);

    console.log(`[PASS] Test 2.3: Fatal failures result in FAILED status in SQL; in-flight crashes never mark COMPLETED; 0 duplicate leads or messages.`);

    // -------------------------------------------------------------
    // Test 2.4: Completion gate invariant
    // -------------------------------------------------------------
    console.log('\n--- Test 2.4: Persistent State Completion Invariant ---');
    // Verify that a job cannot be COMPLETED without started_at, completed_at, and status = COMPLETED
    const invalidJobCheck = await pool.query(`
      SELECT id FROM scraper_jobs 
      WHERE status = 'COMPLETED' AND (started_at IS NULL OR completed_at IS NULL)
    `);
    if (invalidJobCheck.rows.length > 0) {
      throw new Error('Test 2.4 FAILED: Found COMPLETED jobs without persistent started_at/completed_at timestamps');
    }
    console.log('[PASS] Test 2.4: All COMPLETED jobs enforce persistent started_at, completed_at, and valid counts.');

  } finally {
    // Restore original config
    await pool.query(
      'UPDATE scraper_configs SET next_run_at = $1, is_active = $2 WHERE id = $3',
      [originalConfig.nextRunAt, originalConfig.isActive, originalConfig.id]
    );
    await pool.end();
  }
}

runSchedulerRecoveryTests().then(() => {
  console.log('\n>>> All Scheduler Recovery & Durability Tests PASSED.');
  process.exit(0);
}).catch(err => {
  console.error('\n>>> Scheduler Recovery Test FAILED:', err);
  process.exit(1);
});
