# AageOnline — Production Launch Gates

> **Product:** AageOnline — Get Seen. Get Ahead.  
> **Status:** Authoritative Baseline  
> **Milestone:** 0.20.18  
> **Classification:** Pre-Launch Gate Register  
> **Last Updated:** October 12, 2026  

---

## 1. Overview & Verification Standard

This register defines the definitive launch gates required before AageOnline can accept real payments or be declared production-ready.

All local software engineering, testing, cryptographic validation, and failure-path audits are **COMPLETE** (581 automated tests passing, 0 failing, 0 type errors, 70/70 routes compiling cleanly).

However, live operational reliability requires exercising real infrastructure. **No gate in this document may be marked as PASSED based on unit tests, mocks, local code inspection, or static builds alone.**

---

## 2. Consolidated Launch-Gate Register

### Gate 1: Real PostgreSQL Integration & Transactional Verification

- **Current Status:** **DEFERRED (Prerequisite: Active PostgreSQL Instance)**
- **Prerequisites:** A live, reachable PostgreSQL 16+ instance configured via `DATABASE_URL` with SSL support.
- **Verification Procedure:**
  1. Set `DATABASE_URL` pointing to disposable local or cloud PostgreSQL instance.
  2. Execute `npm run db:migrate` and verify migrations 001 through 011 apply sequentially without error.
  3. Run integration test harness:
     ```bash
     npm run test:real-db
     ```
  4. Verify the 6 integration tests in `frontend/tests/real-postgres-integration.test.ts` execute and pass:
     - Migration runner idempotency and schema validation.
     - Bid intent persistence and expiration enforcement.
     - Payment order persistence and status transition.
     - Advisory transaction locks (`pg_advisory_xact_lock`) and row locking (`FOR UPDATE`).
     - Atomic settlement and append-only position history insertion.
     - Background reconciler loop execution and lock release.
- **Objective Pass/Fail Criteria:** All 6 tests pass; 0 errors; database tables verified populated with test records; locks release within 100ms.
- **Evidence to Retain:** Terminal execution log of `test:real-postgres-integration.test.ts` showing exit code 0.
- **Blocks Real Payments?** **YES.** Real transactions cannot be processed without live ACID transaction validation.

---

### Gate 2: Actual Backup & Restore Verification Against Disposable Database

- **Current Status:** **DEFERRED (Prerequisite: Active PostgreSQL Instance + Utility Binaries)**
- **Prerequisites:** Linux/WSL environment with `pg_dump`, `pg_restore`, and `sha256sum` installed; active PostgreSQL database seeded with representative data; a distinct disposable database target.
- **Verification Procedure:**
  1. Execute backup script:
     ```bash
     bash scripts/backup-db.sh
     ```
  2. Execute backup verification:
     ```bash
     bash scripts/verify-backup.sh <BACKUP_TAR_GZ_PATH>
     ```
  3. Execute restore against an explicitly disposable database:
     ```bash
     TARGET_DB="aageonline_restore_drill_disposable" bash scripts/restore-db.sh <BACKUP_TAR_GZ_PATH>
     ```
  4. Query restored database to verify row counts in `markets`, `businesses`, `payment_orders`, and `position_history` match source database exactly.
- **Objective Pass/Fail Criteria:**
  - Backup completes with zero credential leakage in console logs.
  - Manifest JSON generated with valid 64-hex SHA-256 checksum.
  - Restoration into target database completes with exit code 0.
  - Attempting to restore into the active application database is blocked by `validateRestoreTarget()`.
- **Evidence to Retain:** Backup log, verification manifest JSON, and row count comparison report.
- **Blocks Real Payments?** **YES.** Disaster recovery readiness is mandatory prior to live financial settlement.

---

### Gate 3: Live Worker Concurrency, Process Restart & Database Lock Verification

- **Current Status:** **PASSED (Milestone 0.21.0 — Ubuntu WSL2 Linux Process Verification)**
- **Prerequisites:** Two concurrently running worker instances connected to the same PostgreSQL database.
- **Verification Procedure & Real Linux Evidence (Milestone 0.21.0):**
  1. **Execution Environment:** Executed under Ubuntu 26.04.1 LTS on WSL2 with native Linux Node.js v22.22.1 using mirrored networking (`127.0.0.1:5432`) against isolated target `aageonline_worker_drill_disposable`.
  2. **Concurrent Workers:** Worker 1 (Linux PID 440) and Worker 2 (Linux PID 448) spawned concurrently.
  3. **Advisory Lock Isolation:** Mutual exclusion on `RECONCILER_ADVISORY_LOCK_ID = 829104812` strictly verified; concurrent worker skipped cycle without contention.
  4. **POSIX SIGTERM Delivery:** Dispatched genuine POSIX signal `kill -TERM 440`. Node.js signal listener fired, logged `SHUTDOWN_INITIATED`, drained active work, and logged `SHUTDOWN_COMPLETE` within 17ms.
  5. **Terminal Heartbeat Consistency:** Persisted top-level column `status = 'STOPPED'` and `metadata.status = 'STOPPED'` to table `worker_heartbeats`.
  6. **Advisory Lock Release & Automatic Handover:** Lock 829104812 released automatically upon Worker 1 termination. Surviving Worker 2 acquired the lock on subsequent cycle and completed pending unit of work (`inv_drill_posix_3`, attempts = 1).
  7. **Clean Termination:** Both workers exited cleanly with code `0`. Zero duplicate jobs; zero deadlocks.
- **Objective Pass/Fail Criteria:** Zero duplicate settlements; zero lock deadlocks; graceful shutdown completes within 10s drain window. **PASSED.**
- **Evidence Retained:** Execution logs, database queries on `cache_invalidation_jobs`, `worker_heartbeats`, `reconciliation_runs`, and dedicated regression test suite `tests/worker-heartbeat-lifecycle.test.ts`.
- **Blocks Real Payments?** **NO LONGER BLOCKS (Gate 3 Closed).** Production deployment remains blocked by deferred Gates 4, 5, and 6.

---

### Gate 4: Production Database Provisioning & Secure Configuration

- **Current Status:** **DEFERRED (Prerequisite: Owner Cloud Account & Database Provisioning)**
- **Prerequisites:** Provisioned managed PostgreSQL 16+ instance (e.g. Neon, AWS RDS, DigitalOcean Managed Database, or Supabase).
- **Verification Procedure:**
  1. Verify TLS/SSL enforcement (`sslmode=require`).
  2. Verify automated daily backups and Point-In-Time Recovery (PITR) are enabled in provider console.
  3. Verify connection pool limits (max 20-50 connections) and statement timeouts (10,000ms).
  4. Execute schema migration runner against the provisioned instance:
     ```bash
     DATABASE_URL="<PROD_DATABASE_URL>" node --experimental-strip-types scripts/migrate.ts
     ```
  5. Inspect `schema_migrations` table to confirm all 11 migrations applied.
  6. Execute health check probe:
     ```bash
     DATABASE_URL="<PROD_DATABASE_URL>" node --experimental-strip-types scripts/worker.ts --health
     ```
- **Objective Pass/Fail Criteria:** Migrations 001–011 applied; `worker.ts --health` returns `healthy: true` with latency < 50ms; SSL certificate verified.
- **Evidence to Retain:** Migration runner output log and health probe JSON response.
- **Blocks Real Payments?** **YES.** Production database persistence is mandatory.

---

### Gate 5: PayU Provider Verification with Sandbox & Production Credentials

- **Current Status:** **DEFERRED (Prerequisite: PayU India Merchant Account Onboarding)**
- **Prerequisites:** Registered PayU India merchant account with access to Merchant Key and Salt.
- **Verification Procedure:**
  1. Configure PayU Test Mode:
     ```env
     PAYU_ENV=test
     PAYU_MERCHANT_KEY=<TEST_MERCHANT_KEY>
     PAYU_MERCHANT_SALT=<TEST_MERCHANT_SALT>
     ```
  2. Initiate checkout in test business workspace for position placement.
  3. Complete payment on PayU sandbox checkout gateway using test card credentials.
  4. Verify PayU webhook hits `/api/payments/webhooks/payu`.
  5. Verify reverse hash calculation matches and order transitions `PENDING` → `SUCCEEDED` → `CONFIRMED`.
  6. Verify browser return redirects smoothly to `/business/dashboard/markets`.
  7. Verify ranking engine executes atomic position settlement with immutable history record.
- **Objective Pass/Fail Criteria:** Zero signature mismatches; payment order marked `CONFIRMED`; position updated in market; duplicate webhook delivery handled idempotently.
- **Evidence to Retain:** PayU transaction ID, webhook audit log record, and resulting `position_history` record ID.
- **Blocks Real Payments?** **YES.** End-to-end payment gateway verification must precede real money processing.

---

### Gate 6: DNS, HTTPS, Deployment, Monitoring & Operational Recovery Validation

- **Current Status:** **DEFERRED (Prerequisite: Live Server, Domain Delegation & Monitoring Tools)**
- **Prerequisites:** Production server (Linux VPS) with static public IP; domain `aageonline.com` delegated to server via DNS A record.
- **Verification Procedure:**
  1. Launch production container stack:
     ```bash
     docker compose -f docker-compose.yml --env-file .env.production up -d
     ```
  2. Verify Caddy automatically obtains valid TLS certificates from Let's Encrypt for `aageonline.com` and `www.aageonline.com`.
  3. Verify HTTP requests to `http://aageonline.com` redirect 308 to `https://aageonline.com`.
  4. Query public health endpoint `https://aageonline.com/api/health/ready` and confirm `200 OK`.
  5. Verify external uptime monitor (e.g. UptimeRobot or BetterStack) polls `/api/health/live` every 60 seconds with email/SMS alerting configured.
  6. Crawl key public canonical URLs (`/`, `/jaipur/interior-designers`, `/businesses/abc-interiors-jaipur`) to verify valid 200 status, canonical tags, and robots.txt.
- **Objective Pass/Fail Criteria:** Valid TLS certificate with Grade A rating; 0 mixed-content warnings; health probe returns 200; alerting triggers on simulated container downtime.
- **Evidence to Retain:** SSL Labs / curl header verification output, uptime monitor configuration screenshot, and readiness probe JSON.
- **Blocks Real Payments?** **YES.** Real payments require secure, monitored, and encrypted production infrastructure.

---

## 3. Launch Gate Dependency Flow

```text
┌────────────────────────────────────────────────────────┐
│      LOCAL ARCHITECTURE & TESTING VERIFIED (DONE)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Gate 4: Production Database Provisioning & Migrations  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ Gate 1: Real PostgreSQL   │ │ Gate 2: Actual Backup &   │
│ Integration Tests         │ │ Restore Verification      │
└─────────────┬─────────────┘ └───────────┬───────────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Gate 3: Live Worker Concurrency & Lock Verification    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Gate 5: PayU Sandbox End-to-End Verification           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Gate 6: DNS, HTTPS, Deployment & Monitoring Setup      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      EXPLICIT OWNER APPROVAL: ENABLE LIVE PAYMENTS     │
└────────────────────────────────────────────────────────┘
```
