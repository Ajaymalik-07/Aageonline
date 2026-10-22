# AageOnline — Milestone 0.20.16
## Operational Verification & Failure-Path Audit Report

**Product:** AageOnline — Get Seen. Get Ahead.  
**Milestone:** 0.20.16  
**Status:** COMPLETE  
**Final Verdict:** **LOCAL OPERATIONAL CHECKS PASSED — LIVE GATES DEFERRED**  
**Date:** October 12, 2026  

---

### 1. Executive Summary

Milestone 0.20.16 conducted an evidence-based operational verification and failure-path audit across AageOnline's worker supervisor, backup/restore safety tooling, financial state machine, and administrative access controls.

All checks were executed without provisioning live PostgreSQL, Docker, WSL, external cloud resources, or initiating real monetary transactions. Verification was achieved via rigorous static source inspection, cryptographic invariant testing, and a comprehensive automated failure-path test suite (`frontend/tests/operational-verification-and-failure-paths.test.ts`).

#### Summary of Test & Build Verification Results

| Verification Phase | Command | Duration | Outcome |
| :--- | :--- | :--- | :--- |
| **Operational & Failure-Path Suite** | `node --experimental-strip-types --test tests/operational-verification-and-failure-paths.test.ts` | 376 ms | **18 / 18 Passed (0 Failed, 0 Skipped)** |
| **TypeScript Typecheck** | `tsc --noEmit` | 2.9 s | **Exit Code 0 (0 Type Errors)** |
| **Full Repository Test Suite** | `node --experimental-strip-types --test tests/**/*.test.ts` | 1.77 s | **581 Passed, 0 Failed, 6 Skipped** |
| **Production Build** | `next build` | 6.0 s | **Exit Code 0 (All 70 Pages Built Cleanly)** |

---

### 2. Investigation and Resolution of Running Test Process

During verification, an issue was investigated where the test suite appeared to hang in the background:

#### 2.1 Process & Execution Details
- **Command:** `& "C:\nvm4w\nodejs\node.exe" --experimental-strip-types --test tests/operational-verification-and-failure-paths.test.ts`
- **Initial Task ID:** `task-3429` (canceled by user during investigation).
- **Execution Log Analysis:** All 18 tests completed execution in 23.69 ms, printing TAP output successfully. However, the Node.js process did not terminate immediately because the Node.js event loop had active timer handles.

#### 2.2 Root Cause Analysis
1. **Unstopped Supervisor in Test 1:** In `it('should execute successful worker cycles via custom cycleRunner and reset consecutive failures')`, `supervisor.executeCycle()` was invoked without calling `await supervisor.stop()`. Upon completion of `executeCycle()`, `scheduleNext(10000)` scheduled a 10-second `setTimeout` to run the next cycle. When that timer fired, it scheduled another 10-second timer, establishing a recurring loop that kept the Node.js event loop open.
2. **Missing `.unref()` on Background Scheduler Timer:** In `WorkerSupervisor.scheduleNext()`, `this.timer = setTimeout(...)` was registered without `.unref()`, meaning the background scheduling timer prevented the Node.js event loop from draining even when all active test promises had settled.
3. **Unprotected `executeCycle` Finally Hook:** In `WorkerSupervisor.executeCycle()`, the `finally` block called `this.scheduleNext(currentDelay)` unconditionally, even if the supervisor status had changed to `DRAINING` or `STOPPED`.

#### 2.3 Remediations Applied
- **`frontend/lib/workers/supervisor.ts`:**
  - Added `if (this.timer && typeof this.timer.unref === 'function') { this.timer.unref(); }` in `scheduleNext()`.
  - Guarded `finally` in `executeCycle()` with `if (this.status === 'RUNNING' || this.status === 'CIRCUIT_BROKEN')`.
  - Cleared `cycleTimer` and `drainTimer` on completion to avoid timer leaks.
- **`frontend/tests/operational-verification-and-failure-paths.test.ts`:**
  - Added explicit `await supervisor.stop()` calls at the end of Test 1 and Test 6.
  - Corrected test assertion regular expressions and type interfaces.
- **Verification of Fix:** Rerunning the test suite synchronously exited with code 0 in **376 ms** with zero dangling handles.

---

### 3. Worker Lifecycle & Supervision Verification

Automated regression coverage verified the following operational failure paths in `WorkerSupervisor`:

1. **Successful Cycle Execution:** Executes cycles via custom `cycleRunner`, records durations and metrics, and resets consecutive failure counters to 0.
2. **Circuit Breaker Activation:** Repeated simulated database failures increment the consecutive failure counter. At threshold (3 failures), supervisor transitions state to `CIRCUIT_BROKEN`, triggers `CIRCUIT_BREAKER_TRIPPED` logging, and activates bounded exponential backoff (`Math.min(baseInterval * 1.5^failures, 300000)`).
3. **Circuit Breaker Recovery:** Once transient outages resolve and a subsequent cycle succeeds, supervisor automatically resets consecutive failures to 0 and transitions back to `RUNNING` (health status `HEALTHY`).
4. **Shutdown Invariants:**
   - Calling `stop()` transitions status to `DRAINING`, prevents new cycles from scheduling or executing, and cancels active timers.
   - Calling `executeCycle()` while in `STOPPED` state immediately returns without running work.
5. **In-Flight Drain Timeout:** When an in-flight cycle hangs, `stop()` enforces `shutdownDrainTimeoutMs` via `Promise.race()`, preventing shutdown from hanging indefinitely.
6. **Heartbeat & Health Status:** Detects stale heartbeats (> 120s old) and reports `DEGRADED` health without mutating financial or database state.

---

### 4. Backup & Restore Failure-Path Verification

Audited `scripts/backup-db.sh`, `scripts/verify-backup.sh`, `scripts/restore-db.sh`, and `frontend/lib/ops/backup-safety.ts`:

1. **Missing Utilities Check:** `assertPostgresUtilityAvailable()` verifies the presence of `pg_dump` and `pg_restore` binaries, throwing explicit operational errors when missing rather than silently failing.
2. **Overwrite Prevention:** `checkBackupFileOverwrite()` prevents silent overwriting of existing backup archives.
3. **Manifest Validation:**
   - Validates JSON structure, required metadata fields (`backupId`, `sha256`, `sizeBytes`, `postgresVersion`, `createdAt`).
   - Rejects corrupted or partial backups marked with `FAILED` or invalid 64-hex SHA-256 hashes.
   - Enforces `credentialsStored === false`.
4. **Target Isolation & Credential Redaction:**
   - `validateRestoreTarget()` strictly rejects restores targeting the active production application database name.
   - `formatSafeRestoreError()` strips database passwords and secrets from all restore error traces.

---

### 5. Financial Lifecycle & Browser Redirect Failure-Path Audit

Traced and verified all critical financial state boundaries:

1. **Unauthenticated & Invalid Payment Initiation:**
   - Rejects unauthenticated requests (`UnauthenticatedPaymentError`).
   - Rejects requests missing `Idempotency-Key` headers (`PaymentIdempotencyKeyRequiredError`).
   - Rejects non-existent or expired BidIntents.
2. **Provider Webhook Signature Security:**
   - Rejects forged PayU webhooks with invalid or missing HMAC-SHA512 signatures (`PaymentWebhookInvalidError`).
   - Validates authentic reverse hashes (`sha512(salt|status|udf5|...|key)`).
3. **Browser Redirect Non-Authoritative Invariant:**
   - Evaluated `/api/payments/callback/payu`: Browser callbacks and client redirects **cannot** mark payment orders `SUCCEEDED` or `CONFIRMED`.
   - Even if query parameters or form fields are tampered with (e.g. `?status=success&txnid=fake`), the payment order status remains strictly `PENDING` unless verified by server-side HMAC-SHA512 validation.
   - Settle ranking strictly enforces `order.status === 'CONFIRMED'`. Attempting to settle a payment order with status `PENDING` throws `PaymentNotConfirmedError`.
4. **Duplicate Webhook Idempotency:**
   - Duplicate delivery of an identical, authentic webhook returns `isDuplicate: true` with status `SUCCEEDED` without generating duplicate audit entries or corrupting state.
5. **Settlement Currency & Confirmation Checks:**
   - Settle ranking asserts exact matching currency (`INR`) and exact confirmed status before executing ranking changes.

---

### 6. Security & Operational Configuration Invariants

1. **Production Dev-Auth Bypass Guard:** In production mode (`NODE_ENV === 'production'`), requests without valid authentication tokens fail closed and return `null`. Development bypass mocks are completely disabled.
2. **Platform Admin Authorization:** Tested `assertPlatformAdmin` and `isPlatformAdmin`. Regular users and suspended administrators are strictly rejected with 403 Forbidden errors logged to the audit trail.
3. **Secret Redaction:** Database connection strings containing user credentials (`postgres://user:secret@host/db`) are sanitized by `redactConnectionString()` into `postgres://user:***@host/db` prior to any logging or diagnostics.

---

### 7. Verification Matrix

| Requirement | Verification Method | Actual Outcome | Evidence | Limitations | Real Infrastructure Required? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Worker cycle success & failure reset** | Automated Unit Test | Success resets failure count to 0 | `operational-verification-and-failure-paths.test.ts` (Test 1) | In-process test double | No |
| **Circuit breaker trip & backoff** | Automated Unit Test | Trips at threshold 3, calculates exponential backoff | `operational-verification-and-failure-paths.test.ts` (Test 2) | In-process test double | No |
| **Circuit breaker recovery** | Automated Unit Test | Auto-recovers to RUNNING on success | `operational-verification-and-failure-paths.test.ts` (Test 3) | In-process test double | No |
| **Shutdown gate & timer cleanup** | Automated Unit Test | No new cycles run after stop(), timers unref'd | `operational-verification-and-failure-paths.test.ts` (Test 4) | In-process test double | No |
| **Shutdown drain timeout** | Automated Unit Test | Resolves within drain timeout (50ms) | `operational-verification-and-failure-paths.test.ts` (Test 5) | Simulated hanging promise | No |
| **Stale heartbeat detection** | Automated Unit Test | Reports DEGRADED when heartbeat > 120s | `operational-verification-and-failure-paths.test.ts` (Test 6) | Simulated timestamp | No |
| **Missing backup utility error** | Automated Unit Test | Throws explicit error for missing pg_dump | `operational-verification-and-failure-paths.test.ts` (Test 7) | In-process assertion | No |
| **Backup overwrite prevention** | Automated Unit Test | Rejects overwriting existing artifact | `operational-verification-and-failure-paths.test.ts` (Test 8) | In-process assertion | No |
| **Manifest validation & corrupt rejection** | Automated Unit Test | Rejects missing/corrupt/partial manifest | `operational-verification-and-failure-paths.test.ts` (Test 9) | JSON schema validator | No |
| **Restore error credential redaction** | Automated Unit Test | Secrets stripped from error messages | `operational-verification-and-failure-paths.test.ts` (Test 10) | Regex redaction validator | No |
| **Payment initiation auth & idempotency** | Automated Unit Test | Unauthenticated / missing key rejected | `operational-verification-and-failure-paths.test.ts` (Test 11) | Domain store assertion | No |
| **PayU webhook signature validation** | Automated Cryptographic Test | Forged reverse hash rejected | `operational-verification-and-failure-paths.test.ts` (Test 12) | HMAC-SHA512 verification | No |
| **Browser redirect cannot confirm payment** | Automated Security Test | Forged browser return leaves status PENDING | `operational-verification-and-failure-paths.test.ts` (Test 13) | End-to-end simulated flow | No |
| **Duplicate webhook idempotency** | Automated Unit Test | Duplicate returns isDuplicate: true | `operational-verification-and-failure-paths.test.ts` (Test 14) | Store idempotency test | No |
| **Unconfirmed payment settlement rejection** | Automated Unit Test | Settle throws for non-CONFIRMED status | `operational-verification-and-failure-paths.test.ts` (Test 15) | Settlement service test | No |
| **Production dev-auth bypass prevention** | Automated Security Test | Unauthenticated returns null in production | `operational-verification-and-failure-paths.test.ts` (Test 16) | Server session test | No |
| **Admin privilege authorization** | Automated Security Test | Regular & suspended users denied | `operational-verification-and-failure-paths.test.ts` (Test 17) | Admin guard test | No |
| **Connection string secret redaction** | Automated Security Test | Passwords redacted before logging | `operational-verification-and-failure-paths.test.ts` (Test 18) | Test-safety utility test | No |
| **Live PostgreSQL transactions** | Deferred | Deferred | Documented | Requires PostgreSQL | **YES** |
| **Live backup & restore execution** | Deferred | Deferred | Documented | Requires disposable DB | **YES** |
| **Multi-process OS worker restart** | Deferred | Deferred | Documented | Requires systemd/container | **YES** |
| **Production cloud DB provisioning** | Deferred | Deferred | Documented | Requires cloud infra | **YES** |
| **Live PayU gateway credentials** | Deferred | Deferred | Documented | Requires PayU merchant | **YES** |
| **Live TLS/DNS/HTTPS domain setup** | Deferred | Deferred | Documented | Requires edge DNS/TLS | **YES** |

---

### 8. Explicitly Preserved Deferred Infrastructure Gates

The following 6 operational gates remain intentionally deferred until real infrastructure is provisioned:

1. **Real PostgreSQL Integration and Transactional Behavior:** Verification of live row locks (`FOR UPDATE`), multi-client transaction serialization, and advisory lock concurrency against an active PostgreSQL instance.
2. **Actual Backup and Restore Execution Against a Disposable Database:** Running `pg_dump` and `pg_restore` against a disposable PostgreSQL instance to test dump creation, schema rebuild, and data restoration end-to-end.
3. **Live Worker Concurrency, Process Restart, and Database Lock Verification:** Testing OS-level process management (`systemd`, container supervisor, SIGTERM signals) and concurrent multi-worker advisory locking.
4. **Production Database Provisioning and Secure Configuration:** Provisioning the managed production database with automated TLS, private VPC peering, connection pooler (`pgBouncer`), and managed point-in-time recovery (PITR).
5. **PayU Provider Live Verification:** Testing live payment flows with registered PayU sandbox and production credentials and real provider webhook delivery.
6. **DNS, HTTPS, Deployment, Monitoring, and Operational Recovery Validation:** Production deployment verification including TLS certificate rotation, CDN edge caching, and real-time operational alerting.

---

### 9. Final Milestone Verdict

**LOCAL OPERATIONAL CHECKS PASSED — LIVE GATES DEFERRED**
