# AageOnline — Milestone 0.20.18
## Production Deployment Planning & Infrastructure Decision

**Product:** AageOnline — Get Seen. Get Ahead.  
**Milestone:** 0.20.18  
**Status:** COMPLETE (Planning & Documentation Only)  
**Production Verdict:** **`PLANNING COMPLETE — PROVISIONING GATED ON OWNER APPROVAL`**  
**Date:** October 12, 2026  

---

## 1. Executive Summary & Recommendation

Milestone 0.20.18 establishes the authoritative production deployment plan, hosting comparison, operating cost estimate, environment matrix, and execution runbook for AageOnline.

In strict adherence to milestone constraints:
- **No infrastructure was provisioned or purchased.**
- **No cloud accounts, databases, or staging environments were created.**
- **No DNS, TLS, secrets, or production configurations were modified.**
- **Application source code, financial logic, and design tokens were untouched.**

### Authoritative Architecture Recommendation:
**Linux VPS (Docker Compose) + Caddy Auto-TLS + Managed PostgreSQL 16+**

This architecture fits the current repository perfectly:
1. It runs the existing multi-stage `frontend/Dockerfile` (`web`, `worker`, `migrator`) without rewriting any application logic or build scripts.
2. It natively supports persistent TCP connection pools via standard Node.js `pg.Pool`, enabling full ACID transaction boundaries, row locks (`FOR UPDATE`), and PostgreSQL advisory locks (`pg_advisory_xact_lock`).
3. It allows the background reconciler worker daemon (`WorkerSupervisor`) to run continuously with in-memory circuit breakers, health probes, and graceful shutdown timeouts.
4. It isolates internal application ports (`3000`) within private Docker bridge networks, exposing only ports 80 and 443 via Caddy with automated Let's Encrypt TLS and HTTP/3 support.
5. It offers an exceptionally affordable, predictable operating cost of **$21 – $35 / month** at low initial traffic.

---

## 2. Repository Architecture & Configuration Findings

An exhaustive inspection of the active repository revealed the following architectural realities:

### 2.1 Cloudflare / OpenNext Configuration Findings
- **Inspection Result:** Neither `frontend/wrangler.jsonc` nor `frontend/open-next.config.ts` exists in the repository.
- **Divergence:** While early architectural documentation mentioned Cloudflare as a potential edge CDN, no OpenNext build configuration or workerd adapter was ever scaffolded.
- **Architectural Implication:** Attempting to deploy on Cloudflare Workers would require introducing third-party adapters (`@opennextjs/cloudflare`), replacing Node.js `pg.Pool` TCP sockets with WebSocket/Hyperdrive proxies, and breaking the continuous worker supervisor model.

### 2.2 Docker & Container Readiness
- **Multi-Stage Dockerfile Present:** `frontend/Dockerfile` already defines three optimized targets:
  - `web`: Standalone Next.js Node 22 runner (`node server.js`) with HTTP liveness healthcheck.
  - `worker`: Background reconciler daemon (`scripts/worker.ts`) with custom health check probe (`scripts/worker.ts --health`).
  - `migrator`: Dedicated one-off schema migration runner (`scripts/migrate.ts`).
- **Production Compose File Present:** `docker-compose.yml` orchestrates Caddy, Web, Worker, and Migrator services over private bridge network `aageonline-net`.

### 2.3 Operational Tooling Readiness
- **Backup & Restore Tooling:** `scripts/backup-db.sh`, `scripts/verify-backup.sh`, and `scripts/restore-db.sh` are implemented with SHA-256 manifest generation, path traversal rejection, and credential redaction.
- **Health & Readiness Endpoints:** Built-in endpoints `/api/health`, `/api/health/live`, and `/api/health/ready` provide deep diagnostic state without exposing internal secrets.

---

## 3. Systematic Hosting Options Comparison

| Evaluation Dimension | Option 1: Cloudflare Workers + OpenNext + Managed DB | Option 2: Linux VPS (Docker Compose) + Managed DB (Recommended) | Option 3: Managed PaaS (Render / Railway) + Managed DB (Fallback) |
| :--- | :--- | :--- | :--- |
| **Next.js App Router Compatibility** | Moderate. Requires OpenNext build pipeline; potential V8 isolate edge limitations. | **100% Native.** Standard Node.js 22 LTS standalone server. | **100% Native.** Direct Node.js / Docker container support. |
| **Persistent PG Connections & Pool** | Poor. Serverless isolates cannot hold persistent TCP pools; requires WebSockets / Hyperdrive. | **Native.** Standard `pg.Pool` with persistent connection pooling and statement timeouts. | **Native.** Persistent container holds connection pool. |
| **Advisory Locks & Atomic Settlement** | Risky. Connection multiplexers / proxies can break advisory locks (`pg_advisory_xact_lock`). | **Native.** Direct TLS connection supports transaction-level advisory locks safely. | **Native.** Direct TLS connection supports transaction locks. |
| **Background Worker Engine** | Difficult. Cloudflare isolates cannot run continuous daemon loops; requires Cron Triggers. | **Native.** Dedicated worker container runs `WorkerSupervisor` continuously. | **Native.** Dedicated "Background Worker" service container. |
| **Worker Supervision & Graceful Shutdown** | None. Edge functions terminate abruptly on deadline. | **Native.** Catches `SIGTERM`, drains in-flight cycles within 10s, records stopped heartbeat. | **Native.** PaaS handles SIGTERM gracefully on deploy. |
| **Session & Cookie Security** | Supported via Web Crypto. | **Native.** Node.js `crypto` with `__Host-` prefixed cookies and 256-bit token hashes. | **Native.** Full Node.js crypto and secure cookies. |
| **PayU Webhook Reliability** | Good, but subject to serverless execution limits. | **Excellent.** Dedicated Caddy ingress; direct POST handling without cold starts. | **Good.** Direct webhook routing. |
| **Database Backup & Restore** | Independent managed database provider. | **Integrated.** Host cron runs `backup-db.sh` with manifest validation and tarball retention. | Independent managed database provider. |
| **Deployment Rollback Safety** | Instant edge rollback via Wrangler. | **Fast.** `git checkout <tag> && bash scripts/deploy.sh` rebuilds and launches in < 60s. | Fast. One-click dashboard rollback. |
| **TLS & Custom Domain Setup** | Built-in Cloudflare SSL. | **Automated.** Caddy automatically provisions and renews Let's Encrypt certificates. | Automated. Managed PaaS SSL certificates. |
| **Operational Maintenance Effort** | Low infrastructure maintenance, high application adapter maintenance. | **Moderate.** Basic Linux OS updates (`unattended-upgrades`) and Docker management. | **Low.** Zero server maintenance; managed dashboard. |
| **Vendor Lock-in** | High (Cloudflare runtime, OpenNext config). | **Zero.** 100% portable standard Docker containers; runnable on any cloud or VPS. | **Low.** Portable container images. |
| **Estimated Monthly Cost (Initial)** | ~$5 – $25 / month | **~$21 – $35 / month** | ~$35 – $55 / month |
| **Cost at 50x Traffic** | High (Serverless function request billing escalates quickly). | **Low.** Fixed VPS pricing handles 50x traffic with minimal resource bumps. | Moderate. PaaS resource increments are priced at a premium. |

---

## 4. Realistic Operating Cost Estimates & Assumptions

All estimates are based on current, publicly verifiable pricing tiers for reliable infrastructure providers:

### 4.1 Recommended Architecture: Linux VPS + Managed PostgreSQL

| Service Component | Provider & Tier | Specifications | Monthly Cost (USD) |
| :--- | :--- | :--- | :--- |
| **Application & Worker VPS** | Hetzner Cloud (CX22) *or* DigitalOcean Droplet | 2 vCPU, 4 GB RAM, 40 GB NVMe, 20 TB Traffic (Hetzner) *or* 1 vCPU, 2 GB RAM (DO) | **$4.20** (Hetzner €3.79) *or* **$12.00** (DigitalOcean) |
| **Managed PostgreSQL 16+** | Neon (Launch Plan) *or* DigitalOcean Managed DB | 1 vCPU, 2 GB RAM, 10 GB Storage, Automated daily backups, TLS enforcement | **$15.00 – $19.00** |
| **DNS & Edge Routing** | Cloudflare Direct DNS (Free Tier) | Fast global anycast DNS, DDoS mitigation | **$0.00** |
| **Automated TLS Certificates** | Let's Encrypt (via Caddy) | Automated ACME issuance, HTTP/3, TLS 1.3 | **$0.00** |
| **Transactional Email** | Resend / SendGrid / Amazon SES | Pay-as-you-go (1,000–3,000 emails/mo) | **$0.00 – $2.00** |
| **Uptime Monitoring & Alerts** | BetterStack / UptimeRobot (Free) | 60-second HTTP health checks, email/SMS alerts | **$0.00** |
| **Total Estimated Initial Cost** | — | — | **$21.00 – $33.20 / month** |

### 4.2 Fallback Architecture: Managed PaaS (Render / Railway) + Managed PostgreSQL

| Service Component | Provider & Tier | Specifications | Monthly Cost (USD) |
| :--- | :--- | :--- | :--- |
| **Web Service Container** | Render Starter *or* Railway Base | 1 vCPU, 1 GB RAM, Auto-TLS, Custom domain | **$7.00 – $10.00** |
| **Background Worker Service** | Render Worker *or* Railway Worker | 1 vCPU, 1 GB RAM, continuous execution | **$7.00 – $10.00** |
| **Managed PostgreSQL 16+** | Neon / Supabase Pro / Render DB | Managed PG with daily snapshots | **$19.00 – $25.00** |
| **Total Estimated Initial Cost** | — | — | **$33.00 – $45.00 / month** |

---

## 5. Architectural Specification

### 5.1 Recommended Architecture: Docker VPS + Managed PostgreSQL
- **Host System:** Linux VPS running Ubuntu 24.04 LTS.
- **Ingress Proxy:** Caddy container listening on public ports 80, 443 (TCP & UDP for HTTP/3). Terminates TLS, compresses payloads, and proxies internally to `http://web:3000`.
- **Web Service:** Standalone Next.js server container running Node 22 as unprivileged user `nextjs` (UID 1001).
- **Worker Daemon:** Dedicated container executing `scripts/worker.ts` continuously with `WorkerSupervisor`. Connects outbound to PostgreSQL over TLS. Acquires advisory lock `RECONCILER_ADVISORY_LOCK_ID`.
- **Database:** Independent managed PostgreSQL 16+ instance. Application and worker connect over encrypted TLS connection (`sslmode=require`).
- **Secret Isolation:** Managed on the host via `.env.production` with strict `chmod 600` permissions. Never committed to Git.

### 5.2 Reasonable Fallback: Managed PaaS (Render / Railway)
If the owner chooses to avoid operating a Linux VPS:
- Deploy `frontend/Dockerfile` target `web` as a Web Service on Render/Railway.
- Deploy `frontend/Dockerfile` target `worker` as a Background Worker service on Render/Railway.
- Connect both services via environment variables to managed PostgreSQL.
- Eliminates host OS administration at the cost of slightly higher monthly hosting fees.

---

## 6. Database Migration & Rollback Safety Policy

1. **Ordering & Idempotency:** Migrations 001–010 are executed sequentially by `scripts/migrate.ts` inside a single advisory lock (`SELECT pg_advisory_lock(94827104)`). Every migration checks `schema_migrations` and runs inside a transaction block.
2. **Pre-Deployment Backup:** Before executing new schema migrations, a backup snapshot must be verified.
3. **Decoupled Deployment Sequencing:** Migrations run *before* new application code starts (`docker compose run --rm migrator`). If migrations fail, the deployment script aborts before restarting the web container, leaving the active application untouched.
4. **Forward-Fix Principle:** Financial tables (`position_history`, `ranking_settlements`, `payment_orders`) are strictly append-only. Because rolling back migrations can corrupt live audit ledgers, schema issues must be recovered via forward-fix migrations rather than destructive rollbacks.

---

## 7. Backups, Monitoring & Recovery Controls

1. **Automated Host Backups:** Nightly cron on VPS executes `scripts/backup-db.sh`, dumping schema and data with SHA-256 manifest validation and 7-day retention pruning.
2. **Provider PITR:** Managed database automated daily snapshots with 7-day point-in-time recovery enabled.
3. **Restore Drills:** Mandatory pre-launch restore drill executed against a disposable database using `scripts/restore-db.sh`.
4. **Heartbeat & Telemetry:** Worker records heartbeats every 30 seconds into `worker_heartbeats`. Health probe alerts if heartbeat is older than 300 seconds.
5. **Circuit Breaker:** Triple consecutive database failures trip the worker circuit breaker, triggering exponential backoff to avoid hammering recovering databases.
6. **External Uptime Monitoring:** External monitoring polls `https://aageonline.com/api/health/ready` every 60 seconds with instant email alerts upon failure.

---

## 8. Consolidated Launch-Gate Status

Milestone 0.20.17 verified all local checks. The six outstanding live gates are preserved in [docs/Production-Launch-Gates.md](file:///d:/Aage%20online/docs/Production-Launch-Gates.md):

| Gate | Description | Current Status | Blocker for Live Payments? |
| :---: | :--- | :---: | :---: |
| **Gate 1** | Real PostgreSQL Integration & Transactional Verification | **DEFERRED** | **YES** |
| **Gate 2** | Actual Backup & Restore Against Disposable Database | **DEFERRED** | **YES** |
| **Gate 3** | Live Worker Concurrency, Restart & DB Lock Behavior | **DEFERRED** | **YES** |
| **Gate 4** | Production Database Provisioning & Secure Configuration | **DEFERRED** | **YES** |
| **Gate 5** | PayU Provider Verification with Sandbox/Live Credentials | **DEFERRED** | **YES** |
| **Gate 6** | DNS, HTTPS, Deployment, Monitoring & Operational Recovery | **DEFERRED** | **YES** |

---

## 9. Supporting Documentation Index

- **Environment & Secrets Matrix:** [docs/Production-Environment-and-Secrets-Matrix.md](file:///d:/Aage%20online/docs/Production-Environment-and-Secrets-Matrix.md)
- **Deployment Runbook:** [docs/Production-Deployment-Runbook.md](file:///d:/Aage%20online/docs/Production-Deployment-Runbook.md)
- **Launch Gates Register:** [docs/Production-Launch-Gates.md](file:///d:/Aage%20online/docs/Production-Launch-Gates.md)
- **Consolidated Audit Baseline:** [docs/Milestone-0.20.17-Launch-Gate-Consolidation.md](file:///d:/Aage%20online/docs/Milestone-0.20.17-Launch-Gate-Consolidation.md)

---

## 10. Milestone Verdict

**`PLANNING COMPLETE — PROVISIONING GATED ON OWNER APPROVAL`**

*AageOnline has an authoritative, vetted production deployment architecture and execution runbook. No infrastructure was provisioned. Deployment will commence only when explicit owner approval is granted.*
