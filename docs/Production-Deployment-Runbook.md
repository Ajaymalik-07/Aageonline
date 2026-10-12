# AageOnline — Production Deployment & Operations Runbook
## Milestone 0.20.6: Local Development → Production Deployment Architecture

> **Target Environment:** `aageonline.com` (Production)  
> **Topology:** Docker Compose on Linux VPS + Caddy Auto-TLS + Managed PostgreSQL 16+ + Direct DNS  
> **Brand & Tagline:** AageOnline — Get Seen. Get Ahead.  

---

## 1. Architecture & Production Topology

```text
       [ Internet Users / Search Crawlers / PayU Production Webhooks ]
                               │
                               │ (Public Ports 80 & 443)
                               ▼
            ┌─────────────────────────────────────┐
            │        Linux VPS (Ubuntu 24.04)     │
            │                                     │
            │   ┌─────────────────────────────┐   │
            │   │      Caddy Reverse Proxy    │   │
            │   │  - Auto HTTPS (Let's Encrypt)│  │
            │   │  - Standard Security Headers│   │
            │   │  - Gzip / Zstd Compression  │   │
            │   └──────────────┬──────────────┘   │
            │                  │                  │
            │         Private Docker Bridge       │
            │           (aageonline-net)          │
            │                  │                  │
            │        ┌─────────┴─────────┐        │
            │        ▼                   ▼        │
            │   [ Next.js Web ]     [ Worker ]    │
            │   (Port 3000 private) (No ports)    │
            │   (Standalone Node 22)(Reconciler)  │
            └────────┼───────────────────┼────────┘
                     │                   │
                     │ (SSL/TLS Port 5432)
                     ▼                   ▼
            ┌─────────────────────────────────────┐
            │       Managed PostgreSQL 16+        │
            │    (Neon Direct / RDS / Supabase)   │
            │      - Production Database          │
            │      - SSL Mode: require            │
            │      - Schema Migrations 001–010    │
            └─────────────────────────────────────┘
```

### Security Boundaries
1. **Public Attack Surface:** Only ports **80** (HTTP), **443** (HTTPS), and **443/udp** (HTTP/3-QUIC) are open on the host.
2. **Private Application Port:** Port 3000 is exposed strictly inside internal Docker network `aageonline-net` and is **never** published to host interfaces (`0.0.0.0`).
3. **Database Isolation:** PostgreSQL is hosted on an isolated managed cloud database with SSL enforcement.
4. **Worker Isolation:** The background worker runs in a container with **zero** inbound ports, communicating solely outbound to PostgreSQL over TLS.
5. **Non-Root Execution:** Node.js applications run as unprivileged system user `nextjs` (UID 1001).

---

## 2. Server Prerequisites & DNS Setup

### VPS Requirements
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS (x86_64 or arm64).
- **Specs:** Minimum 2 vCPU, 4 GB RAM, 40+ GB SSD.
- **Network:** Static public IPv4 address.

### Direct DNS Configuration
Configure an `A` record with your DNS provider:

| Host / Subdomain | Type | Value | TTL |
| :--- | :---: | :--- | :---: |
| `aageonline.com` | `A` | `<VPS_PUBLIC_IPV4>` | 300 seconds |
| `www.aageonline.com` | `CNAME` | `aageonline.com` | 300 seconds |

---

## 3. Host Hardening & Provisioning (`scripts/setup-vps.sh`)

1. Connect to the VPS via SSH:
   ```bash
   ssh root@<VPS_PUBLIC_IPV4>
   ```

2. Clone the repository and run the setup script:
   ```bash
   mkdir -p /opt/aageonline && cd /opt/aageonline
   git clone https://github.com/Ajaymalik-07/Aageonline.git .
   sudo bash scripts/setup-vps.sh
   ```

   This script:
   - Updates OS packages.
   - Configures UFW firewall (allows SSH 22, HTTP 80, HTTPS 443; blocks 3000 and 5432).
   - Installs official Docker CE and Compose plugin.
   - Adds the deploy user to the `docker` group.

---

## 4. Production Environment Configuration (`.env.production`)

Copy the production environment template and restrict permissions:

```bash
cd /opt/aageonline
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Ensure the following variables are configured:

```ini
# Application
NODE_ENV=production
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Domain & Ingress
SITE_ADDRESS=aageonline.com
ACME_EMAIL=admin@aageonline.com
NEXT_PUBLIC_APP_URL=https://aageonline.com

# Managed PostgreSQL (Direct SSL Connection)
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/<DB_NAME>?sslmode=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_MAX_CONNECTIONS=10
DATABASE_STATEMENT_TIMEOUT_MS=10000

# Security Keys (Generate with: openssl rand -hex 32)
AUTH_SECRET=<64_CHAR_HEX_SECRET>
RATE_LIMIT_SALT=<64_CHAR_HEX_SECRET>

# Reverse Proxy
TRUSTED_PROXY_IPS=127.0.0.1,172.16.0.0/12,10.0.0.0/8

# PayU India Production Keys
PAYU_ENV=production
PAYU_MERCHANT_KEY=<YOUR_PRODUCTION_PAYU_KEY>
PAYU_MERCHANT_SALT=<YOUR_PRODUCTION_PAYU_SALT>

# Email Delivery
NOTIFICATION_EMAIL_ENABLED=false
```

---

## 5. Deployment Pipeline (`scripts/deploy.sh`)

Execute the production deployment script:

```bash
bash scripts/deploy.sh
```

### What `scripts/deploy.sh` Executes:
1. **Config Verification:** Confirms `.env.production` has `chmod 600` and validates that `DATABASE_URL` and `AUTH_SECRET` are not placeholder values.
2. **Docker Build:** Compiles the standalone Next.js image using `frontend/Dockerfile`.
3. **Database Migrations (001–010):** Runs `npm run db:migrate` in the migrator container *before* launching web services. Any migration failure immediately aborts deployment.
4. **Service Startup:** Launches Caddy, Web, and Worker containers (`docker compose up -d`).
5. **Healthcheck Gate:** Polls `/api/health/live` until the container reports healthy (up to 45s).
6. **Readiness Probe:** Verifies `/api/health/ready` returns HTTP 200 with `{ "ready": true }`.

---

## 6. Post-Deployment Verification Commands

Run the following checks after deployment completes:

```bash
# 1. Process Liveness Check (Should return HTTP 200)
curl -i https://aageonline.com/api/health/live

# 2. Database & Infrastructure Readiness Check (Should return HTTP 200 with ready: true)
curl -i https://aageonline.com/api/health/ready

# 3. Public Homepage Check (Should return HTTP 200 with HTML)
curl -i https://aageonline.com/

# 4. Container Health & Status
docker compose -f docker-compose.yml ps

# 5. Background Worker Telemetry Logs
docker compose -f docker-compose.yml logs --tail 50 worker
```

---

## 7. Operational Troubleshooting & Rollback

### If Migrations Fail
- Database migrations execute inside transactional blocks (`BEGIN ... COMMIT`) with rollback on error, serialized via `SELECT pg_advisory_lock(94827104)`.
- Because migrations run *before* the web container restarts, a failed migration prevents the new application version from launching, keeping existing containers intact.

### If Web Container Fails Health Check
- Inspect logs:
  ```bash
  docker compose -f docker-compose.yml logs web
  ```
- Check database connectivity from within container:
  ```bash
  docker compose -f docker-compose.yml exec web node -e "import('./lib/db/client.ts').then(m => m.checkDatabaseHealth()).then(console.log)"
  ```

### Rollback Procedure
If rolling back to a previous Git commit:
```bash
git checkout <PREVIOUS_STABLE_COMMIT_OR_TAG>
bash scripts/deploy.sh
```
Financial tables (`transactions`, `position_history`, `ranking_settlements`) are strictly append-only and never truncated or rolled back.
