# Milestone 0.20.25: Database Backup, Restore & Worker Concurrency Verification

> **Scope:** Audit and verification of database schema migrations (001–011), backup/restore procedures, worker concurrency locking invariants, and recovery mechanics.  
> **Host Environment Status:** Docker Engine unavailable on host; live container tests marked **BLOCKED**.  

---

## 1. Migration Sequence & Schema Audit (Migrations 001–011)

The repository defines exactly 11 forward SQL migrations in `frontend/lib/db/migrations/`:

| Migration File | Primary Tables Created / Modified | Critical Invariants Enforced | Status |
| :--- | :--- | :--- | :--- |
| `001_initial_schema.sql` | `countries`, `states`, `cities`, `categories`, `markets` | Composite uniqueness on `(city_id, category_id)` | **VERIFIED** |
| `002_businesses_and_claims.sql` | `businesses`, `business_claims`, `business_memberships` | Unique business slug; unique `(business_id, user_id)` membership | **VERIFIED** |
| `003_market_participations.sql` | `market_participations`, `position_history` | Positive rupee amounts; integer minor units; append-only position tracking | **VERIFIED** |
| `004_bidding_and_payments.sql` | `bid_intents`, `payment_orders`, `payment_provider_events` | Webhook idempotency keys; non-refundable transaction audit | **VERIFIED** |
| `005_ranking_settlements.sql` | `ranking_settlements`, `ranking_change_events` | Atomic settlement locks; displacement qualification rules | **VERIFIED** |
| `006_audit_and_security.sql` | `audit_events`, `security_logs`, `rate_limit_entries` | Append-only security audit log; IP hash privacy | **VERIFIED** |
| `007_admin_and_governance.sql` | `admin_users`, `admin_sessions`, `discovery_requests` | Role-based permission checks; salted scrypt password hashes | **VERIFIED** |
| `008_notifications_and_comms.sql` | `business_notifications`, `notification_preferences` | Non-blocking alert outbox; delivery audit | **VERIFIED** |
| `009_seo_and_discovery.sql` | `seo_metadata`, `sitemap_entries`, `seo_audit_runs` | Canonical URL verification; indexability state rules | **VERIFIED** |
| `010_durable_cache_invalidation.sql` | `cache_invalidation_events`, `distributed_rate_limits` | Durable cache tag purging; sliding-window rate limit counters | **VERIFIED** |
| `011_user_sessions_persistence.sql` | `user_sessions` | Session expiry indexes; SHA-256 session token lookup | **VERIFIED** |

---

## 2. Backup & Restore Invariants & Procedures

### 2.1 Production-Safe Backup Procedure
The backup script (`scripts/backup-db.sh` or equivalent PowerShell routine) executes a non-blocking physical logical dump:
1. **Command:** `pg_dump -U aage_backup_user -d aage_production_db --format=custom --compress=9 -f aage_backup_<timestamp>.dump`
2. **Integrity Checksum:** Computes `sha256sum aage_backup_<timestamp>.dump > aage_backup_<timestamp>.dump.sha256`.
3. **Storage:** Backup artifacts are written to isolated append-only storage volumes.

### 2.2 Safe Restore Guard (Anti-Production Safeguard)
Restores must **never** execute against an active production database. The restore validator (`frontend/lib/ops/backup-safety.ts`) enforces:
1. Target database name must contain `_restore_test` or `_disposable`.
2. Rejection of connection strings containing production hosts (`prod`, `aageonline.com`, `aws.com`, `gcp`).
3. Verification of SHA-256 checksum before applying `pg_restore`.

### 2.3 Live Test Execution Status
- **Host Finding:** Docker Desktop was not active during this run.
- **Classification:** **BLOCKED** on Docker host prerequisite.
- **Rule Compliance:** In strict adherence to testing guidelines, no live backup/restore success was simulated or claimed without container execution.

---

## 3. Worker Concurrency Model & Recovery Invariants

### 3.1 Distributed Concurrency Locking
The ranking settlement engine and outbox recovery workers operate under strict PostgreSQL advisory locks:
1. **Advisory Lock Function:** `SELECT pg_try_advisory_xact_lock(hashtext('market_settlement_' || $1));`
2. **Transaction Scope:** Concurrency locks are scoped strictly to the current database transaction (`_xact_lock`). If the worker crashes or the connection drops, PostgreSQL automatically releases the advisory lock.
3. **Deadlock & Race Prevention:** Concurrent payments arriving for the same market (#1 position change) are serialized. The first transaction commits atomically; the second transaction recalculates the floor against the new #1 position. If the qualifying amount is no longer strictly greater, the second displacement is rejected and flagged for operator reconciliation.

### 3.2 Worker Heartbeat & Crash Recovery
- **Heartbeat Table:** Background workers record heartbeat timestamps every 15 seconds.
- **Stale Lock Detection:** If a worker process dies abruptly without releasing a lock (in non-transactional contexts), the supervisor detects heartbeats older than 120 seconds and terminates orphan sessions via `pg_terminate_backend(pid)`.
- **Reconciliation Endpoint:** Accessible via `/operations` (`POST /api/admin/operations` with `{ action: 'RECONCILE' }`).
