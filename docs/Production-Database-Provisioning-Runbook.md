# AageOnline — Production Database Provisioning & Secure Configuration Runbook

> **Brand:** AageOnline — Get Seen. Get Ahead.  
> **Status:** Pre-Execution Runbook (Awaiting Explicit Owner Authorization)  
> **Classification:** Launch Gate 4 Implementation Specification  
> **Target Release:** Production Phase 8  
> **Database Baseline:** PostgreSQL 16+ (Local reference: 16.8)  
> **Document Reference:** `docs/Production-Database-Provisioning-Runbook.md`  

---

## 1. Executive Summary & Authoritative Scope

This runbook establishes the definitive, step-by-step operational procedure for provisioning, configuring, hardening, migrating, and verifying the production PostgreSQL database for AageOnline.

### Strict Safety & Authorization Boundaries
1. **Zero Cloud Provisioning Without Explicit Owner Command:** No cloud accounts, databases, compute droplets, or VPC resources may be provisioned or billed based on this document alone.
2. **Read-Only Context:** Application source code, local databases (`aageonline_dev`, `aageonline_integration_test`, `aageonline_worker_drill_disposable`), and test environments remain untouched.
3. **No Blind Migrations:** Production schema migrations (001 through 014) must be executed strictly through the documented one-off container protocol after network and role validation.
4. **No Real Financial Charges:** Payment gateways (PayU India) remain gated under Launch Gate 5; this runbook prepares the transactional persistence layer only.

---

## 2. Workload Profile, Constraints & Architectural Invariants

### 2.1 Workload Profile
AageOnline exhibits an asymmetric read-heavy, high-value write transactional workload:
- **Read Workload (High Volume):** Public market directories, category rails, competitive ladder views, business profiles, and SEO canonical landing pages. Read queries are optimized with composite indexes (e.g. `idx_ranking_entries_market_pos`) and SSR caching.
- **Write Workload (Low-to-Medium Frequency, Extreme Integrity):**
  - Business claim submissions and mobile OTP verifications.
  - PayU payment orders, webhook callbacks, and cryptographic signature audit trails.
  - Atomic ranking settlement mutations updating ladder positions.
  - Background reconciler worker cycles running every 30 seconds.
  - Hourly lead scraper and email campaign outbox updates.

### 2.2 Relational & Transactional Integrity Invariants
1. **PostgreSQL 16+ Engine:** Relies on robust ACID transactions, modern identity columns, JSONB operations, and advisory locking primitives.
2. **Integer Minor Units:** All monetary values are strictly `BIGINT` paise (₹1.00 = `100`). Floating-point types (`FLOAT`, `DOUBLE PRECISION`, `REAL`) are prohibited.
3. **Append-Only Financial Ledger:** Tables `transactions`, `position_history`, `audit_logs`, `webhook_events`, and `ranking_settlements` are immutable. Updates or deletions on confirmed records are strictly blocked.
4. **Atomic Ranking Mutations:** Market position settlements require row locking (`SELECT ... FOR UPDATE` on `markets`) inside a single database transaction.

### 2.3 Advisory Lock Invariants & Connection Pooling Constraints
AageOnline background jobs rely on PostgreSQL session-level advisory locks:
- `RECONCILER_ADVISORY_LOCK_ID = 829104812` (`pg_try_advisory_lock` in `frontend/lib/workers/reconciler-worker.ts`)
- `MIGRATION_ADVISORY_LOCK_ID = 94827104` (`pg_advisory_lock` in `frontend/lib/db/migrator.ts`)
- `SCHEDULER_ADVISORY_LOCK_ID = 94827105` (`pg_try_advisory_lock` in `api/src/scheduler/engine.ts`)

> [!CAUTION]
> **CRITICAL POOLING CONSTRAINT — TRANSACTION POOLING BREAKS ADVISORY LOCKS:**  
> Connection poolers operating in **transaction pooling mode** (such as PgBouncer with `pool_mode = transaction`, Supabase Supavisor on port 6543, or Neon pooled endpoints) reassign server connections between transactions.  
> Because `pg_try_advisory_lock` binds to the physical PostgreSQL session backend, subsequent queries or unlock statements within the same application client may be routed to a different backend connection. This causes:  
> 1. Orphaned lock retention on the original backend.  
> 2. Failure to unlock via `pg_advisory_unlock`.  
> 3. False concurrency skips across all workers.  
> 
> **Architectural Resolution:**  
> - The background worker (`aageonline_worker`), scheduler, and migrator **MUST** connect to the **direct session-mode port** (standard port `5432` or DigitalOcean direct port `25060`).  
> - If connection pooling is enabled for the public Next.js web application (`aageonline_web`), PgBouncer must either be configured in `session` mode or use separate connection strings (`DATABASE_URL` direct vs `DATABASE_POOLED_URL`).

### 2.4 Connection Budget & Headroom Analysis

```text
┌──────────────────────────────────────┬────────────────────────┬───────────────────────────────────────────┐
│ Service / Consumer Component         │ Allocated Connections  │ Purpose & Lifecycle                       │
├──────────────────────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ `aageonline_web` (Next.js SSR/API)   │ 10 connections         │ User auth, bidding, claims, webhooks      │
│ `aageonline_worker` (Reconciler)     │ 5 connections          │ 30s cycle, advisory lock 829104812        │
│ `aageonline_api` (REST Service)      │ 3 connections          │ Direct queries, health monitoring         │
│ `aageonline_admin` (Admin Next.js)   │ 0 connections          │ HTTP client only (communicates via API)   │
│ `worker.ts --health` (Health Probe)  │ 1 connection           │ Transient probe every 30s (< 100ms)       │
│ Host Backup Cron (`pg_dump`)         │ 1 connection           │ Nightly offsite backup dump (< 30s)       │
│ Administrative / psql Headroom       │ 5 connections          │ Migrations, manual inspection, telemetry  │
├──────────────────────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ TOTAL REQUIRED CONNECTION BUDGET     │ 25 connections         │ Minimum safe production capacity          │
└──────────────────────────────────────┴────────────────────────┴───────────────────────────────────────────┘
```

### 2.5 Availability & Disaster Recovery Objectives
- **Recovery Point Objective (RPO):** $\le 1\text{ hour}$ (automated daily snapshots + 7-day Point-In-Time Recovery WAL archiving).
- **Recovery Time Objective (RTO):** $\le 30\text{ minutes}$ (automated cloud failover or point-in-time snapshot spin-up).

---

## 3. Managed PostgreSQL Provider Comparative Analysis

The table below evaluates production-qualified managed PostgreSQL providers against AageOnline's specific requirements. All pricing and specifications reflect verified October 2026 data.

| Evaluation Dimension | Option 1: DigitalOcean Managed DB (Bangalore `blr1`) | Option 2: AWS Lightsail Managed DB (Mumbai `ap-south-1`) | Option 3: AWS RDS PostgreSQL (Mumbai `ap-south-1`) | Option 4: Neon Serverless Postgres (AWS Mumbai) |
| :--- | :--- | :--- | :--- | :--- |
| **Geographic Region** | Bangalore, India (`blr1`) | Mumbai, India (`ap-south-1`) | Mumbai, India (`ap-south-1`) | Mumbai, India (`ap-south-1`) |
| **Latency to Indian Metros** | **< 15–35 ms** (Optimal routing) | **< 15–30 ms** (Optimal routing) | **< 15–30 ms** (Optimal routing) | **< 20–35 ms** (Standard AWS routing) |
| **Host-to-DB Latency** | **< 1 ms** (VPC peering in `blr1`) | **< 1 ms** (VPC peering in `ap-south-1`) | **< 1 ms** (VPC peering in `ap-south-1`) | **5–15 ms** (External TLS egress) |
| **Engine Version** | PostgreSQL 16.x | PostgreSQL 16.x | PostgreSQL 16.x | PostgreSQL 16.x |
| **Base Configuration** | 1 vCPU, 2 GB RAM, 30 GB SSD | 1 vCPU, 1 GB RAM, 40 GB SSD | `db.t4g.micro` (2 vCPU, 1 GB RAM, 20 GB gp3) | 1 CU (~2 GB RAM, 0.25–1 vCPU) |
| **Direct Connections** | **47 connections** (2 GB plan)<br>*(22 connections on 1 GB plan)* | **~112 connections** (formula-based) | **~112 connections** (`LEAST(RAM/9.5MB, 5000)`) | **100+ direct connections** |
| **Connection Pooling** | Built-in PgBouncer (direct port 25060 provided) | Direct connection only (no pooler) | Direct connection (RDS Proxy optional) | Direct port 5432 & PgBouncer port 6543 |
| **Advisory Lock Safety** | **100% Safe** via direct port 25060 | **100% Safe** (native direct port) | **100% Safe** (native direct port) | **Safe on direct port only** *(autosuspend must be disabled)* |
| **Automated Backups & PITR** | Daily snapshots + **7-day PITR included** | Daily snapshots (7-day retention) | Automated snapshots + **1–35 day PITR** | Continuous WAL + point-in-time branch |
| **High Availability (Failover)** | 1-Click Standby Node ($60/mo total) | High Availability Plan ($30/mo total) | Multi-AZ Synchronous (~$36/mo total) | Native multi-AZ compute replication |
| **Invoicing & Indian GST** | USD billing + 18% GST invoice | **Native INR billing via AISPL with GST** | **Native INR billing via AISPL with GST** | USD billing via Stripe (international card) |
| **Estimated Monthly Cost** | **$30.00 / mo** (2 GB standalone)<br>*($60.00 / mo with HA Standby)* | **$15.00 / mo** (Standard)<br>*($30.00 / mo with High Availability)* | **~$18.00–$22.00 / mo** (Standalone)<br>*($36.00–$44.00 / mo with Multi-AZ)* | **$19.00 / mo** (Launch plan with fixed compute) |
| **Recommendation Status** | **RECOMMENDED PRIMARY** (Simplicity & VPC Co-location) | **RECOMMENDED ALTERNATIVE** (Lowest Cost with INR/GST) | **ENTERPRISE SCALE OPTION** (Higher setup overhead) | **EVALUATED BUT CONDITIONAL** (Autosuspend risk) |

### Authoritative Provider Recommendation:
1. **Primary Recommendation:** **DigitalOcean Managed PostgreSQL 16 (Bangalore `blr1`, 2 GB RAM Tier @ $30/mo)**.  
   - Direct VPC co-location with the application Droplet ($24/mo) yields sub-millisecond query latency.  
   - 47 direct connections provide 188% capacity over the 25-connection budget.  
   - Automated 7-day point-in-time recovery (PITR) satisfies financial audit compliance out of the box.  
2. **Alternative Budget Recommendation:** **AWS Lightsail Managed PostgreSQL 16 (Mumbai `ap-south-1`, 1 GB RAM Tier @ $15/mo)**.  
   - Provides 112 direct connections with native Indian GST invoicing via Amazon Internet Services Pvt Ltd (AISPL).

---

## 4. Secure Connectivity, Least-Privilege Roles & Secret Management

### 4.1 Network Security Architecture
```text
           PUBLIC INTERNET
                  │
                  ▼ (Blocked by Firewall)
     ┌────────────────────────┐
     │   Managed PostgreSQL   │
     │   (Port 5432 / 25060)  │
     └────────────▲───────────┘
                  │
                  │ Inbound TLS 1.3 (sslmode=verify-full / require)
                  │ Allowed strictly from VPC or Trusted IP Whitelist
                  │
     ┌────────────┴───────────┐
     │  Application Droplet   │
     │  (Bangalore `blr1` VPC)│
     │  Internal IP: 10.x.x.x │
     └────────────────────────┘
```

1. **VPC Co-location:** Bind the managed database to the private Virtual Private Cloud (VPC) network shared with the application host.
2. **Trusted Sources Whitelist:** Configure the cloud firewall to reject all incoming TCP traffic on the database port **except** from:
   - Application Droplet Private IP (`10.x.x.x`)
   - Application Droplet Public Static IP (backup path)
   - Authorized Operator Bastion / Static VPN IP (for emergency maintenance)
3. **TLS Enforcement:** Strict TLS 1.3 with valid certificate validation (`DATABASE_SSL=true`, `DATABASE_SSL_REJECT_UNAUTHORIZED=true`).

---

### 4.2 Least-Privilege Database Role Matrix

Do not run the application using the cloud superuser (`doadmin` or `postgres`). Provision distinct, least-privilege roles:

| Role Name | Scope | Permissions Granted | Permissions Forbidden |
| :--- | :--- | :--- | :--- |
| **`aage_admin`** | Initial Setup & Maintenance | Schema owner, extension creation, role provisioning | Live application traffic |
| **`aage_migrator`** | Migration Runner (`scripts/migrate.ts`) | DDL (`CREATE`, `ALTER`, `DROP` on public schema), `pg_advisory_lock` | Running as continuous web application user |
| **`aage_app`** | Web, Worker, and API runtime | DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on application tables | DDL (`DROP TABLE`, `TRUNCATE`, `ALTER TABLE`) |
| **`aage_readonly`** | Telemetry, Analytics, Audit | `SELECT` on non-sensitive tables | Any write, update, or delete operations |
| **`aage_backup`** | Nightly `pg_dump` backup cron | `SELECT`, `LOCK TABLES` on all tables | Modifying schema or table data |

#### SQL Provisioning Script for Cloud PostgreSQL:
```sql
-- Execute as cloud superuser (doadmin / postgres)
CREATE DATABASE aageonline_prod WITH ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';

\c aageonline_prod;

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. Create Application & Service Roles with SCRAM-SHA-256
CREATE ROLE aage_migrator WITH LOGIN PASSWORD '<STRONG_MIGRATOR_SECRET>' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE aage_app WITH LOGIN PASSWORD '<STRONG_APP_SECRET>' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE aage_readonly WITH LOGIN PASSWORD '<STRONG_READONLY_SECRET>' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE aage_backup WITH LOGIN PASSWORD '<STRONG_BACKUP_SECRET>' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- 3. Grant Schema Permissions
GRANT ALL ON SCHEMA public TO aage_migrator;
GRANT USAGE ON SCHEMA public TO aage_app;
GRANT USAGE ON SCHEMA public TO aage_readonly;
GRANT USAGE ON SCHEMA public TO aage_backup;

-- 4. Default Privileges for Tables Created by Migrator
ALTER DEFAULT PRIVILEGES FOR ROLE aage_migrator IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aage_app;

ALTER DEFAULT PRIVILEGES FOR ROLE aage_migrator IN SCHEMA public
    GRANT SELECT ON TABLES TO aage_readonly;

ALTER DEFAULT PRIVILEGES FOR ROLE aage_migrator IN SCHEMA public
    GRANT SELECT ON TABLES TO aage_backup;

ALTER DEFAULT PRIVILEGES FOR ROLE aage_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO aage_app;

-- 5. Connection Limits
ALTER ROLE aage_app CONNECTION LIMIT 35;
ALTER ROLE aage_migrator CONNECTION LIMIT 3;
ALTER ROLE aage_backup CONNECTION LIMIT 2;
ALTER ROLE aage_readonly CONNECTION LIMIT 5;
```

---

### 4.3 Secret Management & Production Environment Variables

1. **Generation:** Passwords must be generated using high-entropy CSPRNG tokens:
   ```bash
   openssl rand -base64 32
   ```
2. **Storage:** Stored on the production application host strictly inside `/opt/aageonline/.env.production` with permissions `chmod 600` owned by `root:root`.
3. **Exclusion:** `.env.production` is strictly excluded from version control via `.gitignore`.
4. **Environment Parameters:**
   ```ini
   # /opt/aageonline/.env.production (Production Persistence Configuration)
   NODE_ENV=production
   APP_ENV=production
   PERSISTENCE_MODE=postgres

   # Direct Session Connection String (Used by Web, Worker & Migrator)
   DATABASE_URL=postgresql://aage_app:<STRONG_APP_SECRET>@<PRIVATE_DB_HOST>:25060/aageonline_prod?sslmode=require

   # Dedicated Migrator Connection String
   MIGRATOR_DATABASE_URL=postgresql://aage_migrator:<STRONG_MIGRATOR_SECRET>@<PRIVATE_DB_HOST>:25060/aageonline_prod?sslmode=require

   # Connection Pool & Statement Limits
   DATABASE_MAX_CONNECTIONS=10
   DATABASE_IDLE_TIMEOUT_MS=30000
   DATABASE_CONNECTION_TIMEOUT_MS=5000
   DATABASE_STATEMENT_TIMEOUT_MS=10000
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=true
   ```

---

## 5. Migration Execution & Schema Deployment Protocol

Schema migrations must be applied sequentially from `001` through `014` using the isolated one-off migrator service **before** live web traffic or workers are started.

```text
┌────────────────────────────────┐
│  Start New Host Infrastructure │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│   Verify DB Network & TLS      │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│ Execute One-Off Migrator:      │
│ docker compose run --rm        │
│ migrator                       │
└───────────────┬────────────────┘
                │
                ├──────────────────────────────────────────────┐
                │ Migration Failed?                            │ Migration Succeeded?
                ▼                                              ▼
┌────────────────────────────────┐             ┌────────────────────────────────┐
│ Rollback & Inspect Logs        │             │ Verify schema_migrations table │
│ Halt Container Startup         │             │ (All 14 migrations recorded)   │
└────────────────────────────────┘             └───────────────┬────────────────┘
                                                               │
                                                               ▼
                                               ┌────────────────────────────────┐
                                               │ Start Application Services:    │
                                               │ docker compose up -d web worker│
                                               └────────────────────────────────┘
```

### Execution Command:
```bash
# Execute strictly on the production host
docker compose -f docker-compose.yml --env-file .env.production run --rm \
  -e DATABASE_URL="$MIGRATOR_DATABASE_URL" \
  migrator
```

### Verification Query:
```sql
SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC;
```
Expected result: Exactly 14 records from `001_initial_schema.sql` through `014_whatsapp_auth_and_business_evidence.sql`.

---

## 6. Operational Verification & Resilience Testing

Before opening traffic to users, execute these five verification drills against the provisioned production database.

### Drill 1: Advisory Lock Correctness & Mutual Exclusion
Verify that `pg_try_advisory_lock(829104812)` functions correctly over the cloud connection:
```bash
# Connection 1: Acquire lock
psql "$DATABASE_URL" -c "SELECT pg_try_advisory_lock(829104812) AS acquired;"
# Expected: acquired = t

# Connection 2 (Simultaneous): Attempt to acquire lock while Connection 1 holds it
psql "$DATABASE_URL" -c "SELECT pg_try_advisory_lock(829104812) AS acquired;"
# Expected: acquired = f
```

### Drill 2: Statement Timeout Enforcement
Verify that runaway queries are killed after 10,000 ms to protect connection pool capacity:
```bash
psql "$DATABASE_URL" -c "SET statement_timeout = 10000; SELECT pg_sleep(12);"
# Expected output: ERROR: canceling statement due to statement timeout
```

### Drill 3: Transient Connection Interruption & Worker Reconnection
1. Start the worker container: `docker compose up -d worker`.
2. Inspect worker logs to confirm normal reconciliation cycles.
3. Simulate temporary network disruption by injecting a temporary drop rule on the host:
   ```bash
   iptables -A OUTPUT -p tcp --dport 25060 -j DROP
   sleep 10
   iptables -D OUTPUT -p tcp --dport 25060 -j DROP
   ```
4. Confirm in worker logs:
   - Worker logs connection error gracefully.
   - Worker initiates backoff without process crash.
   - Worker re-establishes PostgreSQL connection and resumes normal cycles.

### Drill 4: Process Crash & Session Advisory Lock Release
1. Start Worker 1 and verify it holds lock `829104812`.
2. Abruptly terminate Worker 1: `docker kill --signal=SIGKILL aageonline_worker`.
3. Verify that PostgreSQL immediately frees advisory lock `829104812` upon TCP socket closure.
4. Verify Worker 2 acquires the lock on the subsequent cycle without deadlock.

### Drill 5: Backup & Disposable Target Restore Drill
1. Execute the production backup script:
   ```bash
   bash scripts/backup-db.sh
   ```
2. Verify checksum manifest generation (`.sha256`).
3. Restore the backup into a distinct, explicitly disposable database:
   ```bash
   TARGET_DB="aageonline_prod_restore_drill_disposable" bash scripts/restore-db.sh <BACKUP_PATH>
   ```
4. Confirm row counts match source tables in `markets`, `businesses`, and `schema_migrations`.
5. Drop the disposable database after verification:
   ```bash
   psql "$ADMIN_DATABASE_URL" -c "DROP DATABASE aageonline_prod_restore_drill_disposable;"
   ```

---

## 7. Ordered Provisioning Checklist

```text
[ ] STEP 1: OWNER APPROVAL & PREREQUISITES
    [ ] Owner selects provider: DigitalOcean (Bangalore) or AWS Lightsail (Mumbai).
    [ ] Owner authorizes monthly operating budget ($30–$54 / month).
    [ ] Owner provisions cloud account and configures billing / payment method.
    [ ] Application Droplet static public IP and private VPC IP recorded.

[ ] STEP 2: CLUSTER CREATION & NETWORK SECURITY
    [ ] Provision Managed PostgreSQL 16 cluster in selected region.
    [ ] Enable Private VPC Networking.
    [ ] Add Application Droplet private and public IPs to Database Trusted Sources.
    [ ] Download provider CA certificate (`ca-certificate.crt`).
    [ ] Confirm TLS is strictly enforced (`sslmode=require`).

[ ] STEP 3: DATABASE & ROLE PROVISIONING
    [ ] Connect via cloud admin credentials (`doadmin` / `postgres`).
    [ ] Execute role provisioning script (Section 4.2).
    [ ] Generate strong 32-character SCRAM-SHA-256 secrets for `aage_migrator`, `aage_app`, `aage_backup`.
    [ ] Populate `/opt/aageonline/.env.production` with strict permissions (`chmod 600`).

[ ] STEP 4: MIGRATION EXECUTION
    [ ] Run one-off migration task: `docker compose run --rm migrator`.
    [ ] Query `schema_migrations` to confirm all 14 migrations applied.
    [ ] Confirm 42 application tables created.

[ ] STEP 5: RESILIENCE & ADVISORY LOCK DRILLS
    [ ] Run Drill 1: Advisory lock mutual exclusion (Section 6).
    [ ] Run Drill 2: Statement timeout enforcement (Section 6).
    [ ] Run Drill 3: Worker crash and lock cleanup (Section 6).
    [ ] Run Drill 5: Backup dump and disposable restore test.

[ ] STEP 6: APPLICATION SERVICE STARTUP
    [ ] Start application containers: `docker compose up -d web worker api`.
    [ ] Execute health probe: `docker compose exec worker node --experimental-strip-types scripts/worker.ts --health`.
    [ ] Verify HTTP 200 on public health endpoint: `curl -k https://127.0.0.1/api/health/ready`.
    [ ] Confirm `worker_heartbeats` table records live updates with `status = 'ACTIVE'`.

[ ] STEP 7: GATE 4 CLOSURE SIGN-OFF
    [ ] Document provider cluster ID, endpoint, and verified connection metrics.
    [ ] Update `docs/Production-Launch-Gates.md` marking Gate 4 as PASSED.
    [ ] Advance deployment pipeline to Launch Gate 5 (PayU Production Merchant Onboarding).
```

### Rollback & Abort Criteria:
- **Phase 2 Abort:** If VPC networking fails or latency between Droplet and DB exceeds 5 ms, destroy database instance and investigate provider region co-location before continuing.
- **Phase 4 Abort:** If any migration fails, do NOT launch web or worker containers. Execute rollback query, drop corrupted tables, fix the migration script in development, and re-run.
- **Phase 5 Abort:** If advisory locks fail or show connection leakage under pool testing, switch `DATABASE_URL` strictly to direct session port `25060`.

---

## 8. Comprehensive Risk Register

| Risk ID | Risk Description | Severity | Probability | Impact | Mitigation Strategy |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **RSK-DB-01** | Transaction-mode pooler breaks session advisory lock `829104812` | **HIGH** | Medium | Reconciler worker fails to synchronize; potential duplicate settlements. | Worker strictly connects via direct session port `25060`/`5432`; verified in Drill 1. |
| **RSK-DB-02** | Connection slot exhaustion under traffic spike | **MEDIUM** | Low | Application returns HTTP 500; `remaining connection slots reserved`. | 2 GB tier provides 47 connections (42% peak utilization); statement timeout set to 10s. |
| **RSK-DB-03** | Runaway query starves database CPU / memory | **MEDIUM** | Low | Query queue builds up; latency degrades across all endpoints. | Hard statement timeout (`statement_timeout = 10000ms`) enforced in client pool. |
| **RSK-DB-04** | Accidental restore targeting active production database | **CRITICAL** | Very Low | Catastrophic data loss; overwriting of live financial transactions. | `validateRestoreTarget()` in `backup-safety.ts` blocks any restore matching active DB. |
| **RSK-DB-05** | Production credential leakage in version control | **CRITICAL** | Very Low | Unauthorized access to financial records and user personal data. | Credentials exist strictly in `/opt/aageonline/.env.production`; excluded in `.gitignore`. |
| **RSK-DB-06** | Cloud data center outage in primary region | **HIGH** | Very Low | Complete service downtime until provider resolves infrastructure incident. | 7-day PITR enabled; off-host encrypted backups synced nightly to independent S3/R2 storage. |

---

## 9. Outstanding Decisions Requiring Owner Approval

The following architectural and commercial decisions remain strictly undecided and require explicit owner sign-off prior to execution:

1. **Hosting & Database Provider Selection:**  
   - *Option A (Recommended):* DigitalOcean (Bangalore `blr1`) — Droplet ($24) + Managed DB ($30) = **$54.00 / month**.  
   - *Option B (Alternative):* AWS Lightsail (Mumbai `ap-south-1`) — VPS ($20) + Managed DB ($15) = **$35.00 / month** with INR/GST billing.
2. **High Availability (Failover Standby Node):**  
   - *Single-Node Plan ($15–$30/mo):* Point-in-time recovery and automated daily snapshots; manual failover (~15 min RTO).  
   - *High-Availability Multi-Node Plan ($30–$60/mo):* Automated instant failover with standby replica (< 60s RTO).
3. **Backup Retention & Off-Host Storage Target:**  
   - Selection of independent offsite storage provider for encrypted `pg_dump` artifacts (Cloudflare R2, AWS S3, or Backblaze B2).
4. **Production Credential Custody:**  
   - Authorization of master password creation, KMS key management, and deployment operator access keys.
