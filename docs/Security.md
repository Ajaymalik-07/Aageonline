# AageOnline — Security & Platform Integrity Specification

## 1. Security as a Core Product Requirement

AageOnline is a paid competitive visibility platform where the core product mechanism is:

```text
Payment → qualifying transaction → ranking position
```

> **Fundamental Integrity Invariant:**  
> If an unpaid, underpaid, manipulated, duplicated, forged, or unauthorized transaction can cause a business to appear above a legitimately paid position, the platform's core integrity is compromised.

Security at AageOnline is not an afterthought or an infrastructure layer; it is an intrinsic product requirement enforced through **defense-in-depth**:

```text
Authentication
  ↓
Authorization (Role & Object-Level)
  ↓
Business Ownership Verification
  ↓
Bid Qualification & Rate Limiting
  ↓
Server-Side Price Recalculation
  ↓
Provider Payment Verification
  ↓
Atomic Concurrency-Locked Transaction
  ↓
Deterministic Position Derivation
  ↓
Append-Only Auditing & History
  ↓
Automated Reconciliation
```

---

## 2. Absolute Authority Rule

**The frontend has ZERO authority to decide:**
- Who is #1, #2, or any position
- Who moves up or down
- What monetary amount qualifies
- Whether payment succeeded
- Whether money is held or committed
- Whether a transaction is valid
- Whether a business is eligible
- Whether a position is available
- Whether a ranking change is legitimate

**System Authority Hierarchy:**
1. **Frontend:** May only *request* an operation and present state.
2. **Backend API:** *Authorizes*, recalculates, and *validates* business rules.
3. **Payment Provider:** Independently *confirms* financial execution.
4. **Database Engine:** Executes *atomic, locked mutations* and persists immutable state.
5. **Ranking Engine:** *Derives* authoritative positions based on verified qualifying records.

---

## 3. Untrusted Client Boundary

All client-controlled and client-submitted values are classified as **hostile/untrusted**, including:
`businessId`, `userId`, `marketId`, `categoryId`, `locationId`, `rankingId`, `position`, `targetPosition`, `bidAmount`, `transactionId`, `paymentId`, `orderId`, `paymentStatus`, `currentPosition`, `newPosition`, `isVerified`, `isPaid`, `isAdmin`, `role`.

A malicious actor modifying these values in DevTools, Postman, or `curl` must gain zero privilege and execute zero unauthorized mutations. Client-side validation exists strictly for UX; server-side validation is authoritative and invariant.

---

## 4. AageOnline Ranking Integrity Model

The system enforces the strict sequential lifecycle:

```text
[Bid Request] (Idempotency Key, Target Position)
      ↓
[Server Validation] (Session, Object Authorization, Business Active Status)
      ↓
[Eligibility Check] (Active verified business record)
      ↓
[Authoritative Price Derivation] (Lock market row, re-evaluate current qualifying amount)
      ↓
[Strictly-Greater Check] (New amount > current qualifying amount)
      ↓
[Transaction Record Created] (Status: CREATED / PAYMENT_PENDING)
      ↓
[Payment Initiated] (Gateway intent created with exact server-calculated amount)
      ↓
[Gateway Confirmation] (Server-to-server webhook or direct gateway status check)
      ↓
[Cryptographic Webhook Verification] (HMAC signature, raw body, amount & currency match)
      ↓
[Transaction Status Mutation] (Status: PAYMENT_CONFIRMED)
      ↓
[Atomic Ranking Update] (Database transaction with row-level market lock)
      ↓
[Position History Append] (Immutable record in position_history)
      ↓
[Audit Log Append] (Immutable security record with correlation ID)
      ↓
[Notification Queueing] (Milestone ladder event emitted)
```

**Under no circumstances may this sequence be reordered or bypassed.**

---

## 5. Strictly Higher Bid Rule

The mathematical qualification rule for position displacement is strictly:

$$\text{New Qualifying Amount} > \text{Current Qualifying Amount}$$

- $\ge$ is **strictly rejected**. An equal payment cannot displace an existing qualifying position.
- Minimum allowable increment is $+100\text{ paise}$ (₹1.00).
- For an open/vacant position with no active paid incumbent, the qualifying floor is the base entry fee.
- Rejection criteria: $\le$ current qualifying amount, $\le 0$, negative numbers, non-integers, decimals beyond minor units, `NaN`, `Infinity`, string injection, and overflow integers.

---

## 6. Atomic Ranking Mutation & Concurrency Isolation

To prevent race conditions, lost updates, and duplicate ranks (#1 split between two businesses):

1. **Transaction Isolation:** Executed within PostgreSQL transactions with `SELECT ... FOR UPDATE` row-level locking on the target `market` entity or serializable isolation.
2. **Validation Inside Transaction:**
   ```sql
   BEGIN TRANSACTION;
   -- 1. Lock market row
   SELECT * FROM markets WHERE id = $market_id FOR UPDATE;

   -- 2. Verify current incumbent qualifying amount has not changed
   SELECT * FROM ranking_entries WHERE market_id = $market_id AND position = $target_pos;

   -- 3. Assert: payment.amount_minor > incumbent.qualifying_amount_minor
   -- If violated (superseded by concurrent transaction):
   -- ROLLBACK and return 409 TARGET_POSITION_SUPERSEDED

   -- 4. Shift displaced ranks down by 1
   UPDATE ranking_entries 
   SET position = position + 1 
   WHERE market_id = $market_id AND position >= $target_pos;

   -- 5. Insert new ranking entry
   INSERT INTO ranking_entries (market_id, business_id, position, amount_minor, transaction_id) ...

   -- 6. Append immutable audit & position history
   INSERT INTO position_history ...
   INSERT INTO audit_logs ...

   COMMIT;
   ```
3. **No Partial State:** Any database error or constraint violation triggers an immediate `ROLLBACK`.

---

## 7. Payment & Webhook Security

1. **Server-Side Pricing:** Payment intents are created using amounts recalculated by the server. The client *never* specifies the charge amount.
2. **Cryptographic Webhook Verification:**
   - Provider webhook signatures (e.g., Razorpay HMAC SHA256) are validated against raw, unparsed request bytes before JSON deserialization.
   - Replay window: Webhook timestamps older than 300 seconds are rejected.
   - Webhook idempotency: Provider event IDs (`event_id`) are checked against a unique constraint in `webhook_events`. Duplicate events return `200 OK` without re-executing logic.
3. **Multi-Field Validation:**
   The server verifies:
   - `provider_payment_id` matches gateway record.
   - `amount` matches the exact integer paise stored on the `transactions` record.
   - `currency` matches `'INR'`.
   - `order_id` belongs to the expected `business_id` and `market_id`.

---

## 8. Idempotency & Replay Protection

- Every mutating financial request requires a client-generated UUID v4 `Idempotency-Key` (header).
- Idempotency keys are scoped to the authenticated `user_id` and stored server-side with their cached response and payload hash.
- Replayed identical requests return the original response without executing duplicate payments or ranking mutations.
- Conflicting requests with an existing idempotency key return `409 Conflict`.

---

## 9. "Impossible State" Fail-Closed Rule

If the system detects an inconsistent, contradictory, or ambiguous state:
- Business marked paid but missing qualifying transaction.
- Transaction amount does not match provider record.
- Two businesses claim the same rank.
- Webhook signature valid but transaction already finalized with differing metadata.

**The system FAILS CLOSED:**
- It **does NOT** move the business upward.
- It transitions the transaction to `RECONCILIATION_REQUIRED`.
- It generates an urgent security alarm.
- Authoritative ranking mutations are frozen for that market record until reconciled.

---

## 10. Authorization Architecture

1. **Role-Based Access Control (RBAC):**
   - `USER`: Can browse public rankings, claim businesses, manage owned profiles.
   - `BUSINESS_OWNER` / `MANAGER`: Can initiate bids, view private history, update verified profile.
   - `ADMIN`: Operational management, verification approvals, audit reviews.
   - `SUPER_ADMIN`: System configuration, security reviews.
2. **Object-Level Authorization (BOLA/IDOR Prevention):**
   - Every request to `/api/v1/businesses/:id/*` verifies: `business.owner_id == session.user_id` or active delegated manager permission.
   - Every request to `/api/v1/transactions/:id` verifies business ownership.
   - Unauthorized attempts return `403 Forbidden` and log a security audit event.

---

## 11. Rate Limiting & Anti-Automation

Layered rate-limiting enforced via edge gateway and Redis token bucket:

| Endpoint Group | Rate Limit Window | Identity Dimensions |
| :--- | :--- | :--- |
| Auth (`login`, `register`, `otp`) | 5 req / min | IP + Account ID |
| Bid Quotes (`position-quote`) | 30 req / min | User ID + IP |
| Bid Creation (`/bids`) | 6 req / min | User ID + Business ID |
| Payment Creation (`/payments/create`) | 5 req / min | Business ID + IP |
| Public Discovery (`/markets`, `/ranking`) | 120 req / min | IP |
| Admin Endpoints (`/admin/*`) | 60 req / min | Admin User ID + IP |

---

## 12. Transport & Browser Security Controls

- **Content Security Policy (CSP):**
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com; frame-src https://api.razorpay.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
  ```
- **Strict Headers:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **CSRF Protection:** SameSite=Lax/Strict cookies and custom headers (`X-Requested-With` / `X-CSRF-Token`) on state-changing endpoints.
- **XSS Prevention:** Zero untrusted HTML injection; zero `dangerouslySetInnerHTML`; output encoding and server-side DOM sanitization.
- **Open Redirect Protection:** Redirects whitelist relative internal paths (`/explore`, `/dashboard`) only.

---

## 13. Audit Logging & Redaction

All security-sensitive operations generate structured, immutable records in `audit_logs`:
- Fields: `id`, `timestamp`, `correlation_id`, `actor_id`, `actor_role`, `ip_address`, `action`, `resource_type`, `resource_id`, `status`, `metadata`.
- **Mandatory Redaction:** Passwords, payment card numbers, UPI PINs, gateway secret keys, JWT signing keys, and sensitive tokens are strictly stripped prior to log emission.

---

## 14. Comprehensive Security Threat Model

| Threat / Attack | Impact | Prevention | Detection | Response | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Zero-Payment Ranking** | Business achieves rank without paying | Server requires confirmed transaction before DB rank mutation | Integrity monitor queries paid positions without transactions | Revert rank, flag account, raise P1 alarm | `sec-test-04` |
| **Underpayment Attack** | Attacker pays ₹1 to claim ₹20,000 rank | Server recalculates required amount; ignores client price | Webhook checks `amount == transaction.amount_minor` | Reject transaction, alert admin | `sec-test-01`, `sec-test-14` |
| **Equal-Bid Displacement** | Business matches #1 bid to displace | Strict `new > current` inequality enforced in SQL & code | Audit log review of rank movement triggers | Transaction rejected with 422 | `sec-test-02` |
| **Forged Payment Callback** | Attacker calls `/success` in browser | Browser callbacks never mutate rank; webhooks require HMAC | Webhook signature verification | 401 Unauthorized; zero DB mutation | `sec-test-05`, `sec-test-06` |
| **Webhook Replay Attack** | Duplicate rank movements from same webhook | Unique constraint on `webhook_events.event_id` | Database unique constraint violation catch | Return 200 idempotent acknowledgment; zero mutation | `sec-test-07` |
| **Bid Race Condition** | Two bidders bid for #1 simultaneously | Row-level locking on `market_id` + serializable execution | Concurrency collision detection in DB engine | First committed wins; second receives 409 with updated floor | `sec-test-09` |
| **BOLA / IDOR Attack** | User A purchases rank for User B's business | Object authorization validates `user_id == business.owner_id` | Audit log records unauthorized access attempts | 403 Forbidden; log security event | `sec-test-10`, `sec-test-11` |
| **Admin Route Bypass** | Normal user accesses `/api/v1/admin/*` | Role verification in server middleware and route handler | RBAC permission failure alerts | 403 Forbidden; audit event | `sec-test-13` |
| **Idempotency Replay** | Network retry creates two charges | `Idempotency-Key` table records in-flight & completed requests | Unique key violation | Return cached original response; zero duplicate charge | `sec-test-08`, `sec-test-19` |
| **Currency Mismatch** | Payment made in USD evaluated as INR | Strict currency validation: `currency === 'INR'` | Gateway webhook parser | Reject payment; fail closed | `sec-test-15` |
| **Floating-Point Drift** | Rounding error produces ₹0.99 underpayment | Integer minor units (paise) used throughout entire stack | Strict type-checking & regex validators | Non-integer rejected | `sec-test-14` |

---

## 15. Security Acceptance Gate (Release Blockers)

No deployment to staging or production is permitted if any of the following release blockers exist:
1. ❌ Any code path where a business occupies a paid rank without a verified, confirmed transaction.
2. ❌ Any code path where an equal or lower amount displaces an incumbent.
3. ❌ Any code path where client-submitted pricing is used to initiate a payment intent.
4. ❌ Any code path where client browser redirects declare payment success.
5. ❌ Missing HMAC signature verification on webhook routes.
6. ❌ Replayed webhooks causing multiple rank shifts.

---

## 16. Identity, Membership & Business Workspace Security Controls

1. **Server-Side Authorization is Authoritative:**
   - Client payloads sending `userId`, `businessId`, or `role` are never trusted.
   - The server derives user identity directly from the authenticated session.
   - Every business mutation independently verifies that the authenticated user possesses an `ACTIVE` `BusinessMembership` for the target business with sufficient RBAC permissions.
2. **Cross-Business Isolation Invariant:**
   - User A cannot access, view private details, or update profiles of Business B without a valid membership in Business B. Requests are rejected with `403 Forbidden`.
   - Business switching in workspace routes must re-validate membership server-side.
3. **Claim Verification Boundary:**
   - Claim requests do not grant ownership upon submission.
   - Claims require verified commercial documentation (GSTIN, trade license, official corporate domain email).
   - Approval is restricted to verified administrators and executes inside an audited transaction.
4. **Open-Redirect Hardening:**
   - The `/auth/login` redirect handler whitelists relative internal paths (e.g. `/business/claim`, `/business/dashboard`) and rejects protocol-relative (`//`) or absolute external URLs.

---

## 17. Pricing Engine & Floor Calculator Security Invariants (Read-Only)

1. **Zero Financial Mutation:**
   - The pricing endpoint (`GET /api/markets/:marketId/pricing`) is strictly `GET` and read-only.
   - It cannot initiate payments, charge payment methods, reserve positions, or alter ranking records.
2. **Server Authority & Non-Authoritative Client:**
   - The client supplies only `targetPosition` and optional context `businessId`.
   - The server exclusively resolves the current occupant, current floor, base floor, and market capacity from authoritative state.
3. **Competitor Data Privacy:**
   - Pricing calculations expose only public market mechanics: target position, current qualifying amount, required qualifying amount, calculation mode, and explanation.
   - **Strictly Masked:** Competitor user IDs, bank accounts, transaction references, audit logs, and internal risk scores are never included in pricing responses.
4. **Whole Rupee Financial Invariant:**
   - Inputs and calculations strictly enforce integer minor units (`amountMinor % 100 === 0`) and positive whole rupees (`amountRupees > 0 && Number.isSafeInteger(amountRupees)`).
   - Floating-point arithmetic, fractions, and decimal rupees are rejected.
5. **No Audit Flooding:**
   - Read-only calculations do not emit high-volume security audit events to prevent log exhaustion. Security audit logging remains reserved for state-changing authentication, claim, and administrative operations.

---

## 18. Bid Intent Creation & Idempotency Boundary Security Controls (Milestone 0.11.0)

1. **Authentication & Identity Resolution:**
   - `POST /api/bid-intents`, `GET /api/bid-intents/:id`, and `POST /api/bid-intents/:id/cancel` require an authenticated session token.
   - Anonymous or guest requests are rejected with `401 Unauthenticated`.
   - The creator identity (`createdByUserId`) is derived exclusively from server session state, never from client body parameters.

2. **Centralized RBAC Enforcement:**
   - Membership and role permissions are evaluated via `assertAuthorized(membership, 'bidIntent.create')`.
   - Allowed roles: `OWNER`, `ADMIN`.
   - Denied roles: `EDITOR` (403), `FINANCE` (403). Role escalation via client payload is rejected.

3. **Strict Cross-Business Isolation:**
   - A caller can only create, view, or cancel BidIntents for businesses where they hold an active, authorized membership.
   - Accessing or mutating another business's BidIntent is rejected with `403 ForbiddenBusinessAccessError`.

4. **Authoritative Pricing Re-evaluation & Client Amount Tampering Defense:**
   - Client-submitted amounts (`qualifyingAmountMinor`) are never accepted as authoritative.
   - The server independently recomputes the current required qualifying amount using `PricingCalculator` against authoritative market state.
   - Submitting ₹0.01, ₹1, or arbitrary discounted amounts is completely ineffective.
   - If a client includes `clientCalculatedAmountMinor` and the market moved in the interim, the server halts with `409 PRICING_CHANGED` to prevent unintended commitments under stale quotes.

5. **Scoped Idempotency Protection:**
   - Idempotency keys are mandatory (`Idempotency-Key` header) and scoped to `(actorUserId, businessId, idempotencyKey)`.
   - Replay attacks across different businesses or users fail because keys are isolated to the caller's context.
   - Replaying a key with conflicting parameters (different target position, market, or business) is rejected with `409 IDEMPOTENCY_KEY_REUSED`.
   - Deduplicated retries return the original intent without re-triggering creation audit events.

6. **Audit Trail Integrity:**
   - `BID_INTENT_CREATED` and `BID_INTENT_CANCELLED` are recorded in the append-only audit log with actor ID, business ID, market ID, target position, and qualifying amount.
   - Sensitive competitor data, authentication secrets, and payment tokens are excluded from audit payloads.

7. **Zero Financial Mutation & Non-Reservation Boundary:**
   - Creation of a `BidIntent` creates zero payment gateway charges, zero ledger entries, and zero position locks.

---

## 11. PayU Payment Gateway Security Controls & Boundary Invariants (Milestone 0.12.0)

1. **Zero Client Authority on Financial Records:**
   - Client applications cannot supply authoritative payment amounts, status flags, transaction identifiers, or qualification states.
   - The server exclusively recalculates and derives payment amounts from the server-side `BidIntent` (`qualifyingAmountMinor`).

2. **Cryptographic SHA-512 Reverse-Hash Verification:**
   - PayU India webhook payloads and browser callback responses are verified using PayU's documented SHA-512 reverse-hash formula:
     `sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)`
   - Hash comparisons are performed strictly using constant-time byte comparison (`crypto.timingSafeEqual`) on 128-character hexadecimal buffers. Naive string equality (`===`) is prohibited to eliminate timing side-channel attacks.

3. **Merchant Secret & Salt Isolation:**
   - The PayU Merchant Salt (`PAYU_MERCHANT_SALT`) is restricted to server-side runtime environments.
   - It is never shipped in client bundles, never rendered in HTML form templates, never serialized in API responses, and never logged.

4. **Audit Trail Secret Redaction:**
   - Financial audit events (`PAYMENT_ORDER_CREATED`, `PAYMENT_WEBHOOK_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_FAILED`, `PAYMENT_CANCELLED`, `PAYMENT_STATE_CONFLICT`) record only safe operational identifiers: `paymentOrderId`, `bidIntentId`, `businessId`, `providerTransactionId`, `amountRupees`, and `status`.
   - Hashes, merchant salts, credit card details, CVVs, and raw customer passwords are explicitly omitted.

5. **Webhook Replay & Duplicate Attack Protection:**
   - Incoming webhook payloads generate a deterministic SHA-256 fingerprint (`payloadHash`) across sorted parameters.
   - Replayed or duplicate webhooks match existing event records and return HTTP 200 without creating secondary financial records or re-triggering state machine transitions.

6. **Cross-Tenant Business Isolation:**
   - `POST /api/bid-intents/:id/payment-order` and `GET /api/bid-intents/:id/payment` enforce session authentication and `BusinessMembership` verification.
   - Members from Business A cannot create, inspect, or cancel payment orders belonging to Business B (`403 Forbidden`).

7. **Zero Ranking Mutation Security Barrier:**
   - Under no circumstances does a verified payment callback or webhook directly update `ranking_entries`, modify `MarketParticipation.currentPosition`, or create `PositionHistory` rows. Ranking mutation remains strictly gated for Milestone 0.13.0.

---

## 12. Atomic Ranking Settlement Security Controls & Concurrency Invariants (Milestone 0.13.0)

1. **Zero Client Ranking Authority:**
   - Client applications cannot supply authoritative positions, ranking orders, displacement targets, or qualifying amounts.
   - The ranking settlement boundary resolves target position, business ID, market ID, and paid amount exclusively from the verified server-side `PaymentOrder` and `BidIntent`.

2. **Confirmed Payment Prerequisite Gate:**
   - Only payments in `CONFIRMED` state can initiate a settlement transaction.
   - State `SUCCEEDED` is insufficient (requires independent PayU reconciliation before crossing the ranking boundary).
   - In-flight (`PENDING`), initial (`CREATED`), or terminated (`FAILED`, `CANCELLED`, `EXPIRED`) orders are strictly rejected (`422 PAYMENT_NOT_CONFIRMED`).

3. **Settlement RBAC & Object-Level Authorization:**
   - Initiating ranking settlement requires active business membership with `rankingSettlement.create` permission (`OWNER`, `ADMIN`).
   - Roles `EDITOR` and `FINANCE` are denied (`403 UnauthorizedSettlementAccessError`).
   - Members from Business A cannot trigger or inspect settlements for Business B (`403 Forbidden`).

4. **Market-Level Concurrency & Serialization Defense:**
   - Ranking mutations require an exclusive lock on the target market entity (`SELECT ... FOR UPDATE` in PostgreSQL, `ACTIVE_MARKET_LOCKS` in memory).
   - Prevents lost updates, double-occupancy race conditions, and corrupted position orderings when two businesses settle concurrently within the same market.

5. **Stale Pricing & Race Condition Defense:**
   - Ranking calculation re-reads live market participations inside the transaction lock.
   - If market state shifted between intent creation and payment confirmation such that the incumbent floor now exceeds the paid amount, the transaction safely aborts without mutating ranking, marking the settlement `FAILED` with `failureReason = 'RANKING_TARGET_NO_LONGER_ACHIEVABLE'`.
   - The payment remains `CONFIRMED`; no extra money is charged and no partial position changes occur.

6. **All-or-Nothing Transaction Atomicity:**
   - If any step during settlement (ranking mutation, participation update, `PositionHistory` append, audit logging) encounters an error, the entire transaction rolls back.
   - Ranking state is restored to its exact pre-transaction state. Zero partial mutations are permitted.

7. **Idempotency & Replay Attack Defense:**
   - Backed by database uniqueness on `payment_order_id`. Replayed settlement calls return the existing settlement outcome without repeating position movements or duplicating `PositionHistory` entries.

8. **Audit Trail Redaction:**
   - Ranking settlement audit records (`RANKING_SETTLEMENT_STARTED`, `RANKING_SETTLEMENT_SUCCEEDED`, `RANKING_POSITION_CHANGED`, etc.) log operational identifiers (`settlementId`, `paymentOrderId`, `targetPosition`, `amountRupees`).
   - Payment provider secrets, merchant salts, webhook tokens, and user credentials are strictly excluded.

---

## 13. Production PostgreSQL Persistence & Settlement Recovery Security Controls (Milestone 0.14.0)

1. **Server-Only Database Credentials:**
   - Database connection strings (`DATABASE_URL`, `DATABASE_DIRECT_URL`) are strictly restricted to server-side environments and never exposed via `NEXT_PUBLIC_*` prefixes.
   - Connection credentials, passwords, and TLS private keys are never included in error responses, log outputs, or client bundles.

2. **Strict Production Persistence Guard:**
   - `assertProductionPersistence()` executes before every financial operation (`createBidIntent`, `createPaymentOrder`, `processPayUWebhook`, `reconcilePaymentOrder`, `settleRanking`).
   - If running in production mode (`NODE_ENV=production` or `PERSISTENCE_MODE=postgres`) and `DATABASE_URL` is missing or unreachable, the system fails closed immediately with an operational error.
   - Silently falling back to volatile in-memory storage for financial transactions is architecturally prevented.

3. **Concurrency & Race Condition Defense:**
   - Database-level row locking (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`) prevents concurrent ranking mutations within the same market across distributed application instances.
   - Polling workers claim recovery jobs with `SELECT ... FOR UPDATE SKIP LOCKED` to prevent duplicate concurrent settlement executions across worker processes.
   - Partial unique index `uq_market_participations_active_position` enforces that at most one active business occupies each integer position in a market.

4. **Settlement Recovery RBAC & Operator Authorization:**
   - The operational endpoint `POST /api/admin/settlement-recovery` is protected by user authentication and requires active administrator credentials (`admin:manage`).
   - Non-admin or unauthenticated callers are rejected (`401 Unauthenticated` / `403 Forbidden`).

5. **Tenant Isolation Across Repositories:**
   - All repository query methods (`getPaymentOrdersByBusiness`, `getBidIntentsByBusiness`, `getSettlementsByBusiness`) enforce tenant scoping by `businessId`.
   - Direct database queries validate foreign keys against canonical `businesses` and `markets` entities, preventing orphan or spoofed records.

---

## 14. Cache Security, Tenant Privacy & Edge Rate Limiting (Milestone 0.18.0)

1. **Shared Cache Isolation & Private No-Store Enforcement:**
   - All private business workspace endpoints (`/business/dashboard/**`), financial operations (`/api/markets/*/pricing`, `/api/payments/**`, `/api/bid-intents/**`), and administrative operations (`/admin/**`, `/api/admin/**`) strictly emit `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.
   - Sensitive tenant ranking histories, business profiles, and notification feeds are strictly prohibited from being stored in shared CDN or browser caches.

2. **Post-Commit Invalidation Ordering & Consistency:**
   - Cache invalidation triggers strictly *after* ranking settlement transactions commit to persistent storage.
   - Cache invalidation failures are captured to a resilient recovery queue and will never cause a committed transaction or verified payment to abort or rollback.
   - Uncommitted or speculative ranking states are never published or cached.

3. **Privacy-Preserving IP Hashing & Edge Perimeter Defense:**
   - Client IP addresses are hashed using SHA-256 with a secret server salt before evaluating sliding-window rate limit counters.
   - Raw IP addresses are never retained in memory caches, telemetry tables, or operational audit logs.
   - Rate limiting headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) provide transparent feedback to API consumers without exposing internal network details.

4. **Production Persistence Enforcement on Operational SEO Repositories:**
   - `PostgresSeoAuditRepository` implements zero silent fallback in production environments (`NODE_ENV=production` or `PERSISTENCE_MODE=postgres`).
   - If PostgreSQL persistence is unreachable or unconfigured, administrative audit operations fail closed with explicit configuration errors rather than quietly substituting volatile memory caches.

---

## 15. Distributed State Security, Proxy Anti-Spoofing & Crawler Defense (Milestone 0.19.0)

1. **Proxy Anti-Spoofing & Trusted Upstream Invariant:**
   - Client-supplied `X-Forwarded-For` and `X-Real-IP` headers are strictly rejected unless the immediate network socket originates from an explicitly trusted proxy CIDR or loopback interface (`isTrustedProxy`).
   - Untrusted connections default to the direct connection IP address, neutralizing IP-spoofing attempts aimed at bypassing rate limits or impersonating tenants.

2. **Cryptographic IP Token Derivation (Zero Collision Risk):**
   - Client IP addresses are normalized and hashed using FIPS 180-4 SHA-256 combined with a high-entropy secret salt (`RATE_LIMIT_SALT`).
   - Replaces vulnerable bitwise and truncated hashes with a full 256-bit entropy space, guaranteeing zero token collisions across distributed clusters.

3. **Verified Crawler Authorization Policy:**
   - Client requests asserting `User-Agent: Googlebot` or `Bingbot` are treated as unverified public clients by default.
   - Elevated crawler rate-limit headroom (2x) is granted strictly when validated through infrastructure-level edge bot headers (`cf-verified-bot: true` or `x-verified-bot: true`).
   - Prevents scrapers and malicious bots from bypassing discovery rate limits by spoofing well-known crawler signatures.

4. **Distributed Outbox Security & Single-Active Worker Lease:**
   - Durable outboxes (`cache_invalidation_jobs`, `settlement_recovery_jobs`) utilize PostgreSQL `FOR UPDATE SKIP LOCKED` and explicit lease timestamps (`locked_until`).
   - Prevents double-processing of financial settlement jobs or redundant cache flushes across horizontally scaled application instances.
   - Session-level advisory locking (`pg_try_advisory_lock(829104812)`) guarantees single-active runner status for the background reconciler worker without external distributed locking infrastructure.

---

## 16. Administrative Authentication & Multi-Tenant Boundary Isolation (Milestone 0.20.25)

1. **Stateless Administrative Session Tokens:**
   - Administrative session tokens issued by the central API service (`createAdminSession`) are cryptographically signed using Web Crypto HMAC-SHA256 (`adm_sess_<userId>_<expiresAt>_<signature>`).
   - Every administrative request validates tokens in constant time (`crypto.timingSafeEqual`) against the signature salt. Expired or tampered tokens are rejected with HTTP 403 Forbidden.
   - Explicit revocation sets tokens in `REVOKED_ADMIN_TOKENS`.

2. **Cross-Tenant Business Boundary Isolation:**
   - In `resolveWorkspaceContext`, requests targeting another tenant's business strictly reject with `HTTP 403 Forbidden` (`You do not have permission to access this business`).
   - Tenant boundaries check active membership status across all system businesses. Unclaimed businesses (with zero memberships) permit claims by authorized users, while foreign businesses owned by another tenant remain inaccessible.

3. **Zero Direct Database Driver in Admin Portal:**
   - The administrative Control Center (`admin/`) has zero direct PostgreSQL drivers or network connections to PostgreSQL.
   - All mutations execute through server-to-server proxy route handlers to `api:4000` with Bearer token authentication, preventing direct database exposure or credential leakage to client bundles.

4. **Fail-Closed Policy on Administrative Tokens:**
   - In production environments, if `ADMIN_TOKEN` is unset or blank, `authenticateAdminRequest` fails closed with HTTP 500 configuration errors rather than allowing unauthenticated access.

---

## 17. Authoritative PostgreSQL Persistence & Fail-Closed Security (Milestone 0.20.26)

1. **Elimination of Process-Local Authoritative Storage:**
   - Ephemeral in-memory Maps and objects in the standalone REST API (`api/`) are eliminated as authoritative sources of truth for mutable business, financial, content, ranking, and audit state.
   - All mutations write durably to PostgreSQL using parameterized queries ($1, $2, ...) to prevent SQL injection.

2. **Fail-Closed Persistence Boundary:**
   - When `DATABASE_URL` is configured, API readiness `/api/health/ready` evaluates connectivity using `checkDatabaseHealth()`.
   - If PostgreSQL is unreachable, timed out, or unready, the API immediately marks itself `DEGRADED` (HTTP 503) and fails closed.
   - The API server never falls back silently to in-memory fixtures or mock datasets when the real database is unavailable.

3. **Atomic Market Row-Level Concurrency:**
   - Mutating a business ranking locks the target market row via `SELECT id FROM markets WHERE id = $1 FOR UPDATE`.
   - Ranking settlements, displacements, and `position_history` append records occur inside a single ACID transaction block (`withTransaction`), preventing lost updates, race conditions, or uncoordinated ranking positions.

---

## 18. Lead Discovery & Email Outreach Security Controls (Milestone 0.20.27)

1. **SSRF & Private Network Defense (`WebsiteCrawlerConnector`)**:
   - The crawler strictly checks URLs with `isSafeUrl()` before opening network sockets.
   - Blocks loopback addresses (`127.0.0.1`, `localhost`, `::1`), RFC1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.0.0/16`), and AWS/GCP cloud instance metadata services.
   - Bounded by a 5-second socket timeout and a 1MB maximum memory buffer ceiling.

2. **Spreadsheet Formula Injection Sanitization (`CsvConnector`)**:
   - Sanitizes untrusted CSV cell values starting with dangerous spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`).
   - Automatically prefixes risky cells with a single quote (`'`), ensuring back-office operators opening exported CSVs in Microsoft Excel or Google Sheets are protected from Remote Code Execution (RCE) and DDE attacks.

3. **Email Template XSS Defense & Output Escaping (`template-renderer.ts`)**:
   - Scraped candidate data (business names, locations, contact names) are treated as untrusted user input.
   - All personalization variables are converted through `escapeHtml()` converting `<` to `&lt;`, `>` to `&gt;`, `"` to `&quot;`, and `'` to `&#39;`.

4. **Authoritative Suppression List Invariant (`email_suppression_list`)**:
   - Suppression lists are permanently stored in PostgreSQL.
   - Checks execute immediately before every dispatch cycle; suppressed recipients are excluded prior to outbox queueing.
   - Public one-click unsubscribe links (`/api/public/leads/opt-out`) permanently register opt-outs without requiring user authentication.

5. **Server-Side Gemini API Isolation & Anti-Hallucination Constraints**:
   - `GEMINI_API_KEY` is restricted strictly to server-side Node processes and never sent to browser bundles.
   - Gemini prompts instruct the model **never** to invent business emails, phone numbers, or addresses.
   - If unconfigured or on failure, the system falls back safely to deterministic taxonomy mapping.

6. **Decoupled Outreach Boundary**:
   - Scraper runs on an isolated schedule and cannot trigger automatic email delivery.
   - Email Automation runs independently on SQL-persisted leads, strictly enforcing contact cooldown periods (default: 30 days) and per-campaign volume limits.






