# AageOnline — Verification Matrix & Security Test Strategy

## 1. Quality & Security Assurance Philosophy

AageOnline implements a verification-first test harness. The security of the payment-to-ranking pipeline is subject to rigorous automated verification.

---

## 2. Mandatory Security Test Suite (20 Core Scenarios)

Every PR, release candidate, and architectural iteration must pass the following 20 core security scenarios:

| ID | Test Scenario | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **SEC-01** | **Lower Bid Rejected** | Offered amount < current qualifying amount fails validation | Returns `422 INVALID_BID_QUALIFICATION`; zero DB mutation |
| **SEC-02** | **Equal Bid Rejected** | Offered amount == current qualifying amount fails validation | Returns `422 INVALID_BID_QUALIFICATION`; zero DB mutation |
| **SEC-03** | **Higher Bid Accepted** | Offered amount > current qualifying amount is accepted | Returns 200 with valid payment intent |
| **SEC-04** | **Unpaid Mutation Rejected** | Direct attempt to mutate rank without confirmed payment | Returns `403 Forbidden` / `401 Unauthorized`; zero mutation |
| **SEC-05** | **Forged Client Callback** | Client redirects with `?payment=success` or modified state | Ignored by backend; rank updates ONLY on verified webhook |
| **SEC-06** | **Forged Webhook Signature**| Webhook payload with invalid or missing HMAC signature | Returns `401 UNVERIFIED_WEBHOOK_SIGNATURE`; zero DB update |
| **SEC-07** | **Replayed Webhook Idempotency**| Same valid webhook delivered twice | First updates rank; second returns `200 OK` with zero duplicate shift |
| **SEC-08** | **Duplicate Submission Guard**| Double-click on payment/bid button with same Idempotency-Key | Single transaction created; duplicate request returns cached result |
| **SEC-09** | **Concurrent Bid Collision** | Two users bid for position #1 simultaneously | One transaction commits; second transaction rejected with `409` |
| **SEC-10** | **BOLA Business Manipulation** | User A submits bid for User B's business | Returns `403 UNAUTHORIZED_BUSINESS_ACCESS`; security alert logged |
| **SEC-11** | **BOLA Transaction Access** | User A queries User B's private transaction history | Returns `403 Forbidden` or `404 Not Found` |
| **SEC-12** | **Direct API Ranking Injection**| Attacker bypasses frontend with custom `curl` script | Server independently enforces price, auth, and webhook rules |
| **SEC-13** | **Privilege Escalation Attack**| Non-admin user calls `/api/v1/admin/*` endpoints | Returns `403 Forbidden`; logged to security audit log |
| **SEC-14** | **Invalid Amount Injection** | Bid with 0, negative, NaN, Infinity, decimal, string, float | Rejection at type/schema layer; fails closed safely |
| **SEC-15** | **Currency Mismatch Attack** | Gateway payment executed in USD or EUR | Webhook checks `currency === 'INR'`; rejects transaction |
| **SEC-16** | **Expired Transaction Rejection**| Webhook arrives after hold window (120s) elapsed | Handled via reconciliation protocol; rank not silently moved |
| **SEC-17** | **Cancelled Transaction Lock** | User cancels payment on provider modal | Transaction moves to `CANCELLED`; cannot be re-activated |
| **SEC-18** | **Failed Payment Safety** | Provider reports `payment.failed` | Transaction marked `FAILED`; ranking remains untouched |
| **SEC-19** | **Network Retry Deduplication** | Network timeout during API fetch retries request | `Idempotency-Key` prevents duplicate transaction row |
| **SEC-20** | **Authoritative Position Derivability** | Audit query checks: "Why is business X at rank #N?" | Exact transaction, amount, timestamp, and cause verifiable |

---

## 3. Concurrency Verification Harness

A concurrency test fixture simulates:
- 10 virtual users simultaneously attempting to purchase position #1 in market `Jaipur + Interior Designers`.
- Execution asserts that:
  - Exactly 1 user successfully claims position #1 at their bid price.
  - Exactly 9 users receive `409 TARGET_POSITION_SUPERSEDED` with updated required floors.
  - The database maintains zero duplicate ranks (`COUNT(DISTINCT position) == COUNT(*)`).
  - Positions shift deterministically with zero gaps.

---

## 4. Accessibility (WCAG 2.2 AA) Verification

- 100% keyboard navigable without mouse.
- Visible focus rings with minimum 3:1 contrast against surface.
- Screen reader announcements using `aria-live="polite"` for dynamic rank notifications.
- All touch targets meet or exceed $44 \times 44\text{px}$.
- Motion respects `prefers-reduced-motion` media queries.

---

## 5. SEO / AEO / GEO Verification

- HTML documents render critical content without waiting for client JavaScript hydration.
- Structured data validation: WebSite, Breadcrumbs, and ItemList JSON-LD contain transparent paid visibility disclosures.
- Robots.txt and sitemap.xml dynamically updated with canonical URLs.

---

## 6. Security Acceptance Gate

No code may be merged or deployed if any of the 20 security scenarios fail, or if synthetic Lighthouse scores degrade Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1).

---

## 7. Data-Access Layer & Public Contract Test Matrix

Automated test suites (`frontend/tests/data-access.test.ts` & `frontend/tests/markets-directory.test.ts`) verify:
- **Publication Invariant Enforcement:** `getPublishedMarkets()` excludes draft, review, and archived markets.
- **Pagination & Determinism:** Slices respect `page` and `pageSize`; sorting conforms to `qualifying_amount_desc`.
- **Search & Filter Resolution:** Exact city, category, combined pair, and empty/unregistered queries resolve deterministically.
- **Discovery Deduplication:** Repeat discovery queries increment count without creating duplicate records.
- **Validation Boundary:** Malformed records, missing IDs/slugs, or non-published states throw `DataValidationError`.
- **API Outage Resilience:** Remote adapter throws typed `ServiceUnavailableError`, triggering error boundaries rather than zero-data illusions.

---

## 8. Locations Directory & Reusable City Page Test Matrix

Automated test suite (`frontend/tests/locations-directory.test.ts`) validates:
- **Location Domain Contract:** `LocationSummary` provides strongly typed IDs, slugs, state/country relations, and active market counts.
- **Slug Resolution & Aliases:** Canonical city slugs (`/jaipur`, `/delhi`, `/mumbai`) and aliases (`pink city`, `bombay`) resolve accurately.
- **Dynamic Market Aggregation:** Publishing new markets in a city automatically increments market counts and derives categories on the city page with zero code modifications.
- **Controlled 404 Response:** Non-existent or zero-market cities return 404.
- **Location Discovery Pipeline:** Unlisted cities return `found: false` with discovery triggers; repeat requests deduplicate.
- **Dynamic Sitemap Verification:** Indexable cities are dynamically enumerated into `sitemap.xml`.
- **Regression Integrity:** The 6 seed markets and `/markets` directory continue to resolve with 100% test pass rate.

---

## 9. Categories Directory & Reusable Category Page Test Matrix

Automated test suite (`frontend/tests/categories-directory.test.ts`) validates:
- **Category Domain Contract:** `CategorySummary` provides strongly typed IDs, names, slugs, descriptions, active market counts, and public URLs.
- **Deterministic Sorting:** Categories sort primarily by `activeMarketCount` descending, with alphabetical name tie-breaking.
- **Slug Resolution & Aliases:** Canonical category slugs (`/categories/interior-designers`, `/categories/restaurants`) and aliases (`interior designer`, `restaurant`) resolve accurately.
- **Dynamic Category → Market & Location Derivation:** Locations on a Category Page are derived strictly from published markets in that category. Publishing a new market (`Hisar × Interior Designers`) immediately adds the location without code changes.
- **Emerging Category Transitions:** When an unlisted category (`dentists`) is published with a market, it dynamically transitions into public discovery and sitemap inclusion.
- **Controlled 404 Response:** Non-existent or zero-market categories return 404.
- **Category Discovery Pipeline:** Unlisted categories return `found: false` with discovery triggers; repeat requests deduplicate without data corruption.
- **Related Categories Aggregation:** Deterministic published category recommendations excluding current category.
- **Regression Safeguards:** The 6 seed markets and `/categories` count remain fully intact and accurate.

---

## 10. Business Entity, Reusable Profile & Market Participation Test Matrix

Automated test suite (`frontend/tests/businesses-domain.test.ts`) validates:
- **Business Identity & Slugs:** Canonical slug resolution (`/businesses/royal-interiors-jaipur`), independent identity, and unlisted business 404 boundary.
- **Publication & Verification Lifecycle:** DRAFT and ARCHIVED businesses are excluded from public directory; VERIFIED status badge renders accurately.
- **Market Participation Relationship:** Explicit $\text{Business} + \text{Market}$ mapping, composite key uniqueness (`businessId + marketId`), and unpublished market isolation.
- **Ranking Separation:** Unranked participants render `currentPosition === null` with "Participating in this market"; ranked participants render market-scoped `#N` without global claims.
- **Mandatory Dynamic Proof 1:** Multi-market expansion (Jaipur $\rightarrow$ Delhi $\rightarrow$ Mumbai) reflects immediately on business profile with zero code edits.
- **Mandatory Dynamic Proof 2:** Multiple businesses participate in the same market independently without shared ranking mutations.
- **Mandatory Dynamic Proof 3:** A business can exist with category and location without any market participation (zero inferred markets).
- **Mandatory Dynamic Proof 4:** A single canonical business entity participates across multiple markets without profile fragmentation.
- **Unknown Business Discovery:** Searches for unlisted businesses trigger deduplicated `BUSINESS` discovery requests with rate limiting and zero direct DB mutation.

---

## 11. Authentication, Claim, Membership/RBAC & Business Workspace Test Matrix

Automated test suite (`frontend/tests/auth-rbac-workspace.test.ts`) validates:
- **Authentication Abstraction:** In-memory user store, active session tokens, expiration handling, session invalidation on sign-out, and suspension invariants.
- **Centralized RBAC Engine:** Pure permission matrix evaluation across all roles (`OWNER`, `ADMIN`, `EDITOR`, `FINANCE`), asserting that `can()` returns true only for authorized actions and `assertAuthorized()` throws 401/403 respectively.
- **Business Claim Lifecycle:**
  - Authenticated claimant required; unauthenticated submissions rejected.
  - References valid canonical business; non-existent business rejected.
  - Deduplication prevents multiple active claims for the same `(businessId, claimantUserId)`.
  - Claim submission does not grant immediate ownership.
  - Claim approval atomically provisions an `ACTIVE` `OWNER` `BusinessMembership`.
  - Claim rejection records auditable `rejectionReason` and grants zero membership.
  - Valid transitions strictly enforced; invalid state machine transitions rejected.
- **Business Membership Integrity:** Composite uniqueness on `(businessId, userId)`, role mutations without duplicate record creation, and multi-user concurrent memberships.
- **Cross-Business Isolation:**
  - User A cannot access Business B (returns 403).
  - User A cannot update profile of Business B (unauthorized).
  - User without memberships receives 403 on workspace entry.
  - Server evaluates business identity server-side, ignoring client URL manipulation.
- **Business Workspace & Metrics Truthfulness:** Truthful active market counts, truthful paid position status (#N in market or unranked), truthful empty visibility state, and profile editing with append-only audit logging.

---

## 12. Market Position Pricing Calculator & Floor Engine Test Matrix

Automated test suite (`frontend/tests/pricing-engine.test.ts` — 28 unit and integration tests) validates:
- **Whole Rupee & Money Invariants:**
  - Validates positive whole Indian Rupees (₹1, ₹20,000, ₹20,001, ₹20,050, ₹100,000).
  - Strictly rejects decimal rupees (₹20,000.50, ₹20,000.10, ₹0.50, ₹20.5) without rounding, flooring, or ceiling.
  - Strictly rejects 0, negative amounts, NaN, Infinity, and unsafe integers.
  - Validates integer minor units (paise) where `amountMinor % 100 === 0`; rejects fractional paise and non-whole-rupee minor amounts.
- **Target Position Rules & Capacity:**
  - Accepts positive integer positions #1 to market capacity.
  - Rejects 0, negative numbers, decimals (`1.5`, `2.1`), NaN, Infinity, and positions exceeding market capacity (`51` in 50-cap market).
- **Strict Superseding Rules:**
  - Evaluates current occupant amount (e.g. ₹20,000) $\rightarrow$ exact minimum required is ₹20,001 (+100 paise).
  - Equal amounts (₹20,000) and lower amounts (₹19,999) are strictly rejected as non-qualifying superseding values.
- **Vacant Position Base Floor:**
  - Unoccupied target positions use market base floor (₹1,000 / 100,000 paise) with calculation mode `INITIAL_FLOOR`.
  - Empty markets with no ranked participants correctly evaluate to base entry floor.
- **Requesting Business Context & Edge Cases:**
  - Business targeting its own held position returns `ALREADY_HOLDING_POSITION` without manufacturing a false superseding requirement.
  - Business targeting a lower visibility position (holds #1, targets #3) returns `LOWER_POSITION` without treating it as a purchase.
  - Business targeting a better position (holds #5, targets #2) calculates the exact superseding requirement based on position #2's occupant.
- **Market Status Boundaries:**
  - Rejects non-existent markets with `InvalidMarketError` (404).
  - Rejects draft/unpublished markets with `MarketUnavailableError` (422).
- **Deterministic Calculation:**
  - 10 repeated iterations of identical market, position, and business inputs yield strictly identical monetary minor units and whole rupee figures.
- **ZERO Financial & State Mutation Guarantee:**
  - Snapshots canonical `MarketRankings` before calculations, runs 50 pricing calculations across diverse positions, and asserts byte-for-byte identity of post-run state (`serializedBefore === serializedAfter`).
- **Cross-Business Isolation:**
  - Calculations for Business A and Business B targeting the same market and position do not cross-contaminate business context or expose private competitor data.

---

## 13. Bid Intent Creation & Idempotency Boundary Test Matrix (Milestone 0.11.0)

Automated test suite (`frontend/tests/bid-intent.test.ts` — 23 unit and integration tests across 8 test suites) validates:

1. **Authentication & Centralized RBAC:**
   - Rejects unauthenticated creation attempts with `401 UnauthenticatedError`.
   - Allows `OWNER` role to create BidIntents.
   - Allows `ADMIN` role to create BidIntents.
   - Strictly rejects `EDITOR` role with `403 ForbiddenBusinessAccessError`.
   - Strictly rejects `FINANCE` role with `403 ForbiddenBusinessAccessError`.

2. **Cross-Business Isolation:**
   - Rejects callers attempting to create an intent for a business they do not manage with `403`.
   - Rejects callers reading another business's BidIntent with `403`.
   - Rejects callers cancelling another business's BidIntent with `403`.

3. **Market & Target Position Validation:**
   - Rejects non-existent market with `404 MarketNotFoundError`.
   - Rejects target position 0, negative integers (-1), decimals (1.5), and positions exceeding market capacity (> 8).

4. **Idempotency Boundary & Duplicate Request Protection:**
   - Rejects creation when `Idempotency-Key` is missing or empty string.
   - Exact repeat request with identical key returns the original `BidIntent` without creating duplicate records.
   - Reusing key with different target position rejects with `409 IdempotencyKeyReusedError`.
   - Reusing key with different market rejects with `409 IdempotencyKeyReusedError`.
   - Verifies idempotency keys are strictly scoped to `(actorUserId, businessId)` context.

5. **Authoritative Pricing Re-evaluation & Stale Quote Defense:**
   - Server re-evaluates pricing dynamically at creation; client-submitted lower amounts are overridden with authoritative server calculations.
   - Rejects with `409 PricingChangedError` when client references an outdated quote after the market moved.

6. **Immutability, Expiration, and Cancellation Lifecycle:**
   - Verifies `expiresAt` is set exactly 15 minutes into the future (`BID_INTENT_TTL_MINUTES = 15`).
   - Dynamically evaluates status as `EXPIRED` once current time exceeds `expiresAt`.
   - Allows authorized user to transition `PENDING_PAYMENT` to `CANCELLED`.
   - Rejects cancellation of already cancelled or expired intents with `422 BidIntentNotCancellableError`.

7. **ZERO Ranking & ZERO Financial Mutation Guarantee:**
   - Captures full JSON snapshots of `MarketRankings` and `MarketParticipation` before intent creation.
   - Creates 10 sequential BidIntents across diverse markets and target positions.
   - Asserts byte-for-byte identity of rankings and participations before vs after (`rankingBefore === rankingAfter`).
   - Asserts 0 financial records, 0 transaction ledgers, and 0 position history records are created.

8. **Data-Access Service Layer:**
   - Validates end-to-end delegation through `BidIntentService`, `LocalBidIntentDataSource`, and singleton factory exports.

---

## 9. Milestone 0.12.0 PayU Gateway & Payment Boundary Test Matrix (`frontend/tests/payment.test.ts`)

### 9.1 Authentication & RBAC Authorization
- Rejects unauthenticated caller (`401 UnauthenticatedPaymentError`).
- Rejects unauthorized caller without membership in the business (`403 UnauthorizedPaymentAccessError`).
- Rejects `EDITOR` role from creating payment orders (`403`).
- Allows `OWNER` to create, view, and cancel payment orders.
- Allows `ADMIN` to create, view, and cancel payment orders.
- Allows `FINANCE` to view payment orders; rejects from creation.
- Enforces strict cross-business tenant isolation: User from Business A cannot create or view payment orders for Business B.

### 9.2 BidIntent Lifecycle Validation
- Rejects payment order creation for non-existent BidIntent (`404 PaymentBidIntentNotFoundError`).
- Rejects payment order creation for expired BidIntent (`409 PaymentBidIntentExpiredError`).
- Rejects payment order creation for cancelled BidIntent (`409 PaymentBidIntentCancelledError`).
- Accepts valid `PENDING_PAYMENT` BidIntent.

### 9.3 Money & Financial Invariants
- Derives amount strictly from server-side `BidIntent.qualifyingAmountMinor`.
- Enforces whole Indian Rupee invariant (`amountMinor % 100 === 0`).
- Rejects decimal or fractional rupee amounts without rounding.
- Enforces currency invariant (`currency === 'INR'`). Rejects non-INR currency.

### 9.4 Payment Order Creation & Scoped Idempotency
- Successfully instantiates `PaymentOrder` in `CREATED` state with PayU transaction ID and checkout parameters.
- Idempotent replay: Sending identical request with same key returns existing `PaymentOrder` without creating duplicate records or PayU requests.
- Conflicting key reuse: Reusing idempotency key with conflicting intent or business returns `409 PaymentIdempotencyKeyReusedError`.

### 9.5 PayU SHA-512 Hash & Reverse-Hash Verification
- Generates exact PayU request hash: `sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)`.
- Rejects tampered request hash.
- Computes and verifies PayU reverse webhook hash: `sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)`.
- Validates constant-time byte comparison (`crypto.timingSafeEqual`). Rejects forged or mismatched reverse-hashes.

### 9.6 Webhook Processing & Duplicate Event Safety
- Accepts and processes valid success webhook, transitioning order to `SUCCEEDED` with `paidAt` timestamp.
- Accepts and processes valid failure webhook, transitioning order to `FAILED`.
- Rejects webhooks with invalid or missing signature with `400 Bad Request`.
- Rejects webhooks with unknown or mismatched transaction references.
- Rejects webhooks with amount mismatch (e.g. ₹28,500 expected vs ₹28,499 reported).
- Duplicate event safety: Simulating 10 identical webhook deliveries produces exactly 1 state transition, 1 audit entry, and 0 duplicate records.

### 9.7 Payment State Machine Lifecycle
- Valid transitions: `CREATED` → `PENDING` → `SUCCEEDED` / `FAILED` / `CANCELLED`.
- Terminal state protection: Verified `SUCCEEDED` order cannot be downgraded to `FAILED`.
- Contradictory events (e.g. unexpected transition on completed order) flagged and rejected.
- `UNKNOWN` status safely frozen without advancing financial or ranking state.

### 9.8 CRITICAL ZERO-MUTATION REGRESSION TEST
- Baseline ranking snapshot recorded via `CanonicalRankingStateProvider` before test.
- Full end-to-end payment flow simulated:
  `BidIntent` created → `PaymentOrder` created → Valid PayU success webhook verified → `PaymentOrder` becomes `SUCCEEDED`.
- Assertions:
  - `MarketParticipation.currentPosition` unchanged.
  - Qualifying amounts unchanged.
  - Position entries in market ladder unchanged.
  - `PositionHistory` records created: exactly **0**.
  - Ranking mutations: exactly **0**.
  - Wallet balances: **0** (no wallets exist).
  - Financial ledger balances: **0**.

---

## 10. Atomic Ranking Settlement Engine Verification Matrix (Milestone 0.13.0)

Automated test suite (`frontend/tests/ranking-settlement.test.ts`) covering 20 dedicated test cases across 9 test groups.

### 10.1 Payment Confirmation Gate Invariants
- **CONFIRMED Gate:** Only payment orders with `status === 'CONFIRMED'` are allowed to enter ranking settlement.
- **Pre-Confirmation Rejection:** Orders in `CREATED`, `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED` throw `PaymentNotConfirmedError` (`422 Unprocessable Entity`).
- **Non-Existent Orders:** Rejects missing payment orders with `PaymentOrderNotFoundError` (`404 Not Found`).

### 10.2 Authentication, RBAC & Tenant Isolation
- **Unauthenticated Calls:** Throws `UnauthenticatedSettlementError` (`401 Unauthorized`).
- **Foreign Business Rejection:** Caller attempting to settle an order for a business they do not belong to is rejected with `UnauthorizedSettlementAccessError` (`403 Forbidden`).
- **Role Permission Enforcement:**
  - `OWNER`: Permitted (`rankingSettlement.create`, `rankingSettlement.view`).
  - `ADMIN`: Permitted (`rankingSettlement.create`, `rankingSettlement.view`).
  - `FINANCE`: View permitted (`rankingSettlement.view`), execution denied (`403 Forbidden`).
  - `EDITOR`: Denied (`403 Forbidden`).

### 10.3 Pure Calculation & Movement Algorithms
- **New Business Insertion:** Inserting at #1 shifts incumbents (#1 → #2, #2 → #3) with exact position calculations.
- **Upward Movement:** Moving an existing business upward (e.g. #10 → #5) vacates #10, inserts at #5, and shifts down only the affected span (#5 → #6 ... #9 → #10).
- **Same-Position No-Op:** Targeting the business's currently held position returns `isNoOp: true` with zero ranking changes and zero `PositionHistory` records.
- **Market Capacity Bounds:** Target positions > 100 throw `TargetBeyondCapacityError` without mutating state.

### 10.4 Strict Greater-Than Displacement & Stale Pricing Defense
- **Strict Greater-Than:** Rejects payments where `paidAmountRupees <= incumbentQualifyingAmountRupees`. Displacing requires strictly `>` (+100 paise minimum).
- **Stale Pricing / Concurrent Market Shift:** If competitor moved into target position with higher qualifying amount between intent creation and settlement, settlement is marked `FAILED` with `failureReason = 'RANKING_TARGET_NO_LONGER_ACHIEVABLE'`. Payment remains `CONFIRMED`. Ranking remains completely unchanged.

### 10.5 Position History Invariants
- **Comprehensive History:** Every displaced incumbent and the target business receives an immutable `PositionHistory` record referencing `rankingSettlementId` and `paymentOrderId`.
- **Cause Identification:** Every record explicitly sets `cause = 'PAID_VISIBILITY_SETTLEMENT'`.
- **No-Op Prevention:** Zero `PositionHistory` records created if positions did not change.

### 10.6 Settlement Idempotency (Sections 35 & 90)
- Calling `settleRanking` 10 times for the same confirmed payment order returns the identical settlement outcome.
- Exactly 1 effective ranking mutation occurs.
- Exactly 1 set of `PositionHistory` records is created.
- Zero duplicate positions or records.

### 10.7 Atomicity & Rollback Guarantees (Sections 87 & 88)
- **Fault Injection Before History:** Simulating persistence failure during `PositionHistory` creation triggers immediate rollback. Market participations and rankings revert to exact pre-transaction snapshot.
- **Fault Injection Before Settlement Record:** Simulating persistence failure during settlement record persistence triggers full rollback.

### 10.8 Concurrency & Duplicate Position Protection (Sections 85 & 137)
- Executing multiple settlements concurrently (`Promise.all`) safely serializes transactions through market-level row locking.
- Resulting market state guarantees 100% uniqueness of active positions (zero duplicate positions).
- No businesses lost, no corrupted qualifying amounts.

### 10.9 Read Model Consistency
- Updates are immediately reflected in `CanonicalRankingStateProvider` without stale cached reads.
- Data-access layer (`rankingSettlementService`) cleanly delegates between local simulation and API adapters.

---

## 11. Milestone 0.14.0 — PostgreSQL Persistence & Settlement Recovery Test Matrix

### 11.1 Test Suite Breakdown

| Suite | File | Tests | Coverage Scope |
|---|---|---|---|
| **Persistence & Production Readiness** | `frontend/tests/postgres-persistence.test.ts` | 15 | Configuration parsing, SSL parameters, `assertProductionPersistence()` guard, database health check, readiness audit `/api/admin/readiness`, migration SQL ordering (001–005), and schema uniqueness/constraint verification. |
| **Settlement Recovery & Bounded Retries** | `frontend/tests/settlement-recovery.test.ts` | 4 | Outbox job generation, crash recovery simulation (Section 40), duplicate recovery cycle idempotency, permanent business conflict classification (`TargetNoLongerAchievableError` -> `FAILED`), and retry backoff. |
| **Full Repository Regression** | `frontend/tests/**/*.test.ts` | 356 | All 43 test suites spanning taxonomy, pricing, auth, RBAC, BidIntent, PayU checkout, payment verification, atomic ranking settlement, and visual ranking components. |

### 11.2 Key Verification Scenarios

1. **Production Guard Enforcement:**
   - In `NODE_ENV=production` or `PERSISTENCE_MODE=postgres`, attempting to execute `createBidIntent`, `createPaymentOrder`, or `settleRanking` without `DATABASE_URL` strictly throws `CRITICAL CONFIGURATION ERROR` and blocks execution.
2. **Crash Recovery Simulation (Section 40):**
   - Simulated crash with `PaymentOrder.status === 'CONFIRMED'` and no completed `RankingSettlement`.
   - Running `runSettlementRecoveryCycle()` discovers the unresolved job, executes canonical `settleRanking()`, atomically creates `PositionHistory`, and marks the recovery job `COMPLETED`.
   - Re-running the cycle produces zero duplicate ranking mutations or history entries.
3. **Permanent Conflict Classification (Section 26):**
   - When a market floor shifts such that the target position is no longer achievable for the paid amount, the recovery worker marks the job `FAILED` (terminal) and logs `TargetNoLongerAchievableError`, avoiding infinite retry loops.

### 11.3 Infrastructure Verification Status Note

- **Unit & Domain Tests:** 424/424 tests PASS (`npm test`).
- **Typecheck & Build:** `npm run typecheck` (`tsc --noEmit`) and `npm run build` (`next build`) pass with 0 errors.

---

## 14. Milestone 0.18.0 — Performance, Caching & Edge Optimization Verification Matrix

### 14.1 Test Suite Breakdown (`frontend/tests/performance-caching-and-edge.test.ts`)

| Group | Tests | Coverage Scope |
| :--- | :--- | :--- |
| **1. Centralized Cache Policies** | 3 | Verifies private no-store headers on workspace, admin, and financial routes; bounded public caching on taxonomy (300s) and rankings (60s); valid header derivation via `createCacheHeaders`. |
| **2. Post-Commit Invalidation** | 3 | Verifies monotonic version increments; path and tag generation for affected market views; repeat invalidation idempotency; worker recovery execution. |
| **3. Sitemap Caching & Invalidation** | 3 | Verifies TTL caching of sitemap snapshots; immediate cache discard on `invalidateSitemapCache()`; fresh generation on `forceFresh`. |
| **4. SEO Audit Persistence Guard** | 2 | Verifies safe fallback in development/test; strict fail-closed exception in production persistence mode (`PERSISTENCE_MODE=postgres`) without `DATABASE_URL`. |
| **5. Edge Rate Limiting & Privacy** | 4 | Verifies deterministic SHA-256 client token hashing without raw IP leakage; trusted proxy extraction; strict search API limits (40 req/min); crawler recognition with 2x headroom. |
| **6. Connection Pool & Metrics** | 2 | Verifies statement timeout configuration; performance metrics telemetry collection (latencies, cache hits/misses, invalidation counts). |

### 14.2 Production Build Verification
- `next build` generates 66 static and dynamic pages with explicit ISR revalidation windows:
  - `/`: 120s
  - `/[location]/[category]`: 60s
  - `/businesses`: 300s
  - `/categories`: 300s
  - `/sitemap.xml`: 3600s
  - `ƒ Middleware`: 35 kB edge interceptor compiling without Node.js crypto scheme errors.

---

## 15. Milestone 0.19.0 — Production Readiness, Distributed State & Live Infrastructure Verification Matrix

### 15.1 Dedicated Test Suite (`frontend/tests/production-readiness-and-distributed-state.test.ts`)

| Group | Tests | Coverage Scope | Status |
| :--- | :--- | :--- | :--- |
| **1. Durable Invalidation Recovery & Restarts** | 4 | Verifies persistence survives process restart; multi-worker `SKIP LOCKED` concurrency lease isolation; provider outage bounded exponential backoff & terminal failure; worker cycle recovery. | `PASS` |
| **2. Rate Limiting, Anti-Spoofing & Crawlers** | 5 | Rejects spoofed crawler User-Agents; grants elevated limits strictly to edge-verified headers; rejects untrusted proxy headers; safely extracts client IP via trusted proxy; degrades to local memory during store outage. | `PASS` |
| **3. Database Disconnect & Persistence Guard** | 2 | Fails closed with `CRITICAL CONFIGURATION ERROR` in production without `DATABASE_URL`; blocks bid intent and payment order creation when database unconfigured. | `PASS` |
| **4. Payment, Webhooks & Ranking Atomicity** | 3 | Rejects unconfirmed payment settlement; deduplicates duplicate payment callbacks/webhooks idempotently; atomically rolls back settlement on injected fault, capturing job in outbox as `RETRYABLE`. | `PASS` |
| **5. Observability, Admin RBAC & Cache Isolation**| 3 | Rejects unauthenticated/non-admin access to `/api/admin/operations/summary`; enforces strict `private, no-cache, no-store, max-age=0` headers; detects stale worker heartbeats. | `PASS` |

### 15.2 Complete Repository Verification Status
- **Automated Tests:** 441/441 tests passing across 48 test suites (`npm test`).
- **Static Typecheck:** Zero TypeScript errors (`npm run typecheck`).
- **Production Build:** Next.js App Router successfully compiled 67 routes and Edge Middleware (`npm run build`).
- **Background Worker:** `npm run worker:once` successfully executes discrete cycle with payment reconciliation, settlement recovery, notification dispatch, and invalidation outbox processing.








