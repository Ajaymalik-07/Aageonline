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
7. ❌ Broken object authorization on business or transaction endpoints.
8. ❌ Public API responses leaking private financial IDs, webhook secrets, or owner details.
9. ❌ Floating-point arithmetic used for monetary amounts.
10. ❌ Unhandled concurrent bids causing duplicate positions or lost updates.
