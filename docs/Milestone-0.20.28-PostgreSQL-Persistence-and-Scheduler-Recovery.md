# AageOnline — Milestone 0.20.28 Report
## PostgreSQL Installation, Live Persistence & Scheduler Recovery

**Status:** ALL GATES PASS  
**Timestamp:** 2026-10-13  
**Database Runtime:** PostgreSQL 16.6 (x64 Windows Portable User-Space Cluster)  
**Database Endpoint:** `127.0.0.1:5432`  
**Database Name:** `aageonline_dev`  
**Application Role:** `aage_app` (SCRAM-SHA-256 authenticated, least-privilege)  

---

## 1. Executive Summary

Milestone 0.20.28 successfully resolved the PostgreSQL runtime blocker identified in Milestone 0.20.27. Using authorized portable user-space binaries under `%USERPROFILE%\.local\pgsql`, a local-only PostgreSQL 16 database cluster was initialized, secured with SCRAM-SHA-256 password authentication, and bound exclusively to loopback `127.0.0.1`.

All 13 forward migrations were applied idempotently using advisory locks (`94827104`). The complete data persistence, repeat-run deduplication, cooldown preservation, email campaign lifecycle, API restart recovery, worker advisory lock concurrency (`829104812`), durable scheduler triggers (`94827105`), and database backup/restore procedures were verified directly against live PostgreSQL storage.

---

## 2. Gate Verification Status Matrix

| Gate / Verification Target | Expected Behavior | Actual Observed Result | Status |
| :--- | :--- | :--- | :---: |
| **1. PostgreSQL Installation & Isolation** | Portable binaries under `%USERPROFILE%\.local\pgsql` bound to `127.0.0.1:5432`. No system registry edits or services. | PostgreSQL 16.6 running as user process PID 93832 listening on `127.0.0.1:5432`. Zero Windows services created. | **PASS** |
| **2. Least-Privilege Role & SCRAM Auth** | Dedicated `aage_app` role with SCRAM-SHA-256 password authentication; credentials gitignored. | `aage_app` role verified via `psql` over SCRAM-SHA-256; `DATABASE_URL` stored in `.env.local` files excluded by `.gitignore`. | **PASS** |
| **3. Migration Execution (001–013)** | Sequential application of migrations 001–013 with advisory locking. Zero duplicate migrations. | All 13 migrations applied to `aageonline_dev`. Verified 42 tables created. Re-running migration runner reports `alreadyAppliedCount: 13, appliedCount: 0`. | **PASS** |
| **4. Scraper Job & Lead SQL Persistence** | Discovered leads and job logs persist in PostgreSQL tables `scraper_jobs` and `lead_prospects`. | Ran discovery: 23 leads inserted into `lead_prospects`, job record inserted into `scraper_jobs`. Verified directly via `psql`. | **PASS** |
| **5. Repeat-Run Deduplication & Provenance** | Re-scraping same target updates existing rows without duplicating records. | Re-ran discovery: `totalDiscovered: 23, newLeadsAdded: 0, existingUpdated: 23, duplicatesSkipped: 23`. Total SQL row count remained exactly 23. | **PASS** |
| **6. Email Campaign, Outbox & Suppression** | Templates, campaigns, outbox messages, and suppressions persist in SQL. Suppressed contacts excluded. | Created template `tpl-...` and campaign `cmp-...`. Suppressed 1 lead. Campaign run queued 2 messages, skipped 1 suppressed lead. Verified in `email_outbox` and `email_suppression_list`. | **PASS** |
| **7. Cooldown Preservation** | Re-running campaign respects configured cooldown (e.g. 14 days) and avoids duplicate sends. | Re-ran campaign: `queuedCount: 0, cooldownSkipped: 2, suppressedSkipped: 1`. Zero duplicate messages created. | **PASS** |
| **8. API Process Restart Recovery** | Terminating and restarting API process preserves all data without memory loss. | Terminated API process (PID 85112), restarted API. Queried `/api/admin/scraper/metrics` and outbox: all 23 leads, 2 jobs, and outbox messages immediately returned from PostgreSQL. | **PASS** |
| **9. Worker Restart Recovery & Concurrency** | Multi-worker safety enforced via PostgreSQL advisory lock (`829104812`). | Spawned concurrent worker while lock held: returned `{ skipped: true, reason: 'Another reconciler worker is currently executing...' }`. Worker resumed cleanly after lock release. | **PASS** |
| **10. Automatic Scheduler Triggering** | Due scheduler jobs execute automatically without in-memory timers; `nextRunAt` advances in SQL. | Set `next_run_at` to past timestamp. Triggered scheduler: acquired advisory lock `94827105`, ran discovery job `job-1791887294924-8ffq`, and advanced `next_run_at` by 24 hours in PostgreSQL. | **PASS** |
| **11. Backup and Restore Parity** | `pg_dump` and restore into disposable test database achieves 100% data parity. | Dumped `aageonline_dev` (115,294 bytes). Restored into `aageonline_restore_test`: verified exact row parity (24 leads, 13 migrations, 4 outbox messages). Test database dropped. | **PASS** |
| **12. Admin-to-API-to-PostgreSQL Data Flow** | Admin Control Center (`:3001`) requests proxy to API (`:4000`) and reflect live PostgreSQL state. | Queried `/api/scraper` and `/api/email-automation` through Admin session: live metrics, campaigns, and outbox messages matched PostgreSQL tables. | **PASS** |

---

## 3. Migration and Schema Integrity

Database: `aageonline_dev`  
Total Tables: `42`  

### Migration History (`schema_migrations`)
```text
 version |                     name                     |            applied_at
---------+----------------------------------------------+----------------------------------
 001     | 001_initial_schema.sql                       | 2026-10-13 15:49:49.204253+05:30
 002     | 002_bid_intents.sql                          | 2026-10-13 15:49:49.388833+05:30
 003     | 003_payments_and_events.sql                  | 2026-10-13 15:49:49.427625+05:30
 004     | 004_ranking_settlements_and_history.sql      | 2026-10-13 15:49:49.513689+05:30
 005     | 005_outbox_and_recovery.sql                  | 2026-10-13 15:49:49.572221+05:30
 006     | 006_admin_operations.sql                     | 2026-10-13 15:49:49.599159+05:30
 007     | 007_ranking_notifications.sql                | 2026-10-13 15:49:49.653007+05:30
 008     | 008_seo_audits.sql                           | 2026-10-13 15:49:49.750383+05:30
 009     | 009_performance_indexes.sql                  | 2026-10-13 15:50:47.334268+05:30
 010     | 010_durable_invalidation_and_rate_limits.sql | 2026-10-13 15:50:47.393602+05:30
 011     | 011_user_sessions.sql                        | 2026-10-13 15:50:47.445242+05:30
 012     | 012_admin_content_and_governance.sql         | 2026-10-13 15:50:47.497811+05:30
 013     | 013_lead_scraper_and_email_automation.sql    | 2026-10-13 15:50:47.695926+05:30
```

---

## 4. Test Suite Execution Summary

1. **API Test Suite (`npm test` in `api/`):**
   - 30 tests across 3 suites: **30 passed, 0 failed** (650ms).
2. **Frontend Test Suite (`npm test` in `frontend/`):**
   - 591 tests across 58 suites: **585 passed, 0 failed, 6 skipped** (1,603ms).
3. **Admin TypeScript Check (`npx tsc --noEmit` in `admin/`):**
   - **0 errors**.

---

## 5. Files Changed

- `api/src/server.ts`: Added environment file loader, wired `SchedulerEngine`, and added `/api/admin/scheduler/tick`.
- `api/src/db/migrator.ts`: Harmonized `schema_migrations` tracking and added advisory locking (`94827104`).
- `api/src/db/repositories/email-automation-repo.ts`: Added `isRecipientInCooldown()` for SQL outbox cooldown checking.
- `api/src/services/email/campaign-engine.ts`: Integrated PostgreSQL outbox cooldown checking.
- `api/src/services/scheduler/scheduler-engine.ts`: Created durable scheduler engine using advisory lock `94827105`.
- `frontend/lib/db/migrations/009_performance_indexes.sql`: Fixed index targets on `locations` and `categories`.
- `api/tests/scraper-and-email-automation.test.ts`: Added dynamic test suffix for idempotency against live databases.
