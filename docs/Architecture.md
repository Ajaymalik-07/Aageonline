# AageOnline — Architecture

## 1. Architecture Goal

Build a web-first, documentation-driven platform with a clear separation between public discovery, authenticated business operations, administrative operations, ranking logic, payments, notifications, and persistence.

## 2. Logical Architecture

```text
Browser
  │
  ├── Public Web
  ├── Business Workspace
  └── Admin
       │
       ▼
Application/API Layer
  ├── Auth
  ├── Businesses
  ├── Markets
  ├── Ranking Engine
  ├── Bidding
  ├── Payments
  ├── Notifications
  └── Audit
       │
       ├── PostgreSQL
       ├── Payment Provider
       ├── Transactional Email
       └── Object Storage
```

## 3. Core Principle

The ranking engine is a business-critical domain service. Payment verification and ranking mutation must be separated so a client cannot directly manipulate rank.

## 4. Recommended Runtime

- Next.js web application
- TypeScript
- PostgreSQL
- Cloudflare for edge/CDN/runtime where appropriate
- Object storage for future first-party media
- External payment provider
- Transactional email provider

Exact provider choices must be recorded in `Decision-Log.md`.

## 5. Domain Boundaries

### Identity
Users, sessions, authentication, authorization.

### Business
Business records, owners, claims, verification.

### Market
Locations, categories, market definitions.

### Ranking
Entries, target positions, position history, ranking calculations.

### Payments
Payment intent, provider transaction, successful transaction, reconciliation.

### Notifications
Email events, milestone detection, delivery status.

### Governance
Audit logs, administrative actions, compliance records.

## 6. Concurrency

Ranking updates must use database transactions and appropriate locking at the market level.

The system must prevent:

- duplicate target positions
- lost updates
- replayed payment application
- inconsistent ranking after concurrent successful payments

## 7. Read/Write Separation

Public ranking pages should be optimized for read performance.

Write operations must pass through authenticated application services and database transactions.

### 7.1 Reusable Frontend Data-Access Layer (`frontend/data-access/`)
Public UI components are strictly decoupled from internal database schemas and raw storage primitives. All public pages consume typed domain services and contracts:

```text
PUBLIC UI
   ↓
Typed frontend data-access layer (`frontend/data-access/`)
   ↓
API / domain service contract (`MarketService`, `LocationService`, etc.)
   ↓
Backend service
   ↓
Database
```

- **Service Interfaces & Adapters:** Core services (`MarketService`, `LocationService`, `CategoryService`, `DiscoveryService`) implement abstract data source interfaces (`MarketDataSource`), backed by either local in-memory registry or remote REST API adapter.
- **Contract Boundary:** Incoming API responses are validated and shaped by domain validators (`validateMarketSummary`, `validatePaginatedMarketResponse`) before entering UI state. Non-published markets and private fields are strictly blocked.
- **API Failure Resilience:** Network or server outages trigger typed `ServiceUnavailableError` and explicit UI retry states rather than fabricating zero data.

### 7.2 Market Position Pricing Calculator & Floor Engine (`frontend/lib/pricing/`)
The Market Position Pricing Calculator is an API-ready, pure read-only domain service answering:
> *"What is the minimum qualifying amount required for this business to target this position in this market right now?"*

```text
Business Workspace / Public UI
        ↓
PricingService (`frontend/data-access/pricing/`)
        ├── LocalPricingDataSource
        └── ApiPricingDataSource (GET /api/markets/:marketId/pricing)
        ↓
PricingCalculator (`frontend/lib/pricing/calculator.ts`)
        ├── Whole Rupee Validator (`frontend/lib/pricing/money.ts`)
        ├── Strict Superseding & Capacity Rules (`frontend/lib/pricing/rules.ts`)
        └── RankingStateProvider (`frontend/lib/pricing/canonical-provider.ts`)
        ↓
Authoritative Typed Result (`MarketPricingResult`)
        ↓ [Strict Boundary: Informational Only / Zero Mutation]
[Future Bid Intent Creation]
        ↓
[Future Verified Payment Gateway Transaction]
        ↓
[Future Atomic Ranking Mutation]
```

- **Strict Separation of Concerns:** Pricing is calculation only. It never reserves positions, creates bids, locks amounts, charges cards, creates transactions, updates `MarketParticipation`, or emits `PositionHistory` records.
- **Strict Superseding & Whole Rupee Invariants:** Calculates exact whole rupee amounts (`minor % 100 === 0`). Occupied positions require `current + ₹1` (100 paise). Vacant positions use base entry floor (₹1,000).
- **Concurrency & Client Authority:** Pricing calculations are point-in-time informational quotes. Future bid intent/payment operations must recalculate authoritative ranking state server-side within a strict database transaction. Client calculations are never trusted for payment or ranking mutation.

## 8. Caching

Public content may be cached.

Ranking responses must have an explicit freshness policy because position data is dynamic.

Payment and account data must not be served from stale public caches.

## 9. Observability

Production systems should expose:

- structured logs
- request IDs
- payment IDs
- ranking operation IDs
- audit events
- error monitoring
- health checks

## 10. Taxonomy & Market Discovery Engine

The Taxonomy Engine is a domain service responsible for canonicalizing, resolving, and incrementally expanding the AageOnline market graph.

```text
inbound URL (locationSlug, categorySlug)
     │
     ▼
Normalization Layer (frontend/lib/taxonomy/normalization.ts)
  - generateSlug(), canonicalizeText()
  - findMatchingCity() — aliases, PIN codes, spelling variants
  - findMatchingCategory() — aliases, normalized form matching
     │
     ▼
Market Resolution Engine (frontend/lib/taxonomy/resolver.ts)
  - resolveMarket(locationSlug, categorySlug, options)
  - Returns: MarketResolutionResult
    { found, isPublished, isIndexable, contentReady, market, city, state, country, category }
     │
     ├─── PUBLISHED + INDEXABLE → serve rich market page
     ├─── PUBLISHED + NOINDEX   → serve market page with <meta robots=noindex>
     ├─── DRAFT / DISCOVERED    → 404 (page never served)
     └─── Not Found             → trigger DiscoveryRequest + 404
          │
          ▼
   Discovery System (frontend/lib/taxonomy/discovery.ts)
     - recordDiscoveryRequest()  with deduplication + requestCount++
     - rate-limiting per clientId
     - DiscoveryRequest → status: NEEDS_REVIEW
          │
          ▼
   Admin Governance (frontend/lib/taxonomy/admin-service.ts)
     - adminCreateCategory(), adminCreateCity(), adminCreateMarket()
     - adminPublishMarket(), adminSetMarketIndexability()
     - All mutations guarded by assertAdminAuthorized(actor: AdminActor)
     - All mutations produce AuditLogEntry (append-only)
          │
          ▼
   Audit Log (frontend/lib/taxonomy/audit.ts)
     - recordAuditLog() — immutable, append-only
     - getAuditLogs() — queryable by entityType, entityId, actor
```

### Lifecycle States

| Entity       | Status Dimension       | Valid Transitions |
|--------------|------------------------|-------------------|
| Market       | publicationStatus      | DISCOVERED → DRAFT → REVIEW → PUBLISHED → ARCHIVED |
| Market       | indexabilityStatus     | NOINDEX ↔ INDEXABLE (admin toggle) |
| Market       | contentStatus          | MISSING → DRAFT → READY → REVIEW → APPROVED |
| Discovery    | status                 | NEEDS_REVIEW → APPROVED / REJECTED / MAPPED / IGNORED |

### Anti-Doorway Invariant

No market URL is served unless:
1. `publicationStatus === 'PUBLISHED'`
2. `status === 'PUBLISHED'`

No market URL is indexed by search engines unless additionally:
3. `indexabilityStatus === 'INDEXABLE'`

Newly discovered markets always start as `DRAFT + NOINDEX` and require explicit admin approval to publish.

---

## 7.2 Dynamic Location Discovery & Reusable City Page Architecture

### Core Pattern
The public location architecture establishes a decoupled, data-driven hierarchy:
```text
PUBLIC UI (/[location], /locations)
       │
       ▼
Typed Frontend Data-Access Layer (LocationService, MarketService)
       │
       ▼
Pluggable Data Source Boundary (LocalLocationDataSource / ApiLocationDataSource)
       │
       ▼
Canonical Location Taxonomy & Market Registry (Database / In-Memory Store)
```

### City Page (`/[location]`) Invariants
1. **Dynamic Reusability:** One generic route `app/[location]/page.tsx` powers all published cities (`/jaipur`, `/delhi`, `/mumbai`, `/hisar`). No per-city page files exist.
2. **Dynamic Market Relationship:** Published markets in a city are queried dynamically via `marketService.getPublishedMarketsByLocation(citySlug)`. Adding a new published market immediately reflects on the next render with zero frontend code changes.
3. **Strict Local Category Derivation:** The categories shown on a City Page are derived strictly from published markets within that city. Global categories without published markets in that jurisdiction are never shown.
4. **Controlled Unavailable State:** Requesting an unlisted or zero-market city returns a clean Next.js `404` (`notFound()`). Internal taxonomy structures are never leaked.
5. **Dynamic Sitemap Inclusion:** Cities with at least one published market are dynamically enumerated into `sitemap.xml`. Unlisted or draft cities are excluded.

---

## 7.3 Dynamic Category Discovery & Reusable Category Page Architecture

### Core Pattern
The public category architecture establishes a decoupled, data-driven discovery hierarchy:
```text
PUBLIC UI (/categories, /categories/[category])
       │
       ▼
Typed Frontend Data-Access Layer (CategoryService, MarketService)
       │
       ▼
Pluggable Data Source Boundary (LocalCategoryDataSource / ApiCategoryDataSource)
       │
       ▼
Canonical Category Taxonomy & Market Registry (Database / In-Memory Store)
```

### Category Page (`/categories/[category]`) Invariants
1. **Dynamic Reusability:** One generic route `app/categories/[category]/page.tsx` powers all published categories (`/categories/interior-designers`, `/categories/restaurants`, `/categories/dentists`). No per-category page files exist.
2. **Dynamic Market & Location Aggregation:** Markets for a category are queried dynamically via `marketService.getPublishedMarketsByCategory(categorySlug)`. Municipal locations are derived dynamically from those published markets. Adding a new published market (`e.g., Hisar × Interior Designers`) immediately reflects on the next render with zero frontend code changes.
3. **No Global Rankings:** A Category Page is fundamentally a directory of city markets, not a competitive ranking page. Ranking is strictly scoped to `Location + Category` markets.
4. **Unknown Category Discovery:** Searching for unlisted categories triggers the deduplicated `DiscoveryService` workflow (`requestType: 'CATEGORY'`). Unlisted URLs return a controlled `404 Not Found` (`notFound()`).
5. **Dynamic Sitemap Inclusion:** Categories with at least one published market are dynamically enumerated into `sitemap.xml`. Unlisted, draft, or zero-market categories are strictly excluded.

---

## 7.4 Business Entity, Reusable Business Profile & Market Participation Architecture

### Core Pattern
The public business architecture establishes an independent, decoupled identity layer:
```text
                         AAGEONLINE
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ↓                   ↓                   ↓
      LOCATIONS           CATEGORIES           MARKETS
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ↓
                         BUSINESSES
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ↓                ↓                ↓
        Categories       Locations       Participation
                                              │
                                              ↓
                                            Market
                                              │
                                              ↓
                                      Future Ranking
                                              │
                                              ↓
                                      Future Payment
```

### Critical Domain Separation
The system strictly separates distinct concepts:
$$\text{Business} \neq \text{Market} \neq \text{MarketParticipation} \neq \text{Ranking Position} \neq \text{Payment}$$

1. **Business Identity:** Independent entity with canonical slug (`/businesses/[business]`), legal identity, and verification status. A business can exist with zero paid visibility and zero market participation.
2. **Market Participation:** An explicit relation connecting a Business to a Market (`businessId + marketId`), unique on composite keys. A business may participate in multiple markets across different cities.
3. **Ranking Separation:** Ranks are market-scoped numbers, never global awards. A business profile is never declared "#1 Interior Designer in India" — only "#3 in Jaipur × Interior Designers".
---

## 7.5 Authentication, Business Claim, Membership/RBAC & Business Workspace Architecture

### Secure Domain Relationship
```text
User
 ↓
BusinessMembership (OWNER | ADMIN | EDITOR | FINANCE)
 ↓
Business
 ↓
MarketParticipation
 ↓
(Future Bidding / Payment / Ranking)
```

### Key Architectural Boundaries

1. **Provider-Independent Authentication:**
   - Abstract `AuthDataSource` boundary cleanly decouples Next.js App Router and business logic from specific authentication vendors (Clerk, Supabase, NextAuth, OAuth).
   - In-memory development adapter (`LocalAuthDataSource`) and remote API adapter (`ApiAuthDataSource`) share identical contracts.
   - User identity represents the authenticated human actor; Business represents the commercial enterprise. They are never conflated into a single account.

2. **First-Class Business Claim Pipeline:**
   - Public businesses exist independently without authenticated owners.
   - Claim requests represent an auditable request for ownership relationship:
     $$\text{Business} \longrightarrow \text{Claim Request} \longrightarrow \text{Verification Desk} \longrightarrow \text{Approval} \longrightarrow \text{BusinessMembership}$$
   - Claim submission requires authenticated identity, references an existing canonical Business, prevents duplicate active claims, and enforces strict state transitions.
   - Claim approval atomically provisions an `ACTIVE` `OWNER` `BusinessMembership`.

3. **Centralized RBAC Engine:**
   - Authoritative evaluations occur server-side (`assertAuthorized()`). Client checks exist purely for UX.
   - Enforces composite uniqueness on `(businessId, userId)`. A user can hold only one membership per business, but can belong to multiple businesses concurrently.
   - Roles:
     - `OWNER`: Full business control, ownership transfer, member management, financial transactions.
     - `ADMIN`: Operational management, profile updates, member invitations, market participations.
     - `EDITOR`: Content and profile information management.
     - `FINANCE`: Reserved exclusively for future financial visibility (invoices, transaction logs).

4. **Business Workspace (`/business/dashboard`):**
   - Strictly protected route requiring authenticated session and active business membership.
   - Resolves multi-business context with server-side validation; supports business context switching without trusting client URL parameters.
   - Truthful metrics only: displays active and eligible market participation counts; strictly disallows fabricated impression, click, ROI, or global rank numbers.
   - Discloses transparent paid visibility notices across all market positioning displays.
   - Excluded from search indexing (`noindex, nofollow`).

---

## 11. Authenticated Bid Intent Creation & Idempotency Boundary (Milestone 0.11.0)

### 11.1 Domain Separation & Architecture Boundary

```text
READ-ONLY PRICING CALCULATION
              ↓
  POST /api/bid-intents
  (Authoritative server re-evaluation + Idempotency boundary)
              ↓
     IMMUTABLE BID INTENT
   (status: PENDING_PAYMENT)
              ↓
     [FUTURE PAYMENT GATEWAY]
              ↓
  [FUTURE ATOMIC RANKING MUTATION]
```

AageOnline strictly separates the user's intent to pursue paid visibility from actual financial transactions and ranking mutations:
$$\text{BidIntent} \neq \text{Payment} \neq \text{Bid} \neq \text{Position Reservation} \neq \text{Ranking Mutation}$$

Creating a `BidIntent`:
- **Does NOT** process or collect payments (no Razorpay/Stripe, orders, ledgers, or charges).
- **Does NOT** reserve the target position (#1, #2, etc.) for the business.
- **Does NOT** modify `MarketParticipation.currentPosition`, qualifying amounts, or `PositionHistory`.
- **Does NOT** alter public market rankings.

### 11.2 Authoritative Creation Flow & Server-Side Pricing Re-evaluation

Between the moment a client views a pricing calculation and creates an intent, market ranking may shift. The server re-evaluates pricing authoritatively at creation time:

```text
1. User Session Authenticated
2. Resolve Active BusinessMembership (enforces OWNER or ADMIN role)
3. Validate Target Market (PUBLISHED status required)
4. Validate Target Position (positive integer, <= active capacity)
5. Authoritative Pricing Re-evaluation (via PricingCalculator)
6. Stale Pricing Detection: If client provided an outdated amount, reject with 409 PRICING_CHANGED
7. Idempotency Check: Scoped by actorUserId + businessId + idempotencyKey
8. Record Immutable BidIntent & PricingSnapshot (status: PENDING_PAYMENT, TTL: 15 min)
9. Record BID_INTENT_CREATED in append-only Audit Log
```

### 11.3 Idempotency Architecture

- **Mandatory Header:** `Idempotency-Key` (client-generated unique string).
- **Scope:** Key resolution is strictly scoped to `(actorUserId, businessId, idempotencyKey)`. A key cannot cross user or business contexts.
- **Identical Retry:** An exact retry returns the existing `BidIntent` without creating duplicate records or emitting duplicate audit log entries.
- **Payload Conflict:** Reusing a key with a conflicting target position, market, or business results in `409 IDEMPOTENCY_KEY_REUSED`.
- **Future Database Constraint:**
  ```sql
  CONSTRAINT uq_bid_intents_idempotency UNIQUE (created_by_user_id, business_id, idempotency_key);
  ```

### 11.4 Expiration & Lifecycle State Machine

- **Default TTL:** 15 minutes (`BID_INTENT_TTL_MINUTES = 15`).
- **States:**
  - `PENDING_PAYMENT`: Initial creation state. Valid for future payment handoff until `expiresAt`.
  - `EXPIRED`: System or query time exceeds `expiresAt`. Cannot be used for payment handoff.
  - `CANCELLED`: Explicitly cancelled by authorized member (`OWNER` / `ADMIN`) prior to expiration.
- **Cancellation:** Emits `BID_INTENT_CANCELLED` audit event. Zero financial consequences since no payment occurred.

---

## 12. PayU Payment Gateway Integration & Payment State Boundary (Milestone 0.12.0)

### 12.1 Objective & System Boundary
Milestone 0.12.0 establishes the production-oriented payment boundary between the authenticated `BidIntent` and the future atomic ranking engine.

```text
Business Workspace
      │
      ▼
Pricing Engine
      │
      ▼
BidIntent (PENDING_PAYMENT)
      │
      ▼
Payment Order Service
      │
      ▼
PaymentGatewayDataSource Abstraction
      │
      ▼
PayU India Gateway (Hosted Checkout)
      │
      ▼
PayU Webhook (Server-to-Server) / Verification API
      │
      ▼
Verified Payment State (PaymentOrder: SUCCEEDED)
      │
      X  [CRITICAL BOUNDARY: ZERO RANKING MUTATION IN 0.12.0]
      │
      ▼
[FUTURE MILESTONE 0.13.0]
Atomic Ranking Engine & Position History Mutation
```

### 12.2 Decoupled Provider Architecture
Payment processing is isolated behind provider-agnostic domain interfaces:
```text
Payment Domain (frontend/types/payment.ts)
     │
     ▼
PaymentGatewayDataSource (frontend/lib/payments/types.ts)
     ├── PayUPaymentGateway (frontend/lib/payments/payu/adapter.ts)
     └── [Future Gateway Adapter]
```
The internal workspace UI, `BidIntent` domain, state machine, and future ranking engine depend strictly on `PaymentOrder` and `ProviderPaymentResult`, never on PayU-specific response schemas or field layouts.

### 12.3 PayU Integration Specifications
- **Selected Integration Flow:** PayU India Hosted Checkout (`_payment`) with SHA-512 request hashing.
- **Request Hash Formula:**
  `sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)`
- **Webhook Reverse-Hash Verification:**
  `sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)`
  (or prefixed with `additionalCharges|` when present).
- **Constant-Time Verification:** Hash comparisons use constant-time byte comparison (`crypto.timingSafeEqual`) to prevent timing side-channels.
- **Server-Side Verification API:** Reconciliation uses PayU's Verify Payment API (`verify_payment` command with SHA-512 authentication) as server-to-server truth.
- **Browser Return Callback:** The browser return route (`/api/payments/callback/payu`) is untrusted. It receives transaction tokens, verifies against PayU server-to-server or recorded state, and redirects the user to the workspace. Browser state is never authoritative.

### 12.4 Financial & Architectural Invariants
1. **Zero Ranking Mutation:** Verified payment in Milestone 0.12.0 does not mutate `MarketParticipation.currentPosition`, `ranking_entries`, or `PositionHistory`.
2. **Whole Rupee Invariant:** All payments strictly enforce `amountMinor % 100 === 0` (positive integers in INR). Decimal amounts are rejected without rounding.
3. **Server-Derived Amounts:** The payment amount is read directly from `BidIntent.qualifyingAmountMinor`. Client amounts are ignored.
4. **Scoped Idempotency:** Payment order creation is scoped by `actorUserId:::businessId:::bidIntentId:::idempotencyKey`.
5. **No Secret Leakage:** Merchant salt and secrets remain strictly server-side in environment variables (`PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`).

---

## 13. Atomic Ranking Settlement Engine (Milestone 0.13.0)

### 13.1 Production Architecture & Transaction Boundary

Milestone 0.13.0 connects independently confirmed payments to an atomic, transaction-safe, idempotent ranking settlement boundary:

```text
PaymentOrder = CONFIRMED
        │
        ▼
Ranking Settlement Service (`frontend/lib/ranking-settlement/settlement-service.ts`)
        │
        ▼
BEGIN TRANSACTION (Market-Level Concurrency Lock)
        │
  ┌─────┴────────────────────────────────────────────────┐
  │ 1. Re-read authoritative Market, Business & BidIntent │
  │ 2. Re-read live MarketParticipations inside lock      │
  │ 3. Validate strict qualification (paid > incumbent)  │
  └─────┬────────────────────────────────────────────────┘
        │
        ▼
Pure Calculation Engine (`calculateSettlementPlan`)
        │
  ┌─────┴────────────────────────────────────────────────┐
  │ - Target business placement plan                     │
  │ - Incumbent displacement & downward shifting plan    │
  │ - Validates capacity (<= 100) & uniqueness bounds    │
  └─────┬────────────────────────────────────────────────┘
        │
        ▼
Atomic Mutations (In-Transaction)
        │
  ├── Mutate target `MarketParticipation` (position & qualifying amount)
  ├── Shift affected incumbent `MarketParticipations`
  ├── Append immutable `PositionHistory` records for all shifted entities
  ├── Persist `RankingSettlement` entity (status: `SETTLED`)
  └── Record audit events (`RANKING_POSITION_CHANGED`, `RANKING_SETTLEMENT_SUCCEEDED`)
        │
        ▼
COMMIT TRANSACTION
        │
  ┌─────┴────────────────────────────────────────────────┐
  │ - Release market-level lock                          │
  │ - Public reads reflect updated positions immediately │
  │ - Settlement reaches immutable terminal state        │
  └──────────────────────────────────────────────────────┘
```

### 13.2 Separation of Calculation and Persistence
To guarantee testability and zero side-effects during planning, ranking calculation is implemented as a pure function:
```ts
calculateSettlementPlan(input: {
  marketId: string;
  targetBusinessId: string;
  targetPosition: number;
  paidAmountMinor: number;
  paidAmountRupees: number;
  currentRankings: Array<{ position: number; businessId: string; qualifyingAmountRupees: number }>;
}): RankingMutationPlan
```
The resulting `RankingMutationPlan` is strictly validated (no duplicate positions, positive integers, capacity bounds) before being applied to persistent storage inside the transaction boundary.

### 13.3 Concurrency & Isolation Strategy
- **PostgreSQL Production Contract:**
  Transactions execute with `READ COMMITTED` or `REPEATABLE READ` isolation, acquiring exclusive row-level locks on the target market entity:
  ```sql
  SELECT id FROM markets WHERE id = $1 FOR UPDATE;
  ```
  This serializes concurrent settlements within the same market while allowing independent settlements across distinct markets to proceed in parallel.
- **Local Memory Simulation:**
  A market lock set (`ACTIVE_MARKET_LOCKS`) serializes concurrent executions with exponential backoff / queueing. Deep snapshot cloning (`cloneMarketParticipationsStore`, `clonePositionHistoryStore`) provides rollback fidelity.

### 13.4 Rollback & Financial Separation Invariants
1. **Financial Independence:** Failure during ranking mutation does not alter `PaymentOrder.status = 'CONFIRMED'`. Paid money remains confirmed; only settlement transitions to `RETRYABLE` (transient failure) or `FAILED` (business conflict).
2. **All-or-Nothing Atomicity:** If any step fails (e.g. failure writing PositionHistory or settlement record), the entire transaction aborts and restores pre-transaction ranking state. Zero partial mutations occur.
3. **No Automatic Refunds or Charging:** If market state shifted between intent creation and settlement such that the paid amount is insufficient to displace the new incumbent, the settlement is marked `FAILED` with `failureReason = 'RANKING_TARGET_NO_LONGER_ACHIEVABLE'`. No extra funds are charged and no refunds are automatically issued in V1.

---

## 14. Production PostgreSQL Persistence & Settlement Recovery Architecture (Milestone 0.14.0)

### 14.1 End-to-End Durable Processing Flow

```text
PayU Hosted Checkout
         │
         ▼
Webhook Callback (`/api/payments/webhooks/payu`) / Server Verification
         │
   ┌─────┴────────────────────────────────────────────────┐
   │ 1. Validate reverse SHA-512 hash fingerprint        │
   │ 2. Deduplicate via `uq_payment_provider_events`      │
   │ 3. Update `PaymentOrder.status = 'CONFIRMED'`        │
   │ 4. Transactionally enqueue `settlement_recovery_jobs`│
   └─────┬────────────────────────────────────────────────┘
         │
         ▼
Immediate Synchronous Settlement Attempt
         │
         ├─── SUCCESS ──► Mark job `COMPLETED`, return 200 OK
         │
         └─── TRANSIENT FAILURE (Timeout / DB lock contention / Worker crash)
                     │
                     ▼
Durable Recovery Worker (`/api/admin/settlement-recovery`)
         │
   ┌─────┴────────────────────────────────────────────────┐
   │ 1. Poll `settlement_recovery_jobs`                   │
   │    `SELECT ... FOR UPDATE SKIP LOCKED`               │
   │    WHERE status IN ('PENDING', 'RETRYABLE')          │
   │ 2. Claim job, transition status to `PROCESSING`      │
   │ 3. Invoke canonical `settleRanking()`                │
   └─────┬────────────────────────────────────────────────┘
         │
         ▼
PostgreSQL Ranking Transaction Boundary (`PostgresRankingTransactionContext`)
         │
   ┌─────┴────────────────────────────────────────────────────────┐
   │ BEGIN;                                                       │
   │ SELECT id FROM markets WHERE id = $1 FOR UPDATE;             │
   │ - Re-verify PaymentOrder is CONFIRMED                        │
   │ - Re-read active market participations & qualifying amounts  │
   │ - Revalidate displacement rules (paid > incumbent)           │
   │ - Calculate mutation plan                                    │
   │ - Update market_participations                               │
   │ - INSERT INTO position_history (append-only)                 │
   │ - INSERT INTO ranking_settlements (status = 'SETTLED')       │
   │ - INSERT INTO audit_logs                                     │
   │ COMMIT;                                                      │
   └─────┬────────────────────────────────────────────────────────┘
         │
         ├─── COMMIT SUCCESS ──► Mark job `COMPLETED`, audit logged
         │
         └─── ERROR / ROLLBACK
                     │
                     ├─── Transient DB Error: Mark job `RETRYABLE`, backoff `next_run_at`
                     └─── Business Conflict: Mark job `FAILED`, record `last_error`
```

### 14.2 Production Persistence Guard

To guarantee that real payments are never processed against non-durable in-memory stores in production environments:
- `assertProductionPersistence()` is wired into every financial mutation entry point (`createBidIntent`, `createPaymentOrder`, `processPayUWebhook`, `reconcilePaymentOrder`, `settleRanking`).
- If `NODE_ENV=production` or `PERSISTENCE_MODE=postgres` and `DATABASE_URL` is missing, the request is immediately rejected with an explicit operational error, preventing unsafe live money processing.
- The readiness endpoint (`GET /api/admin/readiness`) verifies database connectivity, migration application, and provider configurations before allowing traffic.

## 15. Administrative Operations & Autonomous Reconciler Architecture

Milestone 0.15.0 establishes an observable, recoverable, and autonomous operations layer protecting financial integrity and guaranteeing that confirmed payments are never lost.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ADMINISTRATIVE OPERATIONS                             │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                                                        │
         ▼                                                        ▼
Interactive Admin Operator                              Autonomous Reconciler Worker
  • Role: ADMIN / SUPERADMIN                             • Standalone CLI / Cron Runner
  • Auth: Session + Server RBAC                          • Auth: Worker Secret / Internal
  • Actions: View Queues, Manual Reconcile,               • Actions: Periodic Sweeps,
    Retry Eligible Jobs, Readiness Audit                   Heartbeat Emits, Durable Logs
         │                                                        │
         └─────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
          ┌──────────────────────────────────────────────────┐
          │      Administrative Authorization Boundary       │
          │  • assertPlatformAdmin(actor)                    │
          │  • verifyWorkerSecret(req) (timingSafeEqual)     │
          └────────────────────────┬─────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
1. Payment Reconciliation Cycle            2. Settlement Recovery Outbox Cycle
  • Discover stuck PENDING orders (>2m)      • Poll settlement_recovery_jobs
  • Out-of-band PayU verification            • SELECT ... FOR UPDATE SKIP LOCKED
  • Integer minor units & currency check     • Invoke canonical settleRanking()
  • Update PaymentOrder idempotently         • Atomic commit: ranking + position_history
  • On CONFIRMED: enqueue recovery job         + settlement record + audit_log
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   │
                                   ▼
                  PostgreSQL Advisory Session Lock
                   pg_try_advisory_lock(829104812)
                   (Prevents overlapping workers)
                                   │
                                   ▼
                  Durable Persistence & Telemetry
            ├── reconciliation_runs (run history & counters)
            ├── worker_heartbeats (liveness tracking)
            └── audit_logs (append-only operator actions)
```

### 15.1 Administrative Authorization Boundary
- Server-side resolution only: Client-supplied roles or admin flags are strictly rejected.
- Actor roles are enforced via `assertPlatformAdmin(actor)` requiring `role === 'ADMIN' | 'SUPERADMIN'` or server-side verified email matching `PLATFORM_ADMIN_EMAILS`.
- Background invocations (e.g. cron triggers) authenticate via `verifyWorkerSecret(req)` using constant-time comparison (`crypto.timingSafeEqual`) against `ADMIN_WORKER_SECRET` or `CRON_SECRET`.

### 15.2 Autonomous Reconciler Worker & Concurrency Model
- The background reconciler runs outside of web request lifecycles (`scripts/worker.ts`), executing via `npm run worker` (daemon) or `npm run worker:once` (cron).
- In multi-instance environments, the reconciler acquires a PostgreSQL session-level advisory lock (`pg_try_advisory_lock(829104812)`). If another instance is currently running, the attempt yields safely without overlapping execution or CPU waste.
- Each cycle performs:
  1. **Payment Reconciliation:** Discovers payments unresolved for $\ge 2$ minutes, queries PayU payment status outside the ranking transaction, updates status idempotently, and enqueues settlement recovery if confirmed.
  2. **Settlement Recovery:** Claims eligible jobs from `settlement_recovery_jobs` using `FOR UPDATE SKIP LOCKED`, re-verifies invariants within market locks, and commits ranking updates atomically.
  3. **Heartbeat & Telemetry:** Records liveness into `worker_heartbeats` and audit metrics into `reconciliation_runs`.

### 15.3 Fail-Closed Financial Invariants
- Browser callbacks or redirects are never authoritative.
- PayU verification occurs outside any PostgreSQL ranking transaction to eliminate lock contention on external HTTP latency.
- Ranking mutations occur strictly within `withRankingTransaction` with market row locks.
- A failed ranking settlement leaves the payment order strictly `CONFIRMED`—it never modifies financial truth.

---

## 16. Search Engine Visibility & Market Discovery Automation (Milestone 0.17.0)

### 16.1 Centralized SEO Eligibility Pipeline

To protect index quality and prevent thin, doorway, draft, or fabricated pages from entering search engines, all public indexing decisions are evaluated through a centralized, typed policy engine (`frontend/lib/seo/eligibility.ts`).

```text
Platform Candidate URL (Static, Location, Category, Market, Business)
                             │
                             ▼
              evaluateSeoEligibility(candidate)
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
[Gate 1: Private Route]   [Gate 2: Query String] [Gate 3: Taxonomy Match]
(/admin, /auth, /api...)  (Stripped/Disallowed)   (Valid Country/City/Cat)
       │                     │                     │
       ▼                     ▼                     ▼
[Gate 4: Publication]     [Gate 5: Indexability] [Gate 6: Content Quality]
(Must be PUBLISHED)       (Explicit INDEXABLE)   (APPROVED / Not THIN)
       │                     │                     │
       ▼                     ▼                     ▼
[Gate 7: Genuine Data]    [Gate 8: Child Count]
(Has real verified entity)(>0 active children for hubs)
                             │
                             ▼
         Eligible Canonical URL → Dynamic Sitemap / Meta Tags
```

### 16.2 Authoritative Dynamic Sitemap Generation

- Dynamic generation via `frontend/app/sitemap.ts` calling `generateAuthoritativeSitemap()`.
- Reads verified, published entities directly from database and service layers.
- Uses exact, authentic `updatedAt` timestamps; never fabricates current timestamps (`new Date()`).
- Normalizes canonical URLs against authoritative `APP_URL` origin (strictly rejects `localhost` in production).
- Strips query strings, deduplicates canonical URLs, and produces SHA-256 checksums for operational verification.

### 16.3 Structured Data (JSON-LD) Integrity
- Defined in `frontend/lib/seo/schema.ts` for `WebSite`, `Organization`, `BreadcrumbList`, `ItemList`, and `LocalBusiness`.
- `ItemList` entries for ranked markets strictly enforce paid-visibility disclosures (`positionDisclosureText` explaining transparent paid ranking placement).
- `LocalBusiness` schema is only emitted for verified businesses with complete physical data. Never claims AageOnline is a local business in every city.
- Rating and review schemas are strictly excluded until genuine verified reviews are implemented in the platform.

### 16.4 Market Discovery Health Auditing
- Admin-triggered discovery auditor (`frontend/lib/seo/discovery-audit.ts`) scans the platform for missing metadata, duplicate slugs, thin doorway pages, and approved location/category combinations that lack active market records.
- Flags unreviewed discovery opportunities for human operator review without auto-publishing unverified records.

---

## 17. Performance, Caching & Edge Optimization Architecture (Milestone 0.18.0)

### 17.1 Tiered Cache Policy Matrix

| Tier | Route Family | Header Contract | Max Stale / TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **A. Static Content** | Versioned assets, guides | `public, max-age=31536000, immutable` | Static | Code deployment |
| **B. Taxonomy & Hubs** | `/locations`, `/categories`, `/markets` | `public, max-age=300, s-maxage=300, stale-while-revalidate=600` | 5 min | Admin publish / archive |
| **C. Market Rankings** | `/[location]/[category]` | `public, max-age=60, s-maxage=60, stale-while-revalidate=120` | 60 sec | Settlement commit |
| **D. Dynamic Sitemap** | `/sitemap.xml` | `public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200` | 1 hour | Publication mutation |
| **E. Business Workspace**| `/business/dashboard/**` | `private, no-cache, no-store, max-age=0, must-revalidate` | 0 sec (Dynamic) | None (User-scoped) |
| **F. Financial & Pricing**| `/api/markets/*/pricing`, `/api/payments/**` | `private, no-cache, no-store, max-age=0, must-revalidate` | 0 sec (Dynamic) | None (Real-time) |
| **G. Admin Operations** | `/admin/**`, `/api/admin/**` | `private, no-cache, no-store, max-age=0, must-revalidate` | 0 sec (Dynamic) | None (Admin-only) |

### 17.2 Post-Commit Ranking Freshness & Durable Invalidation Flow

To satisfy the invariant that cache invalidation must never execute on uncommitted transactions or roll back confirmed financial operations:

```text
1. Execute Canonical Settlement Transaction (`withRankingTransaction`)
   ├── Acquire PostgreSQL row lock (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`)
   ├── Mutate `market_participations` with displacement plan
   ├── Write append-only `position_history` and `ranking_settlements`
   └── Write transactional `ranking_change_events` outbox
2. Commit Transaction (`tx.commit()`)
3. Post-Commit Invalidation (`triggerMarketRankingInvalidation`)
   ├── Increment monotonic market cache version in registry
   ├── Safely trigger App Router revalidation (`revalidatePath`, `revalidateTag`)
   ├── Append operational audit event (`MARKET_RANKING_CACHE_INVALIDATED`)
   └── On failure: Enqueue to durable `cache_invalidation_jobs` outbox table in PostgreSQL
       (Survives process/container restarts; worker sweeps with FOR UPDATE SKIP LOCKED;
        NEVER aborts or reverts committed settlement)
```

### 17.3 Edge Middleware & Privacy-Preserving Rate Limiting

Next.js Edge Middleware (`middleware.ts`) provides perimeter protection:
- **Client Token Hashing:** Derives deterministic SHA-256 token from client IP + server salt (`AUTH_SECRET` / `RATE_LIMIT_SALT`). Raw IP addresses are strictly excluded from memory caches and logs.
- **Anti-Spoofing Proxy Validation:** Evaluates `X-Forwarded-For` only when requests originate from verified trusted proxies (`TRUSTED_PROXY_IPS`). Untrusted client-supplied headers are stripped or ignored.
- **Route Tiers:**
  - `PUBLIC_DISCOVERY`: 120 requests / minute.
  - `SEARCH_API`: 40 requests / minute.
  - `AUTH_AND_PAYMENTS`: 15 requests / minute.
  - `ADMIN_OPERATIONS`: 30 requests / minute.
- **Crawler Authorization:** Crawler headroom (2x) is granted strictly when verified edge headers (`cf-verified-bot`, `x-verified-bot`) are present. Unverified requests claiming bot User-Agents receive standard public limits.
- **Distributed Store with Safe Degradation:** Counters are stored atomically in PostgreSQL `rate_limit_counters` across instances. During database outages, rate limiting degrades safely to process-local memory counters to avoid blocking legitimate traffic.
- **HTTP 429 Protocol:** Returns structured JSON with `Retry-After: <seconds>`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

---

## 18. Distributed State & Durable Recovery (Milestone 0.19.0)

### 18.1 Multi-Instance Runtime Model
- **Container / Instance Topology:** Multiple stateless web containers behind a reverse proxy / load balancer. Instances share no filesystem or process memory.
- **Shared Source of Truth:** Managed PostgreSQL 16+ is the sole authoritative state store.
- **Reconciler Worker Process:** Independent worker instances poll durable queues (`outbox_events`, `settlement_recovery_jobs`, `cache_invalidation_jobs`) using `FOR UPDATE SKIP LOCKED`.
- **Worker Heartbeats:** Worker activity and health metrics are recorded in `worker_heartbeats` for central operational observability.







