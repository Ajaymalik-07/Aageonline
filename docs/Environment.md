# AageOnline — Environment

## Environment Model

Two environments are supported (Milestone 0.20.6):

- local
- production

## Configuration Principles

Secrets must never be committed to Git.

Environment variables must be validated at application startup.

## Required Configuration Groups

```text
APP_ENV
APP_URL
DATABASE_URL

AUTH_SECRET
SESSION_SECRET

# PayU India Payment Gateway (Milestone 0.12.0)
PAYU_ENV=test                       # 'test' (test.payu.in) or 'production' (secure.payu.in)
PAYU_MERCHANT_KEY=gtKFFx            # PayU Merchant Key (Safe for checkout payload generation)
PAYU_MERCHANT_SALT=eCwWELxi         # PayU Merchant Salt (STRICT SERVER SECRET — NEVER COMMIT OR EXPOSE)

EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM

STORAGE_PROVIDER
STORAGE_BUCKET

ANALYTICS_PROVIDER
ANALYTICS_KEY
```

### PayU India Environment Variable Policies
- **`PAYU_ENV`**: Sets gateway endpoint (`test` maps to `https://test.payu.in/_payment` and `https://test.payu.in/merchant/postservice.php?form=2`; `production` maps to `https://secure.payu.in/_payment` and `https://info.payu.in/merchant/postservice.php?form=2`).
- **`PAYU_MERCHANT_KEY`**: Merchant identifier published in PayU checkout payload.
- **`PAYU_MERCHANT_SALT`**: Cryptographic secret used for SHA-512 request hashing, webhook reverse-hash verification, and Verify Payment API hashing. **MUST NEVER be committed to Git, exposed to browser clients, or included in client bundles.**

## Rules

- Production secrets must be separate from staging.
- Client-exposed variables must never contain secrets.
- Local development should use safe test credentials.
- Webhook secrets must be independently rotated.

---

## PostgreSQL & Persistence Layer Configuration (Milestone 0.14.0)

### Connection Parameters

```env
# Primary PostgreSQL Connection URL (Server-Only, Never NEXT_PUBLIC_*)
DATABASE_URL=postgresql://user:password@hostname:5432/aageonline?sslmode=require

# Optional Direct Connection URL (For migrations / administrative runners when pooling proxy is used)
DATABASE_DIRECT_URL=postgresql://user:password@direct-hostname:5432/aageonline?sslmode=require

# Persistence Mode Selector ('memory' for local dev/testing, 'postgres' for production durability)
PERSISTENCE_MODE=postgres

# Connection Pool Management
DATABASE_MAX_CONNECTIONS=10           # Max concurrent pool connections per application instance
DATABASE_IDLE_TIMEOUT_MS=30000        # Milliseconds before releasing idle pool connection
DATABASE_CONNECTION_TIMEOUT_MS=5000   # Connection acquisition timeout in milliseconds

# TLS / SSL Settings
DATABASE_SSL=true                     # Mandatory in staging & production
DATABASE_SSL_REJECT_UNAUTHORIZED=true # Strict certificate validation in production

# Settlement Recovery Scheduler Settings
SETTLEMENT_RECOVERY_BATCH_SIZE=20     # Max unresolved jobs claimed per recovery cycle
SETTLEMENT_RECOVERY_INTERVAL_MS=60000 # Recovery execution cadence (1 minute default)
```

### Database Migration Command

Migrations are version-controlled SQL files located in `frontend/lib/db/migrations/` and executed sequentially:

```bash
npm run db:migrate
```

### Production Persistence Safety Switch

- **Zero Silent Fallback:** In `NODE_ENV=production`, `APP_ENV=production`, or `PERSISTENCE_MODE=postgres`, the application strictly refuses to initialize or process financial routes (`/api/bid-intents`, `/api/payments/*`, `/api/payments/webhooks/*`) without a verified `DATABASE_URL`.
- **Pre-Flight Readiness Check:** Operational endpoint `GET /api/admin/readiness` audits database reachability, migration state, PayU configuration, and persistence mode before allowing live payments.
- **Fail-Safe Startup:** In local development without a database configured, in-memory adapters operate safely, but will never execute in production without explicit configuration.

---

## Administrative Operations & Scheduler Configuration (Milestone 0.15.0)

### Administrative Access & Worker Authentication

```env
# Platform Administrator Email Whitelist (Comma-separated bootstrap / production fallback)
PLATFORM_ADMIN_EMAILS=ops@aageonline.in,admin@aageonline.in

# Server-Only Worker Invocation Secret (For cron runners & authenticated HTTP worker triggers)
ADMIN_WORKER_SECRET=generate_strong_64_char_hex_secret_here
# Alternative alias accepted:
CRON_SECRET=generate_strong_64_char_hex_secret_here
```

### Background Worker & Reconciler Execution

The reconciler worker runs independently of admin UI presence:

- **Continuous Daemon:**
  ```bash
  npm run worker
  ```
  Runs as a background daemon service with 30-second polling cadence, advisory locking, and heartbeats.

- **Single Execution (Cron-friendly):**
  ```bash
  npm run worker:once
  ```
  Executes a single discrete payment reconciliation & settlement recovery cycle and exits with code 0.

### Scheduler Invariant Parameters

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `RECONCILIATION_BATCH_SIZE` | `25` | Maximum unresolved payment orders evaluated per cycle. |
| `RECONCILIATION_COOL_DOWN_MINUTES` | `2` | Minimum age before a pending payment is evaluated against PayU. |
| `SETTLEMENT_RECOVERY_BATCH_SIZE` | `25` | Maximum claimed settlement recovery jobs per cycle. |
| `SETTLEMENT_LEASE_SECONDS` | `60` | Duration of SKIP LOCKED job processing lease. |
| `WORKER_HEARTBEAT_STALE_MINUTES` | `15` | Threshold after which lack of heartbeat marks worker as `DEGRADED`. |
| `ADVISORY_LOCK_ID` | `829104812` | PostgreSQL transaction-safe numeric key preventing overlapping runs across replicas. |

---

## Performance, Caching & Edge Rate Limiting Configuration (Milestone 0.18.0)

```env
# Edge Rate Limiting & Privacy Token Salt (Server-Only, Never NEXT_PUBLIC_*)
RATE_LIMIT_SALT=generate_strong_32_char_hex_salt_here

# Database Statement Timeout (Terminates runaway reporting queries to prevent connection exhaustion)
DATABASE_STATEMENT_TIMEOUT_MS=10000

# Cache Revalidation Intervals (Seconds)
PUBLIC_RANKING_ISR_SECONDS=60
PUBLIC_TAXONOMY_ISR_SECONDS=300
PUBLIC_SITEMAP_TTL_SECONDS=3600
```

### Rate Limiting Tier Thresholds

| Route Tier | Limit / Window | Description |
| :--- | :--- | :--- |
| `PUBLIC_DISCOVERY` | 120 req / 60s | Public market, category, and location directory listings. |
| `SEARCH_API` | 40 req / 60s | Dynamic search queries and real-time pricing quote calculations. |
| `AUTH_AND_PAYMENTS`| 15 req / 60s | Payment order generation, PayU callback processing, and user auth. |
| `ADMIN_OPERATIONS` | 30 req / 60s | Administrative dashboard metrics, reconciliation sweeps, and audits. |
| *Verified Crawlers*| 240 req / 60s | Googlebot and Bingbot receive 2x headroom on public discovery routes. |

---

## Production Readiness, Distributed State & Infrastructure Security (Milestone 0.19.0)

```env
# Trusted Reverse Proxy & Load Balancer CIDRs/IPs (Comma-separated)
# Used for safe client IP extraction from X-Forwarded-For headers
TRUSTED_PROXY_IPS=127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16

# Rate Limit Storage & Fallback Policy
# Automatically queries PostgreSQL table `rate_limit_counters` (Migration 010)
# Degrades safely to local memory ('degraded-local') during database connection timeouts

# Search Engine Crawler Verification
# Relies on edge headers: 'cf-verified-bot: true' (Cloudflare) or 'x-verified-bot: true' (Gateway)
# Raw User-Agent strings (e.g. 'Googlebot') are considered UNVERIFIED and receive normal limits
```

### Schema Migration 010 Specifications
- **`cache_invalidation_jobs`**: Durable outbox table storing failed post-commit cache revalidation tasks with `status`, `attempts`, `max_attempts` (default 5), and `next_run_at`.
- **`rate_limit_counters`**: Distributed sliding-window table tracking token counts per tier and time window.


