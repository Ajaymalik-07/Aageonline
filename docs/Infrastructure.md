## Verified Deployment & Runtime Topology (Milestone 0.19.0)

### Application Architecture & Hosting Target
- **Runtime:** Node.js 22 LTS / Containerized Web Process (`next start` or standard Node container).
- **Frontend / API Framework:** Next.js 15 App Router (TypeScript).
- **Scale Model:** Horizontally scaled stateless container instances (2+ pods in staging/production for HA).
- **Shared State Model:**
  - Application instances **DO NOT share filesystem or process memory**.
  - All shared state resides strictly in persistent PostgreSQL (`DATABASE_URL`).
  - Cache versioning is monotonically tracked per market; in-memory metrics represent process-local diagnostics.
  - Rate limiting is distributed via PostgreSQL `rate_limit_counters` with automatic fail-open local memory degradation.

### PostgreSQL Persistence & Connection Budgeting
- **Database Engine:** Managed PostgreSQL 15+ (e.g., Supabase, Neon, AWS RDS, or GCP Cloud SQL).
- **Connection Management:** `pg.Pool` with parameterized pooling:
  - Default pool per pod: `DATABASE_MAX_CONNECTIONS=10`
  - Statement timeout: `DATABASE_STATEMENT_TIMEOUT_MS=10000` (prevents connection starvation)
  - Connection timeout: `DATABASE_CONNECTION_TIMEOUT_MS=5000`
  - Total connection budget: `Pods * 10 + 5 (admin/migrations) <= max_connections` (e.g., 5 pods = 55 connections).
- **Advisory Locking:** Reconciler worker single-active coordination enforced via `pg_try_advisory_lock(829104812)`.
- **Row-Level Serialization:** Ranking mutations enforce `SELECT id FROM markets WHERE id = $1 FOR UPDATE`.

### Durable Outbox & Background Recovery Architecture
1. **Settlement Recovery Outbox (`settlement_recovery_jobs`):**
   - Captures confirmed payments awaiting atomic ranking settlement.
   - Polled using `SELECT ... FOR UPDATE SKIP LOCKED`.
   - Bounded exponential backoff with terminal failure recording.
2. **Cache Invalidation Outbox (`cache_invalidation_jobs` — Migration 010):**
   - Durably captures failed on-demand cache revalidation jobs post-settlement.
   - Survives pod restarts and worker outages.
   - Concurrent claiming via `SKIP LOCKED` with 60-second processing leases.
3. **Ranking Change Events (`ranking_change_events`):**
   - Emitted atomically inside the settlement transaction for milestone notifications.
4. **Reconciler Worker (`scripts/worker.ts` & `reconciler-worker.ts`):**
   - Runs as a continuous daemon or cron runner (`npm run worker:once`).
   - Emits durable heartbeats to `worker_heartbeats` for operational observability.

### Edge Caching, CDN & Freshness Guarantees
- **Reverse Proxy / Edge:** Cloudflare / CDN edge in front of application pods.
- **Incremental Static Regeneration (ISR):**
  - Public market pages (`/[location]/[category]`): 60 seconds (`revalidate = 60`).
  - Public directory hubs (`/markets`, `/locations`, `/categories`, `/businesses`): 300 seconds.
  - Dynamic Sitemap (`/sitemap.xml`): 1 hour (3600s), invalidated immediately upon taxonomy/publication mutations.
- **Maximum Intended Staleness:** 60 seconds for public ranking pages following settlement.
- **Private Route Cache Isolation:** Workspace, payments, admin endpoints enforce `private, no-cache, no-store, max-age=0, must-revalidate`.

### Rate Limiting & Proxy Security
- **IP Privacy & Token Derivation:** FIPS 180-4 SHA-256 with server-side salt (`computeSha256Hex`).
- **Distributed Counting:** Multi-instance atomic sliding-window in PostgreSQL (`rate_limit_counters`).
- **Outage Fallback:** Gracefully degrades to local memory (`store: 'degraded-local'`) if database is unreachable.
- **Anti-Spoofing:** Client `X-Forwarded-For` and `X-Real-IP` headers are rejected unless connection originates from verified upstream proxy (`isTrustedProxy`).
- **Crawler Protection:** Elevated 2x headroom requires edge-verified headers (`cf-verified-bot` or `x-verified-bot`). Spoofed User-Agents receive standard limits.

### Payment Gateway Environment
- **Provider:** PayU India.
- **Modes:** `test` (sandbox: `test.payu.in`) vs `production` (`secure.payu.in`).
- **Signature Security:** SHA-512 request hashing and reverse webhook hash verification (`PAYU_MERCHANT_SALT`).
- **Idempotency:** Unique constraints on `provider_transaction_id` and `(created_by_user_id, business_id, bid_intent_id, idempotency_key)`.

---

## Production VPS & Managed PostgreSQL Architecture (Milestone 0.20.6)

### Target Host Topology
- **Host:** Linux VPS running Ubuntu 24.04 LTS (minimum 2 vCPU, 4GB RAM, static public IPv4).
- **Reverse Proxy:** Caddy 2 container terminating TLS via ACME (Let's Encrypt / ZeroSSL) on ports 80 and 443. Parameterized for `aageonline.com`.
- **Application Services:** Next.js standalone container (`web:3000`) and background worker container (`worker`) isolated on private bridge network `aageonline-net`. Port 3000 is never exposed on the host.
- **Security:** UFW firewall denying incoming ports 3000 and 5432; non-root user `nextjs` (UID 1001) in containers.
- **Deployment Model:** Direct **Local Development → Production** model (separate staging environment decommissioned in Milestone 0.20.6).

### Managed PostgreSQL Provider Evaluation Matrix

| Provider | Recommended Region | Connection Pooling | SSL Enforcement | Pricing / Tier | Suitability |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Neon Serverless** | AWS `ap-southeast-1` (Singapore) | Direct endpoint (native advisory locks) | Required (`sslmode=require`) | Launch ($19/mo) / Free | **Supported** (Fast provisioning, branching) |
| **Supabase** | AWS `ap-south-1` (Mumbai) | Direct / Supavisor session mode | Required (`sslmode=require`) | Pro ($25/mo) | **Recommended** (Low latency to India, automated backups) |
| **AWS RDS PostgreSQL** | `ap-south-1` (Mumbai) | Direct (~100 conns) | Required (`sslmode=require`) | `db.t4g.micro` (~$15/mo) | **Enterprise Grade** (Predictable IOPS, point-in-time recovery) |
| **DigitalOcean Managed DB**| `blr1` (Bangalore) | Built-in connection pooler | Required (`sslmode=require`) | $15/mo | **Alternative** (Co-located with Bangalore Droplet) |

*Evaluation Invariant: In all cases, `DATABASE_MAX_CONNECTIONS` is budgeted at 10 (web) + 5 (worker) = 15 connections, easily accommodated across all evaluated providers.*

