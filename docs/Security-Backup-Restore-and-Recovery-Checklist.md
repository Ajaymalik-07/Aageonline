# AageOnline — Security, Backup, Restore & Disaster Recovery Checklist

> **Product:** AageOnline — Get Seen. Get Ahead.  
> **Milestone:** 0.20.21  
> **Status:** Actionable Operational Standard  
> **Date:** October 12, 2026  
> **Document Reference:** `docs/Security-Backup-Restore-and-Recovery-Checklist.md`

---

## 1. Scope & Objectives

This document establishes the authoritative operational procedures for host and container security, encrypted off-host database backups, disaster recovery restore drills, and service observability. It is completely provider-neutral and applicable to any standard Linux VPS hosting environment.

---

## 2. Host Hardening & Container Security Standard

### A. Host Operating System Hardening
- [ ] **SSH Configuration (`/etc/ssh/sshd_config`):**
  - Disable root password login: `PermitRootLogin prohibit-password` or `no`
  - Disable password authentication: `PasswordAuthentication no`
  - Change default port (optional): e.g. Port `2222`
  - Enforce Ed25519 or RSA 4096-bit public key authentication
- [ ] **Uncomplicated Firewall (UFW) Configuration:**
  - Default policy: `ufw default deny incoming && ufw default allow outgoing`
  - Allow SSH: `ufw allow 22/tcp` (or custom SSH port)
  - Allow HTTP/HTTPS: `ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp`
  - Deny all database ports from public interfaces: `ufw deny 5432/tcp`
  - Enable firewall: `ufw enable`
- [ ] **Fail2Ban Brute-Force Protection:**
  - Install and configure `fail2ban` for SSH rate-limiting (max 5 retries, 1-hour ban).
- [ ] **Automatic Security Patches:**
  - Configure `unattended-upgrades` for daily Linux kernel and security updates.

### B. Container Runtime Isolation
- [ ] **Non-Root Execution:**
  - Next.js Web runs as unprivileged system user `nextjs` (UID 1001, GID 1001).
  - Worker and Migrator execute as unprivileged system user `nextjs`.
  - API and Admin containers run in Alpine sandbox with minimal attack surface.
- [ ] **Port Exposure Verification:**
  - Verify that only `caddy` exposes host ports.
  - Run verification command:
    ```bash
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    ```
  - **Required Result:** Only `aageonline_caddy` shows `0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp`. All other containers must list internal container ports without host bindings.
- [ ] **Volume Isolation:**
  - `caddy_data` and `caddy_config` isolate TLS certificates.
  - When using Option A (same-host DB), `pgdata` volume is owned strictly by container `postgres` user (UID 70).

---

## 3. Encrypted Off-Host Backup Pipeline

### Architecture Overview
Financial integrity requires that database backups are:
1. Created via consistent atomic binary dumps (`pg_dump -Fc`).
2. Verified against cryptographic SHA-256 manifests.
3. Encrypted with asymmetric keys (GPG or Age) before leaving the host.
4. Transported off-host to an independent storage target (S3, Cloudflare R2, Backblaze B2, or secondary SSH server).
5. Rotated based on a deterministic retention schedule (e.g. 7 daily, 4 weekly).

```
   [ PostgreSQL Database ]
              │ `pg_dump -Fc` (atomic binary dump)
              ▼
   [ Local Temp Dump (.dump) ]
              │ `sha256sum` (manifest generation)
              ▼
   [ Checksum Manifest (.sha256) ]
              │ GPG / Age Public Key Encryption
              ▼
   [ Encrypted Artifact (.dump.gpg) ]
              │ `rclone` / `aws cli` / `scp`
              ▼
   [ Off-Host Storage Destination ] (Cloudflare R2 / AWS S3 / B2 / Remote SSH)
```

### Automated Backup Pipeline Script (`scripts/backup-encrypted.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/aageonline}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
DB_DUMP="${BACKUP_DIR}/aageonline_${TIMESTAMP}.dump"
MANIFEST="${DB_DUMP}.sha256"
ENCRYPTED_DUMP="${DB_DUMP}.gpg"
GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-ops@aageonline.com}"
REMOTE_DEST="${BACKUP_REMOTE_DEST:-remote:aageonline-backups/daily}"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[INFO] Starting database backup at ${TIMESTAMP}..."

# 1. Create binary PostgreSQL dump
pg_dump "${DATABASE_URL}" -Fc --no-owner --no-privileges --file="${DB_DUMP}"

# 2. Compute SHA-256 checksum
sha256sum "${DB_DUMP}" > "${MANIFEST}"

# 3. Encrypt dump using recipient public key
gpg --batch --yes --encrypt --recipient "${GPG_RECIPIENT}" "${DB_DUMP}"

# 4. Push encrypted archive and manifest off-host
if command -v rclone >/dev/null 2>&1; then
    rclone copy "${ENCRYPTED_DUMP}" "${REMOTE_DEST}/"
    rclone copy "${MANIFEST}" "${REMOTE_DEST}/"
    echo "[INFO] Successfully transferred encrypted backup to ${REMOTE_DEST}."
else
    echo "[WARN] rclone not installed. Backup stored locally at ${ENCRYPTED_DUMP}."
fi

# 5. Clean up unencrypted local dump
rm -f "${DB_DUMP}"

# 6. Apply 7-day local retention policy
find "${BACKUP_DIR}" -name "*.gpg" -mtime +7 -delete
find "${BACKUP_DIR}" -name "*.sha256" -mtime +7 -delete

echo "[INFO] Backup pipeline completed successfully."
```

---

## 4. Disaster Recovery & Restore Procedures

### Restore Verification Drill
Prior to production launch, operators must practice a complete database restore into an isolated disposable test database.

#### Step 1: Retrieve and Decrypt Off-Host Artifact
```bash
# 1. Download encrypted artifact from remote storage
rclone copy remote:aageonline-backups/daily/aageonline_YYYYMMDD_HHMMSSZ.dump.gpg ./
rclone copy remote:aageonline-backups/daily/aageonline_YYYYMMDD_HHMMSSZ.dump.sha256 ./

# 2. Decrypt using private key
gpg --decrypt --output aageonline_restore.dump aageonline_YYYYMMDD_HHMMSSZ.dump.gpg

# 3. Verify SHA-256 integrity against manifest
sha256sum -c aageonline_YYYYMMDD_HHMMSSZ.dump.sha256
```

#### Step 2: Execute Database Restoration
```bash
# Using existing tested verification script:
export TARGET_DATABASE_URL="postgresql://user:pass@host:5432/aageonline_restore_test"
bash scripts/restore-db.sh ./aageonline_restore.dump
```

#### Step 3: Validate Restored State Invariants
1. Verify schema tables: `schema_migrations`, `businesses`, `markets`, `position_history`, `ranking_settlements`, `payment_orders`.
2. Verify migration count: `SELECT count(*) FROM schema_migrations;` must equal `11`.
3. Verify position sequence: Ensure no duplicate positions per market.
4. Verify financial consistency: Confirm total integer paise matches recorded payments.

---

## 5. Health Monitoring, Logging & Crash Recovery

### A. Health Monitoring Probes
| Service | Endpoint / Probe Command | Expected Healthy Output | Probe Interval |
| :--- | :--- | :--- | :--- |
| **Web** | `http://127.0.0.1:3000/api/health/live` | HTTP 200 `{"status":"UP"}` | 15s |
| **Web Readiness** | `http://127.0.0.1:3000/api/health/ready` | HTTP 200 `{"status":"READY","database":"OK"}` | 30s |
| **API** | `http://127.0.0.1:4000/api/health/live` | HTTP 200 `{"status":"UP"}` | 15s |
| **Admin** | `http://127.0.0.1:3001/` | HTTP 200 | 15s |
| **Worker** | `node scripts/worker.ts --health` | Exit 0 `{"healthy":true,"status":"UP"}` | 30s |
| **Database** | `pg_isready -U aageonline -d aageonline` | Exit 0 | 10s |

### B. Docker Log Retention Policy
All containers in `docker-compose.yml` enforce standard log rotation to prevent disk exhaustion:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```
Total disk space consumed by container logs across all 6 services is strictly capped at **300 MB**.

### C. Incident Recovery & Auto-Restart Policies
- All persistent services (`caddy`, `web`, `api`, `admin`, `worker`, `db`) configure `restart: unless-stopped`.
- If a container experiences an uncaught exception, Docker automatically restarts the container within 10 seconds.
- The worker supervisor automatically manages database reconnections with exponential backoff and circuit-breaking.
