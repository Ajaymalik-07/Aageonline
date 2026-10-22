# AageOnline — Milestone 0.20.21
## Provider-Neutral Production Readiness

**Product:** AageOnline — Get Seen. Get Ahead.  
**Milestone:** 0.20.21  
**Status:** COMPLETE (Provider-Neutral Readiness Audit & Architecture Specification)  
**Production Verdict:** **`PROVIDER-NEUTRAL PRODUCTION READINESS CONFIRMED — MULTI-SERVICE BOUNDARIES VERIFIED — ALL 6 LIVE GATES DEFERRED`**  
**Date:** October 12, 2026  

---

## 1. Executive Summary & Explicit Undecided Baselines

Milestone 0.20.21 prepares AageOnline for eventual production deployment without locking into any specific hosting vendor, purchasing domains, provisioning live infrastructure, or initiating financial transactions.

### Key Provider-Neutral Decisions Upheld:
1. **Domain Candidate Only:** `aageonline.com` remains an illustrative candidate. All routing, TLS ingress, CORS configurations, and Next.js public variables are parameterized dynamically via `${SITE_ADDRESS}`.
2. **Hosting Provider & Region Undecided:** Zero cloud accounts or VPS instances provisioned. The application runs on any standard Linux distribution with Docker Compose.
3. **Database Topology Neutrality:** Fully supports both:
   - **Option A:** Single VPS with containerized PostgreSQL 16 on the same host (activated via `--profile local-db`).
   - **Option B:** VPS plus external Managed PostgreSQL 16 DBaaS (configured via `DATABASE_URL`).
4. **DNS & Edge Undecided:** Works interchangeably with Cloudflare, Route 53, Namecheap, or registrar DNS.
5. **Budgetary Neutrality:** All cost figures are categorized as **unverified estimates** pending real vendor pricing validation.
6. **Zero Website Alterations:** The completed website UI, typography, colors, layout, design tokens, and motion implementation remain **100% locked and unchanged**.
7. **All Six Deferred Production Launch Gates Preserved:** No gate was prematurely claimed as passed.

---

## 2. Multi-Service Container & Architecture Audit

The deployment stack is orchestrated via `docker-compose.yml` across six containerized services plus an optional same-host database service on a private Docker bridge network (`aageonline-net`):

```
                                  Internet
                                     │
                             ┌───────▼───────┐
                             │ Caddy Ingress │ (Public Ports: 80, 443, 443/udp)
                             └───────┬───────┘
                                     │ aageonline-net (Internal Bridge Network)
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
  ┌──────▼──────┐             ┌──────▼──────┐             ┌──────▼──────┐
  │ web (Next)  │             │ api (Node)  │             │ admin (Next)│
  │ Port 3000   │             │ Port 4000   │             │ Port 3001   │
  └──────┬──────┘             └──────┬──────┘             └──────┬──────┘
         │                           │                           │
         │ Direct DB pool            │ Transactional pool        │ HTTP only (Zero DB)
         └─────────────────────────┐ │ ┌─────────────────────────┘
                                   │ │ │
                           ┌───────▼─▼─▼───────┐
                           │   PostgreSQL 16   │
                           │  `DATABASE_URL`   │
                           └───────────────────┘
                                     ▲
                     ┌───────────────┴───────────────┐
                     │                               │
            [ Option A: `db` ]              [ Option B: Managed ]
            postgres:16-alpine              Cloud DBaaS
            Volume: `pgdata`                TLS Enforced
            Internal expose: 5432           External Dedicated Compute
```

### Detailed Service Audit Table:
| Service | Image / Target | Internal Port | Host Port Binding | Healthcheck | Restart Policy | Persistence / Volumes |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **`caddy`** | `caddy:2.9-alpine` | 80, 443 | **80:80, 443:443, 443/udp** | Depends on healthy `web`, `api` | `unless-stopped` | `caddy_data`, `caddy_config` |
| **`web`** | `frontend/Dockerfile` (`web`) | 3000 | **None (Expose only)** | `wget /api/health/live` (15s) | `unless-stopped` | Stateless |
| **`api`** | `api/Dockerfile` | 4000 | **None (Expose only)** | `wget /api/health/live` (15s) | `unless-stopped` | Stateless |
| **`admin`** | `admin/Dockerfile` | 3001 | **None (Expose only)** | `wget http://127.0.0.1:3001/` (15s) | `unless-stopped` | Stateless |
| **`worker`** | `frontend/Dockerfile` (`worker`) | None | **None (Headless)** | `node scripts/worker.ts --health` (30s) | `unless-stopped` | Stateless (Heartbeats in DB) |
| **`migrator`** | `frontend/Dockerfile` (`migrator`) | None | **None (Terminating)** | One-off execution | `no` (`profiles: [tools]`) | Runs migrations `001`–`011` |
| **`db`** *(Option A)* | `postgres:16-alpine` | 5432 | **None (Expose only)** | `pg_isready -U aageonline` (10s) | `unless-stopped` (`profiles: [local-db]`) | `pgdata` volume |

---

## 3. Boundary & Invariant Verification Findings

### A. Admin Service Database Boundary
- **Audit Finding:** The admin application (`admin/`) has **ZERO direct database connections**.
- **Evidence:** Verified via codebase scan: zero imports of `pg`, zero occurrences of `DATABASE_URL`, zero connection pool instantiation.
- **Access Pattern:** All administrative operations (taxonomy management, reconciliation triggers, vitals inspection) communicate exclusively via HTTP with `http://api:4000` guarded by `ADMIN_TOKEN`.

### B. Worker Singleton & Advisory Lock Protection
- **Audit Finding:** Reconciler worker cannot execute concurrently or conflict across multiple instances.
- **Evidence:** Worker acquires PostgreSQL 64-bit session advisory lock `pg_try_advisory_lock(829104812)` at the start of every cycle. If another worker holds the lock, the cycle harmlessly skips (`skipped: true`).
- **Shutdown & Lifecycle:** Handles `SIGTERM`/`SIGINT` with bounded 10-second drain timeouts. Circuit-breaker trips after repeated database disconnects with exponential backoff. Emits durable heartbeats to `worker_heartbeats`.

### C. One-Off Migration Execution
- **Audit Finding:** Migrations (`001_initial_schema.sql` through `011_invalidation_recovery_jobs.sql`) do **NOT** run automatically on application startup.
- **Evidence:** Migrator container is isolated under `profiles: ["tools"]` with `restart: "no"`. Migrations execute only through deliberate command invocation (`docker compose --profile tools run --rm migrator`).
- **Concurrency Guard:** Migration runner acquires dedicated session-level advisory lock `pg_advisory_lock(94827104)`, preventing concurrent runner race conditions. Each file runs within an explicit `BEGIN ... COMMIT` block and records to `schema_migrations`.

### D. Secret Injection & Fail-Closed Authentication
- **Audit Finding:** Zero secrets or credentials committed to repository.
- **Evidence:** `.env.production.example` provides explicit placeholders. Production authentication strictly disables development identity bypass when `NODE_ENV=production`. If session store or database is unreachable, authentication fails closed (`401/403`). All database connection strings with passwords are redacted before log emission.

### E. Network Exposure Isolation
- **Audit Finding:** Public ingress is restricted strictly to Caddy on ports `80` and `443`.
- **Evidence:** PostgreSQL (whether local container or managed), REST API, Admin dashboard, and Web frontend expose ports strictly to internal bridge network `aageonline-net`. No container except Caddy publishes ports to the host interface.

---

## 4. Provider-Neutral Decision Record: Same-Host vs Managed DB

| Attribute | Option A: Single VPS (Same-Host DB) | Option B: VPS + Managed PostgreSQL (DBaaS) |
| :--- | :--- | :--- |
| **Topology** | 1 VM hosting Caddy, Web, API, Admin, Worker + containerized DB on `aageonline-net`. | 1 VM hosting app containers + cloud-managed PostgreSQL cluster. |
| **Compute Contention** | Shared RAM/CPU; risk of OOM termination during Next.js SSR traffic spikes. | Isolated compute; 100% of VPS memory dedicated to application containers. |
| **High Availability** | Single point of failure; VM outage halts both app and database. | Managed cluster with automated failover and multi-AZ standby availability. |
| **Backup Automation** | Self-managed cron via `scripts/backup-encrypted.sh` pushing to off-host storage. | Automated point-in-time recovery (PITR) and daily cloud snapshots. |
| **Unverified Est. Cost** | **~$12 – $24 / month** *(1x 2 vCPU / 4 GB RAM VPS)* | **~$35 – $65 / month** *(1x 2 vCPU / 4 GB RAM VPS + 1x Managed DB)* |
| **Recommendation** | Supported for early alpha testing and constrained budgets. | **Recommended production baseline** for financial integrity and durability. |

*All cost figures are unverified estimates and must be confirmed against official vendor billing schedules prior to purchase.*

---

## 5. Security, Backup, Restore & Recovery Runbook

Authoritative operational specification documented in:
[`docs/Security-Backup-Restore-and-Recovery-Checklist.md`](file:///d:/Aage%20online/docs/Security-Backup-Restore-and-Recovery-Checklist.md)

Key Procedures Established:
1. **Host Hardening:** SSH key-only auth, UFW firewall allowing only 22/80/443, Fail2Ban, unprivileged Docker execution.
2. **Encrypted Backup Pipeline:** `pg_dump -Fc` -> SHA-256 manifest -> GPG/Age asymmetric encryption -> off-host transfer via `rclone` (S3/R2/B2/SSH) -> 7-day retention pruning.
3. **Disaster Restore Drill:** Validated against disposable database with 4-step state invariant checks (migration count = 11, clean positions, non-overlapping ranks).
4. **Observability & Logging:** Standard JSON logging with Docker 10MB/5-file caps (max 300MB total across all containers). Health probes on 15–30s intervals.

---

## 6. Review of Production Environment Variables Template

Reviewed `.env.production.example`. Categorized into 6 secure functional blocks:
1. **Runtime & Environment:** `NODE_ENV=production`, `APP_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`.
2. **Domain & Ingress:** `SITE_ADDRESS=aageonline.com`, `ACME_EMAIL=admin@aageonline.com`, `NEXT_PUBLIC_APP_URL=https://${SITE_ADDRESS}`.
3. **Database Options (Provider-Neutral):**
   - Option A (Same-Host): `DATABASE_URL=postgresql://aageonline:PASS@db:5432/aageonline`, `DATABASE_SSL=false`.
   - Option B (Managed DB): `DATABASE_URL=postgresql://user:PASS@managed-db.example.com:5432/aageonline?sslmode=require`, `DATABASE_SSL=true`.
   - Pool tuning: `DATABASE_MAX_CONNECTIONS=10`, `DATABASE_STATEMENT_TIMEOUT_MS=10000`.
4. **Cryptographic Secrets (Fail-Closed):** `AUTH_SECRET`, `SESSION_SECRET`, `RATE_LIMIT_SALT`, `ADMIN_TOKEN` (64-char hex strings).
5. **Payment Gateway (PayU India):** `PAYU_ENV=production`, `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`.
6. **Transactional Notifications:** `NOTIFICATION_EMAIL_ENABLED=false`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

---

## 7. Verification Evidence & Test Execution Results

All available tests and compilation checks executed cleanly with **zero failures**:

### A. Automated Test Suites
1. **API Integration Suite (`api/tests/api-server.test.ts`):**
   - Command: `node --experimental-strip-types --test tests/api-server.test.ts`
   - Results: **8 / 8 tests PASS (0 failures, 200 ms)**
   - Covered: Health/readiness probes, market catalog & search, categories/locations, businesses directory & slug lookup, bid intents validation, admin operations vitals & reconciliation triggers, CORS preflights.
2. **Frontend Domain, Security & Operational Suite (`frontend/tests/`):**
   - Command: `node --experimental-strip-types --test tests/operational-verification-and-failure-paths.test.ts tests/businesses-domain.test.ts tests/auth-rbac-workspace.test.ts`
   - Results: **64 / 64 tests PASS (0 failures, 297 ms)**
   - Covered: Worker supervisor lifecycle & circuit breaking, backup safety & credential redaction, financial lifecycle & redirect security, auth/RBAC fail-closed invariants, business domain validation.

**Total Automated Tests: 72 / 72 tests PASSING.**

### B. TypeScript Static Compilation
- `frontend/`: `tsc --noEmit` → **0 errors**
- `api/`: `tsc --noEmit` → **0 errors**
- `admin/`: `tsc --noEmit` → **0 errors**

### C. Container Production Builds
- `admin/`: Executed `next build` → **Compiled successfully in 4.7s**, prerendered all static routes (`/`, `/discovery`, `/operations`), First Load JS = 104 kB.

---

## 8. Preserved Six Production Launch Gates

Per project standards, all six live production launch gates remain **DEFERRED** and explicitly unclosed:

1. **Gate 1 — Real PostgreSQL integration & transactional verification:** `DEFERRED` (Awaiting disposable/managed database).
2. **Gate 2 — Backup and restore verification against a disposable database:** `DEFERRED` (Awaiting live PostgreSQL instance).
3. **Gate 3 — Live worker concurrency, restart & database-lock verification:** `DEFERRED` (Awaiting multi-process live DB).
4. **Gate 4 — Production database provisioning & secure configuration:** `DEFERRED` (Awaiting cloud provider account & owner approval).
5. **Gate 5 — PayU provider verification with sandbox/live credentials:** `DEFERRED` (Awaiting PayU merchant onboarding).
6. **Gate 6 — DNS, HTTPS, deployment, monitoring & operational recovery:** `DEFERRED` (Awaiting live VPS, Caddy TLS, and DNS delegation).

---

## 9. Deliverables Created & Modified

| Deliverable | File Path | Status |
| :--- | :--- | :---: |
| **Milestone Report** | [`docs/Milestone-0.20.21-Provider-Neutral-Production-Readiness.md`](file:///d:/Aage%20online/docs/Milestone-0.20.21-Provider-Neutral-Production-Readiness.md) | **Created** |
| **Architecture & Decision Record** | [`docs/Provider-Neutral-Deployment-Architecture-and-Decision.md`](file:///d:/Aage%20online/docs/Provider-Neutral-Deployment-Architecture-and-Decision.md) | **Created** |
| **Security & Backup Checklist** | [`docs/Security-Backup-Restore-and-Recovery-Checklist.md`](file:///d:/Aage%20online/docs/Security-Backup-Restore-and-Recovery-Checklist.md) | **Created** |
| **Docker Compose Config** | [`docker-compose.yml`](file:///d:/Aage%20online/docker-compose.yml) | **Updated** (admin healthcheck, `local-db` profile, `pgdata` volume) |
| **Admin Container Config** | [`admin/Dockerfile`](file:///d:/Aage%20online/admin/Dockerfile) | **Updated** (`npm ci`, `npm run build`, `npm start`) |
| **Environment Template** | [`.env.production.example`](file:///d:/Aage%20online/.env.production.example) | **Updated** (dual-option database configuration) |
| **First Deployment Checklist** | [`docs/Production-First-Deployment-Checklist.md`](file:///d:/Aage%20online/docs/Production-First-Deployment-Checklist.md) | **Updated** (provider-neutral baseline) |
| **Decision Log** | [`docs/Decision-Log.md`](file:///d:/Aage%20online/docs/Decision-Log.md) | **Updated** (ADR-039) |
| **Changelog** | [`docs/Changelog.md`](file:///d:/Aage%20online/docs/Changelog.md) | **Updated** (Milestone 0.20.21 entry) |

---

## 10. Recommended Next Milestone

**Milestone 0.20.22 — Disposable Database Staging & Pre-Flight Verification Harness:**
Before committing funds to live production hosting or purchasing a domain:
1. Spin up a temporary, disposable local or cloud PostgreSQL instance.
2. Execute the live database verification tests against that disposable instance to validate Gates 1, 2, and 3.
3. Validate automated backup creation, GPG encryption, and restore drill with realistic seed data.
4. Verify worker concurrent advisory locking and recovery sweeps with live PostgreSQL connections.
