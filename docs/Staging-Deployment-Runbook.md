# AageOnline — Staging Deployment & Operations Runbook
## Milestone 0.20.2: Docker VPS + Managed PostgreSQL + Direct DNS

> [!NOTE]  
> **SUPERSEDED BY MILESTONE 0.20.6:** The separate staging environment model has been decommissioned. AageOnline uses a simplified **Local Development → Production** deployment architecture. Refer to the canonical [Production Deployment Runbook](file:///d:/Aage%20online/docs/Production-Deployment-Runbook.md).

> **Historical Target Environment:** `staging.aageonline.com` (Archival Record)  
> **Topology:** Docker Compose on Linux VPS + Caddy Auto-TLS + Managed PostgreSQL 16+  
> **Brand & Tagline:** AageOnline — Get Seen. Get Ahead.  

---

## 1. Architecture & Deployment Topology

```text
       [ Internet Client / QA Browser / PayU Sandbox ]
                              │
                              │ (Public Ports 80 & 443)
                              ▼
           ┌─────────────────────────────────────┐
           │        Linux VPS (Ubuntu 24.04)     │
           │                                     │
           │   ┌─────────────────────────────┐   │
           │   │      Caddy Reverse Proxy    │   │
           │   │  - Auto HTTPS (Let's Encrypt)│  │
           │   │  - X-Robots-Tag: noindex    │   │
           │   │  - Gzip / Zstd Compression  │   │
           │   └──────────────┬──────────────┘   │
           │                  │                  │
           │         Private Docker Bridge       │
           │       (aageonline-staging-net)      │
           │                  │                  │
           │        ┌─────────┴─────────┐        │
           │        ▼                   ▼        │
           │   [ Next.js Web ]     [ Worker ]    │
           │   (Port 3000 private) (No ports)    │
           └────────┼───────────────────┼────────┘
                    │                   │
                    │ (SSL/TLS Port 5432)
                    ▼                   ▼
           ┌─────────────────────────────────────┐
           │       Managed PostgreSQL 16+        │
           │      (AWS RDS / Neon / Supabase)    │
           │      - Isolated Staging Database    │
           │      - SSL Mode: require            │
           │      - Schema Migrations 001–010    │
           └─────────────────────────────────────┘
```

### Security Boundaries
1. **Public Attack Surface:** Only ports **80** (HTTP) and **443** (HTTPS / HTTP3-QUIC) are exposed on the host.
2. **Private Application Port:** Port 3000 is exposed strictly inside the internal Docker network `aageonline-staging-net` and is **never** bound to host interfaces (`0.0.0.0`).
3. **Database Isolation:** PostgreSQL is hosted externally on a managed cloud database. The VPS does not run a public database daemon.
4. **Worker Isolation:** The background worker runs in a container with **zero** inbound ports, communicating solely outbound to PostgreSQL over TLS.
5. **Non-Root Execution:** Node.js applications run as unprivileged system user `nextjs` (UID 1001).

---

## 2. Server Prerequisites & DNS Setup

### VPS Requirements
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS (x86_64 or arm64).
- **Specs:** Minimum 2 vCPU, 4 GB RAM, 20 GB SSD.
- **Network:** Static public IPv4 address.

### Direct DNS Configuration
Before provisioning certificates, configure an `A` record in your DNS provider:

| Host / Subdomain | Type | Value | TTL |
| :--- | :---: | :--- | :---: |
| `staging.aageonline.com` | `A` | `<VPS_PUBLIC_IPV4>` | 300 seconds |

*Prerequisite Note: Do NOT proxy through Cloudflare with orange-cloud active if testing direct Caddy ACME challenges, or configure Caddy DNS-01 challenge.*

---

## 3. VPS Host Preparation & Firewall Setup

SSH into the VPS as root or sudo user:

```bash
# 1. Update OS packages
sudo apt update && sudo apt upgrade -y

# 2. Configure Host Firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH Access'
sudo ufw allow 80/tcp comment 'Caddy HTTP & ACME Challenge'
sudo ufw allow 443/tcp comment 'Caddy HTTPS'
sudo ufw allow 443/udp comment 'Caddy HTTP/3 QUIC'
sudo ufw enable
sudo ufw status verbose
```

*Confirm that port 3000 and port 5432 are NOT listed in `ufw status`.*

---

## 4. Install Docker Engine on VPS

Install the official Docker CE and Compose plugin:

```bash
# Add Docker's official GPG key & repository
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker on boot
sudo systemctl enable --now docker
```

---

## 5. Clone Repository & Configure Environment

```bash
# 1. Create deployment directory
sudo mkdir -p /opt/aageonline
sudo chown -R $USER:$USER /opt/aageonline
cd /opt/aageonline

# 2. Clone repository
git clone https://github.com/Ajaymalik-07/Aageonline.git .

# 3. Create staging environment configuration
cp .env.staging.example .env.staging
chmod 600 .env.staging
```

Edit `.env.staging` with your actual managed database URL and generate cryptographic secrets:

```bash
# Generate high-entropy secrets
openssl rand -hex 32  # Use for AUTH_SECRET
openssl rand -hex 32  # Use for RATE_LIMIT_SALT
```

Ensure `.env.staging` includes:
```env
NODE_ENV=production
APP_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
SITE_ADDRESS=staging.aageonline.com
ACME_EMAIL=ops@aageonline.com
NEXT_PUBLIC_APP_URL=https://staging.aageonline.com
DATABASE_URL=postgresql://staging_user:password@your-managed-db.host:5432/aageonline_staging?sslmode=require
AUTH_SECRET=<generated-secret>
RATE_LIMIT_SALT=<generated-secret>
PAYU_ENV=test
PAYU_MERCHANT_KEY=gtKFFx
PAYU_MERCHANT_SALT=eCwWELxi
```

---

## 6. Run Database Migrations (001–010)

Before launching the web application, execute all pending migrations against the staging database:

```bash
# Build and run the one-off migrator container
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm migrator
```

**Expected Output:**
```text
--- AageOnline Database Migration Runner ---
Connected to PostgreSQL (12ms). Applying pending migrations...
Applying migration 001_initial_schema.sql...
Applied migration 001_initial_schema.sql successfully.
...
Applying migration 010_durable_invalidation_and_rate_limits.sql...
Applied migration 010_durable_invalidation_and_rate_limits.sql successfully.
Migration Summary:
- Already applied: 0
- Newly applied:   10
Database schema is up to date.
```

---

## 7. Start Staging Services

Launch Caddy, Next.js web application, and the background reconciler worker:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

Verify running containers:

```bash
docker compose -f docker-compose.staging.yml ps
```

All three services (`caddy`, `web`, `worker`) must be in `Up` status, with `web` showing `(healthy)`.

---

## 8. Verification & Smoke Testing

### 1. Process Liveness Check
```bash
curl -i https://staging.aageonline.com/api/health/live
```
**Expected:** HTTP 200 OK with `{"status":"UP","mode":"liveness"}`.

### 2. Dependency Readiness Check
```bash
curl -i https://staging.aageonline.com/api/health/ready
```
**Expected:** HTTP 200 OK with `{"status":"UP","ready":true,"checks":{"databaseReachable":true,"migrationsApplied":true}}`.

### 3. SEO Staging Shield Verification
```bash
curl -i https://staging.aageonline.com/
```
**Expected Header Check:**
- `X-Robots-Tag: noindex, nofollow`
- Response must NOT include real-money checkout forms or indexing indicators.

### 4. Background Worker Heartbeat Verification
```bash
docker compose -f docker-compose.staging.yml logs --tail 50 worker
```
**Expected:** Reconciler loop logging cycle execution, outbox checks, and healthy heartbeats.

---

## 9. Rollback Runbook

### Application Rollback
If a regression is detected in the application code:

```bash
cd /opt/aageonline

# 1. Checkout previous known-good commit
git checkout <PREVIOUS_COMMIT_OR_TAG>

# 2. Rebuild and restart containers
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

### Database Schema Invariant & Rollback Limitation
- Tables recording financial events (`transactions`), position transitions (`position_history`), and audit trails are strictly **append-only**.
- In accordance with ADR-022, raw table rollbacks and data deletions are **prohibited**.
- Migrations 001–010 are additive. Backward compatibility with running application pods is preserved.
- If a schema defect is encountered, apply a forward corrective migration (`011_fix_*.sql`) rather than modifying applied history.

---

## 10. AI and Search Discovery Safeguards

- Staging is deliberately isolated from all search crawlers (`robots.txt` disallow all + `X-Robots-Tag: noindex`).
- Production discovery (when promoted) relies on:
  1. Authoritative dynamic sitemaps (`/sitemap.xml`) populated strictly with `PUBLISHED` and `APPROVED` entities.
  2. JSON-LD structured data adhering to Schema.org standards with explicit paid visibility disclosures.
  3. LLM/AIO-GEO crawler accessibility (Googlebot, Bingbot, ClaudeBot, GPTBot) on public discovery routes with verified bot headroom.

---

## 11. Automated Turnkey Scripts Reference

To eliminate manual configuration errors on Ubuntu VPS hosts, two automated bash scripts are provided in `scripts/`:

1. **Host Setup & Hardening (`scripts/setup-vps.sh`):**
   ```bash
   sudo bash scripts/setup-vps.sh
   ```
   - Automatically installs Docker CE, Docker Compose plugin, Git, OpenSSL, and CA certificates.
   - Idempotently configures UFW firewall: allows 22/tcp, 80/tcp, 443/tcp, 443/udp; explicitly denies 3000/tcp and 5432/tcp.
   - Prepares `/opt/aageonline` deployment directory and adds user to the `docker` group.

2. **Automated Staging Deployment Pipeline (`scripts/deploy-staging.sh`):**
   ```bash
   bash scripts/deploy-staging.sh
   ```
   - Verifies `.env.staging` file presence and enforces `600` file permissions.
   - Asserts non-placeholder values for `DATABASE_URL`, `SITE_ADDRESS`, and `AUTH_SECRET`.
   - Builds multi-stage Docker images (`caddy`, `web`, `worker`, `migrator`).
   - Runs database migrations 001–010 via the dedicated `migrator` container before starting web services.
   - Launches services in detached mode and polls web container health status (`/api/health/live`).
   - Executes an internal liveness check inside the container bridge network.

