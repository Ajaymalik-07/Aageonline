# AageOnline — Production First-Deployment Checklist

> **Product:** AageOnline — Get Seen. Get Ahead.  
> **Status:** Actionable Operational Checklist  
> **Milestone:** 0.20.20  
> **Classification:** Pre-Deployment Execution Standard  
> **Last Updated:** October 12, 2026  

---

## Important Notice

**DO NOT EXECUTE THIS CHECKLIST AUTOMATICALLY.**  
This checklist is an actionable, ordered operational guide prepared for when the project owner formally approves production provisioning. Every step requiring owner approval or live credentials is explicitly marked.

---

## Phase 1: Pre-Provisioning Approvals & Ownership (Provider-Neutral)

### Step 1: Owner Architecture & Budget Authorization
- [ ] **Action:** Project owner reviews and approves the deployment topology and spending ceiling:
  - **Option A (Low Cost, Same-Host DB):** Single Linux VPS (2 vCPU, 4 GB RAM) running Caddy, Web, API, Admin, Worker, and containerized PostgreSQL 16 on `aageonline-net` = **~$12 – $24 / month (Unverified estimate)**.
  - **Option B (High Durability, Managed DB):** Linux VPS (2 vCPU, 4 GB RAM) + Cloud Managed PostgreSQL 16 (DBaaS) = **~$35 – $65 / month (Unverified estimate)**.
- [ ] **Owner Approval Gate:** Written confirmation of architecture option (Option A vs B) and monthly budget ceiling.
- [ ] **Status:** `PENDING OWNER APPROVAL (EXPLICITLY UNDECIDED)`

---

### Step 2: Domain Finalization & Ownership Security
- [ ] **Action:** Project owner finalizes domain selection (`aageonline.com` candidate or alternative) and registers through chosen registrar.
- [ ] **Requirement:** Enable mandatory Two-Factor Authentication (2FA) via authenticator app / hardware security key on registrar account.
- [ ] **Requirement:** Enable Registrar Lock and Auto-Renewal.
- [ ] **Requirement:** Enable free WHOIS Privacy protection.
- [ ] **Owner Gate:** Confirm domain registration and ownership delegation.
- [ ] **Status:** `PENDING OWNER ACTION (DOMAIN CANDIDATE ONLY)`

---

### Step 3: Server & Database Provisioning (Provider-Neutral)
- [ ] **Action:** Project owner creates account on selected provider (e.g. DigitalOcean, AWS, Hetzner, Linode, or any Linux VPS provider).
- [ ] **Requirement:** Enable mandatory 2FA on provider account.
- [ ] **VPS Provisioning:**
  - OS: Standard Linux (Ubuntu 24.04 LTS or Debian 12 x64/ARM64)
  - Resources: Minimum 2 vCPU, 4 GB RAM, 50+ GB SSD
  - Authentication: SSH Key authentication only (Disable root password login)
  - Networking: Attach static public IPv4 address
- [ ] **Database Provisioning (Based on Step 1 Selection):**
  - **If Option A:** Ensure Docker Compose is installed; activate local DB with `docker compose --profile local-db up -d`.
  - **If Option B:** Provision Managed PostgreSQL 16+ with SSL enforced (`sslmode=require`), automated daily snapshots, and private VPC networking.
- [ ] **Owner Gate:** Confirm provisioned server and securely record database credentials into `.env.production`.
- [ ] **Status:** `PENDING OWNER ACTION (PROVIDER UNDECIDED)`

---

## Phase 2: Host Hardening, Secrets & Networking

### Step 4: Host Hardening & Secure Secret Setup
- [ ] **Action:** Connect to server via SSH (`ssh deploy@<VPS_STATIC_IP>`).
- [ ] **Install Prerequisites:**
  ```bash
  sudo apt-get update && sudo apt-get upgrade -y
  sudo apt-get install -y docker.io docker-compose-v2 ufw fail2ban curl postgresql-client
  sudo systemctl enable --now docker
  sudo usermod -aG docker deploy
  ```
- [ ] **Configure Host Firewall (UFW):**
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP (Let's Encrypt challenge & redirect)
  sudo ufw allow 443/tcp   # HTTPS (Public ingress)
  sudo ufw allow 443/udp   # HTTP/3 QUIC (Mobile acceleration)
  sudo ufw enable
  ```
- [ ] **Generate Production Cryptographic Secrets (CSPRNG):**
  ```bash
  AUTH_SECRET=$(openssl rand -hex 32)
  SESSION_SECRET=$(openssl rand -hex 32)
  RATE_LIMIT_SALT=$(openssl rand -hex 32)
  ADMIN_TOKEN=$(openssl rand -hex 32)
  ```
- [ ] **Configure `.env.production`:**
  - Copy `.env.production.example` to `/opt/aageonline/.env.production`.
  - Populate `DATABASE_URL` with managed PostgreSQL TLS connection string.
  - Populate generated cryptographic secrets.
  - Set `SITE_ADDRESS=aageonline.com`.
  - Set `APP_ENV=production` and `NODE_ENV=production`.
  - Set `PAYU_ENV=test` (Keep in test mode initially!).
  - Lock permissions: `chmod 600 /opt/aageonline/.env.production`.
- [ ] **Verify:** Ensure `.env.production` is never committed to Git.
- [ ] **Status:** `PENDING HOST SETUP`

---

### Step 5: DNS Records & Cloudflare Configuration
- [ ] **Action:** Configure DNS records pointing to `<VPS_STATIC_IP>`:
  - `aageonline.com` (A record) → `<VPS_STATIC_IP>`
  - `www.aageonline.com` (A record) → `<VPS_STATIC_IP>`
  - `api.aageonline.com` (A record) → `<VPS_STATIC_IP>`
  - `admin.aageonline.com` (A record) → `<VPS_STATIC_IP>`
- [ ] **Crucial Rule:** In Cloudflare, set proxy status to **DNS Only (Grey Cloud)** for initial deployment to allow Caddy ACME TLS issuance.
- [ ] **Verify:** Run `dig +short aageonline.com` to confirm DNS propagation.
- [ ] **Status:** `PENDING DNS SETUP`

---

## Phase 3: Build Verification & Database Initialization

### Step 6: Clone Repository & Build Container Artifacts
- [ ] **Action:** Clone authoritative repository onto server into `/opt/aageonline`.
- [ ] **Build Images:**
  ```bash
  cd /opt/aageonline
  docker compose build
  ```
- [ ] **Verify:** All 4 multi-stage images build without error (`caddy`, `web`, `api`, `admin`, `worker`, `migrator`).
- [ ] **Status:** `PENDING BUILD`

---

### Step 7: Database Connectivity Review
- [ ] **Action:** Test outbound PostgreSQL TLS connection from server:
  ```bash
  psql "$DATABASE_URL" -c "SELECT version(), current_user, current_database();"
  ```
- [ ] **Verify:** PostgreSQL 16+ reported, SSL connection verified, credentials authenticated.
- [ ] **Status:** `PENDING DB CHECK`

---

### Step 8: Execute Migrations 001–011 (Explicit Approval Gate)
- [ ] **Action:** Execute the schema migration runner inside the isolated migrator container:
  ```bash
  docker compose run --rm migrator
  ```
- [ ] **Verify Output:**
  - Migrations 001 through 011 applied sequentially.
  - `schema_migrations` table contains 11 rows.
  - Advisory lock `94827104` released cleanly.
- [ ] **Status:** `PENDING MIGRATION RUN`

---

## Phase 4: Container Launch & Health Verification

### Step 9: Launch Core Services (Web, API, Admin & Caddy)
- [ ] **Action:** Execute automated deployment script:
  ```bash
  bash scripts/deploy.sh
  ```
- [ ] **Verify:**
  - `aageonline_caddy` running on ports 80 and 443.
  - `aageonline_web` listening on internal port 3000.
  - `aageonline_api` listening on internal port 4000.
  - `aageonline_admin` listening on internal port 3001.
  - Internal ports NOT exposed to public host interface.
- [ ] **Status:** `PENDING CONTAINER UP`

---

### Step 10: Verify Background Worker Daemon (`aageonline_worker`)
- [ ] **Action:** Inspect worker container logs:
  ```bash
  docker compose logs -f worker
  ```
- [ ] **Verify:**
  - Worker acquires advisory lock `RECONCILER_ADVISORY_LOCK_ID` (829104812).
  - Completes reconciler cycles every 30 seconds.
  - Writes heartbeats to `worker_heartbeats` table.
- [ ] **Health Probe Test:**
  ```bash
  docker compose exec worker node --experimental-strip-types scripts/worker.ts --health
  ```
- [ ] **Result:** `{"healthy": true, "database": "CONNECTED", ...}` with exit code 0.
- [ ] **Status:** `PENDING WORKER CHECK`

---

### Step 11: HTTPS & Domain Verification
- [ ] **Action:** Test public HTTPS endpoints from outside the server:
  ```bash
  curl -I https://aageonline.com
  curl -I https://www.aageonline.com
  curl -I https://api.aageonline.com/api/health/live
  curl -I https://admin.aageonline.com
  ```
- [ ] **Verify:**
  - Valid Let's Encrypt TLS certificate presented.
  - HTTP `http://aageonline.com` returns `308 Permanent Redirect` to HTTPS.
  - Security headers present: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
- [ ] **Status:** `PENDING TLS VERIFY`

---

## Phase 5: Functional & Disaster Recovery Drills

### Step 12: Real PostgreSQL Integration Verification (Gate 1)
- [ ] **Action:** Run real database integration test suite against the live instance:
  ```bash
  docker compose exec web npm run test:real-db
  ```
- [ ] **Verify:** All 6 transactional tests pass (atomic bid placement, row locking, append-only history).
- [ ] **Status:** `PENDING GATE 1`

---

### Step 13: Backup & Disposable Restore Verification Drill (Gate 2)
- [ ] **Action:** Test automated database backup:
  ```bash
  bash scripts/backup-db.sh
  ```
- [ ] **Action:** Verify backup archive integrity:
  ```bash
  bash scripts/verify-backup.sh <BACKUP_PATH>
  ```
- [ ] **Action:** Execute restore drill against explicitly disposable test database:
  ```bash
  TARGET_DB="aageonline_restore_drill_disposable" bash scripts/restore-db.sh <BACKUP_PATH>
  ```
- [ ] **Verify:** Data restores 100% cleanly; script refuses to overwrite active production database.
- [ ] **Setup Cron:** Add nightly backup to `/etc/cron.d/aageonline-backup`:
  ```bash
  0 3 * * * deploy /opt/aageonline/scripts/backup-db.sh >> /var/log/aageonline-backup.log 2>&1
  ```
- [ ] **Status:** `PENDING GATE 2`

---

### Step 14: PayU Sandbox End-to-End Verification (Gate 5)
- [ ] **Action:** Test payment workflow in sandbox mode (`PAYU_ENV=test`):
  1. Access test business workspace at `https://aageonline.com/business/dashboard/markets`.
  2. Initiate bid position placement for #1 position.
  3. Complete payment on PayU sandbox checkout gateway using test card credentials.
  4. Verify server-side webhook receives POST at `https://aageonline.com/api/payments/webhooks/payu`.
  5. Verify reverse hash calculation matches and order status transitions to `CONFIRMED`.
  6. Verify atomic ranking update reflects on public market ladder `https://aageonline.com/jaipur/interior-designers`.
- [ ] **Status:** `PENDING GATE 5`

---

### Step 15: Monitoring & Alerting Setup (Gate 6)
- [ ] **Action:** Configure external uptime monitor (e.g. BetterStack, UptimeRobot, or Freshping):
  - Target: `https://aageonline.com/api/health/ready`
  - Cadence: 60 seconds
  - Notification: Email / SMS alerts to system owner and on-call engineer
- [ ] **Action:** Verify alert triggers on simulated container downtime.
- [ ] **Status:** `PENDING GATE 6`

---

## Phase 6: Final Review & Live Payment Activation

### Step 16: Final Launch-Gate Review
- [ ] **Review:** Verify all six gates have documented empirical evidence:
  - Gate 1: Real PostgreSQL Integration → **PASSED**
  - Gate 2: Backup & Restore Verification → **PASSED**
  - Gate 3: Live Worker Concurrency & Lock Handover → **PASSED**
  - Gate 4: Production Database Provisioning → **PASSED**
  - Gate 5: PayU Sandbox Verification → **PASSED**
  - Gate 6: DNS, HTTPS & Monitoring → **PASSED**
- [ ] **Status:** `PENDING GATES REVIEW`

---

### Step 17: Explicit Owner Approval for Live Real Payments
- [ ] **Action:** Owner signs off on transitioning to live customer transactions.
- [ ] **Configuration Update:**
  - Update `/opt/aageonline/.env.production`:
    - `PAYU_ENV=production`
    - `PAYU_MERCHANT_KEY=<GENUINE_LIVE_KEY>`
    - `PAYU_MERCHANT_SALT=<GENUINE_LIVE_SALT>`
- [ ] **Restart Services:**
  ```bash
  docker compose restart web worker
  ```
- [ ] **Final Check:** Confirm `/api/health/ready` returns `200 OK` with `payu: true`.
- [ ] **Status:** `PENDING OWNER SIGN-OFF`

---

## Summary of Owner Approval Checkpoints

| Checkpoint | Description | Current Status |
| :---: | :--- | :---: |
| **Checkpoint 1** | Provider selection and monthly hosting budget ($35 – $54/mo) | `REQUIRED` |
| **Checkpoint 2** | Domain registration of `aageonline.com` with 2FA | `REQUIRED` |
| **Checkpoint 3** | VPS and Managed Database provisioning | `REQUIRED` |
| **Checkpoint 4** | Execution of migrations 001–011 against live database | `REQUIRED` |
| **Checkpoint 5** | Production PayU India merchant account onboarding | `REQUIRED` |
| **Checkpoint 6** | Final sign-off to enable real customer payments (`PAYU_ENV=production`) | `REQUIRED` |
