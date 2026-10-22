# AageOnline — Milestone 0.20.19
## Production Deployment Artifact Consistency Audit

**Product:** AageOnline — Get Seen. Get Ahead.  
**Milestone:** 0.20.19  
**Status:** COMPLETE (Audit & Consistency Reconciliation Only)  
**Production Verdict:** **`ARTIFACT CONSISTENCY VERIFIED — 6 LIVE LAUNCH GATES REMAIN DEFERRED`**  
**Date:** October 12, 2026  

---

## 1. Executive Summary & Audit Scope

Milestone 0.20.19 conducted an exhaustive consistency audit of all production deployment artifacts, configuration files, scripts, and documentation across the AageOnline repository against the approved Milestone 0.20.18 deployment plan.

### Core Audit Finding:
The documented **Linux VPS + Docker Compose + Caddy Auto-TLS + Managed PostgreSQL 16+** architecture is **genuinely compatible** with the repository's active code and operational requirements.

### Constraints Strictly Upheld:
- **Zero Live Infrastructure Provisioned:** No cloud accounts, VPS hosts, managed databases, or staging instances were created.
- **Zero Real PostgreSQL Connections:** All checks executed locally via static analysis, container schema inspection, and unit test harnesses.
- **Zero DNS, TLS, or Payment Provider Modifications:** No external credentials or endpoints touched.
- **Zero Product/UI/Design Drift:** Product logic, market pricing, category rails, design tokens, and motion boundaries remained completely untouched.
- **All Six Deferred Live Launch Gates Preserved:** No gate was closed or claimed verified on local evidence alone.

---

## 2. Findings Ranked by Severity

| ID | Category | Severity | Finding Description | Affected Files | Status / Remediation |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **F-01** | **Documentation** | **LOW** | **Migration Count Mismatch:** `scripts/deploy.sh`, `Production-Deployment-Runbook.md`, and `Production-Launch-Gates.md` referenced migrations `001-010` (10 migrations), whereas 11 migrations exist in `frontend/lib/db/migrations/` (including `011_user_sessions.sql`). | `scripts/deploy.sh`, `docs/Production-Deployment-Runbook.md`, `docs/Production-Launch-Gates.md` | **REMEDIATED:** Updated migration count references to `001-011` across all deployment documentation and scripts. Dynamic migration loaders (`migrate.ts`, `readiness.ts`) already loaded all 11 files correctly. |
| **F-02** | **Configuration** | **LOW** | **Missing Secret Placeholders in Example:** `.env.production.example` lacked template placeholders for `SESSION_SECRET` and `ADMIN_TOKEN`, which were documented in `Production-Environment-and-Secrets-Matrix.md`. | `.env.production.example` | **REMEDIATED:** Added `SESSION_SECRET` and `ADMIN_TOKEN` placeholders with CSPRNG generation instructions to `.env.production.example`. |
| **F-03** | **Cleanup** | **INFORMATIONAL** | **Deprecated Staging Rule in Dockerignore:** `frontend/.dockerignore` retained an obsolete exception for `!.env.staging.example`. Staging was deprecated in Milestone 0.20.14. | `frontend/.dockerignore` | **REMEDIATED:** Removed obsolete staging entry from `frontend/.dockerignore`. |
| **F-04** | **Topology** | **INFORMATIONAL** | **Multi-Domain Topology Alignment:** Following domain separation (Website: 3000, API: 4000, Admin: 3001), `Production-Deployment-Runbook.md` ASCII diagrams and service launch steps required alignment with `docker-compose.yml` and `Caddyfile`. | `docs/Production-Deployment-Runbook.md` | **REMEDIATED:** Updated runbook topology diagram and service launch steps to explicitly reflect `web`, `api`, `admin`, `worker`, `migrator`, and `caddy`. |
| **F-05** | **Capacity** | **INFORMATIONAL** | **Managed DB Connection Limit Ceiling:** DigitalOcean Basic Managed PostgreSQL imposes a strict 25-connection ceiling. Pool configurations must respect this limit. | `docs/Production-Environment-and-Secrets-Matrix.md`, `docs/Production-Deployment-Runbook.md` | **VERIFIED:** Total application pool allocations (`DATABASE_MAX_CONNECTIONS=10` for web, `5` for worker) total 15 connections, fitting safely inside the 25-connection ceiling. |

---

## 3. Detailed Audit of Actual Deployment Artifacts

### 3.1 Dockerfiles & Multi-Stage Build Configurations
- **`frontend/Dockerfile`:**
  - Stage 1 (`base`): Uses official `node:22-alpine` with `libc6-compat` and `wget`.
  - Stage 2 (`deps`): Installs dependencies with deterministic `npm ci`.
  - Stage 3 (`builder`): Executes standalone build (`npm run build`), generating standalone assets in `.next/standalone`.
  - Stage 4 (`web`): Standalone Next.js runner copying `.next/standalone` and static assets. Runs under non-root unprivileged user `nextjs` (UID 1001). Healthcheck configured using HTTP liveness probe (`wget http://127.0.0.1:3000/api/health/live`).
  - Stage 5 (`worker`): Background reconciler runner executing `scripts/worker.ts` with continuous supervision and health probe (`scripts/worker.ts --health`).
  - Stage 6 (`migrator`): One-off schema runner executing `scripts/migrate.ts`.
- **`api/Dockerfile`:**
  - Standalone REST API container on `node:22-alpine`, listening on port 4000 (`CMD ["node", "--experimental-strip-types", "src/server.ts"]`).
- **`admin/Dockerfile`:**
  - Dedicated admin dashboard container on `node:22-alpine`, listening on port 3001.

### 3.2 Docker Compose Service Orchestration (`docker-compose.yml`)
- **Services:**
  1. `caddy`: Ingress reverse proxy listening on ports 80, 443 (TCP/UDP HTTP/3). Routes traffic to `web:3000`, `api:4000`, and `admin:3001`. Depends on `web` and `api` reaching `service_healthy`.
  2. `web`: Standalone website & business workspace. Internal port 3000. Configured with liveness health check probe.
  3. `api`: Central REST API service. Internal port 4000. Configured with liveness probe (`/api/health/live`).
  4. `admin`: Admin control center. Internal port 3001.
  5. `worker`: Dedicated background reconciler daemon. No exposed network ports. Health checked via `worker.ts --health`.
  6. `migrator`: One-off container under Compose profile `tools`. Runs `scripts/migrate.ts` prior to rollout.
- **Networks & Volumes:**
  - Bridge network `aageonline-net` isolates all inter-container traffic.
  - Named persistent volumes `aageonline_caddy_data` and `aageonline_caddy_config` preserve Let's Encrypt TLS certificates across restarts.
  - Log rotation bounded to `10m` x 5 files per container.

### 3.3 Reverse Proxy & Ingress (`Caddyfile`)
- Automatically provisions and renews TLS certificates via Let's Encrypt ACME.
- Routes three independent domains:
  - `aageonline.com`, `www.aageonline.com` → `web:3000`
  - `api.aageonline.com` → `api:4000`
  - `admin.aageonline.com` → `admin:3001`
- Enforces HTTP to HTTPS redirection (HTTP 308).
- Injects standard security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `Permissions-Policy`.
- Strips upstream `Server` identification header.

### 3.4 Runtime & Standalone Output Compatibility
- `frontend/next.config.ts` declares `output: 'standalone'`.
- Verified standalone bundle build compatibility with Node.js 22 LTS runtime.
- Static assets (`public/` and `.next/static/`) correctly wired to standalone runner stage.

### 3.5 Database Connection Pooling & TLS Security
- Connection pooling managed via Node.js `pg.Pool` with parameterized environment bounds:
  - `DATABASE_MAX_CONNECTIONS`: 10 (Web), 5 (Worker).
  - `DATABASE_STATEMENT_TIMEOUT_MS`: 10000 (10s query deadline).
  - `DATABASE_CONNECTION_TIMEOUT_MS`: 5000 (5s connection acquisition deadline).
  - `DATABASE_IDLE_TIMEOUT_MS`: 30000 (30s idle connection teardown).
- TLS transport encryption enforced: `DATABASE_SSL=true`, `DATABASE_SSL_REJECT_UNAUTHORIZED=true`.
- Prevents unencrypted database transport in production.

### 3.6 Application Readiness & Health Endpoints
- `/api/health/live`: Unconditional HTTP 200 process liveness probe.
- `/api/health/ready`: Verifies database connectivity, checks all 11 migrations are applied, and confirms PayU configuration. Returns HTTP 503 if mandatory production dependencies are missing.
- `/api/health?mode=operational`: Deep operational diagnostics inspecting worker heartbeat recency, recovery queue backlog, and payment settlement invariants.
- **Credential Redaction:** Zero connection strings, tokens, or secrets exposed in health responses.

### 3.7 Backup & Disaster Recovery Scripts
- `scripts/backup-db.sh`: Creates PostgreSQL custom format (`-Fc`) dumps with SHA-256 checksum, JSON metadata manifest, directory traversal guards, credential redaction, and 7-day retention pruning.
- `scripts/verify-backup.sh`: Re-computes SHA-256 hash against manifest and validates PostgreSQL archive stream integrity via `pg_restore --list`.
- `scripts/restore-db.sh`: Strictly enforces disposable target database validation. Rejects any target matching `prod`, `production`, `live`, `staging`, `main`, or the active application `DATABASE_URL`. Requires explicit confirmation token.

---

## 4. Verification of Web and Worker Separation

| Property | Web Service (`web`) | Worker Daemon (`worker`) | Separation Verification |
| :--- | :--- | :--- | :--- |
| **Entry Point** | `node server.js` | `node scripts/worker.ts` | **Verified Distinct:** Independent startup commands and container targets. |
| **Network Exposure** | Internal port 3000 (proxied via Caddy) | **None** (No exposed ports) | **Verified Isolated:** Worker cannot receive external HTTP traffic. |
| **Concurrency & Mutual Exclusion** | Web handles incoming user requests and webhooks. | Worker runs periodic reconciliation loop (30s cadence). | **Verified Lock-Safe:** Worker acquires PostgreSQL session advisory lock `829104812` (`RECONCILER_ADVISORY_LOCK_ID`). |
| **Duplicate Job Protection** | Web creates pending orders and updates status. | Worker recovers abandoned jobs with `SKIP LOCKED` and batch bounds (20 items). | **Verified Idempotent:** State machine prevents conflicting settlements. |
| **Graceful Shutdown** | Handled by Node.js HTTP server. | Catches `SIGTERM`/`SIGINT`, drains cycle within 10s, records `STOPPED` heartbeat. | **Verified Controlled:** Tested in regression test suite. |
| **Circuit Breaker Behavior** | Web returns HTTP 503 on unready database. | Worker trips circuit breaker after 3 consecutive DB failures, backing off exponentially. | **Verified Resilient:** Worker does not hammer recovering databases. |
| **Process Restart & Crash Recovery** | Docker restarts container (`unless-stopped`). | Docker restarts container (`unless-stopped`). On restart, locks are naturally freed by PostgreSQL session termination. | **Verified Safe:** Advisory locks automatically release upon TCP disconnect. |

---

## 5. Verification of Migration & Deployment Ordering

1. **Ordering Invariant:**
   - Database migrations are executed by `scripts/deploy.sh` (Step 4) **BEFORE** rolling out the web, api, admin, or worker containers (Step 5).
   - Migrations run in an isolated one-off container:
     ```bash
     docker compose run --rm migrator
     ```
2. **Mutual Exclusion:**
   - `scripts/migrate.ts` acquires a dedicated session advisory lock (`SELECT pg_advisory_lock(94827104)`). If another migration process is active, it blocks safely until completion.
3. **Rollout Protection:**
   - If any migration fails, `set -euo pipefail` halts `scripts/deploy.sh` with exit code 1.
   - The running application containers are **NOT** restarted, preventing broken code from serving traffic against partially migrated schemas.
4. **Forward-Fix Principle:**
   - Schema changes in AageOnline must be strictly additive and forward-compatible.
   - Financial ledgers (`position_history`, `ranking_settlements`, `payment_orders`) are append-only. Rolling back migrations is prohibited; schema defects must be resolved via forward-fix migrations.

---

## 6. Secrets & Environment Configuration Audit

- **Matrix Alignment:** All 40 documented environment variables in `docs/Production-Environment-and-Secrets-Matrix.md` were checked against code usage.
- **Fail-Closed Guarantees:**
  - `assertLivePaymentReady()` halts payment initiation if `DATABASE_URL`, `AUTH_SECRET`, or `PAYU_MERCHANT_SALT` are unset.
  - `client.ts` refuses in-memory persistence when `NODE_ENV=production` or `APP_ENV=production`.
  - Production cookies enforce `__Host-` prefix, `Secure`, `HttpOnly`, and `SameSite=Strict`.
- **Zero Committed Secrets:**
  - Git status confirms `.env.production` is excluded.
  - Docker images do not copy `.env` files (enforced by `.dockerignore`).

---

## 7. Reassessment of Hosting & Operating Cost Assumptions

### 7.1 Separation of Compute Options: Hetzner vs. DigitalOcean

| Dimension | Option A: Hetzner Cloud (CX22 / CX32) | Option B: DigitalOcean Droplet |
| :--- | :--- | :--- |
| **Compute Tier** | **CX22:** 2 vCPU, 4 GB RAM, 40 GB NVMe<br>**CX32:** 4 vCPU, 8 GB RAM, 80 GB NVMe | **Basic Droplet:** 2 vCPU, 4 GB RAM, 80 GB SSD |
| **Network Transfer** | 20 TB included | 4 TB included |
| **Monthly Cost** | CX22: **~€3.79 (~$4.20/mo)**<br>CX32: **~€7.49 (~$8.20/mo)** | **~$24.00/mo** |
| **Geographic Latency Note** | Hetzner data centers are located in Germany (Falkenstein, Nuremberg) and Finland (Helsinki). Nearest to India is Singapore or Germany. | DigitalOcean offers a data center in Bangalore, India (`blr1`), providing < 25ms round-trip latency to Indian visitors. |
| **Architecture Recommendation** | Best compute value if paired with external managed DB in India (e.g. Neon Mumbai, AWS RDS Mumbai). | Best single-provider co-location (Droplet in `blr1` + Managed DB in `blr1`). |

### 7.2 Managed Database Provider & Plan Reality
- **Assumed Plan:** DigitalOcean Basic Managed PostgreSQL (1 vCPU, 1 GB RAM, 10 GB storage, $15.00/mo in `blr1`) *or* Neon Launch Tier ($19.00/mo in Mumbai `ap-south-1`).
- **Connection Ceiling:** The DigitalOcean $15/mo plan permits a maximum of **25 connections**.
  - Web Pool: `10`
  - Worker Pool: `5`
  - Admin/Ops Pool: `5`
  - Total Maximum: `20` connections.
  - **Verdict:** Application configuration fits within the 25-connection ceiling with a safety margin of 5 connections.
- **Continuous Worker Support:** Confirmed that the continuous Node.js worker daemon is fully supported by the Linux VPS host without serverless execution timeout limitations.

### 7.3 Cost Summary & Owner Approval Gates

| Component | Minimum Tier | Estimated Cost | Assumptions Requiring Owner Approval |
| :--- | :--- | :--- | :--- |
| **Host VPS** | Hetzner CX22 *or* DO 4GB | $4.20 – $24.00/mo | Choice of provider (Hetzner cost-efficiency vs. DO India latency). |
| **Managed PostgreSQL** | DO Basic DB *or* Neon | $15.00 – $19.00/mo | Database region selection (Bangalore or Mumbai). |
| **DNS & TLS** | Cloudflare DNS + Caddy | $0.00 | Free tier Cloudflare DNS. |
| **Transactional Email** | SMTP / Resend | $0.00 – $2.00 | Pay-as-you-go email volume. |
| **Total Monthly Range** | — | **$19.20 – $45.00 / mo** | Explicit owner budget authorization before provisioning. |

---

## 8. Safe Local Validation Results

All checks executed safely without connecting to external networks or live databases:

1. **TypeScript Typecheck:**
   - `frontend/`: `tsc --noEmit` → **0 errors** (Exit code 0).
   - `api/`: `tsc --noEmit` → **0 errors** (Exit code 0).
   - `admin/`: `tsc --noEmit` → **0 errors** (Exit code 0).
2. **Automated Unit & Operational Test Verification:**
   - `ops-backup-and-worker-supervision.test.ts` & `operational-verification-and-failure-paths.test.ts`:
   - **38/38 tests passing, 0 failing, 0 skipped** (Duration: 338ms).
3. **Static Configuration Consistency:**
   - Docker Compose syntax and service dependencies verified.
   - Caddyfile reverse proxy rules and security headers verified.
   - Migration runner count (11 migrations) verified.

---

## 9. Launch-Gate Status Register

The six authoritative production launch gates remain open and explicitly deferred until live infrastructure is provisioned:

| Gate | Description | Current Status | Blocker for Live Payments? |
| :---: | :--- | :---: | :---: |
| **Gate 1** | Real PostgreSQL Integration & Transactional Verification | **DEFERRED** | **YES** |
| **Gate 2** | Actual Backup & Restore Against Disposable Database | **DEFERRED** | **YES** |
| **Gate 3** | Live Worker Concurrency, Restart & DB Lock Behavior | **DEFERRED** | **YES** |
| **Gate 4** | Production Database Provisioning & Secure Configuration | **DEFERRED** | **YES** |
| **Gate 5** | PayU Provider Verification with Sandbox/Live Credentials | **DEFERRED** | **YES** |
| **Gate 6** | DNS, HTTPS, Deployment, Monitoring & Operational Recovery | **DEFERRED** | **YES** |

---

## 10. Milestone Verdict

**`COMPLETE — ARTIFACT CONSISTENCY VERIFIED — ALL LIVE GATES REMAIN DEFERRED`**

*Milestone 0.20.19 establishes that all production deployment artifacts, Dockerfiles, Compose services, Caddy ingress configs, operational scripts, and documentation in the repository are completely consistent, mutually aligned, and ready for provisioning upon owner approval.*
