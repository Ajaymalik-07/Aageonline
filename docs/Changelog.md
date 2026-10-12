# AageOnline — Changelog

## 0.1.0 — Documentation Foundation

### Added

- Product documentation structure.
- Core paid-visibility model.
- Ranking/payment state model.
- Initial architecture.
- API conventions.
- Database model.
- Design system foundation.
- Security/compliance/consent baseline.
- Testing strategy.
- Delivery phases.
- SEO/content/AIO-GEO/analytics foundations.

### Locked Brand Decisions

- AageOnline
- Get Seen. Get Ahead.
- Teal + Emerald + Lime
- Deep Navy foundation
- Light and Dark themes
- Controlled 3D
- Purposeful motion
- WCAG 2.2 AA

## 0.2.0 — Development Harness Foundation

### Added
- Root-level `AGENTS.md` defining core product model, V1 exclusions, documentation hierarchy, and engineering safety rules.
- Root-level `DESIGN.md` defining brand tokens, Light/Dark themes, 4px grid spacing, typography, 8 mandatory component states, motion tokens, and 3D boundaries.
- `.agents/` development harness structure:
  - Skills: `project-context`, `ranking-engine`, `payments-integrity`, `database-migrations`, `security-audit`, `testing-and-verification`, `design-system`, `code-review`, and `ponytail`.
  - Rules: `engineering-standards.md`, `ranking-and-transactions.md`, `security-and-data-protection.md`, and `design-and-accessibility.md`.
  - Workflows: `feature-implementation.md`, `ranking-mutation-verification.md`, and `security-gate.md`.
  - References: `awesome-harness-engineering.md`, `awesome-design-md.md`, and `evaluated-tools-matrix.md`.
- Dev-scoped `.agents/mcp_config.json` for persistent agent memory (`agentmemory`).
- Hardened `.gitignore` excluding secrets, credentials, environment variables, build artifacts, and dependency directories.
- ADR-011 through ADR-014 in `docs/Decision-Log.md`.

## 0.20.14 — Production Readiness Audit & Launch Gate

### Audited
- Comprehensive, evidence-based production readiness audit across Financial Lifecycle, Persistent Auth & RBAC, Worker Supervision & Backups, SEO & Product Trust, and Dependencies/Deployment Configuration.
- Evaluated all previous milestone reports as claims to verify against code and tests rather than proof of correctness.

### Fixed & Remediated
- **Financial Lifecycle Gap (High Severity):** Resolved potential stranded payments where PayU webhook verification transitioned orders to `SUCCEEDED`, but `settleRanking()` required `CONFIRMED`. Implemented an auto-confirmation bridge in `frontend/lib/ranking-settlement/settlement-service.ts` and background reconciler (`frontend/lib/payments/reconciliation-service.ts`, `frontend/lib/db/repositories/payment-repository.ts`).
- **CSRF Defense-in-Depth (Medium Severity):** Added Edge middleware protection in `frontend/middleware.ts` validating `Sec-Fetch-Site` and `Origin` on state-changing API mutations (`POST`, `PUT`, `PATCH`, `DELETE`), rejecting cross-site requests with 403 `CSRF_REJECTED` while exempting public payment gateway callbacks.

### Added
- Dedicated regression test suite: `frontend/tests/launch-readiness-and-lifecycle-gate.test.ts` (9 tests covering auto-confirmation, unconfirmed rejection, CSRF cross-site blocking, same-origin allowance, and PayU callback exemptions).
- Architecture decision record ADR-037 in `docs/Decision-Log.md`.
- Comprehensive production readiness report: `docs/Milestone-0.20.14-Production-Readiness-Audit.md`.

### Verdict & Deferred Gates
- Verdict: **`REMEDIATION COMPLETE — LIVE GATES REMAIN`**.
- Preserved 6 deferred live infrastructure gates: real PostgreSQL engine verification, actual backup/restore execution, multi-instance worker concurrency, managed database provisioning, production PayU credentials, and HTTPS/DNS/monitoring deployment.

## 0.20.13 — Backup & Restore Readiness + Worker Supervision

### Added
- Standardized, automated PostgreSQL backup pipeline in `scripts/backup-db.sh`:
  - PostgreSQL custom-format output (`pg_dump -Fc --no-owner --no-privileges --blobs`).
  - Pre-flight binary existence validation (`pg_dump`, `sha256sum`).
  - SHA-256 cryptographic digest generation (`.sha256`).
  - Auditable metadata manifest (`.manifest.json`) capturing timestamp, version, format, size, checksum, and zero credential storage.
  - Path traversal and overwrite protection.
  - Configurable retention pruning scoped strictly to designated backup directory.
- Backup integrity verification pipeline in `scripts/verify-backup.sh`:
  - Validates SHA-256 checksum against actual file.
  - Tests archive stream and table catalog TOC integrity via `pg_restore --list`.
  - Updates manifest verification status.
- Safe database restore pipeline in `scripts/restore-db.sh`:
  - Active application database protection (`RESTORE_DATABASE_URL != DATABASE_URL`).
  - Strict production/staging target rejection.
  - Mandatory disposable target naming token requirement (`test`, `disposable`, `sandbox`, `restore`, `dev`).
  - Checksum validation pre-flight and interactive/forced confirmation gate.
- Cross-platform backup safety engine in `frontend/lib/ops/backup-safety.ts`.
- Background worker process supervisor in `frontend/lib/workers/supervisor.ts`:
  - Configurable interval with bounded clamping (5s to 300s).
  - Bounded exponential backoff and circuit breaker on consecutive errors (default 5).
  - Graceful termination signal handling (`SIGINT`, `SIGTERM`) with bounded in-flight cycle drain (10s) and terminal `STOPPED` heartbeat emission.
  - Structured JSON logging with zero credential or token leakage.
- Dedicated worker health probe CLI in `frontend/scripts/worker.ts` (`--health`).
- Docker container worker healthcheck configured in `docker-compose.yml` and `frontend/Dockerfile`.
- Comprehensive operational test suite `frontend/tests/ops-backup-and-worker-supervision.test.ts` (20 tests).
- Authoritative Milestone Verification Report in `docs/Milestone-0.20.13-Operations-Readiness.md`.

### Verified
- Automated test suite (`npm test`): 539 tests across 174 suites; 533 passed, 0 failed, 6 skipped.
- Static typing (`npm run typecheck`): 0 errors (`tsc --noEmit`).
- Production build (`npm run build`): 70/70 routes statically generated and compiled successfully (`next build`).

## 0.20.12A — Local PostgreSQL Setup & Integration Test Execution Readiness

### Added
- Dedicated database test safety module `frontend/lib/db/test-safety.ts` enforcing:
  - Strict rejection of production environment modes (`NODE_ENV === 'production'`, `APP_ENV === 'production'`).
  - Strict rejection of production-like database names (`prod`, `production`, `live`, `staging`, `main`, `primary`).
  - Mandatory disposable target naming token requirement (`test`, `disposable`, `sandbox`, `temp`, `dev`, `local`, `dummy`).
  - Deterministic credential redaction (`redactConnectionString()`) in test logs and assertion messages.
- Comprehensive Windows-native setup guide in `docs/Local-PostgreSQL-Integration-Testing.md` detailing:
  - Manual PostgreSQL installation for Windows (EnterpriseDB / `winget`).
  - PowerShell service and TCP port 5432 verification procedures.
  - Creation of dedicated disposable test database `aageonline_integration_test`.
  - Exact PowerShell environment variable syntax (`$env:INTEGRATION_TEST_DATABASE_URL`).
  - Verified migration runner and test suite commands.
  - Deterministic cleanup and troubleshooting for authentication, port conflicts, and SCRAM-SHA-256.

### Hardened & Fixed
- Hardened `frontend/tests/real-postgres-integration.test.ts`:
  - Differentiated unconfigured vs failing database states: misconfigured or failing connections immediately fail the test with explicit assertion failures (zero false skips).
  - Resolved `node:test` skip execution flow: async test bodies now exit immediately upon skip to avoid subsequent unhandled connection errors.
  - Deterministic cleanup limited strictly to synthetic test identifiers (`usr_test_%`, `biz_test_%`, `po_live_%`, `bi_live_%`, etc.).
- Documented advisory lock key boundaries (`hashtext()` 32-bit integer limitations) and confirmed secondary database row-level locking (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`) guarantees collision-free serialization.
- Updated `docs/Milestone-0.20.12-PostgreSQL-Integration-Verification.md` with authoritative verdict: **`HARNESS READY — LIVE DATABASE STILL BLOCKED`**.

### Verified
- Automated test suite (`npm test`): 519 tests across 167 suites; 513 passed, 0 failed, 6 skipped.
- Static typing (`npm run typecheck`): 0 errors (`tsc --noEmit`).
- Production build (`npm run build`): 70/70 routes statically generated and compiled successfully (`next build`).

## 0.20.12 — Real PostgreSQL Integration & Financial Settlement Verification

### Added
- Authoritative Milestone Verification Report in `docs/Milestone-0.20.12-PostgreSQL-Integration-Verification.md`.
- ADR-036 in `docs/Decision-Log.md` documenting Real PostgreSQL Integration Testing Architecture & Environment Gate.
- Dedicated real PostgreSQL integration test suite in `frontend/tests/real-postgres-integration.test.ts` covering live connection health, migration execution, cross-connection visibility, transactional advisory locks, row-level locks, atomic rollbacks, duplicate webhook fingerprint rejection, and persistent session lookups.

### Verified & Diagnosed
- Comprehensive host environment probe: confirmed neither local PostgreSQL nor Docker daemon is active on port 5432.
- Adhered strictly to milestone safety rules: reported **BLOCKED** verdict for live execution rather than falsely claiming integration pass from mocked or in-memory tests.
- 512 tests passing across 167 test suites (`npm test`) with 6 live database tests appropriately gated/skipped.
- 0 TypeScript errors with `npm run typecheck` (`tsc --noEmit`).
- Production build succeeded with all 70 static & dynamic routes (`npm run build`).

## 0.20.11 — Financial Persistence Remediation & PostgreSQL Source of Truth

### Added
- Authoritative Milestone Remediation Report in `docs/Milestone-0.20.11-Financial-Persistence-Remediation.md`.
- ADR-035 in `docs/Decision-Log.md` documenting Financial Persistence Remediation & PostgreSQL as the Source of Truth.
- Completed and extended `PostgresPaymentRepository` (`getPaymentOrderByBidIntentId`, `getPaymentOrdersByBusiness`).
- Upgraded `RankingTransactionContext` to support real PostgreSQL client connection, transaction blocks (`BEGIN` / `COMMIT` / `ROLLBACK`), market-level transactional advisory locks (`SELECT pg_advisory_xact_lock(hashtext($1))`), and row-level locks (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`).
- Added asynchronous, PostgreSQL-backed domain methods to `frontend/lib/bid-intent/store.ts` (`getBidIntentByIdAsync`, `getBidIntentInternalAsync`, `cancelBidIntentAsync`, `getBidIntentsByBusinessAsync`).
- Added asynchronous, PostgreSQL-backed domain methods to `frontend/lib/payments/store.ts` (`getPaymentOrderByBidIntentIdAsync`, `getPaymentOrderByIdAsync`, `cancelPaymentOrderAsync`, `confirmPaymentOrderAsync`, `getPaymentOrderInternalAsync`).
- Added asynchronous, PostgreSQL-backed domain methods to `frontend/lib/ranking-settlement/settlement-service.ts` (`getRankingSettlementByIdAsync`, `getRankingSettlementByPaymentOrderIdAsync`, `getRankingSettlementsByBusinessAsync`).
- Dedicated financial persistence & durability test suite `frontend/tests/financial-persistence-and-durability.test.ts` covering 21 assertions across 6 core categories.

### Changed & Hardened
- **PostgreSQL as Source of Truth:** Bid intents, payment orders, provider events, ranking settlements, market participations, and position history records are durably persisted to PostgreSQL using existing migrations `001`–`004`.
- **Fail-Closed Production Guard:** In production mode (`NODE_ENV === 'production'`, `APP_ENV === 'production'`, or `PERSISTENCE_MODE === 'postgres'`), missing `DATABASE_URL` or failed database mutations strictly fail closed and throw critical errors instead of falling back to in-memory Maps.
- **Web API & Background Worker Unification:** All financial API routes (`/api/bid-intents`, `/api/payments`, `/api/businesses/...`) and background reconciliation daemons (`runPaymentReconciliationCycle`, `runSettlementRecoveryCycle`) operate over the exact same PostgreSQL repositories.
- **PayU Webhook Deduplication:** Every incoming webhook payload hash is checked against `payment_provider_events` using `uq_payment_provider_events_fingerprint` to ensure idempotent, single execution.
- **Atomic Ranking Settlement:** Ranking settlement executes inside a database transaction with market-level advisory locking, ensuring serialized mutations and atomic rollback on any failure.

### Verified
- 509 tests passing across 160 suites with 0 failures (`npm test`).
- 0 TypeScript errors with `npm run typecheck` (`tsc --noEmit`).
- Production build succeeded with 70 static and dynamic routes (`npm run build`).

## 0.20.10 — Persistent Authentication & Production Session Security

### Added
- Authoritative Milestone Remediation Report in `docs/Milestone-0.20.10-Authentication-Remediation.md`.
- ADR-034 in `docs/Decision-Log.md` documenting Persistent Authentication, High-Entropy Token Lifecycle, and Multi-Tenant Server Authorization.
- Database Migration `011_user_sessions.sql` establishing PostgreSQL `user_sessions` table with composite indexes, token hash uniqueness, telemetry hashing, and expiration timestamps.
- `PostgresSessionRepository` in `frontend/lib/db/repositories/session-repository.ts` providing atomic session creation, SHA-256 hash lookup, user joins, revocation, and automated sweep logic.
- Cryptographic session token generator and validator in `frontend/lib/auth/session-token.ts` utilizing `crypto.randomBytes(32)` and deterministic SHA-256 hashing.
- Hardened cookie policies utilizing `__Host-` prefix in production (`__Host-aageonline_session`), `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
- Authoritative server-side authorization guards in `frontend/lib/auth/server-guard.ts` (`requireAuthenticatedUser`, `requireBusinessMembership`, `requirePlatformAdminUser`, and `requireAdminOrWorker`).
- Dedicated security test suite `frontend/tests/production-session-and-auth-security.test.ts` with 26 test assertions covering 7 critical security invariant categories.

### Changed & Hardened
- **Completely removed development identity bypass in production execution paths:** `getActiveDevSession()` strictly returns `null` in production, `setActiveDevUser()` throws an error in production, and `LocalAuthDataSource` fails closed without leaking `user-ajay`.
- Refactored `frontend/app/api/auth/login/route.ts` to establish persistent server-side sessions and set `HttpOnly` session cookies.
- Refactored `frontend/app/api/auth/logout/route.ts` to durably revoke sessions in PostgreSQL and clear cookies.
- Refactored 17 protected API routes across bid intents, business workspaces, members, profiles, claims, and dashboards to enforce server-side business membership and RBAC permissions.
- Client-supplied `actorUserId`, `businessId`, and headers are ignored; server resolves caller identity strictly from authenticated session cookie.

### Verified
- 488 tests passed with 0 failures across the complete test suite.
- 0 TypeScript errors with `tsc --noEmit`.
- Next.js production build compiled and optimized 70 static, SSG, and dynamic routes with zero errors.

## 0.20.9 — Production Security, Financial Integrity & Reliability Audit

### Added
- Authoritative Production Readiness Audit Report in `docs/Milestone-0.20.9-Production-Security-Reliability-Audit.md`.
- ADR-033 in `docs/Decision-Log.md` documenting the formal audit verdict and remediation roadmap.
- Comprehensive security and reliability audit covering development authentication, in-memory state fallbacks, PayU cryptographic algorithms, ranking settlement atomicity, PostgreSQL pooling, rate limiting, and SEO routing policies.

### Audit Findings & Verdict
- **Verdict:** **`BLOCKED`** (Blocked for live customer payments and live infrastructure deployment pending persistent auth and persistence synchronization).
- **Blockers Identified:**
  - `SEC-01`: In-memory authentication (`LocalAuthDataSource`) with global `user-ajay` dev fallback leaks owner permissions on unauthenticated requests.
  - `SEC-02`: Dual-state dichotomy between in-memory `Map` stores and PostgreSQL repositories risks data loss on container restart.
  - `SEC-03`: Ranking settlement transaction defaults to process-local mutex instead of PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).
  - `SEC-04`: Missing automated database backup and disaster recovery restore scripts.
  - `SEC-05`: Edge Middleware rate limiting operates in process-local memory rather than shared distributed counters.
- **Verified Invariants:**
  - PayU request and reverse-hash algorithms (SHA-512) and timing-safe equality checks verified.
  - Production pre-flight deployment guard blocks test keys (`gtKFFx`/`eCwWELxi`) in production mode.
  - Anti-spoofing proxy client IP extraction and salted SHA-256 IP hashing verified.
  - Production SEO rules verified: public directories and market routes (`/jaipur/interior-designers`) indexable; private workspaces and APIs disallowed.
  - 461 automated tests passing across 145 suites (100% pass rate).
  - TypeScript compilation passing with 0 errors (`tsc --noEmit`).
  - Next.js 15 production build compiling all 69 static/SSG/dynamic routes with exit code 0.

## 0.20.8 — Whole-Website Functional & Regression Audit

### Added
- Comprehensive functional and regression verification report in `docs/Milestone-0.20.8-Functional-Regression-Audit.md`.
- Automated regression suite `frontend/tests/ui-navigation-regression.test.ts` verifying canonical redirects, landmark semantics, site configuration targets, and animation removal.
- Expanded automated test coverage to 461 passing tests across 145 suites (100% pass rate).

### Verified
- **Business Workflows:** Authentication, RBAC tenant isolation, business claiming pipelines, workspace views, bid intent creation, PayU signature verification, atomic ranking settlement with row-level locks, duplicate callback idempotency, position history logs, and background reconciliation recovery.
- **Security & Integrity Invariants:** Server-side price recalculation, confirmed-payment-only ranking settlement, non-refundable payment finality, token-bucket rate limiting, and zero secret exposure.
- **SEO & Accessibility:** Canonical URL coverage, JSON-LD schemas, robots directives, sitemap completeness, WCAG 2.2 AA single `<main>` landmark invariant, visible keyboard focus, and contrast compliance.
- **Build Quality:** Zero TypeScript compilation errors (`tsc --noEmit`) and successful Next.js production build (`next build`) compiling all 69 static/SSG routes.

## 0.20.7 — Whole-Website UI Consistency & Design Alignment

### Added
- Canonical visual alignment across all 19 route families based on Homepage (`/`) and Jaipur Interior Designers (`/jaipur/interior-designers`).
- Full milestone documentation in `docs/Milestone-0.20.7-Whole-Website-UI-Alignment.md`.
- ADR-032 in `docs/Decision-Log.md`.
- Canonical 308 URL redirects in `next.config.ts` (`/claim` → `/business/claim`, `/how-it-works` → `/#how-it-works`, `/trust` → `/#trust`, `/explore` → `/markets`).
- Anchor landmarks `id="how-it-works"` and `id="trust"` on the homepage.

### Fixed
- **Admin Views Layout Duplication:** Removed duplicate `<Header />` and `<Footer />` renders and nested `<main>` tags from `/admin`, `/admin/operations`, and `/admin/discovery`.
- **Accessibility & Landmarks:** Replaced nested `<main>` tags with `<div>` in `businesses/[business]/page.tsx` and its loading skeleton.
- **Semantic Workspace Navigation:** Replaced inner `<header>` tags with `<nav aria-label="Workspace Navigation">` in `WorkspaceNav.tsx`.
- **Navigation Target Consistency:** Updated direct navigation links in `site.ts`, `Header.tsx`, `MobileNav.tsx`, and `Footer.tsx` to canonical routes.
- **Eyebrow & CTA Token Alignment:** Standardized section eyebrow text and CTA buttons in `/[location]` and `/categories/[category]` to `var(--action-primary)`.
- **Directory Hero Consistency:** Standardized hero badge status dots across `/locations`, `/categories`, `/markets`, and `/businesses` to `#EA580C`.

### Removed
- **Motion & Animations:** Removed keyframe pulsing indicators (`@keyframes livePulse`), marquee scrolling animations, and 3D tilt transformations (`rotateX`/`rotateY`).
- **Bouncy Hover Effects:** Replaced `translateY` hover lifts with static border-color and elevation transitions.
- **Auto-Advancing Rotator:** Removed automatic step carousel and auto-advance controls from `HowItWorksJourney.tsx`.

## 0.20.6 — Remove Staging Infrastructure & Simplify Deployment Architecture

### Removed
- **Decommissioned Staging Deployment Artifacts:**
  - Removed `docker-compose.staging.yml`, `scripts/deploy-staging.sh`, and `.env.staging.example`.
  - Decommissioned separate staging environment target (`staging.aageonline.com`).
  - Removed staging-wide `X-Robots-Tag: noindex, nofollow` header override from `Caddyfile`.

### Added
- **Canonical Production Deployment Pipeline (`docker-compose.yml`, `scripts/deploy.sh`):**
  - Standardized single deployment workflow: **Local Development → Production**.
  - `docker-compose.yml`: Services `caddy`, `web`, `worker`, `migrator` on private network `aageonline-net`.
  - `scripts/deploy.sh`: Hardened production deploy script with automated environment validation, database migration pre-execution, healthcheck polling, and internal readiness probe verification.
  - `.env.production.example` & `.env.example`: Comprehensive environment templates for production VPS and local workstation development with zero secret exposure.
  - `docs/Production-Deployment-Runbook.md`: Production operations, DNS, firewall, and rollback runbook.
  - ADR-031 in `docs/Decision-Log.md`.

### Changed
- **Host Bootstrap Script (`scripts/setup-vps.sh`):** Updated to target production `aageonline.com` and use `docker-compose.yml`.
- **Caddy Reverse Proxy (`Caddyfile`):** Parameterized for `{$SITE_ADDRESS:aageonline.com}`, serving clean production headers without staging noindex overrides.
- **Historical Milestone Reports:** Marked Milestone 0.20.4, Milestone 0.20.5, and Staging Runbook as superseded archival records.

## 0.20.4 — Pre-Provisioning Security Audit & Deployment Gate

### Added
- **Pre-Provisioning Security Audit Report (`docs/Milestone-0.20.4-Pre-Provisioning-Audit.md`):**
  - Comprehensive inspection of all deployment scripts, Docker Compose topologies, firewall rules, and migration sequences.
  - Final Deployment Gate: **READY TO PROVISION**.
- **PostgreSQL Session Advisory Locking for Migrations (`frontend/lib/db/migrator.ts`):**
  - Session-level advisory lock (`MIGRATION_ADVISORY_LOCK_ID = 94827104`) prevents race conditions between multiple deployment runners or worker instances executing `npm run db:migrate` concurrently.
- **Fail-Closed Deployment Healthcheck Gate (`scripts/deploy-staging.sh`):**
  - Script immediately aborts deployment with `exit 1` and dumps container diagnostic logs if `aageonline_staging_web` fails to achieve healthy status within timeout.
  - Added strict internal verification of `/api/health/ready`.
- **Docker-UFW Network Isolation Verification (`docker-compose.staging.yml`, `scripts/setup-vps.sh`):**
  - Confirmed internal Next.js application port 3000 is never exposed on the host, preventing Docker's iptables manipulation from bypassing UFW firewall rules.
  - Documented root-equivalent privileges associated with Linux `docker` group membership.

## 0.20.2 — Docker VPS, Managed PostgreSQL & Direct DNS Deployment

### Added
- **Production Multi-Stage Dockerfile (`frontend/Dockerfile`):**
  - Built on official Node.js 22 LTS Alpine (`node:22-alpine`).
  - Implements multi-stage compilation (`base`, `deps`, `builder`, `web`, `worker`, `migrator`).
  - Generates optimized standalone Next.js build via `output: 'standalone'` in `next.config.ts`.
  - Enforces least-privilege security running as non-root system user `nextjs:nodejs` (UID 1001).
  - Includes container liveness healthcheck (`wget -qO- http://127.0.0.1:3000/api/health/live`).
- **Caddy Direct HTTPS & Reverse Proxy (`Caddyfile`):**
  - Automatic TLS management via Let's Encrypt / ZeroSSL on public ports 80 and 443.
  - Parameterized hostname `{$SITE_ADDRESS}` defaulting to `staging.aageonline.com`.
  - Injects defense-in-depth security headers: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow`.
  - Transparent reverse proxying to internal Next.js application port 3000 over private Docker bridge.
- **Docker Compose Staging Orchestration (`docker-compose.staging.yml`):**
  - Services: `caddy` (public TLS termination), `web` (Next.js App Router), `worker` (dedicated reconciler daemon), and `migrator` (one-off DB migration runner).
  - Isolates application and worker inside private bridge network `aageonline-staging-net`; zero public port leakage.
  - Healthcheck dependency wiring: Caddy startup waits for `web` container healthcheck to pass.
- **Staging Deployment & Operations Runbook (`docs/Staging-Deployment-Runbook.md`):**
  - Comprehensive guide for VPS host configuration (Ubuntu 22.04/24.04 LTS), UFW firewall rules, Docker CE installation, DNS A record binding, environment setup, database migrations, smoke testing, and rollback procedures.
- **Safe Environment Template (`.env.staging.example`):**
  - Comprehensive environment documentation with safe placeholders for SSL database URL, cryptographic salts, and PayU sandbox keys.

## 0.20.0 — Staging Deployment, Live PostgreSQL Integration & End-to-End Verification

### Added
- **Staging Environment Protection (`APP_ENV=staging`):**
  - Absolute search engine crawl exclusion: `app/robots.ts` returns `disallow: ['/']` and omits sitemap when `APP_ENV === 'staging'`.
  - Edge response header enforcement: Injects `X-Robots-Tag: noindex, nofollow` on all responses served under staging environments.
  - Outbound email safety sink: `StandardDeliveryAdapter` automatically intercepts staging emails into synthetic `STAGING_SAFETY_SINK`, preventing real customer notifications during staging tests unless explicitly sent to `STAGING_TEST_EMAIL_RECIPIENT`.
- **Machine-Checkable Health & Readiness Probes (`/api/health/live`, `/api/health/ready`):**
  - Added dedicated path-based container orchestration probes alongside query mode (`/api/health?mode=...`).
  - `/api/health/live`: Unconditional HTTP 200 process liveness probe.
  - `/api/health/ready`: Dependency readiness probe returning HTTP 503 when mandatory PostgreSQL persistence is unreachable.
- **PayU Sandbox Integration Verification:**
  - Standard PayU Sandbox credentials (`gtKFFx` / `eCwWELxi`) verified for request hash computation and reverse webhook hash verification.
  - End-to-end verification of anti-tampering defenses against altered amounts and forged signatures.
- **Automated Verification Suite:**
  - Added `frontend/tests/staging-deployment-and-live-verification.test.ts` (13 tests) verifying staging isolation, migration order, PayU sandbox mechanics, and readiness probes.
  - Expanded automated test suite to 454/454 passing tests across 49 suites.

## 0.19.0 — Production Readiness, Distributed State & Live Infrastructure Verification

### Added
- **Durable Cache Invalidation Outbox (`Migration 010: cache_invalidation_jobs` & `PostgresInvalidationRepository`):**
  - Replaced volatile in-memory recovery queues with persistent PostgreSQL table `cache_invalidation_jobs`.
  - Failed cache invalidation jobs persist with status, attempts count, max attempts (5), next run timestamp, and safe diagnostic error message.
  - Concurrent multi-worker processing guaranteed via `SELECT ... FOR UPDATE SKIP LOCKED` and lease locking (`locked_until`).
  - Implements bounded exponential backoff on retries; transitions to `TERMINAL_FAILED` for administrative inspection upon exceeding max attempts.
  - Survives application restarts and container crashes with zero lost invalidation records.
  - Reconciler worker cycle (`reconciler-worker.ts`) automatically polls and processes pending jobs as part of continuous background sweeps.
- **Distributed Rate Limiting & Proxy Anti-Spoofing Architecture (`Migration 010: rate_limit_counters` & `rate-limit.ts`):**
  - Upgraded IP token generator to pure FIPS 180-4 SHA-256 with server-side salt (`computeSha256Hex`), eliminating hash collisions without third-party dependencies.
  - Multi-instance distributed rate limiting supported via PostgreSQL atomic counter table `rate_limit_counters`.
  - High-availability outage fallback: Gracefully degrades to local in-memory sliding window with `store: 'degraded-local'` if the database is unreachable, ensuring legitimate traffic is never blocked.
  - Anti-spoofing proxy validation: Rejects client-supplied `X-Forwarded-For` and `X-Real-IP` headers unless the immediate connection originates from a verified upstream proxy (`isTrustedProxy`).
  - Verified crawler protection: Rejects spoofed `User-Agent: Googlebot` strings; elevated 2x headroom is granted strictly when infrastructure-verified edge headers (`cf-verified-bot: true` or `x-verified-bot: true`) are present.
- **Edge Middleware Decoupling (`middleware.ts`):**
  - Decoupled Edge Middleware from Node.js database drivers (`pg`), avoiding runtime incompatibilities (`process.nextTick`) in edge contexts while keeping rate-limit evaluation ultra-fast.
- **Enhanced Observability & Administrative Summary Reporting (`/api/admin/operations/summary` & `metrics.ts`):**
  - Explicit scope labeling distinguishing `PROCESS_LOCAL` diagnostics from cluster-wide durable PostgreSQL totals.
  - Reports durable invalidation outbox metrics (pending, failed, terminal failed, processing, oldest pending age).
  - Reports worker heartbeat status, freshness, payment reconciliation runs, settlement recovery status, and database pool telemetry.
- **Automated Failure-Injection & Security Test Suite (`frontend/tests/production-readiness-and-distributed-state.test.ts`):**
  - 17 dedicated tests covering: process restarts with queued jobs, concurrent worker locking, CDN outage backoff and terminal failure, crawler spoofing rejection, untrusted proxy header rejection, database outage failover, production persistence guard enforcement, duplicate payment deduplication, settlement atomicity rollback, unauthorized operations summary protection, and stale heartbeat detection.
  - 441/441 automated tests passing across 48 test suites with zero failures.

## 0.18.0 — Performance, Caching & Edge Optimization

### Added
- **Centralized Cache Policy Architecture (`frontend/lib/cache/policies.ts`):**
  - Explicit typed classification across data classes: `STATIC_IMMUTABLE`, `PUBLIC_CONTENT`, `PUBLIC_TAXONOMY`, `PUBLIC_RANKING`, `PUBLIC_SITEMAP`, `PRIVATE_WORKSPACE`, `ADMIN_OPERATIONS`, and `FINANCIAL_DYNAMIC`.
  - Enforces strictly private no-store headers (`private, no-cache, no-store, max-age=0, must-revalidate`) across business workspace, payment orders, real-time pricing quotes, and administrative tools.
  - Bounded caching for public taxonomy hubs (300s TTL) and live market rankings (60s TTL).
- **Post-Commit Ranking Freshness & Invalidation Service (`frontend/lib/cache/invalidation.ts`):**
  - Atomic invalidation triggers strictly *after* the PostgreSQL ranking transaction commits in `settleRanking()`.
  - Next.js App Router on-demand revalidation for affected market routes (`revalidatePath`) and tags (`revalidateTag`).
  - Monotonic market cache version tracking (`getMarketCacheVersion`).
  - Safe recovery queue (`FAILED_INVALIDATIONS_RECOVERY_QUEUE`) and worker retry runner (`recoverPendingInvalidations`).
  - Guarantees cache invalidation failure never rolls back confirmed financial truth or committed position updates.
- **Next.js Edge Middleware & Privacy-Preserving Rate Limiting (`frontend/middleware.ts`, `frontend/lib/security/rate-limit.ts`):**
  - Edge middleware matching all dynamic public and API endpoints.
  - Differentiated rate limits across four tiers: `PUBLIC_DISCOVERY` (120 req/min), `SEARCH_API` (40 req/min), `AUTH_AND_PAYMENTS` (15 req/min), and `ADMIN_OPERATIONS` (30 req/min).
  - Deterministic 16-character hex client IP token hashing with server-side salt, preventing raw IP retention in memory or logs.
  - Returns HTTP 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
  - Recognizes verified search engine crawlers (Googlebot, Bingbot) and applies 2x headroom on public discovery routes.
- **Incremental Static Regeneration (ISR) & Route Optimization:**
  - Configured bounded ISR: `/[location]/[category]` (60s), `/markets` (300s), `/locations` (300s), `/categories` (300s), `/businesses` (300s), and `/` (120s).
  - Configured 1-hour bounded revalidation on `/sitemap.xml` with in-memory snapshot caching and explicit taxonomy mutation invalidation (`invalidateSitemapCache`).
- **Database Resilience & Migration 009 (`009_performance_indexes.sql`):**
  - Added composite indexes for business directory and sitemap candidate scanning, market ranking ladders (`market_participations(market_id, status, current_position ASC NULLS LAST)`), business dashboard participation lookups, position history by business and market, and fast taxonomy slug lookups.
  - Configured statement timeout (`statement_timeout = 10000ms`) on `pg.Pool` to prevent connection starvation from long-running queries.
  - Documented deployment connection budgeting across container instances.
- **Production Persistence Guard in SEO Audit Repository (`frontend/lib/db/repositories/seo-audit-repository.ts`):**
  - Strictly forbids silent fallback to in-memory maps in production environments, throwing critical persistence failure errors when PostgreSQL is unreachable.
- **Lightweight Observability & Performance Metrics (`frontend/lib/observability/metrics.ts`):**
  - Telemetry collector tracking request latencies, cache hit/miss ratios, rate-limit rejections, and connection pool metrics.
  - Integrated into administrative overview summary API (`/api/admin/operations/summary`).
- **Automated Test Suite (`frontend/tests/performance-caching-and-edge.test.ts`):**
  - 17 dedicated automated tests verifying cache policies, invalidation ordering, sitemap snapshotting, rate limiting, and pool configuration.
  - Full test suite passing: 424/424 tests passing across 47 test suites.

## 0.17.0 — Search Engine Visibility & Market Discovery Automation

### Added
- **Centralized SEO Eligibility Policy Engine (`frontend/lib/seo/eligibility.ts`):**
  - Evaluates platform URLs against an 8-gate typed validation pipeline.
  - Distinguishes publication status (`PUBLISHED`) from indexability status (`INDEXABLE`).
  - Enforces route privacy (excludes `/admin`, `/auth`, `/api`, internal discovery), query parameter rejection, content approval (`APPROVED`), verified underlying data, and minimum active child count for location/category hubs.
  - Categorizes exclusions with granular typed reasons (`UNPUBLISHED_STATUS`, `EXPLICIT_NOINDEX`, `CONTENT_NOT_APPROVED`, `INSUFFICIENT_GENUINE_DATA`, `THIN_DOORWAY_PAGE`, `PRIVATE_ROUTE`, `QUERY_PARAMETERS_DETECTED`, `CANONICAL_CONFLICT`).
- **Authoritative Dynamic Sitemap Service (`frontend/lib/seo/sitemap-service.ts`, `frontend/app/sitemap.ts`):**
  - Next.js dynamic sitemap generator pulling exclusively from authoritative, published database and service records.
  - Normalizes canonical URLs against authoritative origin with strict rejection of `localhost` in production.
  - Maps real entity `updatedAt` timestamps; strictly prohibits fabricated current timestamps (`new Date()`).
  - Computes SHA-256 checksums and provides structured operational summaries (`generateAuthoritativeSitemapSummary`).
- **Canonical Normalization & Metadata Helpers (`frontend/lib/seo/canonical.ts`):**
  - Strict path normalization with trailing slash removal, lowercase casing, and query-string stripping.
  - Helper `generateCanonicalMetadata()` emits valid Next.js `Metadata` with absolute canonical URL, OpenGraph attributes, and automated `noindex, nofollow` robot directives on private or non-indexable routes.
- **Schema.org Structured Data (JSON-LD) Integrity (`frontend/lib/seo/schema.ts`):**
  - Structured data generators for `WebSite`, `Organization`, `BreadcrumbList`, `ItemList`, and `LocalBusiness`.
  - Enforces mandatory paid-visibility disclosures on ranked market `ItemList` entries (`positionDisclosureText`).
  - Limits `LocalBusiness` to verified businesses with complete physical data; strictly prohibits false claims of AageOnline operating as a local business in every city and excludes fabricated review/rating schema.
- **Market Discovery Quality Audit Engine (`frontend/lib/seo/discovery-audit.ts`):**
  - Audits taxonomy relationships, thin markets, duplicate canonical paths, and missing metadata.
  - Cross-references approved locations and categories to detect candidate market expansion opportunities without auto-publishing unreviewed records.
- **Search Console Adapter (`frontend/lib/seo/search-console.ts`):**
  - Provider-agnostic adapter gracefully reporting `configured: false` when credentials (`GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL` / `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`) are unconfigured, avoiding runtime exceptions and fabricated metrics.
- **Durable Database Persistence & Migration 008 (`frontend/lib/db/migrations/008_seo_audits.sql`):**
  - `seo_audit_runs`: Persistent audit logs tracking total candidate URLs, eligible URLs, exclusion breakdowns, validation failures, and sitemap checksums.
  - `seo_registered_routes`: Snapshot table indexing candidate URLs, eligibility flags, exclusion reasons, and audit timestamps.
  - `PostgresSeoAuditRepository` with in-memory fallback for local development.
- **Administrative Operations & Audit Endpoint (`frontend/app/api/admin/seo/audit/route.ts`):**
  - Protected `GET` and `POST` operational endpoints enforcing `assertAdminOrWorker`.
  - Integrates SEO and Sitemap health into the central admin operations dashboard (`frontend/app/admin/operations/OperationsDashboardClient.tsx`, `/api/admin/operations/summary`).
- **Comprehensive Test Suite (`frontend/tests/seo-eligibility-and-sitemaps.test.ts`):**
  - 23 dedicated automated test cases verifying all 8 eligibility gates, sitemap normalization, JSON-LD compliance, search console safety, and discovery health audits.
  - Complete project test suite passed: 407/407 tests passing across 46 test suites.

## 0.16.0 — Ranking Visibility, Position History & Notification Engine

### Added
- **Transactional Ranking-Change Events Outbox (`frontend/lib/ranking-settlement/settlement-service.ts`):**
  - Emits durable `RankingChangeEvent` records (`ranking_change_events` table) within the exact same PostgreSQL transaction that mutates `market_participations`, `position_history`, and `ranking_settlements`.
  - Enforces atomic rollback safety: transactions rolling back guarantee zero phantom ranking change events.
  - Deduped by composite constraint `uq_ranking_change_event(ranking_settlement_id, business_id)`.
- **Database Schema Migration 007 (`frontend/lib/db/migrations/007_ranking_notifications.sql`):**
  - `ranking_change_events`: Committed outbox tracking business position changes, displacement directions (`UP`, `DOWN`, `ENTRY`, `NO_CHANGE`), and processing timestamps.
  - `business_notifications`: Durable notification queue with delivery lifecycle (`PENDING`, `PROCESSING`, `RETRYABLE`, `DELIVERED`, `FAILED`), bounded retries, exponential backoff, and idempotency key `uq_notification_event_user_type`.
  - `notification_preferences`: Tenant settings for in-app alerts and opt-in email delivery with configurable anti-spam digest windows (`digest_window_minutes`).
- **Downward Milestone Threshold Engine (`frontend/lib/notifications/milestones.ts`):**
  - Detects crossings across all 7 configured tiers: `#1 -> #5`, `#5 -> #10`, `#10 -> #20`, `#20 -> #30`, `#30 -> #50`, `#50 -> #75`, `#75 -> #100`.
  - Consolidates rapid multi-threshold drops into the primary (deepest) threshold alert.
  - Generates objective, neutral disclosure copy without superlative claims.
- **Rapid-Movement Coalescing & Anti-Spam Digesting (`frontend/lib/notifications/notification-service.ts`):**
  - Groups successive downward events within a configurable 15-minute window into existing pending notifications.
  - Eliminates notification fatigue and email storms while keeping the full historical position ledger append-only and intact.
- **Autonomous Reconciler Worker Notification Coordination (`frontend/lib/workers/reconciler-worker.ts`):**
  - Integrated `processPendingRankingEvents()` and `deliverPendingNotifications()` into single reconciler cycle.
  - Updated worker heartbeat metrics to report notification queue counts and delivery stats.
- **Business Workspace Ranking History & Notifications UI & APIs:**
  - `GET /api/business/dashboard/ranking-history`: Paginated, auditable movement history with direction and market filters, and mandatory paid visibility disclosures.
  - `GET /api/business/dashboard/notifications`: Paginated notifications inbox.
  - `GET /api/business/dashboard/notifications/unread-count`: Unread counter for badges.
  - `POST /api/business/dashboard/notifications/[id]/read`: Idempotent read mutation.
  - `GET / PUT /api/business/dashboard/notification-preferences`: Preferences management.
  - Accessible responsive workspace UI pages (`/business/dashboard/ranking-history`, `/business/dashboard/notifications`) styled with Deep Navy (`#071526`) and Vibrant Orange (`#EA580C`) design tokens.

## 0.15.0 — Administrative Operations & Live Reconciler Scheduling

### Added
- **Server-Side Administrative Authorization Guard (`frontend/lib/auth/admin-guard.ts`):**
  - Canonical `assertPlatformAdmin()` guard enforcing server-side `UserRole` (`USER | ADMIN | SUPERADMIN`) checks and `PLATFORM_ADMIN_EMAILS` fallback. Never trusts client-supplied roles.
  - Constant-time `verifyWorkerSecret()` implementing `crypto.timingSafeEqual()` for `x-admin-worker-secret` and `Authorization: Bearer` headers against `ADMIN_WORKER_SECRET` / `CRON_SECRET`.
  - Shared `assertAdminOrWorker()` boundary for administrative operations endpoints.
  - Pre-seeded platform admin (`user-admin` / `admin@aageonline.example.com`) in `frontend/lib/auth/store.ts`.
- **Database Schema Migration 006 (`frontend/lib/db/migrations/006_admin_operations.sql`):**
  - `reconciliation_runs` table tracking run types, triggers (`SCHEDULED`, `MANUAL`), candidate/success/retryable/failed counters, and JSONB diagnostic summary.
  - `worker_heartbeats` table providing persistent worker liveness tracking (`worker_id`, `worker_type`, `last_heartbeat_at`, `status`, `metadata`).
  - Operational sorting indexes on `payment_orders(created_at DESC)` and `ranking_settlements(created_at DESC)`.
- **Durable Repositories Layer:**
  - `PostgresReconciliationRunRepository` & memory fallback with pagination and filtering.
  - `PostgresHeartbeatRepository` & memory fallback for worker liveness tracking.
  - Enhanced `PostgresPaymentRepository` with `getUnresolvedPayments()`, paginated payment orders, provider events, and financial summary stats.
  - Enhanced `PostgresRecoveryRepository` with paginated job lists, manual retry resets, and queue stats.
  - Enhanced `PostgresRankingSettlementRepository` with paginated settlement queries.
- **Independent Payment Reconciliation Engine (`frontend/lib/payments/reconciliation-service.ts`):**
  - `runPaymentReconciliationCycle()`: safely discovers stuck `PENDING` orders, performs provider-side PayU verification outside any ranking transaction lock, validates amounts/currencies in integer minor units, executes canonical `evaluatePaymentTransition()`, transitions state idempotently, enqueues ranking settlement if confirmed, and logs to `audit_logs`.
  - `reconcileSinglePaymentOrder()`: on-demand single payment reconciliation with full permission assertions.
- **Autonomous Multi-Instance Safe Worker (`frontend/lib/workers/reconciler-worker.ts`, `frontend/scripts/worker.ts`):**
  - PostgreSQL advisory lock (`pg_try_advisory_lock(829104812)`) preventing concurrent overlapping runs across clustered servers.
  - Autonomous reconciler cycle coordinating payment reconciliation and settlement recovery outbox processing.
  - Continuous heartbeat recording and graceful signal handling (`SIGINT`, `SIGTERM`).
  - Standalone CLI runner with `--once` (cron) and daemon support via `npm run worker` / `npm run worker:once`.
- **Production Readiness & Live Heartbeat Diagnostics (`frontend/lib/db/readiness.ts`):**
  - Granular subsystem status: `database`, `migrations`, `payu`, `workerHeartbeat` (`PASS`, `DEGRADED`, `NOT_CONFIGURED`), and `recoveryQueue`.
  - Queue depth metrics, oldest job age, and heartbeat freshness verification.
- **Secure Administrative APIs (`frontend/app/api/admin/`):**
  - 11 dedicated endpoints: `/api/admin/operations/summary`, `/api/admin/payments`, `/api/admin/payments/[id]`, `/api/admin/payments/[id]/reconcile`, `/api/admin/settlements`, `/api/admin/recovery-jobs`, `/api/admin/recovery-jobs/[id]/retry`, `/api/admin/provider-events`, `/api/admin/reconciliation-runs`, `/api/admin/readiness`, `/api/admin/payment-reconciliation`.
- **Administrative Operations Dashboard UI (`frontend/app/admin/operations/`):**
  - Non-indexable (`robots: { index: false, follow: false }`) responsive administrative control center.
  - Real-time heartbeat badge, queue metrics, quick sweep triggers with confirmation, searchable payment orders table with on-demand Reconcile button, settlements and recovery jobs view with manual Retry button, and durable run history ledger.
  - Themed with brand palette: Deep Navy (`#071526`), Vibrant Orange (`#EA580C`), Inter typography.
- **Comprehensive Testing & Validation:**
  - 14 dedicated test suites in `frontend/tests/admin-operations-and-reconciler.test.ts`.
  - Full test suite: 370/370 tests PASS (`npm test`).
  - Clean TypeScript verification (`npm run typecheck`) and production build compilation (`npm run build`).

## 0.14.0 — Production PostgreSQL Persistence & Settlement Recovery

### Added
- **Production PostgreSQL Persistence Client & Pool Manager (`frontend/lib/db/client.ts`, `frontend/lib/db/guard.ts`):**
  - Connection pooling with `pg.Pool`, timeouts, and SSL configuration.
  - ACID transaction helper `withTransaction<T>()` managing `BEGIN ... COMMIT / ROLLBACK`.
  - Non-negotiable Production Persistence Safety Guard (`assertProductionPersistence`): strictly prevents execution of live financial routes (`createBidIntent`, `createPaymentOrder`, `processPayUWebhook`, `reconcilePaymentOrder`, `settleRanking`) in production without a valid, reachable `DATABASE_URL`. Silently falling back to volatile in-memory financial storage is strictly forbidden.
- **Version-Controlled PostgreSQL Migration Engine (`frontend/lib/db/migrations/`, `frontend/lib/db/migrator.ts`, `frontend/scripts/migrate.ts`):**
  - Canonical raw SQL migrations 001–005:
    - `001_initial_schema.sql`: Core taxonomy, businesses, memberships, claims, `market_participations` with active position unique index (`uq_market_participations_active_position`), and `audit_logs`.
    - `002_bid_intents.sql`: `bid_intents` with `uq_bid_intents_actor_business_key` scoped idempotency and integer minor units check.
    - `003_payments_and_events.sql`: `payment_orders` with provider uniqueness, scoped idempotency, and `payment_provider_events` with payload hash fingerprint constraint (`uq_payment_provider_events_fingerprint`).
    - `004_ranking_settlements_and_history.sql`: `ranking_settlements` with `uq_ranking_settlements_payment_order` and `position_history` append-only audit ledger with no-op check constraint.
    - `005_outbox_and_recovery.sql`: `settlement_recovery_jobs` table with fast skip-locked polling index (`idx_recovery_jobs_poll`).
  - Migration tracker table `schema_migrations` recording version timestamps.
  - CLI runner `npm run db:migrate`.
- **PostgreSQL Repository Layer (`frontend/lib/db/repositories/`):**
  - `PostgresPaymentRepository`: payment orders and provider events with idempotent inserts and transactional updates.
  - `PostgresBidIntentRepository`: bid intents with scoped idempotency checks.
  - `PostgresRankingSettlementRepository`: settlements with one-settlement-per-order uniqueness.
  - `PostgresMarketParticipationRepository`: atomic position updates, incumbent shifts, and active rankings lookup.
  - `PostgresPositionHistoryRepository`: strictly append-only position history ledger.
  - `PostgresRecoveryRepository`: settlement recovery queue with `SELECT ... FOR UPDATE SKIP LOCKED` claiming.
  - `PostgresAuditRepository`: immutable audit log persistence.
- **PostgreSQL Ranking Transaction & Concurrency Strategy (`frontend/lib/ranking-settlement/postgres-transaction.ts`):**
  - Transaction-scoped context acquiring row-level locks on target market (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`).
  - Guarantees serialized mutations, atomic ranking updates, `PositionHistory` persistence, and settlement completion commit together.
- **Durable Settlement Recovery Service & REST APIs (`frontend/lib/ranking-settlement/recovery-service.ts`, `frontend/app/api/admin/settlement-recovery/route.ts`):**
  - Discovers confirmed-but-unsettled payment orders across process restarts and application crashes.
  - Distinguishes transient errors (marked `RETRYABLE` with exponential backoff $2^{\text{attempts}} \times 30\text{s}$) from permanent business conflicts (marked `FAILED` terminal; no infinite retry loops).
  - Protected administrative endpoint `POST /api/admin/settlement-recovery` for scheduled/manual reconciliation cycles.
- **Production Readiness & Health Audit Endpoint (`frontend/lib/db/readiness.ts`, `frontend/app/api/admin/readiness/route.ts`):**
  - `checkProductionReadiness()` and `GET /api/admin/readiness`: pre-flight health audit verifying database connectivity, migration status, PayU production keys, and persistence mode before allowing live payment initiation.
- **Next.js Production Build Hardening (`frontend/next.config.ts`):**
  - Added `serverExternalPackages: ['pg']` and client bundle webpack fallbacks for Node.js built-ins (`net`, `tls`, `fs`, `dns`, `pg`).
- **Comprehensive Unit & Integration Test Suite (`frontend/tests/postgres-persistence.test.ts`, `frontend/tests/settlement-recovery.test.ts`):**
  - 19 dedicated tests covering production guards, migration SQL integrity, outbox queueing, crash recovery simulation (Section 40), idempotency replays, and permanent conflict handling.
  - Total repository test suite: 356/356 tests PASS (`npm test`).

## 0.13.0 — Atomic Ranking Settlement Engine After Verified Payment

### Added
- **Confirmed-Payment Settlement Boundary (`frontend/lib/ranking-settlement/`):**
  - Confirmed-payment gate: strictly restricts entry to `PaymentOrder.status === 'CONFIRMED'`. Statuses `SUCCEEDED`, `PENDING`, `CREATED`, `FAILED`, `CANCELLED`, `EXPIRED` are strictly rejected.
  - Pure calculation engine (`calculateSettlementPlan`): handles target business insertion, upward movement, incumbent downward shifting, and same-position no-op without database side-effects.
  - Strict greater-than displacement invariant: requires `new qualifying amount > current occupant amount` (+100 paise minimum). Rejects equal or lower qualifying amounts.
  - Stale pricing & concurrent market shift protection: re-evaluates current live market participations inside the transaction lock. If the target is no longer achievable, the settlement transitions to `FAILED` with `failureReason = 'RANKING_TARGET_NO_LONGER_ACHIEVABLE'` while payment remains `CONFIRMED` with zero ranking mutation.
  - Capacity bounds: rejects positions exceeding market capacity (1–100) with `TargetBeyondCapacityError`.
- **Transaction & Concurrency Management (`frontend/lib/ranking-settlement/transaction.ts`):**
  - Market-level row locking boundary (simulating PostgreSQL `SELECT id FROM markets WHERE id = $1 FOR UPDATE`) serializing concurrent settlements targeting the same market.
  - All-or-nothing atomicity with deep snapshot isolation: failure at any step (e.g. `PositionHistory` or settlement record failure) triggers rollback to exact pre-transaction state.
  - Zero partial ranking updates: verified through fault injection hooks.
- **Append-Only Position History Ledger (`frontend/lib/ranking-settlement/position-history.ts`):**
  - Append-only `PositionHistory` recording every upward and downward movement with cause `'PAID_VISIBILITY_SETTLEMENT'`.
  - Correlated with `rankingSettlementId` and `paymentOrderId`.
  - Zero history entries generated on same-position no-ops.
- **Settlement Idempotency & Database Invariant:**
  - Guaranteed `UNIQUE(payment_order_id)` constraint: calling settlement repeatedly returns the identical settlement outcome without duplicate mutations or history records.
- **Data Access & REST API (`frontend/app/api/payments/[id]/settle-ranking/route.ts`):**
  - `POST /api/payments/:id/settle-ranking`: Orchestrates server-side ranking settlement with authentication and RBAC (`rankingSettlement.create`). Zero client authority on amounts or target positions.
  - `GET /api/payments/:id/settle-ranking`: Inspects settlement record status (`rankingSettlement.view`).
- **Audit System Extension (`frontend/types/audit.ts`):**
  - Added settlement audit event types: `RANKING_SETTLEMENT_CREATED`, `RANKING_SETTLEMENT_STARTED`, `RANKING_SETTLEMENT_SUCCEEDED`, `RANKING_SETTLEMENT_FAILED`, `RANKING_SETTLEMENT_RETRYABLE`, `RANKING_POSITION_CHANGED`, `RANKING_SETTLEMENT_DUPLICATE`.
- **UI Integration (`frontend/features/business-workspace/MarketPositionPricingCalculator.tsx`):**
  - Interactive settlement button in business workspace after payment confirmation.
  - Real-time settled banner with final position and qualifying amount.
  - Safe error alerts for target displacement without false refund claims.
  - Statutory paid visibility disclosure preserved.
- **Comprehensive Test Suite (`frontend/tests/ranking-settlement.test.ts`):**
  - 20 unit, integration, concurrency, and rollback tests verifying all invariants.

## 0.12.0 — PayU Payment Gateway Integration & Payment State Boundary

### Added
- **Payment Domain Foundation (`frontend/types/payment.ts`, `frontend/lib/payments/`):**
  - `PaymentOrder` and `PaymentProviderEvent` entities with immutable properties and financial precision.
  - Strict Whole Rupee money invariants (`amountMinor % 100 === 0`) and INR currency enforcement (`currency === 'INR'`).
  - Formal Payment State Machine (`CREATED`, `PENDING`, `SUCCEEDED`, `CONFIRMED`, `FAILED`, `CANCELLED`, `EXPIRED`, `UNKNOWN`) with terminal protection and duplicate event detection.
  - Comprehensive typed domain errors with HTTP mapping (`PaymentAmountMismatchError`, `PaymentBidIntentExpiredError`, `PaymentIdempotencyKeyReusedError`, `PaymentWebhookInvalidError`, etc.).
- **PayU India Payment Gateway Integration (`frontend/lib/payments/payu/`):**
  - Provider abstraction: `PaymentGatewayDataSource` with concrete `PayUPaymentGateway`.
  - Official PayU Hosted Checkout integration (`_payment`) with SHA-512 request hashing (`key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT`).
  - Webhook reverse-hash verification with constant-time byte comparison (`crypto.timingSafeEqual`) on SHA-512 hashes.
  - Server-side PayU Verify Payment API client with configurable timeouts and secure authorization headers.
  - Environment boundary supporting test (`test.payu.in`) and production (`secure.payu.in`, `info.payu.in`).
- **Payment Order Store & Idempotency Boundary (`frontend/lib/payments/store.ts`):**
  - Scoped idempotency keyed on `actorUserId:::businessId:::bidIntentId:::idempotencyKey`.
  - Server-side authoritative amount derivation from `BidIntent.qualifyingAmountMinor` (zero client trust).
  - Webhook processing with SHA-256 event fingerprinting (`payloadHash`) and duplicate protection.
  - Append-only security and operational audit logging (`PAYMENT_ORDER_CREATED`, `PAYMENT_WEBHOOK_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_FAILED`, `PAYMENT_CANCELLED`, `PAYMENT_STATE_CONFLICT`).
  - **CRITICAL ZERO-MUTATION BOUNDARY:** Webhook processing executes zero ranking mutations, creates zero `PositionHistory` records, and modifies zero market positions.
- **Data-Access Layer & REST APIs (`frontend/data-access/payments/`, `frontend/app/api/`):**
  - Reusable `PaymentService` with `LocalPaymentDataSource` and `ApiPaymentDataSource`.
  - `POST /api/bid-intents/:id/payment-order` with `Idempotency-Key` header and RBAC verification.
  - `GET /api/bid-intents/:id/payment` for authorized payment status polling.
  - `POST /api/payments/:id/cancel` for internal order cancellation.
  - `POST /api/payments/webhooks/payu` for server-to-server PayU event ingestion.
  - `/api/payments/callback/payu` for browser redirect handling with server-side validation.
- **Business Workspace UI Integration (`frontend/features/business-workspace/`):**
  - Interactive payment flow in `MarketPositionPricingCalculator.tsx` with dynamic state badges (`Payment Ready`, `Payment In Flight`, `Payment Succeeded`, `Payment Failed`).
  - Automatic PayU hosted checkout form generation and submission.
  - Verified payment banner with explicit non-mutation transparency disclaimer: *"Your payment has been verified. Your market position has not been changed by this payment flow yet."*
- **Verification & Test Suite (`frontend/tests/payment.test.ts`):**
  - 23 comprehensive tests covering authentication, RBAC, BidIntent validation, whole-rupee invariants, idempotency replay, hash verification, webhook processing, duplicate webhooks, state machine, and zero ranking mutation regression.
  - Full suite passes: 317 tests across 85 test suites.

## 0.11.0 — Authenticated Bid Intent Creation & Idempotency Boundary

### Added
- **Bid Intent Domain (`frontend/types/bid-intent.ts`, `frontend/lib/bid-intent/`):**
  - `BidIntent` entity capturing immutable intent to bid.
  - Scoped idempotency boundary (`actorUserId:::businessId:::idempotencyKey`).
  - Authoritative server-side pricing re-evaluation at creation time.
  - Stale quote detection (`409 PRICING_CHANGED`).
  - 15-minute expiration lifecycle (`BID_INTENT_TTL_MINUTES = 15`).
  - REST endpoints: `POST /api/bid-intents`, `GET /api/bid-intents/:id`, `POST /api/bid-intents/:id/cancel`.

## 0.10.0 — Market Position Pricing Calculator & Qualifying Amount Floor Engine (Read-Only)

### Added
- **Core Market Position Pricing Domain (`frontend/lib/pricing/`):**
  - `types.ts`: Pure domain contracts (`MarketPricingRequest`, `MarketPricingResult`, `MoneyMinor`, `MoneyRupees`, `CalculationMode`, `PricingStatus`, `RankingStateProvider`).
  - `money.ts`: Invariant enforcement for whole Indian Rupees (`amountMinor % 100 === 0`) and positive integers (`Rupees > 0 && Number.isSafeInteger(Rupees)`). Strict rejection of decimals, fractional rupees, and fractional paise without rounding.
  - `rules.ts`: Target position validation against market capacity ($1 \le \text{position} \le \text{capacity}$), strict superseding rule derivation ($+\text{₹}1$ / 100 paise), and base floor derivation (default ₹1,000 / 100,000 paise).
  - `calculator.ts`: Deterministic, read-only `PricingCalculator` supporting calculation modes `STRICT_SUPERSEDING`, `INITIAL_FLOOR`, `ALREADY_HOLDING_POSITION`, and `LOWER_POSITION`.
  - `canonical-provider.ts`: `CanonicalRankingStateProvider` connecting calculator to authoritative in-memory rankings and market stores.
- **Reusable Frontend Data-Access Pricing Service (`frontend/data-access/pricing/`):**
  - Abstract `PricingDataSource` and singleton `PricingService`.
  - `LocalPricingDataSource` for synchronous server-side and unit-test execution.
  - `ApiPricingDataSource` consuming REST API with strict response schema validation.
- **Read-Only REST API Route:**
  - `GET /api/markets/:marketId/pricing` with validation for `targetPosition` (integers only), 404 for unknown markets, 422 for unpublished markets or capacity overflow.
- **Business Workspace Markets Integration:**
  - Enhanced `/business/dashboard/markets` with interactive position selector, live qualifying amount calculation, calculation mode and reason explanations, timestamp display, request correlation to prevent stale async states, and non-lock disclaimers.
  - Zero payment language and zero payment CTAs.
- **Automated Verification Harness:**
  - Added 28 new tests in `frontend/tests/pricing-engine.test.ts` bringing total test suite to 271 passing tests across 67 suites.
  - Verified zero-mutation invariant: 50 successive calculations execute with zero database or in-memory state mutations.

## 0.9.0 — Authentication + Business Claim + Membership/RBAC + Business Workspace

### Added
- **Provider-Independent Authentication Layer (`frontend/types/auth.ts`, `frontend/data-access/auth/`):**
  - Abstract `AuthDataSource` interface supporting session retrieval, current user, login, and logout without vendor lock-in.
  - Implemented `LocalAuthDataSource` and `ApiAuthDataSource` with `AuthService`.
  - Canonical user lifecycle (`ACTIVE`, `SUSPENDED`, `DELETED`) with session invalidation and expiration guards.
  - `/auth/login` page supporting safe relative `returnUrl` redirects and persona selection in development.
  - REST endpoints: `GET /api/auth/me`, `GET /api/auth/session`, `POST /api/auth/logout`.
- **First-Class Business Claim Domain (`frontend/types/business-claim.ts`, `frontend/data-access/claims/`):**
  - `BusinessClaim` entity with strict lifecycle state machine (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`).
  - Validation guards: Authenticated claimant required, references valid canonical Business, duplicate active claims for `(businessId, claimantUserId)` prevented.
  - Verification evidence support: `GSTIN`, `BUSINESS_EMAIL`, `OFFICIAL_DOCUMENT`, `PHONE_VERIFICATION`.
  - Atomic claim approval provisioning `OWNER` `BusinessMembership`.
  - Rejection with auditable `rejectionReason`.
  - REST endpoints: `GET /api/business-claims`, `POST /api/business-claims`, `POST /api/business-claims/:id/review`.
  - Dedicated `/business/claim` submission and review portal.
  - Connected public `BusinessClaimCta` on `/businesses/[business]` with slug preservation.
- **Business Membership & Centralized RBAC (`frontend/types/membership.ts`, `frontend/data-access/memberships/`):**
  - Conceptual separation: $\text{User} \neq \text{Business} \neq \text{BusinessMembership} \neq \text{BusinessClaim} \neq \text{MarketParticipation}$.
  - Composite uniqueness on `(businessId, userId)`. Role mutable without duplicating records.
  - Centralized authorization engine (`can()`, `assertAuthorized()`) in `frontend/lib/auth/rbac.ts`.
  - Enforced roles: `OWNER` (full business control, ownership transfer, financial transact), `ADMIN` (operations, profile, members), `EDITOR` (profile content only), `FINANCE` (reserved for future financial visibility).
  - Clear distinction between 401 (unauthenticated) and 403 (unauthorized).
  - REST endpoint: `GET /api/businesses/:businessId/members`, `POST /api/businesses/:businessId/members`.
- **Business Workspace Architecture (`/business/dashboard`):**
  - Authenticated business workspace layout with `noindex, nofollow` metadata.
  - Multi-business context abstraction (`resolveWorkspaceContext()`) with server-side validation and business switcher.
  - `/business/dashboard`: Truthful metrics (active markets, eligible markets, verification status, membership role, empty visibility state).
  - `/business/dashboard/profile`: RBAC-controlled profile editing with audit logging.
  - `/business/dashboard/markets`: Active markets with truthful paid position status and explicit Paid Visibility Disclosures.
  - REST endpoints: `GET /api/businesses/:businessId/workspace`, `GET /api/businesses/:businessId/markets`, `PATCH /api/businesses/:businessId/profile`.
- **Append-Only Audit Logging (`frontend/lib/audit/`):**
  - Audit trail tracking `USER_AUTHENTICATED`, `BUSINESS_CLAIM_SUBMITTED`, `BUSINESS_CLAIM_APPROVED`, `BUSINESS_CLAIM_REJECTED`, `MEMBERSHIP_CREATED`, `MEMBERSHIP_ROLE_CHANGED`, `BUSINESS_PROFILE_UPDATED`.
- **Test Suite (`frontend/tests/auth-rbac-workspace.test.ts`):**
  - 30 comprehensive unit & security tests proving cross-business isolation, RBAC matrices, claim deduplication, and multi-business context resolution. (Total test suite: 243/243 passing).

## 0.8.0 — Business Entity + Reusable Business Profile + Market Participation Architecture

### Added
- **Canonical Business Domain & Registries (`frontend/lib/taxonomy/businesses.ts`):**
  - Canonical `BusinessEntity` domain models with independent identity, canonical slugs, and distinct `publicationStatus` and `verificationStatus`.
  - Multi-category (`BusinessCategoryRelation`) and multi-location (`BusinessLocationRelation`) associations.
  - Dedicated `MarketParticipation` entity enforcing composite uniqueness on `(businessId, marketId)`.
  - Distinct separation: $\text{Business} \neq \text{Market} \neq \text{MarketParticipation} \neq \text{Ranking Position} \neq \text{Payment}$.
- **Typed Frontend Data-Access Layer (`frontend/data-access/businesses/`):**
  - Public contracts `BusinessSummary`, `BusinessProfile`, `BusinessMarketParticipation`, `BusinessSearchParams`, `BusinessSearchResult`.
  - Implemented `LocalBusinessDataSource` and `ApiBusinessDataSource` behind abstract `BusinessDataSource` interface.
  - Exported singleton `businessService` in data-access barrel.
- **REST API (`GET /api/businesses`):**
  - Public REST endpoint supporting `?slug=...`, `?search=...`, `?category=...`, `?location=...`, `?verification=...`, and paginated list queries.
- **Public Business Directory (`/businesses`):**
  - Server-rendered directory page consuming `businessService.getPublishedBusinesses()`.
  - Reusable `BusinessCard` displaying initials avatar, verification badge, primary category, city, active market participation badge, and link to `/businesses/${slug}`.
  - Interactive `BusinessSearch` client component with suggestions and unlisted business discovery fallback (`requestType: 'BUSINESS'`).
  - Responsive `BusinessGrid` with empty state handling.
  - Streaming skeleton loading (`loading.tsx`) and error boundary (`error.tsx`).
- **Reusable Dynamic Business Profile (`/businesses/[business]`):**
  - Single generic route `app/businesses/[business]/page.tsx` handling all published businesses.
  - Canonical business resolution via `businessService.getPublishedBusinessBySlug()`.
  - Verified business hero, factual overview, multi-market participation section, category/location links, verified details card, and business claim CTA.
  - Explicit paid visibility transparency disclosure stating rankings represent competitive visibility, not objective awards.
  - Controlled 404 behavior (`notFound()`) for unlisted businesses.
- **Dynamic Sitemap Integration:**
  - `frontend/app/sitemap.ts` dynamically includes `/businesses` and published `/businesses/${slug}` URLs.
- **Test Suite (`frontend/tests/businesses-domain.test.ts`):**
  - 16 comprehensive unit tests validating entity identity, directory filtering, composite uniqueness, ranking separation, and all 4 mandatory dynamic proofs.

## 0.7.0 — API-Ready Categories Directory & Reusable Category Page Architecture

### Added
- **Public Categories Directory (`/categories`):**
  - Server-rendered discovery page consuming `categoryService.getPublishedCategories()`.
  - Reusable `CategoryCard` displaying category title, active market count badge, description, and link to `/categories/${slug}`.
  - Interactive `CategorySearch` client component supporting instant suggestions, canonical category normalization, and integrated discovery request fallback.
  - Responsive `CategoriesGrid` with empty state handling.
  - Streaming skeleton loading (`loading.tsx`) and error boundary (`error.tsx`).
- **Reusable Category Discovery Page (`/categories/[category]`):**
  - Dynamic single-route architecture handling all published categories (`/categories/interior-designers`, `/categories/restaurants`, etc.). No per-category page files exist.
  - Canonical category resolution via `categoryService.getPublishedCategoryBySlug()`.
  - Real-time market aggregation via `marketService.getPublishedMarketsByCategory()`.
  - Dynamic municipal location derivation: locations on a Category Page are derived strictly from published markets in that category.
  - Reusable `MarketCard` integration showing qualifying amounts, business counts, and canonical URLs.
  - Verified category snapshot metrics (Active Markets, Municipal Locations, Ranked Businesses, Peak Floor), local governance FAQ, related categories cross-linking, and business CTA.
  - Controlled 404 behavior (`notFound()`) for unlisted or zero-market categories.
- **REST API (`GET /api/categories`):**
  - Public REST endpoint supporting `?search=...` and `?slug=...`.
  - Implemented `ApiCategoryDataSource` alongside `LocalCategoryDataSource` in the typed frontend data-access layer.
- **Dynamic Sitemap Integration:**
  - `frontend/app/sitemap.ts` dynamically fetches published categories from `categoryService` and emits indexable `/categories/${slug}` URLs along with `/categories`.
- **Test Suite (`frontend/tests/categories-directory.test.ts`):**
  - 14 automated unit tests covering category contracts, slug resolution, dynamic market additions, emerging category publication, and regression safety.

## 0.6.0 — API-Ready Locations Directory & Reusable City Page Architecture

### Added
- **Public Locations Directory (`/locations`):**
  - Server-rendered discovery page consuming `locationService.getPublishedLocations()`.
  - Reusable `LocationCard` displaying city name, state, and active market counts.
  - Interactive `LocationSearch` client component supporting instant suggestions, city/region lookup, and integrated discovery request fallback.
  - Dynamic `StateRegionRail` grouping published locations by state/region.
  - Streaming skeleton loading (`loading.tsx`) and error boundary (`error.tsx`).
- **Reusable City / Location Page (`/[location]`):**
  - Dynamic single-route architecture handling all published cities (`/jaipur`, `/delhi`, `/mumbai`, `/hisar`).
  - Canonical location resolution via `locationService.getPublishedLocationBySlug()`.
  - Real-time market aggregation via `marketService.getPublishedMarketsByLocation()`.
  - Strict local category derivation: categories on a City Page are derived strictly from published markets in that city.
  - Verified city snapshot metrics, local governance FAQ, related locations section, and business CTA.
  - Controlled 404 behavior (`notFound()`) for unlisted or zero-market cities.
- **REST API (`GET /api/locations`):**
  - Public REST endpoint supporting `?search=...`, `?state=...`, and `?slug=...`.
  - Implemented `ApiLocationDataSource` alongside `LocalLocationDataSource`.
- **Dynamic Sitemap Integration:**
  - `frontend/app/sitemap.ts` dynamically fetches published locations from `locationService` and emits indexable `/${slug}` URLs.
- **Test Suite (`frontend/tests/locations-directory.test.ts`):**
  - 16 new automated unit tests covering location contracts, slug resolution, dynamic market additions, emerging city publication, and regression safety.

## 0.5.0 — Dynamic Taxonomy, Location Discovery & Market Creation System

### Added

**Taxonomy Domain Types (`frontend/types/taxonomy.ts`)**
- `Country`, `StateRegion`, `City`, `CategoryHierarchy`, `MarketEntity` domain models.
- `MarketLifecycleStatus` (DISCOVERED → DRAFT → REVIEW → PUBLISHED → ARCHIVED).
- `MarketPublicationStatus`, `MarketIndexabilityStatus`, `MarketContentStatus` — three independent axes of market state.
- `DiscoveryRequest` with `requestType`, `rawInput`, `normalizedValue`, `requestCount`, `DiscoveryStatus`.
- `AuditLogEntry` with `actor`, `action`, `entityType`, `entityId`, `previousState`, `newState`, `timestamp`.
- `MarketResolutionResult` returned from `resolveMarket()`.

**Canonical Registries**
- `frontend/lib/taxonomy/locations.ts` — seeded with India, 4 states (RJ, DL, MH, HR), 4 cities (Jaipur, Delhi, Mumbai, Hisar) with aliases and PIN codes.
- `frontend/lib/taxonomy/categories.ts` — seeded with Interior Designers, Restaurants, Dentists with extended aliases.
- `frontend/lib/taxonomy/markets.ts` — seeded with 6 production markets (PUBLISHED + INDEXABLE + APPROVED), composite uniqueness on `(cityId, categoryId)`.

**Normalization Engine (`frontend/lib/taxonomy/normalization.ts`)**
- `generateSlug()` — URL-safe, NFD-normalized, diacritic-stripped slugs.
- `canonicalizeText()` — punctuation removal and whitespace collapse.
- `findMatchingCity()` — alias/PIN code/name/slug matching (e.g. "Hissar" → "hisar").
- `findMatchingCategory()` — alias matching (e.g. "interior designer" → "interior-designers").

**Discovery Request System (`frontend/lib/taxonomy/discovery.ts`)**
- `recordDiscoveryRequest()` — deduplication by normalized value, `requestCount` increment, rate limiting (30 req/min per clientId).
- `resetDiscoveryStoreForTesting()` for isolated test isolation.

**Market Resolution Engine (`frontend/lib/taxonomy/resolver.ts`)**
- `resolveMarket(locationSlug, categorySlug, options)` — normalizes inputs, resolves canonical entities, evaluates lifecycle status.
- Auto-discovery: creates DRAFT + NOINDEX market and `DiscoveryRequest` on first encounter of valid city + category pair.
- Both-unknown path: records CITY, CATEGORY, and MARKET discovery requests simultaneously with shared demand count.

**Administrative Governance (`frontend/lib/taxonomy/admin-service.ts`)**
- `assertAdminAuthorized(actor)` — server-side role guard (SUPERADMIN | TAXONOMY_ADMIN).
- `adminCreateCategory()`, `adminMapCategoryDiscovery()` — with alias propagation.
- `adminCreateState()`, `adminCreateCity()`, `adminCorrectCityDiscovery()`.
- `adminCreateMarket()`, `adminPublishMarket()`, `adminSetMarketIndexability()`, `adminArchiveMarket()`.
- `adminRejectDiscovery()` — moves discovery requests to REJECTED with reason.
- `getAdminDiscoveryQueues()` — aggregates all pending and active queues.

**Audit Log (`frontend/lib/taxonomy/audit.ts`)**
- `recordAuditLog()` — append-only, immutable event recording.
- `getAuditLogs(filter)` — queryable by entity type, ID, and actor.

**API Routes**
- `POST/GET /api/discovery` — public discovery trigger with server-side rate limiting, input validation, and deduplication.
- `GET/POST /api/admin/taxonomy` — RBAC-protected admin governance endpoint for all taxonomy mutations.

**Admin UI (`frontend/app/admin/discovery/`)**
- `AdminDiscoveryPage` server component — pre-fetches queues and audit logs.
- `DiscoveryDashboardClient` — interactive queue management, market publication controls, audit trail viewer.

**Route Integration**
- `frontend/app/[location]/[category]/page.tsx` — updated to consult `resolveMarket()` before rendering; enforces `isPublished` + `isIndexable` lifecycle invariants on every request.
- `frontend/data/markets/index.ts` — `getMarketPageData()` falls through to `resolveMarket()` for dynamically published markets.

**Tests (`frontend/tests/taxonomy-discovery.test.ts`)**
- 22 new test scenarios covering: canonical taxonomy integrity, normalization/alias resolution, market uniqueness invariants, discovery deduplication, rate limiting, admin RBAC enforcement, lifecycle transitions, Scenarios A–D, and SEO indexability safeguards.

### Changed
- Total test count: 106 → 128 (all passing, 0 failures).
- TypeScript: 0 errors.
- Production build: `✓ Compiled successfully` — 15 static pages generated.

### Architecture
- `docs/Architecture.md` §10 — Taxonomy & Market Discovery Engine added with full flow diagram and lifecycle state table.

## 0.5.0 — API-Ready Public Markets Directory & Reusable Data-Access Layer

### Added
- **Reusable Public Data-Access Layer (`frontend/data-access/`):**
  - Typed domain contracts (`MarketSummary`, `LocationSummary`, `CategorySummary`, `MarketSearchParams`, `MarketSearchResult`, `PaginatedResponse`, `PaginationMeta`).
  - `MarketService` & `MarketDataSource` abstraction with pluggable `LocalMarketDataSource` and `ApiMarketDataSource` adapters.
  - `LocationService` & `CategoryService` dynamically aggregating published locations and categories from active markets.
  - `DiscoveryService` wrapping customer demand tracking and rate-limited discovery submission.
  - Runtime validation boundary (`validateMarketSummary`, `validatePaginatedMarketResponse`) enforcing schema integrity and publication invariants before UI entry.
- **REST Endpoints:**
  - `GET /api/markets` — paginated public directory listing with location/category filtering and deterministic sorting.
  - `GET /api/markets/search` — canonical search resolution across cities, categories, and published markets.
- **Public Directory Page (`/markets`):**
  - Server-rendered page assembly consuming typed `marketService`, `locationService`, `categoryService`.
  - Comprehensive UI states: Streaming skeleton (`loading.tsx`), interactive error boundary (`error.tsx`), empty state, and success state.
  - Integrated `MarketSearch` with debounced input, combobox accessibility, and discovery request submission.
  - Responsive `MarketFilters` and `MarketsGrid` with `MarketCard` displaying real business counts and INR qualification floors.
  - Sections for "Explore by Location", "Explore by Category", "Location + Category = Market" educational model, and Business CTA.
  - Canonical SEO metadata and `CollectionPage` JSON-LD structured data.
- **Testing:**
  - `frontend/tests/data-access.test.ts` (22 tests) verifying typed service contracts, publication isolation, pagination, sorting, filters, search resolution, validation errors, and network outage resilience.
  - `frontend/tests/markets-directory.test.ts` (17 tests) verifying directory query logic and gap classification.

### Changed
- Total test count: 128 → 167 (all 33 suites passing, 0 failures).
- TypeScript: 0 type errors (`tsc --noEmit`).
- Production build: Successfully generated 18 static/dynamic routes via Next.js 15.

## 0.11.0 — Authenticated Bid Intent Creation & Idempotency Boundary

### Added
- **Bid Intent Domain Model (`frontend/types/bid-intent.ts`):**
  - First-class `BidIntent` entity with immutable fields (`businessId`, `marketId`, `createdByUserId`, `membershipId`, `targetPosition`, `qualifyingAmountMinor`, `qualifyingAmountRupees`, `currency`, `pricingSnapshot`, `idempotencyKey`).
  - `BidIntentStatus` state machine: `PENDING_PAYMENT`, `EXPIRED`, `CANCELLED`.
  - Immutable `PricingSnapshot` capturing mode, required amount, and calculated reason.
  - Explicit configuration: `BID_INTENT_TTL_MINUTES = 15`.
- **Domain Store & Idempotency Boundary (`frontend/lib/bid-intent/store.ts`):**
  - Scoped idempotency resolution: `(actorUserId, businessId, idempotencyKey)`.
  - Exact retry returns existing `BidIntent` with 0 duplicate records and 0 duplicate audit events.
  - Reused idempotency key with conflicting payload parameters rejected with `409 IdempotencyKeyReusedError`.
  - Server-side authoritative pricing re-evaluation at creation time via `PricingCalculator`.
  - Client-submitted amounts never trusted; stale client quote reference detected and rejected with `409 PricingChangedError`.
  - Strict centralized RBAC: `assertAuthorized(membership, 'bidIntent.create')` permitting `OWNER` and `ADMIN`, denying `EDITOR` and `FINANCE`.
  - Audit logging: Records `BID_INTENT_CREATED` and `BID_INTENT_CANCELLED` to append-only audit log.
- **Data-Access Layer (`frontend/data-access/bid-intents/`):**
  - `BidIntentDataSource` and `BidIntentService` contracts.
  - `LocalBidIntentDataSource` (in-memory dev/test store) and `ApiBidIntentDataSource` with typed error mappings (`PricingChangedError`, `IdempotencyKeyReusedError`).
  - Singleton `bidIntentService` export wired into `@aageonline/frontend/data-access`.
- **REST Endpoints:**
  - `POST /api/bid-intents` (requires `Idempotency-Key` header and auth token).
  - `GET /api/bid-intents/:id` (enforces membership authorization).
  - `POST /api/bid-intents/:id/cancel` (transitions `PENDING_PAYMENT` to `CANCELLED`).
  - `GET /api/businesses/:businessId/bid-intents` (paginated business intent listing).
- **Workspace UI Integration (`MarketPositionPricingCalculator.tsx`):**
  - "Create Visibility Intent →" CTA after calculating position pricing.
  - Client-side idempotency key generation per attempt.
  - Active intent confirmation card displaying `PENDING_PAYMENT`, expiration timestamp, reference ID, and cancellation action.
  - Prominent transparency disclosures: intent creation does NOT process payment, reserve position, or guarantee ranking.
  - Stale pricing alert banner with "Recalculate Now" button when server returns `PRICING_CHANGED`.
- **Comprehensive Testing (`frontend/tests/bid-intent.test.ts`):**
  - 23 exhaustive unit and integration tests across 8 test suites.
  - Proves 100% zero-ranking mutation, zero-financial mutation, cross-business isolation, scoped idempotency replay, stale pricing detection, TTL expiration, and RBAC enforcement.

### Changed
- Total test count: 271 → 294 (all 39 suites passing, 0 failures).
- TypeScript: 0 type errors (`tsc --noEmit`).
- Production build: Successfully compiled all 45 static and dynamic routes.




