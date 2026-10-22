# AageOnline — Provider-Neutral Deployment Architecture & Decision Record

> **Product:** AageOnline — Get Seen. Get Ahead.  
> **Milestone:** 0.20.21  
> **Status:** Approved Architectural Decision & Deployment Specification  
> **Date:** October 12, 2026  
> **Document Reference:** `docs/Provider-Neutral-Deployment-Architecture-and-Decision.md`

---

## 1. Executive Summary & Explicit Undecided Baselines

This document establishes the provider-neutral production architecture for AageOnline. It formalizes container boundaries, networking, persistence, and operational procedures while keeping vendor selection and commercial commitments strictly undecided.

### Explicitly Undecided Decisions:
1. **Domain Name:** `aageonline.com` is retained solely as an illustrative candidate. The architecture, Caddy ingress, CORS rules, and Next.js public URLs are fully parameterized via `${SITE_ADDRESS}`.
2. **Hosting Provider & Geographic Region:** No specific cloud vendor (DigitalOcean, AWS, Hetzner, GCP, Azure, Linode) or data center region is selected.
3. **Database Topology:** Both **Option A** (Single VPS with same-host containerized PostgreSQL) and **Option B** (VPS + Managed PostgreSQL DBaaS) are fully supported and evaluated.
4. **DNS & Edge Provider:** Cloudflare, Route 53, Namecheap, or native registrar DNS remain candidate options.
5. **Final Monthly Budget:** All cost figures are explicitly categorized as **UNVERIFIED ESTIMATES** until confirmed against live vendor invoices and usage tiers.

---

## 2. Core Provider-Neutral Target Architecture

The approved baseline deployment platform is a standard **Linux Virtual Private Server (x86_64 or ARM64)** running **Docker Compose (v2.20+)** orchestrating six decoupled services behind **Caddy 2.9 (or equivalent reverse proxy with automatic TLS)**.

```
                                      Internet Traffic
                                             │
                                    ┌────────▼────────┐
                                    │   DNS / CDN     │
                                    │ (Cloudflare/Any)│
                                    └────────┬────────┘
                                             │ Port 80, 443, 443/udp (QUIC)
                                    ┌────────▼────────┐
                                    │   Caddy Ingress │ (Automatic HTTPS)
                                    │   Reverse Proxy │
                                    └────────┬────────┘
                                             │ Internal Docker Bridge Network (`aageonline-net`)
                ┌────────────────────────────┼────────────────────────────┐
                │                            │                            │
       ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
       │   web (Next.js) │          │   api (Node 22) │          │  admin (Next.js)│
       │   Port 3000     │          │   Port 4000     │          │   Port 3001     │
       │   (Internal)    │          │   (Internal)    │          │   (Internal)    │
       └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
                │                            │                            │
                │                            │ Calls REST API             │ Calls REST API
                │ (Direct DB queries via     │ (Transactions, bids,       │ (Zero DB connections,
                │  pg connection pool)       │  ranking settlement)       │  HTTP client only)
                │                            │                            │
                └──────────────────────────┐ │ ┌──────────────────────────┘
                                           │ │ │
                      ┌────────────────────▼─▼─▼──────────────────┐
                      │    PostgreSQL 16 Database Connection      │
                      │               `DATABASE_URL`              │
                      └────────────────────┬──────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
           [ Option A: Same-Host ]                       [ Option B: Managed DB ]
       ┌───────────────────────────────┐             ┌───────────────────────────────┐
       │ Docker Service: `db`          │             │ External Cloud Managed DB     │
       │ Image: postgres:16-alpine     │             │ (DigitalOcean, AWS RDS, etc.) │
       │ Volume: `pgdata`              │             │ SSL/TLS Enforced              │
       │ Network: `aageonline-net`     │             │ Dedicated Cloud Compute       │
       │ Port 5432 (Internal Expose)   │             │ Automated Backups & PITR      │
       └───────────────────────────────┘             └───────────────────────────────┘
```

---

## 3. Comparative Decision Matrix: Same-Host vs Managed PostgreSQL

| Evaluation Dimension | Option A: Single VPS (Same-Host PostgreSQL) | Option B: VPS + Managed Cloud PostgreSQL |
| :--- | :--- | :--- |
| **Component Topology** | Single Linux VM running Caddy, Web, API, Admin, Worker, and containerized PostgreSQL 16 on `aageonline-net`. | Linux VM running application containers + independent cloud managed database cluster. |
| **Resource Contention** | **Shared Memory & CPU:** Application spikes (e.g. Next.js SSR) compete directly with PostgreSQL `shared_buffers` and cache. Risk of Linux OOM killer terminating DB. | **Zero Contention:** Application compute and database compute are isolated. DB has dedicated CPU/RAM and guaranteed IOPS. |
| **High Availability & Durability** | **Single Point of Failure:** If the VPS crashes, disk fills, or kernel panics, application and financial state halt simultaneously. | **High Availability:** DBaaS provides automated failover, multi-AZ standby options, and independent hardware availability. |
| **Backup Management** | **Self-Managed:** Operator must automate `pg_dump`, checksum verification, GPG/Age encryption, off-host pushing, and pruning via cron. | **Automated Managed Backups:** Point-in-time recovery (PITR), automated daily snapshots, and zero-maintenance storage tiering. |
| **Database Maintenance** | Manual vacuum tuning, WAL archival configuration, major version upgrades (`pg_upgrade`), and disk monitoring. | Automated security patches, automated minor engine upgrades, and integrated performance metrics dashboards. |
| **Network & Security** | Internal bridge network (`expose 5432`); database port is strictly hidden from public internet without requiring TLS overhead. | Requires TLS enforcement (`sslmode=require`), VPC peering, or strict trusted source IP firewall rules. |
| **Estimated Monthly Cost (Unverified)** | **Low (~$12 – $24 / month)**  <br>*(e.g., 1x 2 vCPU / 4 GB RAM VPS)* | **Moderate (~$35 – $65 / month)**  <br>*(e.g., 1x 2 vCPU / 4 GB RAM VPS + 1x 1–2 GB RAM Managed DB)* |
| **Operational Risk** | High operational burden on maintenance team; higher risk of catastrophic data loss if disk corrupts before off-host backup sync. | Low operational overhead; resilient financial ledger preservation with SLA backing. |
| **AageOnline Verdict** | **Supported for initial testing, staging, or constrained budgets.** Requires rigorous off-host backup script automation. | **Recommended production baseline** for financial ranking settlement, payment integrity, and auditable history. |

*Note: All cost figures in the table above are unverified estimates and must be verified against current vendor pricing schedules prior to financial commitment.*

---

## 4. Multi-Service Boundary and Isolation Specifications

### Service 1: Ingress Reverse Proxy (`caddy`)
- **Container Name:** `aageonline_caddy`
- **Exposed Public Ports:** `80/tcp`, `443/tcp`, `443/udp` (HTTP/3 QUIC)
- **Role:** Central entry point, TLS certificate lifecycle (ACME via Let's Encrypt / ZeroSSL), HTTP header hardening, compression (`zstd`, `gzip`), and routing to upstream containers.
- **Security Invariant:** Caddy is the **ONLY** container permitted to bind to public host network interfaces.

### Service 2: Public Website & Business Workspace (`web`)
- **Container Name:** `aageonline_web`
- **Internal Port:** `3000` (`expose` only, unmapped to host)
- **Role:** Customer marketing pages, city/category discovery, business claim flows, authenticated business workspace.
- **Persistence Access:** Direct database connection pool for workspace profile rendering and reads; interacts with `api` for remote transactions when configured.

### Service 3: Authoritative REST API (`api`)
- **Container Name:** `aageonline_api`
- **Internal Port:** `4000` (`expose` only, unmapped to host)
- **Role:** Transactional core of AageOnline. Enforces ACID ranking mutations, PayU webhook validation, bid intent generation, business directory queries, and rate limiting.
- **Persistence Access:** PostgreSQL connection pool with transaction isolation (`SELECT ... FOR UPDATE` market serialization locks).

### Service 4: Dedicated Admin Control Center (`admin`)
- **Container Name:** `aageonline_admin`
- **Internal Port:** `3001` (`expose` only, unmapped to host)
- **Role:** Operational management of taxonomy, reconciliation triggering, worker status inspection, and business audits.
- **Architectural Boundary Enforcement:** **ZERO DIRECT DATABASE CONNECTIONS.** The admin application contains no database drivers or credentials; it communicates strictly via HTTP with `http://api:4000` using bearer token authorization (`ADMIN_TOKEN`).

### Service 5: Background Reconciler Worker (`worker`)
- **Container Name:** `aageonline_worker`
- **Internal Port:** None (no HTTP listeners)
- **Role:** Continuous daemon executing payment reconciliation sweeps, outbox settlement recovery, notification generation, and cache invalidation processing.
- **Concurrency Guard:** PostgreSQL session advisory lock (`pg_try_advisory_lock(829104812)`) ensuring singleton leader execution across multi-instance environments.

### Service 6: One-Off Database Migrator (`migrator`)
- **Container Name:** `aageonline_migrator`
- **Internal Port:** None (terminating task)
- **Role:** Executes ordered schema migrations (`001` through `011`) within transactional blocks guarded by session-level advisory lock (`pg_advisory_lock(94827104)`).
- **Decoupled Execution:** Configured under `profiles: ["tools"]` with `restart: "no"`. Never started automatically during general service rollout.

### Service 7: Same-Host Database (`db` — Option A Only)
- **Container Name:** `aageonline_db`
- **Internal Port:** `5432` (`expose` only, unmapped to host)
- **Role:** Containerized PostgreSQL 16 on persistent volume `pgdata`.
- **Activation:** Activated exclusively when passing `--profile local-db`. Inactive in Option B deployments.

---

## 5. Security & Network Hardening Invariants

1. **Host Port Binding Isolation:**
   - Public host binds: `80`, `443` (Caddy only).
   - Internal Docker bridge network (`aageonline-net`): `web:3000`, `api:4000`, `admin:3001`, `db:5432`.
   - Host inspection rule: `docker compose ps` must display empty `PORTS` column for all services except Caddy.
2. **Fail-Closed Authentication:**
   - Production requests lacking valid credentials strictly return `401 Unauthorized` or `403 Forbidden`.
   - Development identity bypass is hardcoded to fail closed when `NODE_ENV=production`.
3. **Database Secret Redaction:**
   - Database connection strings with embedded credentials are automatically scrubbed by regex before writing to log sinks.
4. **Advisory Lock Singleton Guarantee:**
   - Both worker daemon and database migrator enforce distinct 64-bit PostgreSQL advisory locks to eliminate race conditions.
