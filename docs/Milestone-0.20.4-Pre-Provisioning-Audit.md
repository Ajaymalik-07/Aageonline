# AageOnline — Milestone 0.20.4 Pre-Provisioning Security Audit & Deployment Gate

> [!NOTE]  
> **SUPERSEDED BY MILESTONE 0.20.6:** Staging infrastructure has been decommissioned in favor of a simplified **Local Development → Production** model. The security validations and hardening artifacts in this report remain active in the canonical production pipeline.

> **Project:** AageOnline  
> **Tagline:** Get Seen. Get Ahead.  
> **Milestone:** 0.20.4  
> **Historical Target Environment:** `staging.aageonline.com` (Archival Record)  
> **Architecture:** Docker VPS + Managed PostgreSQL 16+ + Direct DNS + Caddy Auto-TLS  
> **Execution Mode:** Local Repository Artifact Inspection & Hardening  
> **Date:** October 9, 2026  

---

## 1. Executive Summary

Milestone 0.20.4 conducted a comprehensive pre-provisioning security audit of the deployment infrastructure artifacts:
- `scripts/setup-vps.sh`
- `scripts/deploy-staging.sh`
- `docker-compose.staging.yml`
- `frontend/Dockerfile`
- `Caddyfile`
- `.env.staging.example`
- Migrations 001–010 and runner `frontend/lib/db/migrator.ts`

The objective of this gate is to ensure that running these scripts on a real Ubuntu VPS will not introduce security vulnerabilities, accidental port exposure, root-equivalent exploits, secret leakage, or deployment deadlock.

**Audit Status:** All artifacts have been audited, hardened with minimal code changes, validated with shell syntax analysis, static typechecks (`tsc --noEmit`), and verified against 454 automated test suites.

---

## 2. Prioritized Audit Findings & Remediation

| Finding ID | Severity | Area | Vulnerability / Risk | Remediation Implemented |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-0204-01** | **MEDIUM** | Network / Firewall | **Docker UFW Bypass:** In standard Linux kernels, Docker modifies `iptables` directly (`PREROUTING`/`DOCKER` chains), bypassing standard UFW `INPUT` filtering. A rule like `ufw deny 3000` has *no effect* on Docker containers with published ports (`ports:`). | In `docker-compose.staging.yml`, `web` strictly uses `expose: - "3000"` (internal bridge network only) rather than host publishing (`ports:`). Added explicit warning comments in `scripts/setup-vps.sh` and runbooks. |
| **SEC-0204-02** | **MEDIUM** | Deploy Pipeline | **Silent Healthcheck Degradation:** In `scripts/deploy-staging.sh`, if the web container exceeded `MAX_WAIT` (45s) without reaching healthy status, the script logged a warning but continued deployment with exit code 0. | Hardened `scripts/deploy-staging.sh` to log `[ERROR]`, dump container logs, and immediately exit with non-zero status code (`exit 1`). Also added strict verification of `/api/health/ready`. |
| **SEC-0204-03** | **MEDIUM** | Database Migrations | **Concurrent Migration Contention:** Multiple deployment runners or concurrent worker containers executing `npm run db:migrate` simultaneously could race each other during table creation. | Implemented session-level PostgreSQL advisory locking (`MIGRATION_ADVISORY_LOCK_ID = 94827104`) in `frontend/lib/db/migrator.ts`. Concurrent migration attempts safely serialize. |
| **SEC-0204-04** | **LOW / INFO** | Host Security | **Docker Group Root Equivalence:** Adding the deploy user to the `docker` group in `scripts/setup-vps.sh` grants root-equivalent control over the host via the Docker socket. | Added explicit security notice in `scripts/setup-vps.sh` and documented in runbook that only authorized deploy operators should receive group membership. |

---

## 3. Mandatory Security & Architectural Checks

### 3.1 Docker and Firewall Security
- **Public Port Exposure:** Only ports **80/tcp**, **443/tcp**, and **443/udp** (HTTP/3) are published by Caddy.
- **Port 3000 (Next.js Application):** Configured with `expose: - "3000"` on the private Docker bridge network (`aageonline-staging-net`). It is **never** published to `0.0.0.0` or bound to the host network interface.
- **Port 5432 (PostgreSQL):** The VPS runs zero local database daemons. Connection to managed PostgreSQL occurs strictly outbound over TLS (`sslmode=require`).
- **Worker Isolation:** The reconciler worker container (`aageonline_staging_worker`) has **zero inbound ports** (no `ports`, no `expose`). It communicates strictly outbound to PostgreSQL.
- **SSH Access Preservation:** `scripts/setup-vps.sh` explicitly executes `ufw allow 22/tcp` *before* enabling UFW (`echo "y" | ufw enable`), eliminating the risk of SSH lockout.
- **IPv4 and IPv6 Exposure:** Caddy automatically listens on both `0.0.0.0` and `::` for ports 80 and 443. UFW default configuration on Ubuntu enforces parity across IPv4 and IPv6 (`IPV6=yes`).

### 3.2 VPS Setup Script (`scripts/setup-vps.sh`)
- **Idempotency:** Re-running the script is safe. Uses `command -v docker` check, overwrites GPG keys with `--yes`, uses `install -m 0755` for keyrings, and `mkdir -p` for directories.
- **Supported Versions:** Targets Ubuntu 24.04 LTS and 22.04 LTS (`$VERSION_CODENAME`).
- **Official Repositories:** Downloads official Docker CE from `download.docker.com/linux/ubuntu` with SHA-verified GPG keyrings in `/etc/apt/keyrings/docker.gpg`.
- **SSH Configuration:** Does *not* alter `/etc/ssh/sshd_config` or disable password authentication automatically, preventing accidental host lockout.

### 3.3 Deployment Pipeline (`scripts/deploy-staging.sh`)
- **Zero Secret Leakage:** Script never echoes, prints, or logs `DATABASE_URL`, `AUTH_SECRET`, or `PAYU_*`. Logs print only non-sensitive metadata (`SITE_ADDRESS`, `APP_ENV`, `PAYU_ENV`).
- **Permissions Enforcement:** Automatically checks and enforces `chmod 600` on `.env.staging`.
- **Migration Rollout Gate:** Migrations run *before* services are started (`docker compose ... run --rm migrator`). Under `set -e`, any migration error halts execution immediately.
- **Worker Single-Active Guarantee:** Reconciler worker acquires PostgreSQL advisory lock `pg_try_advisory_lock(829104812)`. Concurrent container replicas safely yield without executing duplicate financial reconciliations.

### 3.4 Database and Migrations (001–010)
- **Sequential Execution:** Migrations `001` through `010` load in strict numerical order (`loadMigrationFiles()`).
- **Audit Table Integrity:** Tracks applied versions in `schema_migrations`.
- **Transaction Boundaries:** Each migration runs inside `BEGIN ... COMMIT` with `ROLLBACK` on error.
- **Serialization Safety:** Serialized via `SELECT pg_advisory_lock(94827104)`.
- **TLS Requirement:** `pg.Pool` configuration enforces `ssl: { rejectUnauthorized: true }` in production and staging.
- **Connection Budget:** Budgeted at 10 (web) + 5 (worker) = 15 connections, within cloud database limits.

### 3.5 Staging Safety & SEO Isolation
- **Search Engine Blocking:**
  - `frontend/app/robots.ts` returns `User-agent: * Disallow: /` and suppresses `sitemap.xml` when `APP_ENV === 'staging'`.
  - Caddy attaches `X-Robots-Tag: noindex, nofollow` to all HTTP responses.
  - Edge Middleware injects `X-Robots-Tag: noindex, nofollow` dynamically.
- **Outbound Email Safety Sink:** `StandardDeliveryAdapter` automatically intercepts all transactional emails to `STAGING_SAFETY_SINK` unless sent to `STAGING_TEST_EMAIL_RECIPIENT`.
- **PayU Sandbox Isolation:** `PAYU_ENV=test` targets sandbox endpoints (`https://test.payu.in/_payment`) using test credentials (`gtKFFx` / `eCwWELxi`).
- **Financial Invariants:** Unconfirmed payments never mutate ranking; displacement plans execute atomically with market row locks (`SELECT FOR UPDATE`).

---

## 4. Validation Evidence

| Validation Command | Tool / Engine | Outcome | Evidence |
| :--- | :--- | :---: | :--- |
| `bash -n scripts/setup-vps.sh` | Git Bash (GNU bash 5.2) | **PASS** | 0 syntax errors; clean exit code 0. |
| `bash -n scripts/deploy-staging.sh` | Git Bash (GNU bash 5.2) | **PASS** | 0 syntax errors; clean exit code 0. |
| Line Ending Validation | PowerShell AST / .NET IO | **PASS** | Confirmed pure Unix LF (`\n`) on all `.sh`, `Caddyfile`, and compose files. Zero `\r` CRLF characters. |
| `npm run typecheck` | TypeScript Compiler 5.7 (`tsc --noEmit`) | **PASS** | 0 TypeScript type errors across all source files. |
| `npm test` | Node.js Test Runner (v22.23.2) | **PASS** | **454 / 454 tests passed** across 49 test suites (1,060 ms). |
| `npm run build` | Next.js Standalone Compiler (15.2.0) | **PASS** | **69 / 69 routes compiled** into `.next/standalone/server.js`. |
| Edge Middleware Bundle Size | Webpack Build Trace | **PASS** | **62.8 kB** (Zero Node.js `pg` driver leaks). |

*Explicit Audit Boundary Statement:* Local verification was completed using static analysis, syntax validators, and unit/integration tests. Docker daemon execution, live DNS resolution, and cloud PostgreSQL socket connections were **not** executed locally, as those cloud resources remain unprovisioned.

---

## 5. Deployment Gate Verdict

$$\mathbf{READY\ TO\ PROVISION}$$

**Verdict Justification:**  
All repository deployment artifacts—`scripts/setup-vps.sh`, `scripts/deploy-staging.sh`, `docker-compose.staging.yml`, `frontend/Dockerfile`, `Caddyfile`, `.env.staging.example`, and migrations 001–010—have been audited, hardened against Docker-UFW bypasses, secured against concurrent migration races, and validated with clean shell syntax, TypeScript checks, and 454 passing tests. The codebase is safely locked and ready to execute on provisioned staging infrastructure.
