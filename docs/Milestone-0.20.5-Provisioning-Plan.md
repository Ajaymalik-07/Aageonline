# AageOnline — Milestone 0.20.5 Infrastructure Provisioning Plan & Pre-Execution Gate

> [!NOTE]  
> **SUPERSEDED BY MILESTONE 0.20.6:** The separate staging environment deployment was rejected and decommissioned in favor of a direct **Local Development → Production** architecture. Refer to the canonical [Production Deployment Runbook](file:///d:/Aage%20online/docs/Production-Deployment-Runbook.md).

> **Project:** AageOnline  
> **Tagline:** Get Seen. Get Ahead.  
> **Milestone:** 0.20.5  
> **Historical Target Environment:** `staging.aageonline.com` (Archival Record)  
> **Target Architecture:** DigitalOcean Basic Droplet + Neon Serverless PostgreSQL + Direct DNS + Caddy Auto-TLS  
> **Execution Mode:** Pre-Provisioning Verification & Budget Approval Gate (Archived)  
> **Date:** October 9, 2026  

---

## 1. Executive Summary & Architectural Verification

Milestone 0.20.5 prepares the low-budget staging infrastructure deployment for AageOnline. Prior to any paid or irreversible cloud action, the proposed infrastructure configuration was rigorously verified against repository invariants:

1. **Host Capacity (DigitalOcean Basic Droplet — 2 vCPU, 4 GB RAM, Ubuntu 24.04 LTS):**
   - **Memory Profile:**
     - Next.js Standalone Node.js server (`web:3000`): ~180 MB – 250 MB RAM
     - Background Reconciler Worker (`worker`): ~120 MB – 180 MB RAM
     - Caddy 2 Reverse Proxy (`caddy`): ~30 MB – 50 MB RAM
     - Host OS (Ubuntu 24.04 LTS) + systemd + Docker engine: ~450 MB – 550 MB RAM
     - **Total Memory Footprint:** ~800 MB – 1.05 GB RAM (~25% of 4 GB capacity).
   - **Verdict:** **SATISFIES REQUIREMENTS.** Leaves ~3 GB RAM available for OS page cache, Docker build spikes, and database driver buffers.

2. **Database Engine & Connection Pooling (Neon Serverless PostgreSQL):**
   - **Connection Budget:** The repository budgets 10 connections for `web` and 5 connections for `worker` (15 total connections).
   - **Direct vs. Pooled Connection (PgBouncer Warning):**
     - Neon provides both direct endpoints (`ep-xyz.region.aws.neon.tech:5432`) and PgBouncer pooler endpoints (`ep-xyz-pooler.region.aws.neon.tech:5432`).
     - **CRITICAL INVARIANT:** AageOnline uses PostgreSQL session-level advisory locks:
       - `SELECT pg_try_advisory_lock(829104812)` for reconciler single-active coordination.
       - `SELECT pg_advisory_lock(94827104)` for migration serialization.
     - Transaction-pooled PgBouncer does **not** support session-level advisory locks reliably.
     - **Resolution:** AageOnline must connect to the **Direct endpoint** (`ep-xyz.region.aws.neon.tech:5432` without `-pooler`). Because our connection budget is only 15 connections, it sits far below Neon's direct connection limit (~100 connections), ensuring 100% native advisory lock compatibility.
   - **SSL/TLS Requirement:** Neon strictly enforces TLS (`sslmode=require`). [frontend/lib/db/guard.ts](file:///d:/Aage%20online/frontend/lib/db/guard.ts) enforces `ssl: { rejectUnauthorized: true }` when `NODE_ENV=production` or `DATABASE_SSL=true`.
   - **Verdict:** **SATISFIES REQUIREMENTS** via Neon Direct endpoint.

3. **Regional Availability & Latency Analysis:**
   - **Neon Regions:** Neon supports AWS regions:
     - `aws-ap-southeast-1` (Singapore)
     - `aws-ap-southeast-2` (Sydney)
     - `aws-eu-central-1` (Frankfurt)
     - `aws-eu-west-2` (London)
     - `aws-us-east-1` (N. Virginia), `aws-us-east-2` (Ohio), `aws-us-west-2` (Oregon)
     - `aws-sa-east-1` (São Paulo)
   - *Note on India:* Neon currently does **not** offer AWS Mumbai (`ap-south-1`).
   - **Optimal Pairing:**
     - **Database:** Neon region **Singapore (`aws-ap-southeast-1`)**.
     - **Droplet Option A (Lowest Latency):** DigitalOcean **Singapore (`sgp1`)**. Cross-datacenter RTT is **~2–5 ms**.
     - **Droplet Option B (India Host):** DigitalOcean **Bangalore (`blr1`)**. Cross-region RTT to Singapore is **~35–45 ms** (well within the 10,000 ms statement timeout).

4. **Neon Compute Limits & Background Worker Scale-to-Zero Analysis:**
   - **Neon Free Tier Limits:** 100 Compute Unit (CU) hours per month. Automatically scales to zero after **5 minutes of inactivity**.
   - **Worker Behavior:** [frontend/lib/workers/reconciler-worker.ts](file:///d:/Aage%20online/frontend/lib/workers/reconciler-worker.ts) runs continuous sweeps every 30 seconds (`intervalMs: 30000`).
   - **Impact:** An always-on worker container querying every 30s prevents Neon from ever scaling to zero (24 hours/day × 30 days = 720 hours/month). On the Free Tier, the 100 CU-hour quota would be **exhausted in ~4.1 days** (~100 hours), causing database suspension!
   - **Recommended Staging Strategy:**
     - **Option 1 (Free Tier Preservation):** Run the background worker on-demand during active QA testing, or schedule it via host cron (`docker compose run --rm worker node scripts/worker.ts --once`) every 15–30 minutes rather than as a continuous 30-second daemon. Between runs, Neon scales to zero, remaining within the 100 CU-hours free quota.
     - **Option 2 (Continuous Daemon):** Upgrade Neon to the Launch plan ($19.00 / month) if continuous 24/7 30-second reconciler daemon sweeps are strictly required.

---

## 2. Estimated Total Monthly Cost

| Item / Resource | Provider / Tier | Specifications | Monthly Cost (USD) |
| :--- | :--- | :--- | :---: |
| **Virtual Private Server** | DigitalOcean Basic Droplet | 2 vCPU, 4 GB RAM, 80 GB SSD, 4 TB Transfer (Ubuntu 24.04 LTS) | **$24.00** |
| **Managed Database** | Neon PostgreSQL (Free Tier) | PostgreSQL 16+, 1 GB Storage, 100 CU-hours (Singapore) | **$0.00** |
| **Domain & DNS Ingress** | Existing Domain Registrar | DNS A Record (`staging.aageonline.com`) | **$0.00** |
| **Reverse Proxy & TLS** | Caddy 2 (In-Container) | Auto-TLS via Let's Encrypt / ZeroSSL (ACME) | **$0.00** |
| **Payment Gateway** | PayU India Sandbox | Test Merchant Keys (`gtKFFx` / `eCwWELxi`) | **$0.00** |
| **Email Service** | Staging Safety Sink | Intercepted in-memory / local sink | **$0.00** |
| **Total Baseline Cost** | | | **$24.00 / month** |

*(Note: If continuous 24/7 worker daemon execution is selected without scale-to-zero, upgrading Neon to the Launch tier adds $19.00/mo, bringing the total to $43.00/mo.)*

---

## 3. Pre-Provisioning Execution Checklist

Before provisioning begins, the operator must complete the following steps:

### Phase 1: Resource Creation (Awaiting User Approval)
- [ ] **Step 1: Provision DigitalOcean Droplet:**
  - Distribution: Ubuntu 24.04 LTS x64
  - Plan: Basic Droplet — Regular or Premium with 2 vCPU / 4 GB RAM / 80 GB SSD ($24/mo)
  - Region: `sgp1` (Singapore — recommended for ~3ms RTT to Neon) or `blr1` (Bangalore)
  - Authentication: SSH Key (add operator public key)
  - Note Droplet Public IPv4: `DROPLET_IP`
- [ ] **Step 2: Provision Neon PostgreSQL Database:**
  - Create project: `aageonline-staging`
  - Version: PostgreSQL 16
  - Region: AWS Singapore (`aws-ap-southeast-1`)
  - Copy **Direct Connection String** (do not use `-pooler`):
    `postgresql://<user>:<password>@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
- [ ] **Step 3: Configure DNS A Record:**
  - Domain registrar DNS management for `aageonline.com`
  - Record Type: `A`
  - Host / Name: `staging`
  - Value: `<DROPLET_IP>`
  - TTL: 300 seconds (5 minutes)

---

## 4. Host Firewall Configuration (UFW)

The droplet must be hardened immediately upon first boot. `scripts/setup-vps.sh` configures the following rules:

```bash
# Allow SSH first to prevent lockout
ufw allow 22/tcp comment 'SSH Remote Access'

# Allow HTTP and HTTPS for Caddy reverse proxy
ufw allow 80/tcp comment 'HTTP ACME challenges and redirects'
ufw allow 443/tcp comment 'HTTPS TLS termination'
ufw allow 443/udp comment 'HTTP/3 QUIC support'

# Explicitly deny direct access to application and database ports
ufw deny 3000/tcp comment 'Block direct Next.js application access'
ufw deny 5432/tcp comment 'Block direct PostgreSQL port'

# Set default policies and enable
ufw default deny incoming
ufw default allow outgoing
echo "y" | ufw enable
```

*Docker Security Invariant:* In `docker-compose.staging.yml`, port 3000 is declared strictly under `expose: - "3000"`, ensuring it remains internal to the private bridge network (`aageonline-staging-net`) and cannot be reached externally via Docker iptables bypass.

---

## 5. Required Environment Variables (`.env.staging`)

Create `/var/www/aageonline/.env.staging` on the Droplet with permissions `chmod 600`:

```bash
# ==============================================================================
# AageOnline — Staging Environment Variables
# Location: /var/www/aageonline/.env.staging (chmod 600)
# ==============================================================================

# --- Application Runtime & Environment ---
NODE_ENV=production
APP_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
NEXT_TELEMETRY_DISABLED=1

# --- Domain & Ingress Routing ---
SITE_ADDRESS=staging.aageonline.com
ACME_EMAIL=ops@aageonline.com
NEXT_PUBLIC_APP_URL=https://staging.aageonline.com

# --- Managed PostgreSQL Database (Neon Direct Connection) ---
DATABASE_URL=postgresql://<NEON_USER>:<NEON_PASSWORD>@ep-<NEON_PROJECT_ID>.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_MAX_CONNECTIONS=10
DATABASE_STATEMENT_TIMEOUT_MS=10000
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000

# --- Cryptographic Security Keys (Generate via openssl rand -hex 32) ---
AUTH_SECRET=<GENERATED_64_CHAR_HEX_SECRET>
RATE_LIMIT_SALT=<GENERATED_64_CHAR_HEX_SECRET>

# --- Reverse Proxy Network Configuration ---
TRUSTED_PROXY_IPS=127.0.0.1,172.16.0.0/12,10.0.0.0/8

# --- PayU India Sandbox Payment Gateway ---
PAYU_ENV=test
PAYU_MERCHANT_KEY=gtKFFx
PAYU_MERCHANT_SALT=eCwWELxi

# --- Staging Outbound Notification Safety Sink ---
NOTIFICATION_EMAIL_ENABLED=false
STAGING_TEST_EMAIL_RECIPIENT=qa-team@aageonline.test
```

---

## 6. Post-Approval Deployment Execution Commands

Once infrastructure is provisioned and secrets are in place, the following exact commands deploy the application:

```bash
# 1. SSH into the Droplet
ssh root@<DROPLET_IP>

# 2. Clone the repository and execute host bootstrap
cd /var/www
git clone https://github.com/Ajaymalik-07/Aageonline.git aageonline
cd /var/www/aageonline
chmod +x scripts/setup-vps.sh scripts/deploy-staging.sh
sudo ./scripts/setup-vps.sh

# 3. Create .env.staging with secure permissions
cp .env.staging.example .env.staging
chmod 600 .env.staging
nano .env.staging # Populate actual NEON DATABASE_URL, AUTH_SECRET, RATE_LIMIT_SALT

# 4. Execute the hardened staging deployment script
# (Runs migration 001-010, builds standalone containers, starts Caddy, verifies /api/health/ready)
./scripts/deploy-staging.sh

# 5. Live Verification Tests
curl -I https://staging.aageonline.com/api/health/live
curl -I https://staging.aageonline.com/api/health/ready
docker compose -f docker-compose.staging.yml --env-file .env.staging exec web npm test
```

---

## 7. Pre-Execution Budget Approval Gate

$$\mathbf{STATUS:\ STOPPED\ BEFORE\ PAID\ ACTION}$$

In strict accordance with project safety guidelines:
- **No cloud accounts have been created.**
- **No droplets or databases have been purchased.**
- **No DNS records have been altered.**
- **No live payment operations have been initiated.**

**Awaiting User Approval:**  
Total estimated monthly commitment: **$24.00 / month** (DigitalOcean Basic Droplet). Neon PostgreSQL runs on the **$0.00 / month Free Tier**.
