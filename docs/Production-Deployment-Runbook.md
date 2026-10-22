# AageOnline — Production Deployment Runbook

> **Product:** AageOnline — Get Seen. Get Ahead.  
> **Target Environment:** `aageonline.com` (Production)  
> **Architecture Topology:** Docker Compose on Linux VPS + Caddy Auto-TLS + Managed PostgreSQL 16+ + Direct DNS  
> **Status:** Pre-Execution Runbook (Milestone 0.20.18)  
> **Important:** This runbook is a documented operational procedure. **Do not execute until explicit owner approval is granted.**  

---

## 1. Architectural Overview & Network Topology

```text
       [ Internet Users / Search Crawlers / PayU Production Webhooks ]
                               │
                               │ (Public Ports 80 & 443)
                               ▼
            ┌──────────────────────────────────────────────┐
            │           Linux VPS (Ubuntu 24.04)           │
            │                                              │
            │   ┌──────────────────────────────────────┐   │
            │   │          Caddy Reverse Proxy         │   │
            │   │  - Automatic HTTPS (Let's Encrypt)   │   │
            │   │  - Standard Security Headers         │   │
            │   │  - HTTP/3 (QUIC) + Zstandard / Gzip  │   │
            │   └──────────────────┬───────────────────┘   │
            │                      │                       │
            │             Private Docker Bridge            │
            │               (aageonline-net)               │
            │                      │                       │
            │        ┌─────────────┼─────────────┬─────────────────┐
            │        ▼             ▼             ▼                 ▼
            │   [ Next.js Web ] [ Node API ]  [ Admin UI ]    [ Worker Daemon ]
            │   (Port 3000)     (Port 4000)   (Port 3001)     (No ext ports)
            │   (Standalone)    (REST Engine) (Control Center)(Reconciler)
            └────────┼─────────────┼─────────────┼─────────────────┼───────────┘
                     │             │             │                 │
                     │ (SSL/TLS Port 5432)       │                 │
                     ▼             ▼             ▼                 ▼
            ┌──────────────────────────────────────────────────────────┐
            │                  Managed PostgreSQL 16+                  │
            │           (Neon Direct / RDS / DigitalOcean DB)          │
            │            - Production Database                         │
            │            - SSL Mode: require                           │
            │            - Schema Migrations 001–011                   │
            └──────────────────────────────────────────────────────────┘

```

---

## 2. Ordered 14-Step Deployment Runbook

### Step 1: Pre-Provisioning Approval and Account Ownership
- Confirm explicit written authorization from business owner to incur infrastructure costs.
- Verify primary ownership and root credentials for:
  - VPS provider (Hetzner / DigitalOcean).
  - Managed PostgreSQL provider (Neon / AWS / Supabase / DigitalOcean).
  - Domain registrar / DNS provider (Cloudflare / Namecheap).
  - PayU India Merchant Account dashboard.

### Step 2: Provider and Region Selection
- **Recommended Regions:**
  - Database: Mumbai (`ap-south-1`) or Frankfurt/Nuremberg (if using Hetzner/Neon).
  - VPS: Co-located with or geographically proximate to the managed database (< 10ms network latency).
- **Compute Specs:**
  - VPS: Minimum 2 vCPU, 4 GB RAM, 40 GB NVMe SSD (e.g. Hetzner CX22 or DigitalOcean 2 GB droplet).
  - Database: Minimum 1 vCPU, 2 GB RAM, 10 GB storage with automated daily snapshots.

### Step 3: Domain and DNS Prerequisites
- Verify domain registration for `aageonline.com`.
- Configure DNS records:
  - `A` Record: `aageonline.com` → `<VPS_PUBLIC_IPV4>` (TTL: 300s).
  - `CNAME` Record: `www.aageonline.com` → `aageonline.com` (TTL: 300s).
- Verify DNS propagation via `dig +short aageonline.com`.

### Step 4: PostgreSQL Provisioning, Connection Limits, and Automated Backups
- Provision managed PostgreSQL 16+ database instance named `aageonline_production`.
- Enforce SSL transport (`sslmode=require`).
- Configure connection limits:
  - Max pool connections: `20` (Application Web pool max: 10, Worker pool max: 5).
  - Statement timeout: `10000ms` (10s).
  - Idle timeout: `30000ms` (30s).
- Enable automated daily snapshots and 7-day Point-In-Time Recovery (PITR) in provider console.

### Step 5: Production Secret Creation and Secure Injection
1. Connect to VPS via SSH: `ssh deploy@<VPS_PUBLIC_IPV4>`.
2. Clone repository into `/opt/aageonline`:
   ```bash
   sudo mkdir -p /opt/aageonline && sudo chown deploy:docker /opt/aageonline
   git clone https://github.com/Ajaymalik-07/Aageonline.git /opt/aageonline
   cd /opt/aageonline
   ```
3. Copy environment template:
   ```bash
   cp .env.production.example .env.production
   chmod 600 .env.production
   ```
4. Generate cryptographic keys and inject verified values into `.env.production` (referencing [docs/Production-Environment-and-Secrets-Matrix.md](file:///d:/Aage%20online/docs/Production-Environment-and-Secrets-Matrix.md)):
   - `AUTH_SECRET`: `openssl rand -hex 32`
   - `RATE_LIMIT_SALT`: `openssl rand -hex 32`
   - `ADMIN_TOKEN`: `openssl rand -hex 32`
   - `DATABASE_URL`: Injected from Step 4.

### Step 6: Build and Artifact Verification
- Build production container images:
  ```bash
  docker compose build
  ```
- Verify images built cleanly without warnings:
  - `aageonline_web` (Website & Dashboard, Port 3000)
  - `aageonline_api` (Standalone REST API, Port 4000)
  - `aageonline_admin` (Admin Control Center, Port 3001)
  - `aageonline_worker` (Background Reconciler Daemon)
  - `aageonline_migrator` (Database Migration Runner)

### Step 7: Database Migration Review and Execution
- Review migration files in `frontend/lib/db/migrations/` (001 through 011).
- Execute migrations using the isolated migrator container:
  ```bash
  docker compose run --rm migrator
  ```
- Confirm output reports: `All 11 migrations applied successfully.`
- Verify `schema_migrations` table in database confirms all 11 entries.

### Step 8: Production Services Deployment
- Launch web application, REST API, admin panel, and reverse proxy:
  ```bash
  docker compose up -d web api admin caddy
  ```
- Monitor Caddy TLS certificate acquisition:
  ```bash
  docker compose logs -f caddy
  ```
- Verify Caddy outputs: `certificate obtained successfully` for `aageonline.com`, `www.aageonline.com`, `api.aageonline.com`, and `admin.aageonline.com`.

### Step 9: Worker Deployment and Supervision
- Launch background reconciler worker:
  ```bash
  docker compose up -d worker
  ```
- Monitor worker startup telemetry:
  ```bash
  docker compose logs --tail 30 worker
  ```
- Verify worker logs: `STARTUP` event, advisory lock acquisition, and initial cycle execution.


### Step 10: Health Checks and Operational Smoke Tests
Execute verification probes from external terminal:
```bash
# 1. Liveness Probe (HTTP 200)
curl -i https://aageonline.com/api/health/live

# 2. Infrastructure Readiness Probe (HTTP 200 with ready: true)
curl -i https://aageonline.com/api/health/ready

# 3. Worker Health Probe (Inside container)
docker compose exec worker node --experimental-strip-types scripts/worker.ts --health

# 4. Public Homepage Ingress (HTTP 200)
curl -i https://aageonline.com/

# 5. Featured Market Canonical Route (HTTP 200)
curl -i https://aageonline.com/jaipur/interior-designers
```

### Step 11: PayU Sandbox Verification
- With `PAYU_ENV=test` configured in `.env.production`:
  1. Open business workspace: `https://aageonline.com/business/dashboard/markets`.
  2. Initiate bid intent for position #1 in a test market.
  3. Proceed to PayU checkout sandbox and complete payment with test credentials.
  4. Verify PayU webhook hits `https://aageonline.com/api/payments/webhooks/payu`.
  5. Verify payment status updates to `CONFIRMED` and ranking settles atomically.
  6. Verify `position_history` record is created.

### Step 12: Production Payment Enablement (Separate Explicit Owner Approval Gate)
- **GATE REQUIRED:** Obtain explicit owner sign-off before enabling live money.
- Update `.env.production`:
  ```ini
  PAYU_ENV=production
  PAYU_MERCHANT_KEY=<LIVE_MERCHANT_KEY>
  PAYU_MERCHANT_SALT=<LIVE_MERCHANT_SALT>
  ```
- Restart web application:
  ```bash
  docker compose restart web
  ```
- Verify live checkout endpoint maps to `https://secure.payu.in/_payment`.

### Step 13: Post-Deployment Monitoring & Alerting
- Configure external uptime monitoring (e.g. BetterStack / UptimeRobot):
  - Target: `https://aageonline.com/api/health/ready`
  - Interval: 60 seconds.
  - Alert destination: Ops email / SMS.
- Verify Docker container logging rotation (capped at 10MB x 5 files).
- Add cron job on VPS host for daily backup execution:
  ```bash
  0 2 * * * cd /opt/aageonline && bash scripts/backup-db.sh >> /var/log/aageonline-backup.log 2>&1
  ```

### Step 14: Incident Response, Rollback, and Recovery
- **Application Rollback (Zero Data Loss):**
  ```bash
  git checkout <PREVIOUS_STABLE_TAG>
  docker compose build
  docker compose up -d web worker
  ```
- **Database Schema Principle:**
  - Migrations are strictly forward-compatible. Financial ledgers (`position_history`, `ranking_settlements`, `payment_orders`) are append-only and never rolled back.
  - In the event of an incompatible schema defect, apply forward-fix migrations rather than destructive rollbacks.
