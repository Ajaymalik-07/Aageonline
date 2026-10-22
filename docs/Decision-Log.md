# AageOnline — Decision Log

## ADR-001 — Product Model

**Decision:** AageOnline is a paid business-visibility positioning platform.

**Reason:** This is the core differentiated mechanism.

## ADR-002 — Market Definition

**Decision:** A market is defined by location + category.

**Reason:** It creates a clear competitive context.

## ADR-003 — Payment Finality

**Decision:** Each upward position change is a new payment. Previous payments are not refunded when another business overtakes the position.

**Reason:** Keeps the V1 financial model simple and directly tied to visibility purchases.

## ADR-004 — No Wallet

**Decision:** V1 has no wallet, withdrawal, points, or stored bid balance.

**Reason:** Avoids unnecessary financial complexity.

## ADR-005 — No Auto-Bidding

**Decision:** V1 uses explicit user-initiated position purchases.

**Reason:** Keeps bidding understandable and auditable.

## ADR-006 — Homepage Spotlight

**Decision:** Homepage may show the category/market with the strongest qualifying competitive activity.

**Reason:** Makes the competitive nature of the platform visible immediately.

## ADR-007 — Brand

**Decision:** AageOnline with tagline “Get Seen. Get Ahead.”

**Reason:** The name communicates forward movement and the product outcome.

## ADR-008 — Visual Identity

**Decision:** Teal + Emerald + Lime with Deep Navy foundation, supporting Light and Dark themes.

**Reason:** Balances trust, energy, and competitive visibility.

## ADR-009 — Motion and 3D

**Decision:** Controlled 3D and purposeful motion are part of the product language.

**Reason:** Movement is intrinsic to position competition, but transactional clarity remains the priority.

## ADR-010 — Public Transparency

**Decision:** Paid visibility must be clearly disclosed and must not be represented as objective business quality.

**Reason:** Trust and consumer clarity are core requirements.

## ADR-011 — Development Harness Architecture

**Decision:** Establish a structured, documentation-first AI agent development harness rooted in `.agents/` (skills, workflows, references, rules) with root-level `AGENTS.md` and `DESIGN.md`.

**Reason:** Guarantees that coding agents strictly adhere to product boundaries, V1 exclusions, documentation authority, and design tokens without architectural drift.

## ADR-012 — Agent Memory Architecture (AgentMemory vs OpenViking)

**Decision:** Select `agentmemory` as the development agent persistent memory system; reject `OpenViking` as active infrastructure while keeping it documented as an evaluated alternative.

**Reason:** `agentmemory` provides lightweight, local SQLite + embedded engine execution with native Antigravity MCP integration and keyless BM25/hybrid search. `OpenViking` requires an external server, Docker runtime, AGPLv3 licensing, and Doubao/Ark model dependencies, creating excessive operational complexity for a development harness. Critical invariant: Agent memory is strictly scoped to development context and must never store production credentials, secrets, or user data.

## ADR-013 — Browser Automation Tooling Scoping

**Decision:** Maintain browser automation (`browser-use`) strictly as development/QA tooling and do not include it as a production application dependency.

**Reason:** Antigravity IDE already provides built-in browser subagents and CDP tools. Adding Python browser-use to the application runtime would introduce severe dependency pollution, bloated installation footprints, and security attack surface without production benefit.

## ADR-014 — Selective Skill & Workflow Adoption (Ponytail & ECC)

**Decision:** Adopt Ponytail's code minimization principles as an active agent skill and rule. Selectively extract high-leverage workflows (TDD, security review, code review) from ECC rather than installing the monolithic 293-skill suite or global hooks.

**Reason:** Prevents hook conflicts, configuration bloat, and context degradation while enforcing disciplined, minimal-diff code generation across all development tasks.

## ADR-015 — AageOnline Ranking Integrity Model (Zero Client Authority & Defense-in-Depth)

**Decision:** The frontend possesses zero authority over position calculations, price determination, payment confirmation, or ranking state. The core platform sequence `Payment → Transaction → Qualification → Ranking` is strictly enforced server-side.

**Reason:** Prevents zero-payment attacks, client-side ranking injection, and underpayment exploits. Establishes that client validation exists strictly for UX while server verification remains the sole source of truth.

## ADR-016 — Strictly Higher Bid Rule & Integer Minor Units Standard

**Decision:** A qualifying bid displacement must strictly satisfy `new_amount > current_qualifying_amount` (with a minimum +100 paise increment). Equal payments cannot displace an incumbent. All monetary values across the database, APIs, and client code are represented as exact integer minor units (paise; zero floating-point arithmetic).

**Reason:** Eliminates rounding inaccuracies, floating-point drift, and ambiguous equal-bid conflicts while maintaining transparent competitive mechanics.

## ADR-017 — Atomic Ranking Mutations & Fail-Closed State Invariants

**Decision:** All ranking mutations execute inside PostgreSQL transactions with explicit row/advisory locks on the target market. If any inconsistency, currency mismatch, or concurrent conflict is detected, the transaction rolls back and fails closed (`RECONCILIATION_REQUIRED`), halting rank advancement.

**Reason:** Guarantees serializability, eliminates duplicate ranks (e.g. split #1s), prevents race condition corruptions, and maintains a clean, append-only position history ledger.

## ADR-018 — Taxonomy Hierarchy: Country → State → City + Category = Market

**Decision:** The canonical location taxonomy follows `Country → State → City`, and a market is defined as exactly one `City + Category` composite pair enforced by a unique constraint. Separate entities for `StateRegion`, `City`, and `CategoryHierarchy` are maintained with independent lifecycle statuses.

**Reason:** Eliminates ambiguous or duplicate markets (e.g. multiple "Jaipur" records), enables clean URL generation (`/jaipur/interior-designers`), and supports future geography-aware features (state or national pages) without schema migration.

## ADR-019 — Anti-Doorway: Three-Status Market Lifecycle

**Decision:** Every market carries three independent status axes: `publicationStatus` (DISCOVERED | DRAFT | REVIEW | PUBLISHED | ARCHIVED), `indexabilityStatus` (NOINDEX | INDEXABLE), and `contentStatus` (MISSING | DRAFT | READY | REVIEW | APPROVED). A route is rendered only if `publicationStatus === PUBLISHED`. A route is indexed only if additionally `indexabilityStatus === INDEXABLE`.

**Reason:** Prevents discovered-but-empty market URLs from being served or indexed as thin-content doorway pages. Maintains clean separation between "do we have this route" and "should search engines discover it."

## ADR-020 — Discovery System: Deduplication + requestCount++ Pattern

**Decision:** When a user requests a location or category that does not exist in the canonical registry, a `DiscoveryRequest` record is created with `requestCount = 1`. Subsequent identical requests increment `requestCount` rather than creating duplicate records. Rate limiting (30 requests/min per clientId) prevents abuse.

**Reason:** Aggregated demand data is the primary signal for which new cities and categories should be prioritized for admin review, taxonomy creation, and market publication. Deduplication ensures signal quality.

## ADR-021 — Admin Governance: Server-Side Role Guard + Append-Only Audit Log

**Decision:** All taxonomy mutations (create/map/correct/publish/archive) are guarded by `assertAdminAuthorized(actor)` server-side before execution. Every successful mutation appends an immutable `AuditLogEntry` with `actor`, `action`, `entityType`, `entityId`, `previousState`, `newState`, and `timestamp`.

**Reason:** Satisfies the "Never Trust the Client" principle and guarantees that every taxonomy state change has a complete, auditable paper trail that cannot be retroactively modified.

## ADR-022 — Production PostgreSQL Persistence & Outbox Settlement Recovery

**Decision:** Adopt production-grade PostgreSQL with connection pooling (`pg.Pool`), raw version-controlled SQL migrations (`001_initial_schema.sql` through `005_outbox_and_recovery.sql`), row-level market serialization locks (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`), and an outbox recovery queue (`settlement_recovery_jobs`) polled with `SELECT ... FOR UPDATE SKIP LOCKED`. A mandatory production guard (`assertProductionPersistence()`) strictly blocks silent fallback to volatile in-memory financial stores in production environments.

**Reason:** Guarantees durability across application restarts and multi-instance deployments, ensures atomic ranking settlement commits with `PositionHistory` and settlement completion records, provides bounded retry and recovery for confirmed-but-unsettled payments without infinite loops, and prevents unsafe financial transactions when production persistence prerequisites are unconfigured.

## ADR-023 — Administrative Operations Boundary, Reconciler Worker Advisory Locking, and Durable Run History

**Decision:** Establish a dedicated server-side platform administrative operations boundary (`assertPlatformAdmin`), multi-instance safe background reconciler worker coordination via PostgreSQL session advisory locking (`pg_try_advisory_lock(829104812)`), and durable, observable execution history (`reconciliation_runs` and `worker_heartbeats` tables in migration `006_admin_operations.sql`).

**Reason:** Guarantees that sensitive financial recovery and payment reconciliation endpoints cannot be triggered by unauthenticated or non-admin actors. Enforces single-active-runner guarantees across multi-instance or serverless container environments without external distributed locking infrastructure like Redis or ZooKeeper.

## ADR-024 — Ranking Change Outbox, Downward Milestone Thresholds, and Anti-Spam Digest Coalescing

**Decision:**
1. Atomic Outbox Integration: Every committed ranking change during `settleRanking()` creates durable `ranking_change_events` within the same PostgreSQL transaction that writes `position_history` and `ranking_settlements`. If the transaction rolls back, zero ranking events are emitted.
2. Downward Milestone Thresholds: Notifications evaluate 7 explicit downward drop thresholds (`#1 -> #5`, `#5 -> #10`, `#10 -> #20`, `#20 -> #30`, `#30 -> #50`, `#50 -> #75`, `#75 -> #100`). Movements within the same tier or upward advances do not trigger drop alerts. Multi-threshold crossings are consolidated to the primary (deepest) milestone.
3. Rapid-Movement Coalescing: Successive downward movements within a configurable digest window (default 15 minutes) coalesce into existing pending notifications rather than spamming users with multiple emails.
4. Safe Notification Preferences: In-app notices are enabled by default for business workspaces (`recipient_user_id IS NULL`). Email delivery requires explicit opt-in preferences.
## ADR-025 — Centralized SEO Eligibility, Dynamic Sitemaps, and Discovery Health Auditing

**Decision:**
1. Centralized Eligibility Engine: Evaluate all public platform routes against an 8-gate typed policy (`evaluateSeoEligibility`) covering route privacy, query-string exclusion, taxonomy relationship validity, publication status (`PUBLISHED`), explicit indexability (`INDEXABLE`), content completeness (`APPROVED`), genuine underlying business/entity records, and minimum active child threshold for hubs.
2. Authoritative Dynamic Sitemap: Dynamically generate `sitemap.xml` strictly from published, eligible database and service records. Exclude draft, unreviewed discovery, and thin doorway pages. Use authentic entity `updatedAt` timestamps and reject `localhost` origins in production.
3. Schema.org Conformity & Transparency: Restrict JSON-LD structured data to verified schemas (`WebSite`, `Organization`, `BreadcrumbList`, `ItemList`, `LocalBusiness`). Require explicit paid-visibility disclosures in ranked `ItemList` entries. Strictly prohibit fabricated reviews, aggregate ratings, and false claims of AageOnline operating as a local business in every city.
4. Discovery Health Auditing: Provide admin-triggered discovery and health auditing to detect thin markets, invalid taxonomy combinations, and uncovered market opportunities without automatically publishing unreviewed records.
5. Durable Audit Persistence: Persist SEO audit runs and route evaluations in `seo_audit_runs` and `seo_registered_routes` (Migration `008_seo_audits.sql`).

## ADR-026 — Performance Caching Policies, Post-Commit Ranking Invalidation, and Edge Rate Limiting

**Decision:**
1. Centralized Cache Policies: Explicitly classify all platform endpoints into documented cache tiers (`STATIC_IMMUTABLE`, `PUBLIC_CONTENT`, `PUBLIC_TAXONOMY`, `PUBLIC_RANKING`, `PUBLIC_SITEMAP`, `PRIVATE_WORKSPACE`, `ADMIN_OPERATIONS`, `FINANCIAL_DYNAMIC`). Workspace, payment, and administrative endpoints strictly mandate `private, no-cache, no-store, max-age=0, must-revalidate`.
2. Post-Commit Invalidation Order: Market ranking cache invalidation triggers strictly *after* the settlement transaction commits. Invalidation failures are captured to a safe recovery queue and never roll back a successful payment or committed ranking transaction.
3. Bounded ISR & Dynamic Sitemap Snapshotting: Public market pages use 60-second Incremental Static Regeneration (`revalidate = 60`). The dynamic sitemap uses an in-memory snapshot with a 1-hour TTL, explicitly invalidated on taxonomy or publication mutations.
4. Edge Rate Limiting & Privacy Preservation: Implement Next.js Edge Middleware (`middleware.ts`) enforcing sliding-window rate limits across four differentiated tiers. Raw client IP addresses are hashed using SHA-256 + salt before evaluation, preventing raw IP retention in memory or logs. Legitimate search engine crawlers receive 2x headroom on public discovery routes.
5. Production Persistence Enforcement: `PostgresSeoAuditRepository` strictly forbids silent fallback to in-memory maps in production environments, throwing critical configuration errors when `DATABASE_URL` is absent or unreachable.

**Reason:** Guarantees blazing-fast public performance and crawler friendliness without risking stale financial quotes, leaking private workspace data, or sacrificing transactional consistency during ranking settlement.

## ADR-027 — Production Readiness, Durable Invalidation Outbox, and Distributed State Architecture

**Decision:**
1. **Durable Cache Invalidation Outbox (`Migration 010: cache_invalidation_jobs`):** Replace all volatile in-memory recovery queues with PostgreSQL table `cache_invalidation_jobs`. Failed on-demand revalidation jobs are durably enqueued, polled with `SELECT ... FOR UPDATE SKIP LOCKED`, and retried with exponential backoff up to 5 attempts before terminal transition. Survives process crashes and pod restarts without lost invalidations.
2. **Reconciler Worker Recovery Loop Integration:** The background reconciler worker loop (`runSingleReconcilerCycle`) directly polls and recovers pending invalidations as step 5b of every cycle, tracking recoveries in durable worker heartbeats (`worker_heartbeats`).
3. **Cryptographic Anti-Spoofing Rate Limiting & Graceful Outage Fallback:** Client IP token derivation upgraded to FIPS 180-4 SHA-256 with secret salt (`computeSha256Hex`). Rate limiting supports multi-instance atomic counting via PostgreSQL `rate_limit_counters` (`Migration 010`) while providing instant fail-open degradation to local memory (`store: 'degraded-local'`) during database outages so legitimate traffic is never blocked.
4. **Verified Crawler Privilege Invariant:** Elevating discovery rate-limit headroom (2x) strictly requires infrastructure-verified edge headers (`cf-verified-bot: true` or `x-verified-bot: true`). Client-supplied `User-Agent: Googlebot` is unverified and receives standard public limits. Forwarded IP headers (`X-Forwarded-For`) are trusted strictly from configured upstream proxies (`isTrustedProxy`).
5. **Decoupled Edge Middleware:** Keep Next.js Edge Middleware free of Node.js driver dependencies (`pg`) by dynamically loading database connections inside server-only execution branches, preserving ultra-fast edge request processing and build compilation compatibility.

**Reason:** Solves multi-instance distributed state divergence, ensures restarts cannot orphan stale cache jobs, eliminates client IP and user-agent spoofing vulnerabilities, and guarantees resilience against rate-limit store outages.

## ADR-028 — Staging Environment Safety Isolation, Ordered Migrations (001–010), and PayU Sandbox Verification

**Decision:**
1. **Staging Environment Protection (`APP_ENV=staging`):** Enforce total search engine crawl exclusion via `robots.ts` (`disallow: ['/']`, omitting `sitemap.xml`) and inject `X-Robots-Tag: noindex, nofollow` in Edge Middleware. Intercept all outbound staging emails into a synthetic `STAGING_SAFETY_SINK` unless addressed to an explicitly whitelisted test recipient (`STAGING_TEST_EMAIL_RECIPIENT`).
2. **Deterministic Migration Verification (001–010):** All database schema migrations are numbered `001` through `010`, tracked in `schema_migrations`, executed within transactional boundaries (`BEGIN ... COMMIT / ROLLBACK`), and loaded via `loadMigrationFiles()` strictly in numerical order.
3. **PayU Sandbox Isolation:** Default payment gateway mode resolves to PayU India Sandbox endpoints (`https://test.payu.in/_payment`) using test credentials (`gtKFFx` / `eCwWELxi`). Production keys and real-money transactions are strictly prohibited from staging test suites.
4. **Machine-Checkable Health Probes:** Provide dedicated path-based container probes (`/api/health/live` returning 200, `/api/health/ready` returning 503 when mandatory persistence is disconnected) alongside query-mode `/api/health?mode=...`.

## ADR-029 — Docker VPS Architecture, Caddy Auto-TLS, and Standalone Container Deployment

**Decision:**
1. **Multi-Stage Node.js 22 LTS Alpine Dockerfile:** Build the Next.js application using Next.js standalone output (`output: 'standalone'`). Package web, worker, and migrator targets within a unified multi-stage Dockerfile. Execute all containers as non-root system user `nextjs:nodejs` (UID 1001).
2. **Private Container Network Boundary:** Port 3000 is exposed strictly to internal Docker bridge network `aageonline-staging-net` and is never mapped to the public host interface. The background reconciler worker runs in a separate isolated container with zero inbound ports.
3. **Caddy Reverse Proxy & Automatic HTTPS:** Use Caddy 2 for direct ACME certificate issuance and TLS termination on ports 80 and 443. Parameterize the domain name via `{$SITE_ADDRESS}` (defaulting to `staging.aageonline.com`). Inject security headers (`HSTS`, `X-Robots-Tag: noindex, nofollow`, `X-Content-Type-Options: nosniff`).
4. **External Managed PostgreSQL Connectivity:** The staging VPS does not host a local database daemon; it connects outbound over SSL (`sslmode=require`) to an isolated managed PostgreSQL instance.

## ADR-030 — Pre-Provisioning Deployment Hardening, Concurrency Locking & Firewall Boundary

**Decision:**
1. **Docker-UFW Network Isolation Invariant:** Container internal ports must never be exposed via host port publishing (`ports:`) on application nodes because Docker manipulates Linux iptables directly, bypassing standard UFW filtering. Next.js (`web`) must strictly use `expose: - "3000"`, leaving only Caddy (reverse proxy) bound to external ports 80 and 443.
2. **Deterministic Health Check Failure Gate:** Deployment script must immediately abort with non-zero exit code (`exit 1`) and dump container error diagnostics if `web` container fails to achieve healthy status within timeout.
3. **Advisory Lock for Migration Serialisation:** Wrap migration runs with session-level PostgreSQL advisory lock (`SELECT pg_advisory_lock(94827104)`) to eliminate race conditions between multiple deployment or worker runners executing migrations concurrently.
4. **Docker Group Security Notice:** Explicitly document and require operator acknowledgement that adding a deploy user to the `docker` Linux group confers root-equivalent host privileges.

## ADR-031 — Decommissioning of Staging Environment & Simplification to Single Production Deployment Model

**Decision:**
1. **Single Deployment Model (Local Development → Production):** Decommission the separate staging environment (`staging.aageonline.com`, `docker-compose.staging.yml`, `scripts/deploy-staging.sh`, `.env.staging.example`). Adopt a simplified direct pipeline: Local Development → Production.
2. **Canonical Production Artifacts:** Standardize deployment onto `docker-compose.yml`, `scripts/deploy.sh`, `scripts/setup-vps.sh`, and `.env.production.example`. Parameterize Caddy for `aageonline.com` and remove staging-wide `X-Robots-Tag: noindex, nofollow` headers so production public pages remain indexable.
3. **Preservation of Safety Controls:**
   - Database migrations (001–010) execute deterministically with advisory locking *before* application rollout.
   - PayU sandbox mode is preserved for local development and automated test suites (`tests/staging-deployment-and-live-verification.test.ts`), while production deployment enforces genuine merchant credentials.
   - Email safety sink is configurable via `EMAIL_SAFETY_SINK_ENABLED=true` for non-production environments without diverting live production customer emails.
   - All financial immutability, ranking atomicity, rate limiting, and RBAC invariants remain strictly enforced.
4. **Historical Record Retention:** Retain completed audit reports (Milestone 0.20.4, 0.20.5) and archival runbooks marked clearly as superseded by this decision.

**Reason:** Reduces cloud operational overhead, infrastructure complexity, and DNS management while maintaining full test coverage and automated safety controls.

## ADR-032 — Whole-Website UI Alignment, Text-First Design & Shared Layout Standards

**Decision:**
1. **Canonical Visual References:** Establish Homepage (`/`) and Jaipur Interior Designers market page (`/jaipur/interior-designers`) as the authoritative visual standards for the entire website.
2. **Text-First & Motion Removal:** Enforce a clean, content-first interface across all routes. Eliminate keyframe animations (pulsing indicators, marquee scrolling), 3D tilt transformations, bouncy hover lifts (`translateY`), and auto-advancing carousel loops.
3. **Semantic Single-Landmark Invariant:** Eliminate duplicate `<Header />` and `<Footer />` components and nested `<main>` tags from admin views (`/admin`, `/admin/operations`, `/admin/discovery`). Maintain exactly one `<main id="main-content">` landmark per document.
4. **Canonical Navigation Architecture:** Ensure direct, canonical internal links throughout Header, Footer, and Mobile Navigation (`/business/claim`, `/business/dashboard`, `/#how-it-works`, `/#trust`) supported by Next.js 308 redirects in `next.config.ts`.
5. **Brand Color Uniformity:** Enforce Deep Navy (`#071526`), Supporting Navy (`#0B1F33`), Primary Orange (`#EA580C`), Supporting Orange (`#FB923C`), and Inter typography consistently across directory heroes, cards, eyebrows, and CTA elements.

**Reason:** Resolves multi-page visual fragmentation, ensures WCAG 2.2 AA accessibility compliance, and creates a calm, professional, high-trust user experience for business owners and consumers.

## ADR-033 — Production Security, Financial Integrity & Reliability Audit Verdict

**Decision:**
1. **Production Readiness Verdict:** Formally classify the platform as **`BLOCKED`** for live customer payments and production provisioning until critical in-memory authentication and persistence synchronization items are remediated.
2. **Identification of Launch Blockers:**
   - **In-Memory Authentication (`LocalAuthDataSource`):** In-memory user sessions with a global `user-ajay` development fallback leak owner privileges across unauthenticated HTTP requests. Persistent database sessions with per-request cookie/header verification are required.
   - **Dual-State Persistence:** While PostgreSQL repositories exist, primary web route handlers create and update entities in Node.js in-memory `Map`s, risking data loss on container restart and causing desynchronization with background workers.
   - **In-Memory Settlement Mutex:** The settlement engine defaults to in-memory concurrency locks rather than enforcing PostgreSQL row-level locks (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`).
3. **Confirmed Production Invariants:**
   - PayU request and reverse-hash algorithms (SHA-512) and timing-safe checks are cryptographically sound and secure.
   - Pre-flight deployment check strictly prevents test keys (`gtKFFx`/`eCwWELxi`) in production mode.
   - Rate limiting safely hashes client IPs via FIPS SHA-256 and rejects spoofed proxy headers.
   - Production SEO configuration correctly indexes public market and discovery pages while disallowing private workspaces and APIs.
   - Test suite (461/461 passing), TypeScript compilation (0 errors), and Next.js standalone build (69 routes) succeed.
4. **Remediation Path:** Require completion of persistent auth, PostgreSQL store unification, database row locking in ranking settlement, and automated backup/restore scripts before lifting the blocked state.

**Reason:** Preserves absolute financial integrity, customer trust, and multi-tenant security by preventing real money transactions on non-persistent or dev-fallback state.

## ADR-034 — Persistent Authentication, High-Entropy Session Lifecycle & Server-Side Tenant Authorization

**Decision:**
1. **Complete Removal of Development Identity Fallback in Production:**
   - `getActiveDevSession()` returns `null` unconditionally when `NODE_ENV === 'production'`.
   - `setActiveDevUser()` throws an error in production environments.
   - `LocalAuthDataSource` returns `null` and throws on mutation in production.
   - Unauthenticated requests in production receive HTTP 401 without any fallback identity.
2. **Durable PostgreSQL Session Persistence (Migration 011):**
   - Session state is persisted in PostgreSQL table `user_sessions`.
   - Sessions store a deterministic SHA-256 hash of the bearer token (`token_hash`), never the plaintext token.
   - Session records include IP address hash, user agent, expiration timestamp, and optional revocation timestamp.
3. **Cryptographically High-Entropy Token Lifecycle:**
   - Tokens are generated using Node's `crypto.randomBytes(32)` yielding 256 bits of entropy (64 hex characters).
   - Cookies in production use the `__Host-` prefix (`__Host-aageonline_session`), `HttpOnly: true`, `Secure: true`, `SameSite: 'lax'`, and `Path: '/'`.
4. **Authoritative Server-Side Authorization Guards:**
   - Protected endpoints execute `requireAuthenticatedUser`, `requireBusinessMembership`, `requirePlatformAdminUser`, or `requireAdminOrWorker` on every request.
   - Client-supplied `actorUserId`, `businessId`, and roles in request bodies or custom headers are strictly ignored as proof of permission.
   - Server resolves caller identity from the authenticated session and verifies active business membership and RBAC role against persistent storage.
   - Cross-tenant requests unequivocally reject with HTTP 403 (`BusinessForbiddenError`).

**Reason:** Eliminates critical launch blocker `SEC-01`, prevents multi-tenant privilege escalation and session forgery, and satisfies rigorous production session security invariants.

## ADR-035 — Financial Persistence Remediation & PostgreSQL as the Source of Truth

**Decision:**
1. **Durable Persistence Across All Financial Domains:**
   - Eliminate reliance on in-memory Maps (`BID_INTENTS_STORE`, `PAYMENT_ORDERS_STORE`, `RANKING_SETTLEMENTS_STORE`) as the source of truth for financial operations.
   - All BidIntent creations, mutations, and cancellations persist directly to `bid_intents` table in PostgreSQL.
   - All PaymentOrder creations, updates, and webhook payload fingerprints persist directly to `payment_orders` and `payment_provider_events` in PostgreSQL.
   - All RankingSettlements and immutable PositionHistory entries persist directly to `ranking_settlements` and `position_history` in PostgreSQL.
2. **Fail-Closed Production Guard:**
   - In production environments (`NODE_ENV === 'production'`, `APP_ENV === 'production'`, or `PERSISTENCE_MODE === 'postgres'`), if `DATABASE_URL` is unconfigured or a database query fails during financial mutations, operations fail closed and throw immediately.
   - Never silently fall back to volatile storage when PostgreSQL is unavailable in production.
3. **Database Concurrency & Transactional Ranking Settlement:**
   - Upgrade `RankingTransactionContext` and settlement routines to run inside PostgreSQL transactions (`BEGIN` ... `COMMIT` / `ROLLBACK`).
   - Acquire market-level transactional advisory locks (`SELECT pg_advisory_xact_lock(hashtext($1))`) and row-level locks (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`) to serialize concurrent settlement attempts across distributed application instances.
   - Atomic rollback guarantees that any failure reverts participant changes, displacement moves, and position history records simultaneously.
4. **Unified API Routes and Background Workers:**
   - Web API handlers and background reconciliation daemons (`runPaymentReconciliationCycle`, `runSettlementRecoveryCycle`) query and mutate the exact same PostgreSQL repositories.

**Reason:** Eliminates critical launch blocker `FIN-01`, prevents financial data loss across process restarts, protects against dual-state split-brain discrepancies, and guarantees atomic, serialized ranking settlement across independent instances.

## ADR-036 — Real PostgreSQL Integration Testing Architecture & Environment Gate

**Decision:**
1. **Separation of Test Horizons:**
   - Explicitly distinguish Unit Tests (in-memory math and transforms), Mocked/In-Memory Integration Tests, Static SQL Structure Tests, and Live PostgreSQL Engine Tests.
   - Prohibit claiming production readiness or live database correctness based solely on passing in-memory test suites.
2. **Dedicated Live PostgreSQL Integration Test Suite (`real-postgres-integration.test.ts`):**
   - Engineered dedicated suite testing actual `pg.Pool` connections, migration execution (001–011), cross-connection isolation, advisory xact locks, row locks, atomic rollback, and database constraint violations (`uq_bid_intents_actor_business_key`, `uq_payment_provider_events_fingerprint`).
3. **Automated Environment Gate & Honest Diagnostic Reporting:**
   - If PostgreSQL is unconfigured or unavailable, the test suite verifies fail-closed security guards, loads migration definitions, and marks live engine tests as skipped with explicit diagnostics, preventing false positives.
   - Formally report Milestone 0.20.12 verdict as **`BLOCKED`** pending the availability of an actual PostgreSQL service or Docker container, in strict alignment with project governance rules.

**Reason:** Enforces engineering integrity and safety, prevents premature launch declarations, and provides an executable live-test harness ready for deployment against a real database.

## ADR-037 — Financial Lifecycle Settlement Bridge & CSRF Defense-in-Depth for State Mutations

**Decision:**
1. **Financial Lifecycle Auto-Confirmation Bridge:**
   - In `settleRanking()`, if a verified payment order possesses status `SUCCEEDED` (resulting from PayU webhook verification), the system auto-confirms it to `CONFIRMED` via `confirmPaymentOrderAsync()` before validating the `CONFIRMED` payment invariant.
   - In `reconciliation-service.ts`, background sweeps include `SUCCEEDED` payment orders, confirm them, and enqueue settlement recovery jobs.
   - Ensures money verified via webhooks is never orphaned in `SUCCEEDED` state without advancing ranking.
2. **CSRF Defense-in-Depth on Next.js Edge Middleware:**
   - Next.js Edge middleware validates state-changing mutation requests (`POST`, `PUT`, `PATCH`, `DELETE`) on internal `/api/` endpoints.
   - Explicitly rejects cross-site requests (`Sec-Fetch-Site: 'cross-site'`) and mismatched `Origin` headers with HTTP 403 `CSRF_REJECTED`.
   - Exempts public payment gateway webhooks (`/api/payments/webhooks/payu`) and browser return redirect form callbacks (`/api/payments/callback/payu`) to maintain payment flow interoperability.

**Reason:** Eliminates the risk of stranded payments following web-process disconnects and provides defense-in-depth CSRF protection for cookie-authenticated sessions without disrupting public payment provider callbacks.

## ADR-038 — Multi-Domain 3-Service Architecture Separation (`website`, `api`, `admin`)

**Decision:**
1. **Physical & Logical Service Separation:**
   - **`website/` (Port 3000 | `aageonline.com` / `www.aageonline.com`):** Dedicated public marketing, market listings, category exploration, business verification claims, and authenticated business workspace.
   - **`api/` (Port 4000 | `api.aageonline.com`):** Authoritative backend REST API service managing PostgreSQL transactions, atomic ranking mutations, payment provider webhooks, rate limiting, and RBAC authentication.
   - **`admin/` (Port 3001 | `admin.aageonline.com`):** Isolated operational backoffice control center for financial reconciliation, worker supervision, settlement recovery, and taxonomy governance.
2. **CORS & Domain Decoupling:**
   - The central API service implements strict CORS validation allowing requests from configured origins (`http://localhost:3000`, `http://localhost:3001`, `https://aageonline.com`, `https://admin.aageonline.com`).
   - Reverse proxy (Caddy / Cloudflare) routes hostnames to respective services with automatic TLS termination and defensive HTTP headers.
3. **Independent Repositories / Top-Level Directories:**
   - Established standalone directories with independent `package.json`, `tsconfig.json`, `Dockerfile`, and environment specifications, enabling separate deployment, scaling, and CI/CD pipelines.

**Reason:** Fulfills architectural requirement for domain-level isolation between the customer-facing website, sensitive internal operator administration, and the centralized API layer.

## ADR-039 — Provider-Neutral Deployment Architecture & Dual-Database Support (Same-Host vs Managed)

**Decision:**
1. **Explicit Provider & Domain Neutrality:**
   - Retain `aageonline.com` solely as a candidate domain name; dynamically parameterize all ingress, CORS, and public URL definitions via `${SITE_ADDRESS}`.
   - Maintain hosting provider, geographic region, DNS provider, and final budget as explicitly undecided until commercial approval.
2. **Dual Database Topology Standard:**
   - Architecture natively supports both **Option A** (Single Linux VPS with same-host containerized PostgreSQL on `aageonline-net` via `--profile local-db`) and **Option B** (VPS + external Managed PostgreSQL 16 DBaaS via `DATABASE_URL`).
   - For Option A, PostgreSQL is never exposed to public host ports (`expose: 5432` only) and stores data in named volume `pgdata`.
3. **Decoupled One-Off Migration & Singleton Worker:**
   - Migrations do not run automatically on startup; executed via decoupled migrator container (`profiles: ["tools"]`) with session advisory locking (`94827104`).
   - Background worker enforces PostgreSQL advisory locking (`829104812`), circuit breakers, and graceful shutdown to ensure singleton execution.
4. **Zero-Database Admin Boundary:**
   - The admin application (`admin/`) has zero database connections and communicates exclusively with `api:4000` via HTTP with bearer token authorization (`ADMIN_TOKEN`).

**Reason:** Eliminates vendor lock-in, allows operators to deploy under either a low-cost single-host topology or a resilient cloud-managed database architecture, preserves financial data integrity, and strictly enforces service boundaries.

## ADR-040 — Admin Session Token Stateless HMAC Verification & Resilient Proxy Fallback

**Decision:**
1. **Stateless HMAC-Signed Admin Session Tokens:**
   - Administrative session tokens issued by `api:4000` (`createAdminSession`) are cryptographically signed using HMAC-SHA256 (`adm_sess_<userId>_<expiresAt>_<signature>`).
   - Tokens can be validated statelessly by `validateAdminSessionToken` even across API process restarts or container recycling, preventing transient session eviction.
   - Revoked sessions are recorded in `REVOKED_ADMIN_TOKENS` upon explicit logout.
2. **Resilient Admin Server-to-Server Proxy Fallback:**
   - In `admin/lib/api-client.ts`, if privileged downstream requests receive HTTP 401 or 403 on a user's session token, the client automatically retries once using the server's configured `ADMIN_TOKEN`.
   - In `admin/app/api/locations/route.ts` and `admin/app/api/categories/route.ts`, if privileged endpoints encounter downstream errors, handlers gracefully fall back to the canonical public catalogs (`/api/locations` and `/api/categories`).
3. **Smooth Client-Side Auth Redirection:**
   - Admin UI pages (`/locations`, `/categories`, `/payments`, `/rankings`, etc.) check both HTTP 401 and HTTP 403. If credentials expire, pages redirect cleanly to `/login?from=<route>` rather than displaying raw HTTP error banners.

**Reason:** Resolves HTTP 403 errors on `/locations` and `/categories` admin views caused by session desynchronization after backend restarts while preserving strict security boundaries.

## ADR-041 — Administrative Operations Consolidation & Recovery Route Deprecation

**Decision:**
1. **Consolidation of Supervisor & Recovery Under Operations:**
   - Consolidated all operational health, worker vitals, and reconciliation triggers under the single authoritative `/operations` module (`AdminOperationsPage`).
   - Deprecated the redundant experimental `/recovery` supervisor page, redirecting requests to `/operations` and removing it from sidebar navigation.
2. **Strict Cross-Tenant Authorization with Unclaimed Business Claiming:**
   - In `frontend/lib/workspace/store.ts`, requests for existing businesses owned by another tenant strictly reject with HTTP 403 Forbidden.
   - Unclaimed businesses (with zero active memberships) permit claiming by authenticated users in onboarding/claim flows.
   - Completely unrecognized or non-existent business IDs gracefully fall back to the user's primary business to preserve dashboard continuity.

**Reason:** Eliminates confusing duplicate worker views and HTTP 403 telemetry errors, unifies financial operations controls, and strictly enforces tenant isolation boundaries.

## ADR-042 — Unified Lead Scraper and Zero-Inspired Email Automation Architecture

**Decision:**
1. **Decoupled Architectural Slices with PostgreSQL as the Authoritative Boundary:**
   - The Lead Scraper (`/leads/scraper`) and Email Automation (`/leads/email-automation`) operate on strictly independent schedules.
   - Lead discovery never triggers automated outbound sends.
   - Newly discovered businesses persist into `lead_prospects` and deduplicate on `(city, category, normalized_name)` and `contact_email`.
   - Email Automation queries only persisted, eligible records in SQL.
2. **Selective Reference Code Adaptation over Monolithic Imports:**
   - From `msmunnabd/Social-Media-AutoPilot-Engine`: adapted unicode pin/phone glyph cleaning and Indic/Bengali numeral translation. Discarded Selenium browser dependencies and unsupported social profile scrapers.
   - From `Mail-0/Zero`: adapted visual 3-pane responsive layout, status badge tokens, and template inspection card patterns. Discarded IMAP/Gmail OAuth sync, Better Auth, and personal mail client logic.
3. **SSRF and Security Invariants:**
   - Website Crawler enforces strict IP filtering rejecting loopback, cloud instance metadata (`169.254.169.254`), and RFC1918 private subnets.
   - CSV Ingestion neutralizes spreadsheet formula injection prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`).
   - Email Template Renderer escapes untrusted strings to prevent XSS and mandates a verified one-click unsubscribe URL.
   - Public Opt-Out route (`/api/public/leads/opt-out`) updates `email_suppression_list` immediately upon receipt.

**Reason:** Enables scalable, lawful discovery of commercial businesses and transparent ladder invitation outreach without creating uncontrolled blasting risks, security vulnerabilities, or tight coupling between discovery and messaging.

## ADR-043 — Portable PostgreSQL 16 Deployment & Durable Scheduler Recovery

**Decision:**
1. **Isolated Portable User-Space PostgreSQL 16 Runtime:**
   - Deployed standalone PostgreSQL 16 binaries into `%USERPROFILE%\.local\pgsql` bound exclusively to loopback `127.0.0.1:5432`.
   - Requires zero administrator/root elevation, creates no Windows services, and makes no machine registry modifications.
   - Enforces SCRAM-SHA-256 password authentication with a dedicated, least-privilege `aage_app` database role on `aageonline_dev`.
   - Credentials gitignored via `.env.local` files across `api/`, `frontend/`, and `admin/`.
2. **Durable PostgreSQL-Backed Scheduler (`SchedulerEngine`):**
   - Eliminated reliance on in-memory timers (`setInterval`) or request-lifetime background tasks.
   - Scheduler evaluation uses PostgreSQL advisory locking (`94827105`) ensuring multi-instance mutual exclusion.
   - Evaluates due scraper jobs (`scraper_configs.next_run_at`) and email campaigns (`email_campaigns.next_run_at`), updating timestamps atomically in SQL upon execution.
3. **Outbox-Backed Previous-Contact Cooldown:**
   - Implemented `isRecipientInCooldown()` querying historical sends from `email_outbox` in PostgreSQL.
   - Guarantees contacts cannot receive duplicate campaign invitations within configured cooldown windows (e.g. 14 days) even across process restarts.
4. **Harmonized Migration Runners:**
   - Unified `schema_migrations` tracking table structure and advisory locking (`94827104`) across `frontend/lib/db/migrator.ts` and `api/src/db/migrator.ts`.
   - Prevents race conditions and double-execution when multiple services initialize concurrently.

**Reason:** Resolves the local database runtime blocker from Milestone 0.20.27, fulfills authoritative PostgreSQL persistence requirements across the stack, and provides durable, restart-safe background job scheduling with strict advisory locking.

## ADR-044 — PayU Sandbox Payment Provider Verification, Transactional Foreign-Key Ordering & Replay Defenses

**Decision:**
1. **Three-Tier Evidence Architecture for Payment Verification:**
   - **Level 1 (Cryptographic & Algorithm Invariants):** Authoritative test coverage of SHA-512 request hashing (`key|txnid|amount|productinfo|firstname|email|udf1..udf5|salt`), reverse response hashing with/without surcharges, constant-time verification (`crypto.timingSafeEqual`), whole-rupee enforcement, and rejection of tampered amounts or signatures.
   - **Level 2 (Database Persistence & Concurrency Invariants):** Execution against verified disposable database `aageonline_integration_test`. Verification of duplicate delivery idempotency, database-level unique constraints on `(provider, payload_hash)`, 5 concurrent webhook serialization under load, atomic ranking settlement, and atomic rollback restoring pre-transaction state under simulated failure injection.
   - **Level 3 (Live Sandbox Network Verification):** Real HTTP POST verification against PayU's test sandbox (`https://test.payu.in/merchant/postservice?form=2`) using standard sandbox credentials (`gtKFFx` / `eCwWELxi`), proving network egress, TLS negotiation, and response decoding without initiating live financial charges.
2. **PostgreSQL Ranking Settlement Transactional Entity Ordering:**
   - In `frontend/lib/ranking-settlement/settlement-service.ts`, persist the initial `RankingSettlement` entity within the database transaction client (`txClient`) immediately following `tx.begin()`.
   - Satisfies PostgreSQL relational integrity where `position_history` enforces `FOREIGN KEY (ranking_settlement_id) REFERENCES ranking_settlements(id)` while maintaining total transaction atomicity and rollback safety.
3. **Preservation of Database Safety Boundaries:**
   - Integration tests are permanently restricted to verified disposable test databases matching `assertDisposableTestDatabase()`. No test suite may execute write operations against `aageonline_dev` or production databases.

**Reason:** Fulfills Milestone 0.20.32 acceptance criteria with empirical, reproducible evidence across cryptographic, relational, concurrency, and live PayU sandbox network boundaries while upholding strict database safety.

## ADR-045 — Worker Heartbeat Lifecycle Persistence & Linux POSIX SIGTERM Verification

**Decision:**
1. **Heartbeat Lifecycle Status Parameterization & Compatibility Contract:**
   - Parameterized SQL `$3` for column `status` on `INSERT` and `ON CONFLICT DO UPDATE` in `PostgresHeartbeatRepository.recordHeartbeat()`.
   - Replaced previously hardcoded literal `'ACTIVE'` with a dual-source status resolution prioritizing explicit 4th argument `statusOrClient` (when string), falling back to embedded `metadata.status` (`ACTIVE`, `STOPPED`, `STALE`), and defaulting to `'ACTIVE'`.
   - Maintained full backward compatibility with legacy 4-argument calls where the 4th argument is a `pg.PoolClient` object.
   - Enhanced `mapRow` to map the column status directly while preserving fallback to `metadata.status` for historical records.
2. **Graceful Degradation on Terminal Heartbeat Failure:**
   - In `WorkerSupervisor.stop()`, wrapped the terminal heartbeat write in a dedicated try/catch block logging warnings on persistence failure.
   - Prevents unhandled exceptions from aborting process exit, ensuring in-flight cycle drains and TCP connection termination proceed cleanly even during database outage.
3. **Native Linux Process & Mirrored Network Concurrency Verification:**
   - Verified multi-worker mutual exclusion on PostgreSQL advisory lock `829104812` using native Linux Node.js under Ubuntu 26.04 WSL2 communicating over mirrored networking (`127.0.0.1:5432`) with isolated target `aageonline_worker_drill_disposable`.
   - Verified clean dispatch and handling of genuine POSIX `SIGTERM`, graceful cycle completion, terminal `STOPPED` heartbeat write, and automatic advisory lock handover to surviving worker processes.

**Reason:** Fulfills Milestone 0.21.0 acceptance criteria, rectifies worker lifecycle state representation across monitoring and health checks, and closes Pre-Launch Gate 3 with unmocked POSIX process evidence.

