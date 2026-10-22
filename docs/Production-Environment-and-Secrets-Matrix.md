# AageOnline — Production Environment & Secrets Matrix

> **Product:** AageOnline — Get Seen. Get Ahead.  
> **Status:** Authoritative Production Reference  
> **Milestone:** 0.20.18  
> **Classification:** Operational Security Standard  
> **Last Updated:** October 12, 2026  

---

## 1. Overview & Security Policy

This document defines every environment variable and secret utilized by the AageOnline application, background worker daemon, migration runner, and operational tooling.

### Invariants:
1. **Zero Secret Leakage:** No secret key, database password, or signing salt may ever be committed to version control, exposed to browser clients, or logged in stdout/stderr.
2. **Fail-Closed Startup:** In production (`NODE_ENV=production` or `APP_ENV=production`), missing critical variables (`DATABASE_URL`, `AUTH_SECRET`, `PAYU_MERCHANT_SALT`) must halt startup immediately. In-memory fallbacks are strictly prohibited.
3. **No Prefix Leakage:** `NEXT_PUBLIC_*` variables are bundled into client-side JavaScript. Only non-sensitive URLs and configuration may use this prefix.
4. **Isolated Environments:** Production secrets must never be shared with local development or test fixtures.

---

## 2. Environment Variables & Secrets Register

| Variable Name | Purpose | Environments | Class | Consuming Service | Validation & Fail-Closed Behavior | Rotation Frequency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Sets Node.js runtime optimization tier. | Local, Prod | Non-Secret | Web, Worker, Migrator | Must be `production` in live deployments. Disables development bypasses. | Never | Verified |
| `APP_ENV` | Application environment identifier. | Local, Prod | Non-Secret | Web, Worker, Migrator | Must be `production` in live deployments. Triggers strict DB assertion. | Never | Verified |
| `NEXT_PUBLIC_APP_ENV` | Client-facing environment indicator. | Local, Prod | Non-Secret | Browser, Web | Read by frontend telemetry and UI indicators. | Never | Verified |
| `NEXT_TELEMETRY_DISABLED` | Disables Next.js anonymous telemetry collection. | Local, Prod | Non-Secret | Web, Builder | Set to `1`. | Never | Verified |
| `PORT` | HTTP listener port for Next.js standalone server. | Local, Prod | Non-Secret | Web | Defaults to `3000`. Kept private inside Docker network. | Never | Verified |
| `HOSTNAME` | Network interface binding. | Local, Prod | Non-Secret | Web | Set to `0.0.0.0` inside container. | Never | Verified |
| `SITE_ADDRESS` | Primary canonical domain for Caddy ingress. | Prod | Non-Secret | Caddy Proxy | Used by Caddy for automated Let's Encrypt TLS certificate provisioning. | As Needed | Pending DNS |
| `ACME_EMAIL` | Let's Encrypt account contact email. | Prod | Non-Secret | Caddy Proxy | Receives automated TLS certificate expiration notices. | As Needed | Pending DNS |
| `NEXT_PUBLIC_APP_URL` | Canonical public base URL (`https://aageonline.com`). | Local, Prod | Non-Secret | Browser, Web | Used in canonical tags, metadata, structured data, and PayU return URLs. | As Needed | Verified |
| `DATABASE_URL` | PostgreSQL TLS connection URI with credentials. | Local, Prod | **STRICT SECRET** | Web, Worker, Migrator | Application fails closed on financial routes if unset in production. | 90 Days / Compromise | Pending DB Provisioning |
| `DATABASE_DIRECT_URL` | Direct unpooled PostgreSQL URI for migrations. | Prod (Optional) | **STRICT SECRET** | Migrator | Required only if PgBouncer transaction pooling is in front of database. | 90 Days / Compromise | Optional |
| `DATABASE_SSL` | Enforces TLS/SSL database transport encryption. | Local, Prod | Non-Secret | Web, Worker, Migrator | Must be `true` in production. | Never | Verified |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Enforces strict CA certificate validation for DB. | Prod | Non-Secret | Web, Worker, Migrator | Must be `true` in production. Rejects self-signed certificates. | Never | Verified |
| `DATABASE_MAX_CONNECTIONS` | Maximum pool size per instance. | Local, Prod | Non-Secret | Web, Worker | Defaults to `10`. Bounds connection exhaustion on managed DB. | Tune on Load | Verified |
| `DATABASE_STATEMENT_TIMEOUT_MS` | Query execution deadline cutoff. | Local, Prod | Non-Secret | Web, Worker | Defaults to `10000` (10s). Prevents hanging queries from blocking connections. | Tune on Load | Verified |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Pool connection acquisition timeout. | Local, Prod | Non-Secret | Web, Worker | Defaults to `5000` (5s). Fails quickly if connection pool is saturated. | Tune on Load | Verified |
| `DATABASE_IDLE_TIMEOUT_MS` | Idle connection teardown threshold. | Local, Prod | Non-Secret | Web, Worker | Defaults to `30000` (30s). Returns unused connections to database pool. | Tune on Load | Verified |
| `PERSISTENCE_MODE` | Persistence layer engine selector. | Local, Prod | Non-Secret | Web, Worker, Migrator | Set to `postgres` in production. Forbids in-memory stores. | Never | Verified |
| `AUTH_SECRET` | 256-bit cryptographic secret for session auth tokens. | Local, Prod | **STRICT SECRET** | Web | Generates session authentication token hashes. Minimum 64 hex characters. | 180 Days | Pending Generation |
| `SESSION_SECRET` | Secondary session key for cookie encryption. | Local, Prod | **STRICT SECRET** | Web | Used for session cookie integrity. Minimum 64 hex characters. | 180 Days | Pending Generation |
| `RATE_LIMIT_SALT` | 256-bit cryptographic salt for IP hashing. | Local, Prod | **STRICT SECRET** | Middleware | Salts FIPS SHA-256 client IP hashes to preserve end-user privacy. | 90 Days | Pending Generation |
| `TRUSTED_PROXY_IPS` | Comma-separated CIDRs/IPs for upstream proxy. | Local, Prod | Non-Secret | Middleware | Prevents client IP spoofing across `X-Forwarded-For` headers. | As Topology Changes | Verified |
| `PAYU_ENV` | PayU India gateway operating tier (`test` or `production`). | Local, Prod | Non-Secret | Web | Selects `secure.payu.in` vs `test.payu.in` gateway endpoints. | Switch on Launch | Verified |
| `PAYU_MERCHANT_KEY` | Public merchant identifier for PayU India. | Local, Prod | Non-Secret | Web | Included in checkout payload. Obtained from PayU Merchant Dashboard. | As Issued | Pending Merchant Onboarding |
| `PAYU_MERCHANT_SALT` | Cryptographic merchant salt for HMAC-SHA512 hashing. | Local, Prod | **STRICT SECRET** | Web | Verifies PayU webhook reverse hashes and checkout requests. Never commit. | 90 Days / Re-issue | Pending Merchant Onboarding |
| `WORKER_INTERVAL_MS` | Reconciler worker execution cadence in milliseconds. | Local, Prod | Non-Secret | Worker | Defaults to `30000` (30s). Configures background loop interval. | Tune on Load | Verified |
| `SETTLEMENT_RECOVERY_BATCH_SIZE` | Max recovery items claimed per worker cycle. | Local, Prod | Non-Secret | Worker | Defaults to `20`. Bounded batch size prevents unbounded table scans. | Tune on Load | Verified |
| `SETTLEMENT_RECOVERY_INTERVAL_MS` | Recovery cycle evaluation interval in milliseconds. | Local, Prod | Non-Secret | Worker | Defaults to `60000` (60s). Cadence for abandoned settlement recovery. | Tune on Load | Verified |
| `ADMIN_TOKEN` | Bearer token for programmatic worker health invocations. | Local, Prod | **STRICT SECRET** | Web, Worker, Scripts | Checked via `crypto.timingSafeEqual` on `/api/admin/*` endpoints. | 90 Days | Pending Generation |
| `NOTIFICATION_EMAIL_ENABLED` | Feature flag for outbound customer emails. | Local, Prod | Non-Secret | Worker | Defaults to `false` until verified transactional mailer is provisioned. | Switch on Launch | Verified |
| `EMAIL_PROVIDER` | Email delivery transport (`smtp`, `resend`, `sendgrid`). | Local, Prod | Non-Secret | Worker | Defaults to `smtp`. | As Needed | Verified |
| `EMAIL_FROM` | Outbound sender address. | Local, Prod | Non-Secret | Worker | Must be authorized sender (e.g. `notifications@aageonline.com`). | As Needed | Pending DNS |
| `SMTP_HOST` | Transactional email relay hostname. | Prod | Non-Secret | Worker | Outbound SMTP relay host. | As Needed | Pending Mailer Provisioning |
| `SMTP_PORT` | Transactional email relay port. | Prod | Non-Secret | Worker | Standard submission port `587` (TLS) or `465`. | As Needed | Pending Mailer Provisioning |
| `SMTP_USER` | Transactional email SMTP username. | Prod | Non-Secret | Worker | Authenticates outbound relay. | As Needed | Pending Mailer Provisioning |
| `SMTP_PASS` | Transactional email SMTP password. | Prod | **STRICT SECRET** | Worker | Authenticates outbound relay. Never commit to repository. | 90 Days | Pending Mailer Provisioning |
| `EMAIL_SAFETY_SINK_ENABLED` | Pre-launch test override: intercepts outbound emails. | Local, Prod | Non-Secret | Worker | When `true`, emails route exclusively to safe test mailbox. | Disabled on Launch | Verified |
| `SAFE_TEST_EMAIL_RECIPIENT` | Safe trap mailbox for smoke testing. | Local, Prod | Non-Secret | Worker | Destination for intercepted smoke test notifications. | As Needed | Verified |
| `BACKUP_DIR` | Host filesystem path for backup tarball storage. | Prod | Non-Secret | Ops Tooling | Restricts backup dumps to isolated directory (`/var/backups/aageonline`). | As Needed | Verified |
| `BACKUP_RETENTION_DAYS` | Daily backup pruning horizon. | Prod | Non-Secret | Ops Tooling | Defaults to `7` days. Prunes archives older than threshold. | As Needed | Verified |

---

## 3. Secret Generation & Management Procedures

### 3.1 Generating Cryptographic Keys
All random secrets must be generated using cryptographically secure pseudorandom number generators (CSPRNG):

```bash
# 1. AUTH_SECRET (64 hex characters / 256 bits)
openssl rand -hex 32

# 2. SESSION_SECRET (64 hex characters / 256 bits)
openssl rand -hex 32

# 3. RATE_LIMIT_SALT (64 hex characters / 256 bits)
openssl rand -hex 32

# 4. ADMIN_TOKEN (64 hex characters / 256 bits)
openssl rand -hex 32
```

### 3.2 File Permissions & Ingestion
On the production server:
1. Copy template: `cp .env.production.example .env.production`
2. Restrict file permissions immediately to prevent unauthorized user access:
   ```bash
   chmod 600 .env.production
   chown deploy:docker .env.production
   ```
3. Inject verified secrets securely into `.env.production`.
4. Ensure `.env.production` is ignored in Git: verified via `.gitignore`.
