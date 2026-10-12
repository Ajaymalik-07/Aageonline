# AageOnline — Production Deployment & Release Guide

## Release Flow & Environment Progression

```text
Local Development / Feature Branch
   ↓
Automated Verification (454/454 Tests + Typecheck + Standalone Build)
   ↓
Pre-Flight Infrastructure & Config Verification (/api/health/ready)
   ↓
Production Deployment (Docker Compose + Caddy Auto-TLS + Managed PostgreSQL)
   ↓
Continuous Reconciler Worker Verification (/api/admin/operations/summary)
```

## Machine-Checkable Health & Readiness Endpoints

The system separates liveness, readiness, and operational status:

1. **Liveness Probe (`GET /api/health/live` or `GET /api/health?mode=liveness`):**
   - Verifies the process is running and responding to HTTP requests.
   - Status code: `200 OK` with `{ status: "UP", mode: "liveness", uptimeSeconds, timestamp }`.

2. **Readiness Probe (`GET /api/health/ready` or `GET /api/health?mode=readiness`):**
   - Verifies mandatory production infrastructure dependencies:
     - PostgreSQL reachability and pool response time.
     - Schema migrations fully applied up to latest (`010_durable_invalidation_and_rate_limits.sql`).
     - PayU gateway credentials configured (`PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`).
     - Persistent storage mode enforced (`assertProductionPersistence()`).
   - Returns `HTTP 503 DOWN` if mandatory database dependencies are unconfigured or unreachable in production environments.

3. **Operational Health & Telemetry (`GET /api/admin/operations/summary`):**
   - Reports background worker heartbeat freshness (`reconciler-worker`).
   - Reports pending, retryable, and terminal failed durable cache invalidation jobs.
   - Reports unresolved payment order counts and pending settlement recovery queues.
   - Requires platform administrator authorization (`assertPlatformAdmin`).

## Test & Development Safeguards (Milestone 0.20.6)

AageOnline uses a direct **Local Development → Production** model (separate staging environment decommissioned in Milestone 0.20.6):
- **Search Engine Blocking in Non-Production:** When `APP_ENV !== 'production'`, `app/robots.ts` serves `User-agent: * Disallow: /` and suppresses `sitemap.xml`. In production, public listings are fully indexable.
- **Outbound Email Safety Sink:** When `EMAIL_SAFETY_SINK_ENABLED=true` (or during test runs), `StandardDeliveryAdapter` diverts outbound transactional emails to local safety sinks, preventing accidental customer dispatches.
- **PayU Sandbox Safety:** PayU sandbox mode (`PAYU_ENV=test`) is restricted to local development and automated test suites. In production, `scripts/deploy.sh` verifies genuine merchant credentials.

## Safe Deployment Order

Deployments must strictly adhere to the following sequence:

1. **Database Schema Migration (Pre-Deployment):**
   ```bash
   npm run db:migrate
   ```
   Runs sequentially within transactions and registers applied versions in `schema_migrations`.
   *Rule: Migrations must be additive and backward-compatible with currently running application pods.*

2. **Application Pod Rolling Update:**
   Deploy updated Next.js container instances (`next start` or Docker container).

3. **Background Reconciler Worker Service:**
   Ensure the reconciler worker process is active:
   - **Containerized Daemon:** Run as dedicated supervisor process:
     ```bash
     npm run worker
     ```
   - **External Cron Trigger:** Alternatively, schedule every 1 minute:
     ```bash
     npm run worker:once
     ```
   Advisory lock (`pg_try_advisory_lock(829104812)`) prevents concurrent worker execution across pods.

## Rollback Procedures & Limitations

Application rollback and database schema rollback must be treated as strictly separate operations:

- **Financial Ledger Invariant:** `transactions`, `position_history`, `ranking_settlements`, and `audit_logs` are **append-only**. They must NEVER be rolled back, truncated, or retroactively edited.
- **Additive Migrations:** Database migrations must not drop active columns until all previous application versions are fully decommissioned.
- **Application Code Rollback:** If a regression is detected in application code, rolling back container images to the previous tag is safe because migrations maintain backward compatibility.
- **Rollback Limitation:** If a schema migration altered table constraints or data representations, reverting the database requires an explicit forward-migration script; raw table rollbacks are prohibited in production.

## Staging & Production Release Verification Gates

| Gate | Verification Method | Status |
| :--- | :--- | :--- |
| TypeScript Types | `npm run typecheck` | `PASS` (0 errors) |
| Automated Test Suite | `node --experimental-strip-types --test tests/**/*.test.ts` | `PASS` (454/454 passing) |
| Production Build | `npm run build` | `PASS` (All 69 routes compiled) |
| Edge Runtime Safety | `middleware.ts` free of Node.js `pg` driver bindings | `PASS` (Verified bundle 62.8 kB) |
| Migration Completeness | Migrations 001 through 010 validated and ordered | `PASS` |
| Durable Invalidation | PostgreSQL outbox replaces volatile in-memory recovery | `PASS` |
| Anti-Spoofing Rate Limit | FIPS SHA-256 + trusted proxy verification + verified crawler | `PASS` |
| Staging Environment Isolation | Noindex headers + robots blocking + email safety sink | `PASS` |
| PayU Sandbox Integration | Test credentials, hash generation, and reverse verification | `PASS` |
| Live PostgreSQL Instance | Real-database connection and locking in staging/prod cluster | `PENDING LIVE DEPLOYMENT` |
| Production PayU Credentials| Verified merchant salt and webhook secret from merchant portal | `PENDING LIVE DEPLOYMENT` |

