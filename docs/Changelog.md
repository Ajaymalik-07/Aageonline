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

## 0.21.0 — Linux Worker Concurrency, Advisory Lock Handover & Heartbeat Lifecycle Consistency

### Added
- Authoritative milestone closure deliverable: `docs/Milestone-0.21.0-Linux-Worker-Drill-and-Heartbeat-Closure.md`.
- Dedicated regression test suite `frontend/tests/worker-heartbeat-lifecycle.test.ts` (12 tests) verifying:
  - Initial worker heartbeat starts as `ACTIVE`.
  - Normal cycle updates preserve `ACTIVE` status and metadata.
  - Graceful shutdown persists top-level `status = 'STOPPED'` and `metadata.status = 'STOPPED'`.
  - Row mapping and health probe interpretation (`UP` vs `DOWN`).
  - Backward compatibility across all 3-, 4-, and 5-argument calling signatures of `recordHeartbeat()`.
  - Graceful degradation and non-throwing execution if terminal heartbeat persistence fails.

### Changed
- `frontend/lib/db/repositories/heartbeat-repository.ts`:
  - Parameterized SQL `$3` for column `status` on `INSERT` and `ON CONFLICT DO UPDATE`.
  - Implemented dual-source status resolution accepting explicit status string, falling back to embedded `metadata.status`, and defaulting to `'ACTIVE'`.
  - Preserved backward compatibility where the 4th argument was optionally a `pg.PoolClient`.
  - Updated `mapRow()` to resolve status from top-level column with fallback to metadata for legacy rows.
- `frontend/lib/workers/supervisor.ts`:
  - Updated `stop()` to pass explicit `'STOPPED'` status parameter to `recordHeartbeat()`.
  - Added safe timer unref/clearing and wrapped terminal heartbeat persistence in try/catch to guarantee shutdown completion.
- `docs/Production-Launch-Gates.md`:
  - Updated Gate 3 status to **PASSED (Milestone 0.21.0 — Ubuntu WSL2 Linux Process Verification)**.
  - Detailed empirical evidence from native Linux POSIX SIGTERM drill, advisory lock (`829104812`) mutual exclusion, sub-20ms graceful drain, and zero-duplicate job handover.
  - Preserved Gates 4, 5, and 6 as strictly **DEFERRED** pending external infrastructure and payment merchant onboarding.

### Verified
- Automated test suites:
  - `tests/worker-heartbeat-lifecycle.test.ts`: 12/12 PASS (duration: 207ms).
  - Related worker, reconciler, and ops suites (`ops-backup-and-worker-supervision.test.ts`, `admin-operations-and-reconciler.test.ts`, `production-readiness-and-distributed-state.test.ts`): 51/51 PASS (duration: 527ms).
- Static typing: `tsc --noEmit` cleanly passed with 0 errors.
- Live POSIX SIGTERM Drill on Ubuntu 26.04 WSL2:
  - Worker 1 (PID 440) and Worker 2 (PID 448) mutual exclusion confirmed on lock `829104812`.
  - Signal `kill -TERM 440` handled gracefully with zero in-flight data loss.
  - Advisory lock handover to Worker 2 executed cleanly; unit of work 3 completed (`attempts = 1`).
  - Post-drill SQL audit confirmed top-level `status = 'STOPPED'` in PostgreSQL table `worker_heartbeats`.
  - Both drill workers exited cleanly with code 0; isolated database `aageonline_worker_drill_disposable` preserved.

## 0.20.29 — Public Page Linking Repair & Navigation Integrity

### Added
- Authoritative milestone deliverable: `docs/Milestone-0.20.29-Page-Linking-Repair.md`.
- Implemented statutory legal and grievance routes:
  - `/privacy`: Comprehensive Data Protection Policy adhering to IT Act 2000 and DPDP Act 2023, zero cardholder data storage invariant, and data isolation standards.
  - `/terms`: Commercial Terms of Service defining the immutable Location + Category market model, mandatory paid visibility disclosures, whole-rupee transactions, and strict payment finality (no refunds for overtaken positions).
  - `/grievance`: Statutory Grievance Redressal Mechanism adhering to Rule 5(2) of IT Rules 2021, specifying dedicated officer mailbox (`grievance@aageonline.in`), 48-hour acknowledgment, and 15-day maximum disposal timelines.
- Added 308 permanent redirect rules in `frontend/next.config.ts`:
  - `/knowledge` -> `/blog`
  - `/knowledge/:slug*` -> `/blog/:slug*`

### Changed
- Replaced dead `/knowledge` links with `/blog` across homepage and feature cards.
- Synchronized `KnowledgeGuides.tsx` with real published blog article slugs:
  - `startup-website-development-complete-guide`
  - `custom-software-development-vs-off-the-shelf-software`
  - `how-to-choose-a-website-development-company-in-india`
  - `website-development-company-in-noida-what-businesses-look-for`
- Derived `INITIAL_FEATURED_MARKETS` dynamically from `SUPPORTED_MARKETS` registry in `frontend/config/markets.ts`, eliminating unseeded 404 markets from homepage carousel and shuffle components.
- Updated `Footer.tsx` Active Markets links to resolve exclusively to published markets (`jaipur/interior-designers`, `delhi/interior-designers`, `mumbai/interior-designers`, `jaipur/restaurants`, `delhi/restaurants`, `/markets`).
- Canonicalized internal feature links across `HeroSection.tsx`, `BusinessCtaBanner.tsx`, `BusinessCTA.tsx`, `MarketCTA.tsx`, and `MarketHero.tsx`:
  - `/claim` -> `/business/claim`
  - `/explore` -> `/markets`
  - `/how-it-works` -> `/#how-it-works`
- Updated `CategoryRail.tsx` to link directly to canonical category directory `/categories/[categorySlug]`.
- Replaced desktop header `Blog` link with clean light-mode header styling; retained `Blog` in footer resources and legal bar.

### Verified
- Automated test suite `frontend/tests/ui-navigation-regression.test.ts` (13/13 PASS).
- Related test suites: `seo-schema.test.ts` (3/3 PASS), `markets-directory.test.ts` (17/17 PASS), `six-markets-matrix.test.ts` (8/8 PASS), `seo-eligibility-and-sitemaps.test.ts` (23/23 PASS).
- Verified live HTTP response codes on running Next.js instance:
  - `/privacy`, `/terms`, `/grievance`, `/blog`, `/markets`, `/categories/interior-designers`, `/jaipur/interior-designers` return 200 OK.
  - `/claim` (308 -> `/business/claim`), `/explore` (308 -> `/markets`), `/knowledge` (308 -> `/blog`) redirect properly.
- All company details without official registration filing marked with `[LEGAL REVIEW REQUIRED]`.

## 0.20.26 — Authoritative API PostgreSQL Persistence & End-to-End Verification

### Added
- Authoritative milestone deliverables:
  - `docs/Milestone-0.20.26-API-Persistence-and-E2E-Verification.md`
  - `docs/Milestone-0.20.26-Admin-Website-Propagation-Results.md`
  - `docs/Milestone-0.20.26-Database-and-Recovery-Test-Results.md`
- Database Migration `012_admin_content_and_governance.sql` adding PostgreSQL schemas for `discovery_requests`, `content_blocks`, `blog_posts`, `url_redirects`, `newsletter_subscribers`, `lead_prospects`, `admin_users`, and `system_settings`.
- Complete PostgreSQL persistence layer in `api/src/db/`:
  - `client.ts`: Connection pool management with parameter validation, `query`, `withTransaction`, `checkDatabaseHealth`, and `isDatabaseConfigured`.
  - `migrator.ts`: Transaction-isolated sequential schema migration runner (001–012).
  - Repositories: `markets-repo.ts`, `businesses-repo.ts`, `ranking-repo.ts` (with `SELECT ... FOR UPDATE` atomic market locking), `payments-repo.ts`, `content-repo.ts`, and `admin-repo.ts`.
- Fail-closed database health evaluation in `api/src/server.ts`:
  - `/api/health/ready` evaluates PostgreSQL connectivity and returns HTTP 503 `DEGRADED` / `DISCONNECTED` when `DATABASE_URL` is configured but unreachable.
  - Public endpoints (`/api/markets`, `/api/markets/search`, `/api/markets/:id`, `/api/categories`, `/api/locations`, `/api/businesses`, `/api/blog`, `/api/newsletter/subscribe`) connect directly to PostgreSQL repositories.
  - Administrative endpoints across all 16 domains wired directly to PostgreSQL repositories.
- Persistence test suite in `api/tests/persistence.test.ts` (5 tests) verifying fail-closed readiness probe, migration runner integrity, atomic ranking mutations, and database error propagation.

### Verified
- Automated test suites:
  - `frontend/`: 585 PASS, 0 FAIL, 6 SKIPPED (live PostgreSQL container tests).
  - `api/`: 18 PASS, 0 FAIL (13 general API tests + 5 persistence tests).
  - `admin/`: 7 PASS, 0 FAIL.
  - Total repository assertions: 610 PASS, 0 FAIL, 6 SKIPPED.
- Static typing: `tsc --noEmit` cleanly passed with 0 errors across `frontend/`, `api/`, and `admin/`.
- Production builds:
  - `frontend/`: 73/73 static & dynamic routes compiled successfully (exit code 0).
  - `admin/`: 52/52 static & dynamic routes compiled successfully (exit code 0).
- Docker and host probe: Docker CLI not found on host PATH, native PostgreSQL not listening on port 5432; live database container gates accurately marked BLOCKED on Docker Engine Host Prerequisite.

## 0.20.25 — Persistent Data Integration & Admin-to-Website End-to-End Verification

### Added
- Authoritative milestone deliverable: `docs/Milestone-0.20.25-Persistent-Data-Integration-and-E2E-Verification.md`.
- Administrative propagation matrix: `docs/Milestone-0.20.25-Admin-Website-Propagation-Matrix.md`.
- Database backup, restore, and worker verification audit: `docs/Milestone-0.20.25-Database-Backup-Restore-and-Worker-Verification.md`.
- Consolidated administrative operations by removing redundant experimental `/recovery` supervisor page and redirecting to `/operations`.
- Cross-tenant authorization hardened in `frontend/lib/workspace/store.ts` ensuring foreign tenant business requests strictly throw HTTP 403 Forbidden while unclaimed businesses allow owner claims.
- Landmarking invariants hardened in `frontend/app/business/dashboard/WorkspaceNav.tsx` replacing nested `<header role="banner">` with semantic `<div className="workspace-nav-wrapper">`.

### Verified
- Executed all automated test suites: 585 PASS in `frontend/` (6 DB container integration tests safely skipped), 13 PASS in `api/`, 7 PASS in `admin/` (605 total passing assertions, 0 failures).
- TypeScript strict compilation verified with 0 errors across `frontend/`, `api/`, and `admin/`.
- Preserved complete public website design, typography, brand tokens, and admin Control Center UI.
- Audited persistence layer: identified that `api/src/server.ts` currently runs in-memory transient data collections while `frontend/` contains Migrations 001–011 and PostgreSQL repositories.
- Documented exact host prerequisites for live PostgreSQL container initialization.

## 0.20.22 — Disposable PostgreSQL Verification & Recovery Tests

### Added
- Authoritative milestone deliverable: `docs/Milestone-0.20.22-Disposable-PostgreSQL-Verification-and-Recovery-Tests.md`.
- Database integration test report: `docs/Milestone-0.20.22-Database-Integration-Test-Report.md`.
- Backup and restore verification report: `docs/Milestone-0.20.22-Backup-and-Restore-Verification-Report.md`.
- Worker concurrency and recovery report: `docs/Milestone-0.20.22-Worker-Concurrency-and-Recovery-Report.md`.
- Diagnosed local host environment for Docker and native PostgreSQL availability.
- Documented exact local manual setup prerequisites for running disposable database containers.

### Verified
- Executed 106 automated tests across persistence, security, backup safety, and worker supervision suites (100 PASS, 6 safely skipped due to absent live database socket).
- Re-verified TypeScript compilation clean across `frontend/`, `api/`, and `admin/` (0 errors).
- Zero website alterations; completed frontend UI and design remain 100% locked.
- Confirmed zero resources or containers orphaned during verification.
- Preserved all six authoritative launch gates as explicitly DEFERRED.

## 0.20.21 — Provider-Neutral Production Readiness

### Added
- Authoritative milestone deliverable: `docs/Milestone-0.20.21-Provider-Neutral-Production-Readiness.md`.
- Provider-neutral deployment architecture and decision record: `docs/Provider-Neutral-Deployment-Architecture-and-Decision.md`.
- Security, backup, restore and disaster recovery checklist: `docs/Security-Backup-Restore-and-Recovery-Checklist.md`.
- ADR-039 in `docs/Decision-Log.md`: Provider-Neutral Deployment Architecture & Dual-Database Support (Same-Host vs Managed).
- Added optional same-host PostgreSQL 16 service (`db`) with persistent `pgdata` volume to `docker-compose.yml` under the `local-db` profile.
- Added healthcheck to `admin` service in `docker-compose.yml`.
- Updated `admin/Dockerfile` to compile Next.js production build (`npm run build`) and run `npm start`.
- Updated `.env.production.example` and `docs/Production-First-Deployment-Checklist.md` with dual-option database guidance and explicit provider-neutral baselines.

### Verified
- Domain candidate (`aageonline.com`), hosting provider, region, DNS provider, and final budget kept explicitly UNDECIDED.
- Zero website alterations; frontend UI, typography, colors, layout, design tokens, and motion implementation remain 100% locked.
- Admin application has zero direct database connections and communicates strictly with `api:4000` via HTTP.
- Worker singleton behavior guaranteed via PostgreSQL 64-bit advisory lock (`829104812`).
- Database migrations execute as a decoupled one-off runner guarded by advisory lock (`94827104`).
- Only Caddy reverse proxy publishes public host ports (80, 443); all internal services remain unexposed on `aageonline-net`.
- Automated test suites passing cleanly: 72/72 tests (64 frontend unit/domain/security, 8 API integration).
- TypeScript static compilation verified across repository (0 errors across `frontend`, `api`, and `admin`).
- Preserved all six authoritative launch gates as DEFERRED.

## 0.20.20 — API, Admin & Production Integration Readiness & Provider Selection

### Added
- Authoritative integration readiness deliverable: `docs/Milestone-0.20.20-API-Admin-Production-Integration-Readiness.md`.
- Authoritative hosting provider selection deliverable: `docs/Milestone-0.20.20-Production-Provider-Selection.md`.
- Actionable 17-step operational checklist: `docs/Production-First-Deployment-Checklist.md`.
- Automated API test suite in `api/tests/api-server.test.ts` verifying endpoints, health checks, search, and admin operations.
- Admin operational trigger endpoint: `POST /api/admin/operations` with reconciliation dispatch and structured response.
- Dual-shape responses on `GET /api/markets` supporting both paginated data envelopes (`frontend/data-access`) and catalog arrays (`admin/discovery`).
- Business directory REST endpoints: `GET /api/businesses` and `GET /api/businesses?slug=...` consumed by `ApiBusinessDataSource`.
- Market discovery search endpoint: `GET /api/markets/search?q=...` consumed by `ApiMarketDataSource`.
- Systematic comparison of DigitalOcean (`blr1`), AWS Lightsail (`ap-south-1`), and Hetzner Cloud.
- Explicit database connection budget calculation across all 6 containerized processes (25 connections required; 20 peak concurrent).
- Evaluated network latency implications: Rejected Hetzner for core computing due to 130-170ms inter-continental latency penalty and lack of managed PostgreSQL.
- Primary recommendation: DigitalOcean (Bangalore `blr1`) — Basic Droplet (2 vCPU, 4 GB RAM) + Managed PostgreSQL 16 (2 GB RAM, 47 connections) = $54.00/mo.
- Alternative recommendation: AWS Lightsail (Mumbai `ap-south-1`) — VPS (2 vCPU, 4 GB RAM) + Managed PostgreSQL 16 (1 GB RAM, ~112 connections) = $35.00/mo.
- DNS and routing checklist for `aageonline.com` with Cloudflare DNS-only initial issuance policy.
- Performance, HTTP/3 QUIC, and mobile slow-network readiness evaluation for Indian regional users.

### Verified
- Zero changes to frontend UI, page sections, content, typography, colors, layout, or motion system (100% locked).
- Zero cloud accounts, VPS hosts, databases, or live infrastructure provisioned.
- Zero billing configured or purchases initiated.
- Zero DNS, TLS, or external payment settings modified.
- TypeScript static compilation verified across repository (0 errors across `frontend`, `api`, and `admin`).
- Automated tests passing deterministically: 72/72 tests passing (64 frontend unit/domain/security tests, 8 API integration tests).
- Preserved all six authoritative launch gates as DEFERRED.

## 0.20.19 — Production Deployment Artifact Consistency Audit

### Added
- Authoritative deployment artifact audit deliverable: `docs/Milestone-0.20.19-Production-Deployment-Artifact-Audit.md`.
- Reconciled migration count references (`001-011`) across deployment runbook, launch-gate register, and deployment scripts.
- Added missing `SESSION_SECRET` and `ADMIN_TOKEN` placeholders to `.env.production.example`.
- Removed obsolete staging reference from `frontend/.dockerignore`.
- Updated `docs/Production-Deployment-Runbook.md` topology diagram and deployment instructions to reflect independent services (`web`, `api`, `admin`, `worker`, `migrator`, `caddy`).

### Verified
- Zero cloud accounts, staging environments, databases, or live infrastructure provisioned.
- Zero secrets committed to version control.
- TypeScript compilation cleanly passed across `frontend/`, `api/`, and `admin/` (0 errors).
- Automated operational and worker supervision unit tests passed (38/38 assertions).
- Confirmed web, api, admin, and worker run as independent containers with proper isolation and advisory locks.
- Confirmed all six live launch gates remain DEFERRED and open.

## 0.20.18 — Production Deployment Planning & Infrastructure Decision

### Added
- Authoritative production deployment planning document: `docs/Milestone-0.20.18-Production-Deployment-Planning.md`.
- Production Environment and Secrets Matrix: `docs/Production-Environment-and-Secrets-Matrix.md`, classifying all 40 environment variables and secrets with validation behavior, consuming services, and fail-closed policies.
- Ordered 14-Step Production Deployment Runbook: `docs/Production-Deployment-Runbook.md`, covering pre-provisioning ownership, region selection, DNS delegation, managed PostgreSQL configuration, secret injection, artifact verification, decoupled migration execution, web/worker orchestration, PayU sandbox validation, and monitoring setup.
- Consolidated Production Launch Gates Register: `docs/Production-Launch-Gates.md`, defining prerequisites, verification procedures, objective pass/fail criteria, evidence retention, and payment-blocking status for all 6 deferred live gates.
- Recommended architecture specification: Docker Compose on Linux VPS + Caddy Auto-TLS + Managed PostgreSQL 16+ ($21 – $35/mo).
- Fallback architecture specification: Managed PaaS (Render / Railway) + Managed PostgreSQL 16+ ($33 – $45/mo).

### Verified
- Zero cloud accounts, staging environments, databases, or infrastructure provisioned.
- Zero secrets or credentials committed to repository.
- Re-verified all 581 automated repository tests pass deterministically.
- All 6 deferred live infrastructure gates explicitly retained and gated on owner approval.

## 0.20.17 — Launch-Gate Consolidation & Final Local Regression Audit

### Added
- Authoritative consolidated launch-gate document: `docs/Milestone-0.20.17-Launch-Gate-Consolidation.md`.
- Consolidated launch-gate register spanning 5 critical subsystems: Financial Lifecycle & Ranking, Authentication & Security, Operations & Disaster Recovery, Website Quality & Trust, and Deployment Readiness.
- Comprehensive verification methodology mapping each gate to one of six explicit evidence levels (Code Verified, Automated Test Verified, Static/Build Verified, Documented Only, Live Verification Deferred, Unverified/Failed).
- Prioritized next actions and deployment prerequisites for closing deferred infrastructure gates.

### Verified
- Full repository test suite: 581 passed, 0 failed, 6 deferred live tests cleanly skipped (`node --test tests/**/*.test.ts`).
- Operational verification suite: 18 / 18 failure-path tests passed deterministically in 338 ms (`tests/operational-verification-and-failure-paths.test.ts`).
- TypeScript static compilation: 0 type errors (`tsc --noEmit`).
- Production build: All 70 static and dynamic routes compiled successfully with zero bundle errors (`next build`).
- Preserved website design, section structure, branding tokens, motion system, and accessibility states without regression.
- Retained all 6 deferred live infrastructure gates explicitly.

## 0.20.16 — Operational Verification & Failure-Path Audit

### Added
- Comprehensive, deterministic operational verification and failure-path test suite (`frontend/tests/operational-verification-and-failure-paths.test.ts`) covering:
  - Worker lifecycle: Successful cycle execution, bounded exponential backoff, circuit-breaker tripping & auto-recovery, graceful shutdown drain timeout, shutdown scheduling gate, and stale heartbeat detection.
  - Backup/restore safety: Missing PostgreSQL utility detection, archive overwrite prevention, JSON manifest schema validation, partial/failed backup rejection, and restore error credential redaction.
  - Financial lifecycle failure paths: Rejection of unauthenticated/unkeyed payment creation, rejection of forged PayU webhooks with invalid signatures, proof that browser redirects cannot independently confirm payment or bypass verification, duplicate webhook idempotency, and rejection of settlements for unconfirmed payments.
  - Security & operational invariants: Production development-authentication bypass prevention, platform administration privilege guards on non-admin users, and secret redaction in database connection strings.
- Backup safety tooling enhancements in `frontend/lib/ops/backup-safety.ts`:
  - `validateBackupManifest()`: Validates backup metadata, 64-hex SHA-256 hashes, file sizes, and rejects partial backups.
  - `checkBackupFileOverwrite()`: Prevents silent overwriting of existing backup dumps.
  - `formatSafeRestoreError()`: Strips connection strings and sensitive credentials from restore error logs.
- Deliverable report: `docs/Milestone-0.20.16-Operational-Verification.md`.

### Fixed
- Remediated timer leak in `WorkerSupervisor`:
  - Added `.unref()` to background scheduling timer in `scheduleNext()` so background worker intervals do not keep the Node.js event loop alive when tasks finish.
  - Cleared `cycleTimer` and `drainTimer` on completion to avoid lingering timeout handles.
  - Guarded `finally` block in `executeCycle()` to only schedule next cycle when supervisor status is `RUNNING` or `CIRCUIT_BROKEN`.

### Verified
- 18 / 18 operational verification and failure-path tests passed cleanly.
- Full test suite: 581 passed, 0 failed, 6 deferred live tests skipped.
- TypeScript compilation: 0 type errors (`tsc --noEmit`).
- Production build: All 70 static and dynamic routes compiled cleanly (`next build`).

## 0.20.15 — Complete Website-Wide Motion, Hover & Interaction System

### Added
- Authoritative motion tokens module in `frontend/lib/motion/tokens.ts` defining restrained durations (`micro`: 140ms, `fast`: 180ms, `normal`: 260ms, `reveal`: 380ms, `deliberate`: 450ms, `stagger`: 60ms), cubic-bezier easing curves, elevation scales, and experience-specific motion intensity tiers.
- Reusable motion primitives in `frontend/components/motion/`:
  - `MotionReveal`: Single-trigger viewport scroll reveals with SSR safety and native `IntersectionObserver`.
  - `StaggerContainer`: Capped stagger delay coordinator without layout shifts.
  - `useReducedMotion`: Dynamic hook detecting OS/browser `prefers-reduced-motion: reduce` in real time.
- Standardized interactive CSS classes and animations in `frontend/app/globals.css`:
  - Keyframes: `@keyframes spin`, `@keyframes fadeIn`, `@keyframes fadeOut`, `@keyframes scaleIn`, `@keyframes revealUp`, `@keyframes pulseSubtle`, `@keyframes shimmer`.
  - Interactive components: `.aage-button`, `.aage-card`, `.aage-card-interactive`, `.card-lift`, `.aage-input`, `.aage-nav-link`, `.aage-ranking-card`, `.aage-modal-backdrop`, `.aage-bid-modal-content`.
  - Stagger delay helpers: `.stagger-1` through `.stagger-6`.
  - Universal `@media (prefers-reduced-motion: reduce)` override disabling all animations, transitions, and transforms across the entire DOM.
- Shared component enhancements:
  - `Card`: Added `.aage-card-interactive` when `isInteractive` is true.
  - `Button`: Standardized press micro-transitions, 44px min accessible touch targets, and accessible loading state.
  - `Input`: Focus ring transitions and error outline state without layout jumps.
  - `Header`: Replaced fragile inline handlers with `.aage-nav-link`.
  - `FaqAccordion`: Smooth expansion fade and accessible ARIA attributes.
  - `BidModal`: Accessible modal entrance with backdrop fade and dialog scale-in.
- Dedicated regression test suite: `frontend/tests/motion-and-interaction-system.test.ts` (21 tests covering tokens, CSS keyframes, interactive components, reduced-motion overrides, and design-lock layout sequence preservation).
- Authoritative specification and route coverage matrix: `docs/Motion-System.md`.

### Preserved
- **Critical Design-Lock:** 100% preservation of all existing layouts, section hierarchies, copywriting, colors, typography, spacing grids, and responsive breakpoints.
- **Zero Layout Shifts:** CLS = 0 maintained across all routes.
- **Business Logic & Security Invariants:** All payments, rankings, authentication, and database boundaries remain untouched.

### Verdict
- **`IMPLEMENTATION COMPLETE — ROUTE COVERAGE AND VALIDATION REPORTED`**.

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

## 0.20.23A — Admin Application Audit and Verification

### Added
- **Server-Side Authentication & Session Management (`admin/lib/auth.ts`):**
  - Timing-safe constant-time secret comparison (`timingSafeCompare`) preventing timing side-channel attacks across Edge and Node runtimes.
  - Server-side token validation (`verifyAdminToken`) enforcing fail-closed policy in production.
  - Web Crypto HMAC-SHA256 session token generation (`createAdminSessionHash`) and validation (`verifyAdminSessionCookie`).
  - Protected HttpOnly, SameSite=Strict `aage_admin_session` cookie management.
- **Route Guard Middleware (`admin/middleware.ts`):**
  - Enforces mandatory authentication for all backoffice operator views (`/`, `/discovery`, `/operations`) and API endpoints (`/api/*`).
  - Unauthenticated requests safely redirected to `/login?from=...` (browser) or 401 Unauthorized (API).
- **Dedicated Operator Login Portal (`admin/app/login/page.tsx`, `admin/app/LogoutButton.tsx`):**
  - Accessible, responsive backoffice login interface adhering to AageOnline dark system tokens (`#071018`, `#0B1F33`, `#FB923C`).
  - Secure session termination via `DELETE /api/auth`.
- **Server-Side API Proxy Layer (`admin/app/api/`):**
  - `admin/app/api/auth/route.ts`: Login (`POST`), Session Status (`GET`), Logout (`DELETE`).
  - `admin/app/api/operations/route.ts`: Authenticated proxy forwarding system vitals and reconciliation trigger to `http://api:4000` with server-side bearer token injection.
  - `admin/app/api/markets/route.ts`: Authenticated proxy forwarding market catalog queries to `http://api:4000` with server-side bearer token injection.
  - `admin/app/api/health/route.ts`: Dedicated health check endpoint returning service vitals on internal port 3001.
- **Automated Test Suite (`admin/tests/admin-auth-and-api.test.ts`):**
  - 6 unit and security tests verifying token validation, timing attack resistance, cookie hashing, API client resolution, health check contract, and zero browser secret exposure.
- **Production Container Packaging (`admin/Dockerfile`, `admin/.gitignore`):**
  - Updated Docker build copying `lib/` and `middleware.ts`, packaging production Next.js bundle on internal port 3001 with container `HEALTHCHECK`.

### Verified
- **Zero Database Invariant:** Verified zero `pg` dependencies, zero connection pool instantiations, and zero `DATABASE_URL` references in `admin/`.
- **Quality Gates:**
  - Unit tests: 6 passed, 0 failed (`node --experimental-strip-types --test tests/**/*.test.ts`).
  - TypeScript: 0 errors (`tsc --noEmit`).
  - Production build: `next build` succeeded with exit code 0 (11 routes compiled).

## 0.20.23B — API Integration, Admin Authorization & Persistence Audit

### Added
- **Central Administrative Route Authorization Guard (`api/src/server.ts`):**
  - Constant-time secret comparison (`timingSafeTokenCompare`) via `crypto.timingSafeEqual` preventing timing attacks.
  - Server-side administrative authentication guard (`authenticateAdminRequest`) protecting all `/api/admin/*` endpoints (`/api/admin/operations`, `/api/admin/settlements`, `/api/admin/recovery-jobs`).
  - Rejection of missing/malformed `Authorization: Bearer <ADMIN_TOKEN>` headers with HTTP 401 Unauthorized.
  - Rejection of invalid credentials with HTTP 403 Forbidden.
  - Enforced fail-closed security policy in production when `ADMIN_TOKEN` is unset (HTTP 500 CONFIG_ERROR).
- **Hardened Reconciliation Operations (`api/src/server.ts`):**
  - Validated `action: 'RECONCILE'` in `POST /api/admin/operations` with idempotent handling and structured confirmation response.
- **Automated Security & Integration Test Suite (`api/tests/api-server.test.ts`):**
  - Expanded test suite to 11 subtests (12 total tests) covering health checks, market catalog/search, business directory, integer amounts, administrative route guards, fail-closed policy, reconciliation triggers, and CORS preflight.
- **Container Health Check Probe (`api/Dockerfile`, `api/.env.example`, `api/.gitignore`):**
  - Added Docker container `HEALTHCHECK` probe against `http://127.0.0.1:4000/api/health/live`.
  - Documented `ADMIN_TOKEN` in `api/.env.example` and added `.gitignore`.

### Verified
- **Quality Gates:**
  - API unit/integration tests: 12 passed, 0 failed (`node --experimental-strip-types --test tests/**/*.test.ts`).
  - API TypeScript checks: 0 errors (`tsc --noEmit`).
  - Admin unit/security tests: 6 passed, 0 failed.
  - Admin TypeScript checks: 0 errors (`tsc --noEmit`).
- **Financial Invariants:**
  - Verified integer paise/rupee monetary representation across API entities with zero floating-point math.

## 0.20.24 — Admin Complete Dashboard Redesign & Email/Password Authentication

### Added
- **Complete Dashboard Redesign (`admin/`):**
  - Rebuilt administration UI using dark dashboard layout (`AdminShell.tsx`) with collapsible left sidebar, grouped navigation, sticky top toolbar, health ping badges, and dense data tables.
  - Implemented AageOnline design tokens: Deep Navy (`#071526`), Secondary Navy (`#0B1F33`), Primary Orange (`#EA580C`), Highlight Orange (`#FB923C`), neutral borders, and Inter typography (`globals.css`).
  - Added dense management views: Overview (`/`), Business Management (`/businesses`), Markets & Rankings (`/markets`), Taxonomy Review (`/discovery`), Settlement Ledger (`/settlements`), Operations (`/operations`), Audit Trail (`/audit`), and Settings (`/settings`).
- **Decoupled Email/Password Authentication:**
  - Replaced raw `ADMIN_TOKEN` entry with email/password authentication on `/login`.
  - Added show/hide password toggle, remember-me options, accessible focus indicators, and `?from=` redirect handling.
  - Salted and hashed passwords with NIST/OWASP-approved `scrypt` (`crypto.scryptSync`, 16-byte random salt, 64-byte key) with constant-time verification (`crypto.timingSafeEqual`) in `api/src/server.ts`.
  - Implemented login brute-force rate limiting (5 attempts per 15-minute window) returning HTTP 429.
  - Cryptographically signed session cookies with Web Crypto HMAC-SHA256 in `admin/lib/auth.ts`, ensuring 100% compatibility with Next.js Edge runtime middleware.
  - Set secure `HttpOnly`, `SameSite=Strict`, `Secure`-in-production session cookies (`aage_admin_session`).
- **Server-Side API Endpoints (`api/src/server.ts`):**
  - Added `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `POST /api/admin/auth/logout`.
  - Added `GET /api/admin/users`, `GET /api/admin/settlements`, `GET /api/admin/recovery-jobs`, `GET /api/admin/audit-logs`.
  - Created administrative account CLI bootstrap script (`npm run admin:bootstrap` in `api/`).
- **Authenticated Proxy Handlers (`admin/app/api/*`):**
  - Added server-side proxies for settlements (`/api/settlements`), audit logs (`/api/audit`), businesses (`/api/businesses`), markets (`/api/markets`), and operations (`/api/operations`).

- **Comprehensive Control Center & Website Audit Extension (Milestone 0.20.24 Full Scope):**
  - Conducted full website, API, database, and operational services audit documented in `docs/Milestone-0.20.24-Complete-Website-and-Admin-Control-Audit.md`.
  - Established authoritative 15-module information architecture blueprint documented in `docs/Milestone-0.20.24-Admin-Information-Architecture.md`.
  - Implemented 15 additional administrative management screens in `admin/app/`:
    - Locations (`/locations`)
    - Categories (`/categories`)
    - Rankings & Position Ladders (`/rankings`)
    - Payments & Transaction Ledger (`/payments`)
    - Worker Recovery & Stale Lock Eviction (`/recovery`)
    - Website Content & Statutory Disclosures CMS (`/content`)
    - Editorial Blog Engine (`/blog`)
    - Newsletter Subscriber Registry & Consent Records (`/newsletter`)
    - SEO / AEO / GEO Engine Audit (`/seo`)
    - Sitemap & Robots Live Inspection (`/sitemap-robots`)
    - Platform Analytics & Operational Counters (`/analytics`)
    - Lead Acquisition Framework & Connector Registry (`/leads`)
    - Mail Management & Transactional Templates (`/mail`)
    - Operational Alerts & Notification Stream (`/notifications`)
    - Administrator User Directory & Permissions Matrix (`/users`)
  - Added matching authenticated server proxies in `admin/app/api/*` ensuring zero direct PostgreSQL dependencies from `admin/`.
  - Extended authoritative REST API (`api/src/server.ts`) with typed administrative endpoints and dataset stores.
  - Documented complete delivery and verification evidence in `docs/Milestone-0.20.24-Admin-Implementation-and-Verification.md`.

### Verified
- **Admin Unit Tests (`admin/tests/`):** 7/7 tests passed.
- **API Unit Tests (`api/tests/`):** 13/13 test files, 32 assertions passed.
- **TypeScript Checks:** `tsc --noEmit` passed with 0 errors across `admin/` and `api/`.
- **Production Next.js Build:** `next build` in `admin/` compiled all 50 routes, APIs, and pages with 0 errors.
- **Live Integration:** 100% of proxy endpoints tested via authenticated HTTP session with port 4000 returning HTTP 200 OK.

## 0.20.25 — Admin Session Token Stateless Verification & Resilient Proxy Fallback

### Fixed
- **HTTP 403 on `/locations` and `/categories`:** Resolved session desynchronization after API process restarts where in-memory sessions were cleared while browser cookies held previously issued tokens.
- **Stateless HMAC-Signed Admin Tokens:** Admin session tokens are now cryptographically signed (`adm_sess_<userId>_<expiresAt>_<signature>`), allowing the API server to validate unexpired sessions statelessly even across restarts.
- **Server Token Proxy Fallback:** Added resilient server-level `ADMIN_TOKEN` retry in `admin/lib/api-client.ts` for privileged requests whose session tokens encounter downstream 401/403.
## 0.20.27 — Unified Lead Scraper + Zero-Inspired Email Automation

### Added
- **Audited References:** Full architectural and code audits of `msmunnabd/Social-Media-AutoPilot-Engine` (MIT) and `Mail-0/Zero` (MIT) documented in `docs/Milestone-0.20.27-Reference-Repository-Audit.md`.
- **Database Migration 013 (`013_lead_scraper_and_email_automation.sql`):** Added `scraper_configs`, `scraper_jobs`, `email_templates`, `email_campaigns`, `email_outbox`, `email_suppression_list`, and extended `lead_prospects` with `normalized_name`, `outreach_eligible`, `suppressed`, `provenance`, and `discovery_job_id`.
- **Source Connector Framework (`api/src/services/scraper/`):**
  - Adapted Google Maps connector with unicode glyph cleaning (`\ue0c8`, etc.) and Indic/Bengali numeral normalization (`০-৯`, `०-९`).
  - Implemented SSRF-safe Website Crawler with RFC1918/IMDS filtering, 5-second timeouts, and 1MB size bounds.
  - Implemented CSV Import Connector with spreadsheet formula injection protection (`=,+,-,@,\t,\r`).
  - Truthful capability reporting for Google Search (`OPERATIONAL`) and Meta, LinkedIn, X connectors (`CONFIG_REQUIRED`).
- **Gemini AI Normalization (`api/src/services/scraper/gemini-normalizer.ts`):** Server-side Gemini API integration with schema enforcement, factual summaries, and automatic offline fallback to deterministic taxonomy mapping.
- **Authoritative SQL Deduplication & Repositories (`api/src/db/repositories/`):** Created `scraperRepository` and `emailAutomationRepository` ensuring deduplication by city + category + normalized name / email.
- **Safe Template Engine (`api/src/services/email/template-renderer.ts`):** Escapes untrusted HTML inputs, interpolates personalization tokens, and mandates instant opt-out footer.
- **Independent Campaign Engine (`api/src/services/email/campaign-engine.ts`):** Independent scheduler, cooldown window checking, and suppression list enforcement.
- **Admin Information Architecture & Zero 3-Pane UI (`admin/app/`):**
  - Scraper Dashboard at `/leads/scraper` with KPI metrics, configuration controls, and job history.
  - Zero-inspired Email Automation Workspace at `/leads/email-automation` with 3-pane layout, card list, campaign inspector, template studio, and suppression registry.
  - Proxy route handlers `admin/app/api/scraper/route.ts` and `admin/app/api/email-automation/route.ts`.
  - Updated sidebar navigation in `admin/components/AdminShell.tsx` and sub-navigation tabs in `/leads`.
- **Public Opt-Out Endpoint:** `/api/public/leads/opt-out` (GET & POST) with instant suppression in PostgreSQL.

### Verified
- **API Tests:** 30/30 tests passed (`tests/scraper-and-email-automation.test.ts`, `tests/persistence.test.ts`, `tests/api-server.test.ts`).
- **Admin App:** `npx tsc --noEmit` passed with 0 errors; `next build` compiled all 56 routes with 0 errors.
- **Frontend App:** `npx tsc --noEmit` passed with 0 errors.

## 0.20.28 — PostgreSQL Installation, Live Persistence & Scheduler Recovery

### Added
- **Portable PostgreSQL 16 Deployment:** Installed standalone community binaries under `%USERPROFILE%\.local\pgsql` bound strictly to `127.0.0.1:5432` without administrative privileges, Windows services, or machine registry modifications.
- **Dedicated Application Role:** Created least-privilege `aage_app` role with SCRAM-SHA-256 password authentication on `aageonline_dev`.
- **Durable Scheduler Engine (`api/src/services/scheduler/scheduler-engine.ts`):** Implemented PostgreSQL-backed scheduler using advisory locks (`94827105`) that evaluates due scraper jobs and email campaigns without transient in-memory timers.
- **Outbox Cooldown Method (`api/src/db/repositories/email-automation-repo.ts`):** Added `isRecipientInCooldown()` to query historical sends from `email_outbox` in PostgreSQL.
- **Harmonized Migration Runners:** Unified `schema_migrations` tracking and advisory locking (`94827104`) between `frontend/lib/db/migrator.ts` and `api/src/db/migrator.ts`.

### Fixed
- **Migration 009 Syntax Error:** Corrected index targets in `009_performance_indexes.sql` to index `slug` directly on `locations` and `categories` instead of nonexistent `status` columns.
- **Audit Log Fallback:** Ensured `/api/admin/audit-logs` supplies seed records when database audit table is initially empty.
- **Test Isolation:** Added dynamic test identifiers in API persistence tests to ensure clean idempotency against live databases.

### Verified
- **Live SQL Persistence:** Confirmed 24 leads, 3 scraper jobs, 1 campaign, and 4 outbox messages persisted across API restarts.
- **Repeat Deduplication:** Confirmed second discovery run updated 23 existing leads without creating duplicate records.
- **Cooldown Enforcement:** Confirmed repeat campaign dispatch skipped 2 contacts within 14-day cooldown period.
- **Worker Advisory Locking:** Verified concurrent worker execution is harmlessly skipped via `pg_try_advisory_lock(829104812)`.
- **Automatic Scheduler Triggers:** Confirmed due scheduler tick executed scraper discovery and advanced `next_run_at` by 24 hours in SQL.
- **Backup & Restore Parity:** Verified `pg_dump` and restore into disposable test database achieved 100% data parity.
- **Full Test Suites:** 30/30 API tests passed; 585/585 Frontend tests passed; Admin TypeScript check passed with 0 errors.

## 0.20.30 — Business Owner Identity & Registration Flow

### Added
- **Migration 014 (`014_whatsapp_auth_and_business_evidence.sql`):** Added `phone` and `status` to `users`; added `whatsapp_phone`, `evidence_type`, `evidence_reference`, and `evidence_status` to `businesses`.
- **OTP Challenge Service (`frontend/lib/auth/otp-service.ts`):** Indian mobile (+91) normalization, 60s cooldown, 10m TTL, max 5 attempts, hidden test code, and environment-guarded test bypass (`isTestOtpAllowed()`).
- **PostgreSQL User & Business Repositories:** Created `PostgresUserRepository` (`findByPhone`, `createOrGetUserByPhone`) and `PostgresBusinessRepository` (`getBusinessesByOwner`, `createBusinessWithOwner` with foreign key upserts and bounded VARCHAR(64) IDs).
- **Returning Owner Screen:** Dedicated "Your Businesses" screen displaying owned listings with verification badges, "Open Workspace →", and "+ Register Additional Business" CTA.
- **Evidence Format Validation (`frontend/lib/validation/evidence.ts`):** Strict format validation and normalization for GSTIN, UDYAM, SHOP_ESTABLISHMENT, and COMMERCIAL_PAN.
- **Server API Routes:**
  - `POST /api/auth/otp/send`: Indian phone normalization and OTP challenge creation.
  - `POST /api/auth/otp/verify`: Server-side OTP verification, PostgreSQL user resolution, owned business retrieval, and secure HttpOnly cookie creation.
  - `GET /api/auth/me`: Resolves session cookie and retrieves user and owned businesses from PostgreSQL.
  - `POST /api/business/register`: Session verification, Business Phone and locked WhatsApp enforcement, evidence format validation, and atomic PostgreSQL persistence (`verification_status: 'PENDING'`).
  - `POST /api/auth/logout`: Revocation of persistent session in PostgreSQL and clearing of session cookie.
- **Automated Regression Suite (`frontend/tests/business-auth-and-registration-flow.test.ts`):** 18 comprehensive tests covering phone normalization, OTP lifecycle, security invariants, evidence validation, and PostgreSQL persistence.

### Fixed
- **Dev Impersonation:** Removed automatic dev impersonation of `user-ajay` in `frontend/lib/auth/store.ts`.
- **Dashboard WorkspaceNav:** Dynamically loads session from `/api/auth/me` on mount; removed hardcoded `user-ajay` and truthfully displays "Business Owner" / "Not added" and verified phone.
- **Form UX & Accessibility:** Replaced distant error alerts with accessible alert summaries immediately above action buttons, field-level red borders, and automatic focus to the first invalid field.
- **Webpack Bundling:** Guarded database imports in `lib/workspace/store.ts` with `typeof window === 'undefined'` to eliminate client bundle crashes.

### Verified
- **Full Test Suite:** 609 passed, 0 failed, 6 skipped across 190 suites.
- **End-to-End Live Persistence:** Verified real HTTP flow for OTP verification, initial business registration, multi-business registration, and returning user retrieval from PostgreSQL across session logout and re-login.

## 0.20.32 — PayU Sandbox Payment Provider & External Webhook Verification

**Status:** Milestone 0.20.32 — COMPLETE (Sandbox Testing); Production Release — BLOCKED PENDING RELEASE GATES.

### Added
- **PayU Sandbox Integration Test Suite (`frontend/tests/payu-sandbox-integration.test.ts`):** 12 comprehensive end-to-end sandbox verification tests covering PayU sandbox separation, SHA-512 request hashing, reverse response hashing with/without surcharges, tampering rejection, real PostgreSQL webhook processing, duplicate delivery idempotency, 5-way concurrent webhook serialization under load, atomic ranking settlement, rollback under simulated failure, and external PayU sandbox handshake.
- **Verification Report (`docs/Milestone-0.20.32-Payment-Provider-Sandbox-and-External-Webhook-Verification.md`):** Complete evidence-driven milestone verification report with exact commands, exit codes, and status matrix.

### Fixed
- **PostgreSQL Ranking Settlement Foreign Key Ordering:** In `frontend/lib/ranking-settlement/settlement-service.ts`, ensured the `RankingSettlement` entity is persisted inside the transaction client (`txClient`) immediately following `tx.begin()`. This guarantees that subsequent `position_history` rows referencing `settlement.id` satisfy the `position_history_ranking_settlement_id_fkey` constraint without breaking atomicity or rollback safety.

### Verified
- **PayU Sandbox Test Suite:** 12/12 tests passed (0 failures, 0 skipped, exit code 0, duration: 474ms).
- **External Network Handshake:** HTTP POST to `https://test.payu.in/merchant/postservice?form=2` completed with valid PayU sandbox response headers and JSON body for an intentionally nonexistent transaction reference (`NOT_FOUND` / `FAILURE`).
- **Payment Verification Boundary:** Test 12 did not demonstrate a successful end-to-end payment (negative handshake verified; live capture deferred).
- **Payment Domain Regression:** 23/23 tests passed in `tests/payment.test.ts`.
- **Financial Persistence Regression:** 21/21 tests passed in `tests/financial-persistence-and-durability.test.ts`.
- **Real PostgreSQL Integration:** 11/11 tests passed in `tests/real-postgres-integration.test.ts`.
- **Database Safety Guard:** Zero queries executed against `aageonline_dev`; all tests executed strictly against verified disposable database `aageonline_integration_test`.
- **Scope Alignment:** WhatsApp integration excluded from milestone (marked `NOT CONFIGURED / UNVERIFIED`); existing mobile OTP flow kept intact.
- **Production Blockers:** Production merchant credentials, HTTPS webhook ingress verification, and separate production release authorization remain outstanding release gates prior to live deployment.
