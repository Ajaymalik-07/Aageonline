# AageOnline — Milestone 0.20.26
# Database and Recovery Test Results

> **Milestone Status:** PARTIALLY VERIFIED — LIVE GATES BLOCKED  
> **Date:** October 13, 2026  
> **Target Subsystem:** Database Migrations, Reconciler Worker & Disaster Recovery  

---

## 1. Host Infrastructure Diagnostics

Before attempting database mutations, preflight diagnostic probes were executed against the host environment:

| Probe Target | Command Executed | Output / Diagnostic | Status |
| :--- | :--- | :--- | :--- |
| **Docker Engine CLI** | `Get-Command docker` | `CommandNotFoundException`: The term 'docker' is not recognized as a name of a cmdlet, function, script file, or executable program. | **MISSING** |
| **Docker Compose CLI** | `Get-Command docker-compose` | `CommandNotFoundException`: Not installed in PATH. | **MISSING** |
| **Local PostgreSQL Socket** | `Test-NetConnection -ComputerName localhost -Port 5432` | `TcpTestSucceeded: False`. No service listening on TCP 5432. | **UNAVAILABLE** |

### Truth-Telling Determination
In strict compliance with Milestone 0.20.26 instructions:
- **No software was installed.**
- **No cloud infrastructure was provisioned.**
- **No in-memory mock was substituted as a "passing" live database test.**
- All live container-dependent integration tests and destructive recovery tests are classified as **BLOCKED on Docker Engine Host Prerequisite**.

---

## 2. Migration Pipeline Architecture (001–012)

The migration pipeline is unified across `frontend/lib/db/migrator.ts` and `api/src/db/migrator.ts`:

1. **Transactional Session Advisory Lock:**
   - Migration executions acquire 64-bit advisory lock `94827104` (`pg_advisory_lock(94827104)`).
   - Prevents race conditions if web and worker instances attempt migrations concurrently.
2. **Sequential Schema History:**
   - Tracks applied migrations in `schema_migrations` (`version`, `name`, `checksum`, `applied_at`).
   - Rejects altered or corrupted migration files.
3. **Migration Sequence:**
   - `001_initial_schema.sql`: Core tables (`users`, `businesses`, `locations`, `categories`, `markets`, `transactions`, `ranking_entries`, `position_history`).
   - `002_business_claiming_and_verification.sql`: Claim tokens and verification status.
   - `003_notifications.sql`: Notification events and recipient preferences.
   - `004_payment_provider_events.sql`: Raw webhook signatures, provider payloads, and event statuses.
   - `005_audit_trail.sql`: Immutable security and administrative audit log.
   - `006_market_pricing_and_velocity.sql`: Market pricing floors and velocity metrics.
   - `007_ranking_settlement_reconciliation.sql`: Settlement ledgers and recovery jobs.
   - `008_business_media_and_catalog.sql`: Business images and portfolio items.
   - `009_seo_metadata_and_taxonomy.sql`: Meta tags, keywords, and sitemap settings.
   - `010_durable_invalidation_and_rate_limits.sql`: Outbox invalidation queue and distributed rate limit counters.
   - `011_user_sessions.sql`: Persistent user sessions with SHA-256 tokens and TTLs.
   - `012_admin_content_and_governance.sql`: Admin users, blog posts, content blocks, URL redirects, newsletter subscribers, and discovery requests.

---

## 3. Concurrency & Singleton Locking Model

1. **Worker Singleton Execution:**
   - Reconciler daemon acquires session-level advisory lock `829104812` (`pg_try_advisory_lock(829104812)`).
   - If another worker holds the lock, subsequent workers cleanly enter standby mode without duplicate cycles.
2. **Market-Level Mutation Serialization:**
   - Ranking mutations lock the target market row:
     ```sql
     SELECT id FROM markets WHERE id = $1 FOR UPDATE;
     ```
   - All displacements, qualifying price updates, and `position_history` entries are executed within the same transaction.
   - Prevents race conditions and lost updates during high-velocity simultaneous bids.

---

## 4. Disaster Recovery & Backup Safety Invariants

Defined in `scripts/backup-db.sh`, `scripts/restore-db.sh`, and `frontend/lib/ops/backup-safety.ts`:

1. **Deterministic Checksum Validation:**
   - Backups generate custom-format pg_dump archives accompanied by SHA-256 checksums (`.sha256`) and JSON manifests (`.manifest.json`).
   - `verify-backup.sh` validates archive TOC integrity via `pg_restore --list`.
2. **Production Restore Target Safeguard:**
   - `restore-db.sh` refuses execution against active application databases (`RESTORE_DATABASE_URL === DATABASE_URL`).
   - Requires explicit confirmation and target naming containing disposable tokens (`test`, `disposable`, `sandbox`, `restore`, `dev`).
3. **Safe Error Logging:**
   - Connection strings, user passwords, and authentication tokens are deterministically redacted (`redactConnectionString()`) in error outputs.

---

## 5. Summary Gate Table

| Gate | Execution Target | Outcome | Details |
| :--- | :--- | :---: | :--- |
| **Static Code & Repositories** | `api/src/db/` | **PASS** | PostgreSQL pool, parameterized queries, and repositories created |
| **Fail-Closed Probe** | `/api/health/ready` | **PASS** | Verified HTTP 503 DEGRADED on disconnected database in unit tests |
| **Migration Sequence** | 001–012 SQL scripts | **PASS** | Forward compatibility verified across test suites |
| **Live Database Migration** | Disposable DB Container | **BLOCKED** | Host missing Docker Engine / port 5432 listener |
| **Restart Persistence E2E** | API + DB Process Bounce | **BLOCKED** | Blocked on live PostgreSQL container |
| **Multi-Worker Concurrency** | Advisory Lock 829104812 | **BLOCKED** | Blocked on live PostgreSQL container |
| **Live Backup / Restore Run** | `restore-db.sh` | **BLOCKED** | Blocked on live PostgreSQL container |
