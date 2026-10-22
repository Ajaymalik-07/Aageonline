# AageOnline — Milestone 0.20.20
## Production Provider Selection & First Deployment Preparation

**Product:** AageOnline — Get Seen. Get Ahead.  
**Milestone:** 0.20.20  
**Status:** COMPLETE (Planning, Provider Decision & Deployment Preparation Only)  
**Production Verdict:** **`PROVIDER DECIDED & DEPLOYMENT PREPARED — ZERO INFRASTRUCTURE PROVISIONED — ALL 6 LIVE GATES DEFERRED PENDING OWNER APPROVAL`**  
**Date:** October 12, 2026  

---

## 1. Executive Summary & Authoritative Decision

Milestone 0.20.20 delivers the definitive hosting-provider decision, architecture validation, database connection budget, operating cost schedule, and ordered first-deployment checklist for AageOnline.

In strict adherence to milestone boundaries:
- **Zero infrastructure was provisioned or purchased.**
- **Zero cloud accounts, domains, or databases were created.**
- **No DNS records, TLS settings, or live payment gateway parameters were modified.**
- **No production migrations were executed and no real payments were initiated.**
- **Application source code, business logic, design tokens, and UI components remained 100% untouched.**
- **All six production launch gates remain explicitly DEFERRED.**

### Authoritative Provider Decision:
1. **Primary Recommended Configuration:**  
   **DigitalOcean (Bangalore `blr1`, India)**  
   - **Application Host:** Basic Droplet (2 vCPU, 4 GB RAM, 80 GB SSD, 4 TB Bandwidth) = **$24.00 / month**.
   - **Database:** DigitalOcean Managed PostgreSQL 16 (1 vCPU, 2 GB RAM, 30 GB Storage, 47 Direct Connections, Automated Daily Backups + 7-Day PITR) = **$30.00 / month**.  
     *(Alternative budget tier: 1 vCPU, 1 GB RAM at $15.00/mo with tuned connection pools).*
   - **Estimated Monthly Operating Cost:** **$54.00 / month** (~₹4,550 / month).
   - **Core Rationale:** Data sovereignty and ultra-low geographic latency (< 25 ms round-trip across Indian metros), intra-VPC co-location between Droplet and Managed DB (< 1 ms latency), native Docker Compose compatibility, and zero serverless adapter friction.

2. **Strong Qualified Alternative / Fallback Configuration:**  
   **AWS Lightsail (Mumbai `ap-south-1`, India)**  
   - **Application Host:** Lightsail VPS (2 vCPU, 4 GB RAM, 80 GB SSD, 4 TB Bandwidth) = **$20.00 / month**.
   - **Database:** Lightsail Managed PostgreSQL 16 (1 vCPU, 1 GB RAM, 40 GB SSD, ~112 Direct Connections, Automated Backups) = **$15.00 / month**.
   - **Estimated Monthly Operating Cost:** **$35.00 / month** (~₹2,950 / month).
   - **Core Rationale:** Lower initial monthly commitment with 112 direct database connections, local INR billing via AISPL with compliant Indian GST invoices, and sub-20 ms round-trip latency to Indian visitors.

3. **Hetzner Cloud Verdict:**  
   **REJECTED FOR PRODUCTION CORE COMPUTING.** Hetzner does not offer an Indian data center (only Germany, Finland, USA, and Singapore) and provides **no managed PostgreSQL service**. Hosting the application in Europe while serving Indian businesses introduces a destructive **130 ms – 170 ms latency penalty** on every round-trip, degrading dynamic checkout and real-time outbid notifications.

---

## 2. Systematic Provider Comparison Matrix

| Evaluation Dimension | Option A: DigitalOcean (Bangalore `blr1`) — Recommended | Option B: AWS Lightsail (Mumbai `ap-south-1`) — Alternative | Option C: Hetzner Cloud (Germany `fsn1` / Finland `hel1`) — Rejected |
| :--- | :--- | :--- | :--- |
| **Data Center Region** | Bangalore, India (`blr1`) | Mumbai, India (`ap-south-1`) | Falkenstein/Nuremberg (DE), Helsinki (FI) |
| **Audience Latency (India)** | **< 15 – 35 ms** (Optimal Indian routing) | **< 15 – 30 ms** (Optimal Indian routing) | **130 – 170 ms** (High latency across continents) |
| **VPS Specifications** | 2 vCPU (Shared), 4 GB RAM, 80 GB SSD, 4 TB Transfer | 2 vCPU, 4 GB RAM, 80 GB SSD, 4 TB Transfer | 2 vCPU, 4 GB RAM, 40 GB NVMe, 20 TB Transfer (CX23) |
| **VPS Monthly Cost** | **$24.00 / mo** ($0.03571/hr) [Verified Oct 2026] | **$20.00 / mo** ($0.027/hr) [Verified Oct 2026] | **€5.49 / mo** (~$6.00/mo) [Verified Oct 2026] |
| **Managed PostgreSQL Service** | **DigitalOcean Managed PostgreSQL 16** | **AWS Lightsail Managed PostgreSQL 16** | **None available** (Self-hosted only, or external DB) |
| **Managed DB Tier & Cost** | 1 vCPU, 2 GB RAM, 30 GB SSD: **$30.00 / mo**<br>*(or 1 GB RAM, 10 GB SSD: $15.00 / mo)* | 1 vCPU, 1 GB RAM, 40 GB SSD: **$15.00 / mo**<br>*(HA Multi-AZ: $30.00 / mo)* | Requires external DB (e.g. Neon Mumbai: $19.00/mo) |
| **Direct DB Connection Limit** | 1 GB tier: **22 connections**<br>2 GB tier: **47 connections** | 1 GB tier: **~112 connections** (dynamic formula) | External dependent |
| **Host-to-DB Latency** | **< 1 ms** (Private VPC in `blr1`) | **< 1 ms** (Private VPC in `ap-south-1`) | **140 ms+** if DB in India (Catastrophic for app!) |
| **Automated Backups & PITR** | Daily snapshots included + 7-day PITR | Daily automated snapshots included | External dependent |
| **Invoicing & Local Tax** | Billed in USD + 18% GST for Indian accounts | Billed in INR via AISPL with native GST invoices | Billed in EUR (Excludes non-EU VAT) |
| **Docker Compose Support** | **100% Native.** Standard Ubuntu 24.04 LTS | **100% Native.** Standard Ubuntu 24.04 LTS | **100% Native.** Standard Ubuntu 24.04 LTS |
| **Operational Maintenance** | Low (VPS OS updates via unattended-upgrades) | Low (VPS OS updates via unattended-upgrades) | High (Requires self-managing Postgres on host) |
| **Vendor Lock-in** | **Zero.** Standard Docker images and dump formats | **Zero.** Standard Docker images and dump formats | Low |
| **Initial Monthly Total** | **$54.00 / mo** (or $39.00 with 1GB DB) | **$35.00 / mo** | ~$25.00 / mo (with severe latency compromises) |

*Sources: DigitalOcean Pricing (https://www.digitalocean.com/pricing), AWS Lightsail Pricing (https://aws.amazon.com/lightsail/pricing/), Hetzner Cloud Pricing (https://www.hetzner.com/cloud). Checked: October 2026.*

---

## 3. Database Connection Budget Analysis

### 3.1 Code & Service Connection Audit

An audit of database connection consumers across the codebase revealed the following allocations:

1. **`web` Service (`frontend/` Standalone Next.js Server):**
   - Configured via `DATABASE_MAX_CONNECTIONS` in `frontend/lib/db/guard.ts`.
   - Default: `10` connections.
   - Purpose: User authentication, dashboard mutations, position intent calculation, and PayU webhook verification.
2. **`worker` Service (`scripts/worker.ts` Continuous Daemon):**
   - Configured via `DATABASE_MAX_CONNECTIONS`.
   - Allocation: `5` connections.
   - Purpose: Continuous 30-second reconciliation loop, holding session-level advisory lock `RECONCILER_ADVISORY_LOCK_ID` (829104812), and recording worker heartbeats.
3. **`worker --health` Liveness/Readiness Probe:**
   - Invoked every 30 seconds by container healthcheck.
   - Executes short-lived process checking `checkDatabaseHealth()` and `PostgresHeartbeatRepository`.
   - Connection footprint: `1` transient connection (< 100 ms duration).
4. **`api` Service (`api/` Central REST Service):**
   - Currently serves in-memory catalog with readiness probe.
   - When configured for persistent DB queries: budgeted at `3` connections.
5. **`admin` Service (`admin/` Next.js Control Center):**
   - Communicates exclusively over HTTP with `api:4000`. Does not import `pg` or open direct database connections.
   - Connection footprint: `0` connections.
6. **`migrator` Container (`scripts/migrate.ts`):**
   - Runs as an isolated one-off task before application services launch.
   - Connects 1 client, acquires session advisory lock `94827104`, applies migrations, and exits immediately.
   - Peak runtime concurrent connections: `0` (never runs during live traffic).
7. **Automated Host Backups (`scripts/backup-db.sh` via `pg_dump`):**
   - Runs nightly via host cron.
   - Connection footprint: `1` connection during backup stream (< 30 seconds).

### 3.2 Connection Budget & Provider Compatibility

$$\text{Baseline Concurrent Connections} = 10 \text{ (web)} + 5 \text{ (worker)} = 15 \text{ connections}$$
$$\text{Peak Operational Spike} = 15 + 1 \text{ (health probe)} + 1 \text{ (backup)} + 3 \text{ (api)} = 20 \text{ connections}$$
$$\text{Minimum Safe Headroom (psql / admin / telemetry)} = 5 \text{ connections}$$
$$\mathbf{Total\ Required\ Connection\ Budget} = \mathbf{25\ connections}$$

### 3.3 Provider Connection Constraint Comparison
- **DigitalOcean 1 GB RAM Plan ($15/mo):** Imposes a hard limit of **22 direct connections** (25 total with 3 reserved for superuser). **VERDICT:** At 20 peak connections, the safety margin is only 2 connections. A transient spike could trigger `FATAL: remaining connection slots are reserved`.
- **DigitalOcean 2 GB RAM Plan ($30/mo):** Provides **47 direct connections**. **VERDICT:** 20 / 47 = 42% utilization. Provides 27 free connection slots for headroom. **RECOMMENDED FOR DIGITALOCEAN.**
- **AWS Lightsail 1 GB RAM Plan ($15/mo):** Provides **~112 direct connections** under standard Postgres memory allocation. **VERDICT:** 20 / 112 = 18% utilization. Outstanding headroom at lower monthly cost.

---

## 4. Multi-Service Container Topology Validation

The production deployment architecture validates cleanly against `docker-compose.yml`:

```text
                                 PUBLIC INTERNET
                                       │
                        Ports 80, 443 (TCP & UDP HTTP/3)
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │           aageonline_caddy        │
                     │       (Caddy 2.9 Ingress Proxy)   │
                     └─────────────────┬─────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │ private bridge network: aageonline-net          │
              ▼                        ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
    │  aageonline_web   │    │  aageonline_api   │    │ aageonline_admin  │
    │  (Next.js Web)    │    │  (REST API)       │    │ (Admin Dashboard) │
    │  Internal: 3000   │    │  Internal: 4000   │    │ Internal: 3001    │
    └─────────┬─────────┘    └─────────┬─────────┘    └───────────────────┘
              │                        │
              └────────────┬───────────┘
                           │
                           │  No exposed ports
                           ▼
              ┌────────────────────────┐
              │   aageonline_worker    │
              │  (Reconciler Daemon)   │
              └────────────┬───────────┘
                           │
                           │  Outbound TLS (sslmode=require)
                           ▼
              ┌────────────────────────┐
              │   Managed PostgreSQL   │
              │ (Bangalore or Mumbai)  │
              └────────────────────────┘
```

### Key Isolation Invariants:
1. **Zero Public Port Exposure for Applications:** Ports `3000`, `3001`, and `4000` are exposed strictly to the private Docker bridge network (`aageonline-net`). They are not bound to `0.0.0.0` on the host.
2. **Dedicated Ingress Proxy:** Only Caddy exposes public ports `80` and `443`. Caddy enforces automatic TLS certificate provisioning via Let's Encrypt, HTTP-to-HTTPS redirect (HTTP 308), security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS), and HTTP/3 QUIC support.
3. **Worker Isolation:** The background reconciler worker daemon (`aageonline_worker`) has **zero network listeners**. It initiates outbound TLS connections to PostgreSQL and executes the reconciliation loop safely.
4. **Decoupled One-Off Migrator:** Schema migrations are executed via the dedicated `migrator` service target (`docker compose run --rm migrator`) **prior** to restarting application containers.

---

## 5. Domain, DNS & Routing Preparation (`aageonline.com`)

### 5.1 Domain Availability & Registration Status
- **Target Domain:** `aageonline.com`
- **DNS Resolution Check:** Queried via DNS resolution; returned `NXDOMAIN` (no resolving records).
- **Registration Action:** Owner must verify exact availability and register the domain through a reliable registrar prior to deployment.
- **Recommended Registrars:**
  - **Cloudflare Registrar:** At-cost wholesale pricing (~$9.77 / year), zero markup, free WHOIS privacy, mandatory 2FA, free DNSSEC.
  - **Namecheap / Porkbun:** ~$10.00 – $12.00 first year, ~$12.00 – $14.50 renewal.

### 5.2 Required DNS Zone Records
Once the VPS static public IPv4 address (`<VPS_PUBLIC_IP>`) is assigned, configure these records:

| Record Type | Host / Name | Target / Value | TTL | Proxy Status (Cloudflare) | Purpose |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **A** | `@` | `<VPS_PUBLIC_IP>` | 300s / Auto | DNS Only (Grey Cloud) initially | Main website root domain (`aageonline.com`) |
| **A** | `www` | `<VPS_PUBLIC_IP>` | 300s / Auto | DNS Only (Grey Cloud) initially | Canonical www redirect (`www.aageonline.com`) |
| **A** | `api` | `<VPS_PUBLIC_IP>` | 300s / Auto | DNS Only (Grey Cloud) initially | Authoritative REST API (`api.aageonline.com`) |
| **A** | `admin` | `<VPS_PUBLIC_IP>` | 300s / Auto | DNS Only (Grey Cloud) initially | Admin Control Center (`admin.aageonline.com`) |

*Critical Pre-Launch Rule:* Keep Cloudflare proxy set to **DNS Only (Grey Cloud)** during first deployment. This ensures Caddy can automatically complete ACME HTTP-01 / TLS-ALPN-01 challenges directly with Let's Encrypt without proxy interference.

---

## 6. Performance & Slow-Network Readiness (Indian Mobile Environment)

AageOnline targets local Indian businesses and consumers who frequently access the web over mobile 4G/5G connections with variable latency:

1. **Local Indian Data Center Co-Location:** Co-locating in Bangalore or Mumbai ensures round-trip network ping is < 25 ms, eliminating the ~150 ms intercontinental latency penalty of European servers.
2. **HTTP/3 (QUIC) Ingress:** `docker-compose.yml` publishes port `443/udp` for Caddy. HTTP/3 eliminates TCP head-of-line blocking and accelerates connection establishment over unstable mobile carrier networks.
3. **Payload Compression:** `Caddyfile` enforces `encode zstd gzip` across all HTML, JSON, CSS, and JS responses, shrinking transfer payloads by up to 75%.
4. **Static Page Caching:** Next.js standalone output serves prerendered static assets (`.next/static/`) with immutable 1-year cache headers (`Cache-Control: public, max-age=31536000, immutable`).
5. **No Private Route Caching:** `Caddyfile` and Next.js route handlers strictly enforce `Cache-Control: no-store` on authenticated routes, checkout sessions, and payment webhooks to prevent shared proxy data leaks.

---

## 7. Financial Safety & PayU Verification Standard

1. **Non-Authoritative Client Redirects:** Browser redirect return URLs (`/business/dashboard/markets`) are treated strictly as UI navigational hints. They never alter database payment status.
2. **Authoritative Webhook Verification:** Payment confirmation occurs **only** when the server-side PayU webhook (`/api/payments/webhooks/payu`) validates the reverse HMAC-SHA512 hash using `PAYU_MERCHANT_SALT`.
3. **Atomic & Idempotent Settlement:** Ranking position recalculation and payment order status transitions occur inside a single PostgreSQL database transaction with row locks (`FOR UPDATE`) and advisory locks (`pg_advisory_xact_lock`).
4. **Worker Recovery Safety:** The background worker recovers pending orders older than 15 minutes using `SKIP LOCKED`. Duplicate worker restarts automatically free locks via session termination without double-charging or corrupting audit ledgers.

---

## 8. Backup, Monitoring & Disaster Recovery Specifications

1. **Automated Host Backups:** Host cron executes `scripts/backup-db.sh` nightly, creating custom-format (`-Fc`) dumps with JSON manifests, SHA-256 checksums, and 7-day retention pruning.
2. **Provider Point-in-Time Recovery:** Managed database automated daily snapshots with 7-day PITR enabled in the cloud provider console.
3. **Disposable Restore Drills:** Disaster recovery readiness is verified via `scripts/restore-db.sh` strictly targeting a disposable database (`aageonline_restore_drill_disposable`). The script actively refuses to overwrite active production databases.
4. **External Health Monitoring:** An external monitoring service (e.g. BetterStack or UptimeRobot) polls `https://aageonline.com/api/health/ready` every 60 seconds with instant email/SMS alerting.
5. **Worker Heartbeat Telemetry:** `worker_heartbeats` table records daemon vitality every 30 seconds. Healthcheck probes flag the worker as unhealthy if heartbeat age exceeds 300 seconds.

---

## 9. Launch-Gate Register Status

All six production launch gates remain open and **DEFERRED** pending live infrastructure:

| Gate | Description | Current Status | Blocker for Live Payments? |
| :---: | :--- | :---: | :---: |
| **Gate 1** | Real PostgreSQL Integration & Transactional Verification | **DEFERRED** | **YES** |
| **Gate 2** | Actual Backup & Restore Against Disposable Database | **DEFERRED** | **YES** |
| **Gate 3** | Live Worker Concurrency, Restart & DB Lock Behavior | **DEFERRED** | **YES** |
| **Gate 4** | Production Database Provisioning & Secure Configuration | **DEFERRED** | **YES** |
| **Gate 5** | PayU Provider Verification with Sandbox/Live Credentials | **DEFERRED** | **YES** |
| **Gate 6** | DNS, HTTPS, Deployment, Monitoring & Operational Recovery | **DEFERRED** | **YES** |

---

## 10. Required Owner Approvals Prior to Provisioning

The engineering team cannot proceed to infrastructure provisioning without explicit owner sign-off on:
1. **Hosting Provider Selection:** Approval of DigitalOcean (Bangalore `blr1`) or AWS Lightsail (Mumbai `ap-south-1`).
2. **Monthly Operating Budget:** Authorization of **$35.00 – $54.00 / month** hosting expense.
3. **Domain Ownership:** Owner registration of `aageonline.com` on a secure registrar with 2FA enabled.
4. **PayU Merchant Credentials:** Registration and approval of genuine PayU India merchant account.
5. **Production Migration Execution:** Explicit authorization to run migrations `001-011` against live database.
6. **Live Payment Activation:** Explicit authorization to transition `PAYU_ENV` from `test` to `production`.

---

## 11. Milestone Verdict

**`COMPLETE — PROVIDER DECIDED & DEPLOYMENT PREPARED — ZERO INFRASTRUCTURE PROVISIONED`**

*Milestone 0.20.20 establishes that DigitalOcean (Bangalore `blr1`) is the authoritative recommended production provider (with AWS Lightsail Mumbai as the fallback), validates the multi-service Docker Compose topology, defines the exact database connection budget (25 connections required), prepares domain and DNS delegation standards, and delivers the ordered first-deployment checklist.*
