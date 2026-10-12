# AageOnline — Authoritative State Model & Lifecycle Invariants

## 1. System Purpose & Authority

This document defines the formal, authoritative state transitions and operational invariants for AageOnline. No implementation may introduce arbitrary states, skip lifecycle gates, or calculate authoritative ranking in the presentation layer.

---

## 2. AageOnline Ranking Integrity Model

The core product invariant is:

$$\text{Payment} \longrightarrow \text{Transaction} \longrightarrow \text{Qualification} \longrightarrow \text{Ranking}$$

A business **cannot** occupy a paid visibility position merely because:
- A bid was initiated in the browser
- A checkout page was opened
- A client-side URL callback indicates `?payment=success`
- A client state claims `#1`

The ranking changes **only** when an authoritative transaction enters the `RANKING_CONFIRMED` state within an atomic database transaction.

---

## 3. User Account Lifecycle

```text
       ┌──────────────┐
       │  REGISTERED  │
       └──────┬───────┘
              │ (Phone / Email OTP Verified)
              ▼
       ┌──────────────┐
       │   VERIFIED   │
       └──────┬───────┘
              │ (Profile Completed)
              ▼
       ┌──────────────┐       Admin Suspension       ┌──────────────┐
       │    ACTIVE    │ ────────────────────────────► │  SUSPENDED   │
       └──────────────┘                               └──────────────┘
```

- Only `ACTIVE` users may create, claim, or manage businesses.
- `SUSPENDED` users cannot submit bids, execute payments, or modify listings.

---

## 4. Business Record Lifecycle

```text
       ┌──────────────┐
       │    DRAFT     │
       └──────┬───────┘
              │ (Claim initiated with proof)
              ▼
       ┌──────────────┐
       │ CLAIM_PENDING│
       └──────┬───────┘
              │ (Admin / Automatic review)
              ▼
 ┌───────────────────────────┐
 │   VERIFICATION_PENDING    │
 └─────────────┬─────────────┘
               │ (Documentation approved)
               ▼
       ┌──────────────┐       Admin / Policy Flag     ┌──────────────┐
       │    ACTIVE    │ ────────────────────────────► │  SUSPENDED   │
       └──────┬───────┘                               └──────────────┘
              │ (Deleted by owner)
              ▼
       ┌──────────────┐
       │   ARCHIVED   │
       └──────────────┘
```

- **Invariant:** Only `ACTIVE` businesses are eligible to compete in paid visibility ladders.
- Suspended or unverified businesses are excluded from ranking mutations.

---

## 5. Formal Transaction State Machine

The transaction state machine governs the financial and positioning lifecycle:

```text
                        ┌─────────────┐
                        │   CREATED   │
                        └──────┬──────┘
                               │ (Server-side price derivation)
                               ▼
                        ┌─────────────┐
                        │ VALIDATING  │
                        └──────┬──────┘
             ┌─────────────────┼─────────────────┐
             │ (Valid quote)   │ (Invalid bid)   │ (Concurrency collision)
             ▼                 ▼                 ▼
     ┌───────────────┐  ┌─────────────┐   ┌─────────────┐
     │PAYMENT_PENDING│  │  REJECTED   │   │  EXPIRED    │
     └───────┬───────┘  └─────────────┘   └─────────────┘
             │ (Gateway intent initiated)
             ▼
     ┌───────────────────┐
     │PAYMENT_PROCESSING │
     └───────┬───────────┘
             │ (Webhook / Poll received)
             ▼
 ┌───────────────────────────────┐
 │ PAYMENT_VERIFICATION_PENDING  │
 └───────┬───────────────┬───────┘
         │               │ (Signature failed / amount mismatch)
         │               ▼
         │        ┌─────────────────────────┐
         │        │ RECONCILIATION_REQUIRED │ (Fail-closed alarm)
         │        └─────────────────────────┘
         │ (HMAC verified, amount exact)
         ▼
  ┌──────────────────┐
  │PAYMENT_CONFIRMED │
  └────────┬─────────┘
           │ (Acquire market row-lock)
           ▼
  ┌──────────────────┐
  │ RANKING_PENDING  │
  └────────┬─────────┘
           │ (Atomic database commit)
           ▼
 ┌───────────────────┐
 │ RANKING_CONFIRMED │
 └───────────────────┘
```

### Terminal Failure States:
- `FAILED`: Payment gateway reported explicit transaction failure.
- `EXPIRED`: User did not complete checkout within the 120-second hold window.
- `CANCELLED`: User explicitly cancelled the checkout session before capture.
- `REJECTED`: Bid violated business rules (e.g. offered amount $\le$ current qualifying amount).
- `RECONCILIATION_REQUIRED`: Inconsistent financial state detected. Suspends automated rank movement.

---

## 6. Atomic Ranking Mutation Pipeline

When a transaction enters `PAYMENT_CONFIRMED`, the ranking engine executes the following atomic sequence within a database transaction:

```text
Step 1: BEGIN TRANSACTION;
Step 2: SELECT * FROM markets WHERE id = $market_id FOR UPDATE; (Advisory/Row lock)
Step 3: Re-verify current incumbent qualifying amount for $target_position.
Step 4: If incumbent_amount >= transaction.amount_minor:
        - Trigger CONCURRENCY_COLLISION protocol
        - Business takes next best qualified rank OR placed in pending-reconciliation queue
        - Emit TARGET_POSITION_SUPERSEDED event
Step 5: Shift displaced ranking entries:
        UPDATE ranking_entries 
        SET position = position + 1 
        WHERE market_id = $market_id AND position >= $target_position;
Step 6: Upsert new ranking entry with authoritative transaction reference.
Step 7: INSERT INTO position_history (business_id, market_id, prev_pos, new_pos, cause, transaction_id).
Step 8: INSERT INTO audit_logs (actor, action, correlation_id, resource).
Step 9: COMMIT;
Step 10: Asynchronously emit milestone ladder notification events.
```

---

## 7. Position Movement Semantics

Businesses in a market experience discrete movement events:
- `POSITION_GAINED`: Business moved up (e.g., #5 $\rightarrow$ #2).
- `POSITION_LOST`: Displaced downward by a newly qualifying higher transaction (e.g., #2 $\rightarrow$ #3).
- `POSITION_UNCHANGED`: Retained position.
- `ENTERED_RANKING`: Business achieved its first paid ranking in the market.
- `LEFT_RANKING`: Business moved beyond maximum tracked ladder (e.g. dropped past #100).

> **Payment Finality Invariant:**  
> Moving downward due to another business's higher qualifying transaction is **NOT** a refund or reversal event. Each upward position change is a distinct, finalized transaction.

---

## 8. "Impossible State" Fail-Closed Rules

If any of the following contradictions occur, the system immediately **fails closed**:

1. **Unpaid Occupancy:** A business occupies a paid rank without a corresponding `RANKING_CONFIRMED` transaction.
2. **Underpaid Displacement:** An entry exists where `amount_minor <= previous_qualifying_amount_minor`.
3. **Duplicate Rank:** Two active entries in the same market share the identical `position` number.
4. **Missing History:** A rank movement occurred with no corresponding `position_history` record.
5. **Currency Drift:** A payment recorded with `currency != 'INR'`.

**Fail-Closed Response:**
- Zero automatic position advances are permitted.
- The affected market is flagged as `LOCKED_FOR_RECONCILIATION`.
- System triggers a P1 security and operations notification.

---

## 9. Public Visibility & Indexability Invariants

A market entity is visible on public discovery routes (`/markets`, `/api/markets`, and `/{location}/{category}`) if and only if:
1. `status === 'PUBLISHED'`
2. `publicationStatus === 'PUBLISHED'`

Markets in `DISCOVERED`, `DRAFT`, `REVIEW`, or `ARCHIVED` status are strictly quarantined from public directory queries, search results, and robots indexing. Any attempt by public clients to query draft markets returns null or 404. Public data-access adapters validate this invariant before yielding data to UI components.

---

## 10. Commercial Location Publication & City Page State Invariants

A geographic entity (City) is publicly accessible at `/[location]` and indexed in `/locations` if and only if:
1. Canonical entity `status === 'ACTIVE'`
2. City has at least one active market satisfying `publicationStatus === 'PUBLISHED' && status === 'PUBLISHED'`

Cities with 0 published markets or non-existent taxonomy records return a controlled `404 Not Found` (`notFound()`) and are omitted from `sitemap.xml`. When an administrator publishes a new market in an emerging city, the city dynamically transitions into public discovery on the subsequent request without code changes or frontend redeployment.

---

## 11. Category Publication & Category Discovery Page State Invariants

A business category entity is publicly accessible at `/categories/[category]` and indexed in `/categories` if and only if:
1. Canonical entity `status === 'ACTIVE'`
2. Category has at least one active market satisfying `publicationStatus === 'PUBLISHED' && status === 'PUBLISHED'`

Categories with 0 published markets or non-existent taxonomy records return a controlled `404 Not Found` (`notFound()`) and are omitted from `sitemap.xml`. When an administrator publishes a new market in an emerging category (e.g. `Hisar × Interior Designers` or `Jaipur × Dentists`), the category dynamically transitions into public discovery on the subsequent request without code changes or frontend redeployment.

---

## 12. Business Publication, Verification Lifecycle & Market Participation State Invariants

1. **Independent Verification vs. Publication:**
   - `publicationStatus`: Controls public visibility (`PUBLISHED`, `DRAFT`, `REVIEW`, `ARCHIVED`).
   - `verificationStatus`: Controls identity trust badge (`VERIFIED`, `UNVERIFIED`, `PENDING`, `REJECTED`).
   - A business can be `PUBLISHED + UNVERIFIED`. Verification badges are rendered if and only if `verificationStatus === 'VERIFIED'`.
2. **Access Control Invariant:**
   - Only businesses with `publicationStatus === 'PUBLISHED'` are accessible on `/businesses/[business]` or listed in `/businesses`.
   - Businesses in `DRAFT`, `REVIEW`, or `ARCHIVED` status return a controlled `404 Not Found` (`notFound()`) and are excluded from `sitemap.xml`.
3. **Market Participation Invariants:**
   - Participation is an explicit relationship ($\text{Business} + \text{Market} = \text{MarketParticipation}$), unique on composite keys `(businessId, marketId)`.
   - Market participation does **not** imply holding a paid ranking position. If a business participates without a current qualifying transaction, `currentPosition === null` (rendered as "Participating in this market", never `#0` or `#999`).
   - Only participations in markets satisfying `publicationStatus === 'PUBLISHED' && status === 'PUBLISHED'` are exposed publicly.
4. **Unknown Business Discovery:**
   - Direct searches or queries for unlisted businesses trigger deduplicated `DiscoveryRequest` records (`requestType: 'BUSINESS'`). Unlisted inputs never mutate canonical business records from the browser.

---

## 13. Business Claim, Membership & RBAC State Machine

### 13.1 Business Claim State Machine
```text
               ┌───────────┐
               │  PENDING  │
               └─────┬─────┘
                     │
          ┌──────────┼──────────┬──────────┐
          ↓          ↓          ↓          ↓
    UNDER_REVIEW  APPROVED  CANCELLED   EXPIRED
          │          │
     ┌────┴────┐     ↓
     ↓         ↓  [Provisions ACTIVE OWNER Membership]
  APPROVED  REJECTED
```

- **Valid Transitions:**
  - `PENDING` $\rightarrow$ `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`
  - `UNDER_REVIEW` $\rightarrow$ `APPROVED`, `REJECTED`, `CANCELLED`
- **Terminal States:** `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`. Any mutation from a terminal state throws an invalid state transition error.
- **Invariants:**
  - Exactly one active claim (`PENDING` or `UNDER_REVIEW`) is permitted per `(businessId, claimantUserId)`.
  - Claim submission does **not** grant immediate membership.
  - Claim approval atomically provisions an `ACTIVE` `OWNER` `BusinessMembership`.
  - Claim rejection preserves audit record and `rejectionReason`.

### 13.2 Business Membership State Machine
```text
INVITED ──→ ACTIVE ──→ SUSPENDED ──→ REMOVED
              ↑           │
              └───────────┘
```

- **Invariants:**
  - Composite uniqueness: `(businessId, userId)`. A user holds at most one membership record per business.
  - Role modifications (`OWNER`, `ADMIN`, `EDITOR`, `FINANCE`) mutate the existing membership record rather than creating duplicate records.
  - Only `ACTIVE` status grants operational access in RBAC checks. `SUSPENDED` and `REMOVED` memberships are rejected with 403 Forbidden.

---

## 14. Market Position Pricing Calculation States & Invariants (Read-Only)

The Market Position Pricing Engine evaluates market state without executing financial or ranking transitions.

```text
Target Position Request
         │
         ▼
┌───────────────────┐
│ Market Validation │ ─── (Not ACTIVE/PUBLISHED) ──► MarketUnavailableError (422)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│Position Validation│ ─── (Invalid, 0, > Capacity) ─► InvalidTargetPositionError (400/422)
└────────┬──────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│               Calculation Mode Derivation              │
├──────────────────────────┬─────────────────────────────┤
│ Condition                │ Calculation Mode            │
├──────────────────────────┼─────────────────────────────┤
│ Occupant exists          │ STRICT_SUPERSEDING          │
│ Unoccupied position      │ INITIAL_FLOOR               │
│ Requested == Current Pos │ ALREADY_HOLDING_POSITION    │
│ Requested > Current Pos  │ LOWER_POSITION              │
└──────────────────────────┴─────────────────────────────┘
```

### 14.1 Calculation Modes
1. `STRICT_SUPERSEDING`:
   - Position currently occupied by a competitor.
   - Requirement: Strictly exceeds incumbent qualifying amount by at least ₹1 (100 paise).
   - Equal amounts are strictly rejected.
2. `INITIAL_FLOOR`:
   - Target position is currently vacant within market capacity.
   - Requirement: Market's configured base entry floor (₹1,000 / 100,000 paise).
3. `ALREADY_HOLDING_POSITION`:
   - Requesting business currently occupies the requested position.
   - Informational response indicating current holding; requires no superseding action.
4. `LOWER_POSITION`:
   - Requesting business currently occupies a higher visibility position (e.g. holds #1, selects #3).
   - Informational response; does not interpret downgrade as a purchase.

### 14.2 Strict Operational Invariants
1. **Whole Rupee Invariant:** All inputs, outputs, and calculations must be positive whole Indian Rupees only (`amountMinor % 100 === 0`). Decimal amounts and fractional paise are rejected without rounding.
2. **Zero Mutation Invariant:** Pricing evaluation mutates zero records across `MarketParticipation`, `ranking_entries`, `transactions`, `position_history`, and `audit_logs`.
3. **No Reservation / No Price Lock:** A calculation is point-in-time informational data. It never locks an amount or reserves a position slot. Future bid intent and payment operations must independently recalculate market state server-side.

---

## 15. Bid Intent Lifecycle State Machine & Idempotency Invariants (Milestone 0.11.0)

### 15.1 Bid Intent State Transition Diagram

```text
       POST /api/bid-intents
                 │
                 ▼
      ┌─────────────────────┐
      │   PENDING_PAYMENT   │
      └──────────┬──────────┘
                 │
        ┌────────┴────────┐
        │                 │
  (TTL > 15m)      (Authorized Cancel)
        │                 │
        ▼                 ▼
 ┌─────────────┐   ┌─────────────┐
 │   EXPIRED   │   │  CANCELLED  │
 └─────────────┘   └─────────────┘
  (Terminal)        (Terminal)
```

### 15.2 State Definitions & Transitions
1. `PENDING_PAYMENT`:
   - **Entry:** Atomically created upon successful authorization, target validation, server-side pricing re-evaluation, and idempotency resolution.
   - **Meaning:** Represents an immutable, authorized intention to pursue a target position at the calculated qualifying amount. **Does NOT signify payment or position reservation.**
   - **Exits:**
     - Transitions to `EXPIRED` if `now() >= expiresAt` (default TTL: 15 minutes).
     - Transitions to `CANCELLED` via explicit authorized cancellation (`POST /api/bid-intents/:id/cancel`).
2. `EXPIRED`:
   - **Terminal State.** Cannot transition to any other state.
   - Any payment handoff or cancellation attempt on an expired intent is rejected (`410 BID_INTENT_EXPIRED`).
   - Does not affect rankings, trigger refunds, or generate position history.
3. `CANCELLED`:
   - **Terminal State.** Cannot transition to any other state.
   - Authorized actor (`OWNER` / `ADMIN`) explicitly terminates intent prior to expiration.
   - Does not affect rankings, trigger refunds, or generate position history.

### 15.3 Core Invariants
1. **Absolute Immutability:** Once created, `businessId`, `marketId`, `createdByUserId`, `membershipId`, `targetPosition`, `qualifyingAmountMinor`, `qualifyingAmountRupees`, `currency`, `pricingSnapshot`, `idempotencyKey`, and `createdAt` can never be updated.
2. **Authoritative Server Pricing at Creation:** Stale client pricing references are rejected (`409 PRICING_CHANGED`). The server re-evaluates pricing from authoritative market state at creation time.
3. **Scoped Idempotency Invariant:** A repeated request with the same `Idempotency-Key` within the `(actorUserId, businessId)` scope returns the existing `BidIntent`. Conflicting payload parameters produce `409 IDEMPOTENCY_KEY_REUSED`.
4. **Zero Mutation Guarantee:** Creation, expiration, or cancellation of a `BidIntent` mutates zero ranking entries, zero market participations, zero position history records, and processes zero payments.

---

## 16. Payment Order Lifecycle & Payment State Machine (Milestone 0.12.0)

### 16.1 Payment Order State Transition Diagram

```text
       POST /api/bid-intents/:id/payment-order
                        │
                        ▼
               ┌─────────────────┐
               │     CREATED     │
               └────────┬────────┘
                        │ (Redirect to PayU / Transaction initiated)
                        ▼
               ┌─────────────────┐
               │     PENDING     │
               └────────┬────────┘
                        │
      ┌─────────────────┼─────────────────┬─────────────────┐
      │ (Verified Hash  │ (PayU Failure / │ (Authorized     │ (BidIntent
      │ & Success)      │ Hash Mismatch)  │ Cancel)         │ Expired)
      ▼                 ▼                 ▼                 ▼
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│ SUCCEEDED │     │  FAILED   │     │ CANCELLED │     │  EXPIRED  │
└─────┬─────┘     └───────────┘     └───────────┘     └───────────┘
      │ (Reconciled)  (Terminal)        (Terminal)        (Terminal)
      ▼
┌───────────┐
│ CONFIRMED │
└───────────┘
  (Terminal)
```

### 16.2 State Definitions

| State | Type | Description |
|---|---|---|
| `CREATED` | Initial | Payment order created internally and correlated with `BidIntent`. Checkout payload generated. |
| `PENDING` | In-Flight | Customer redirected to PayU. In-flight transaction awaiting server-to-server webhook or verification API. |
| `SUCCEEDED` | Verified | Trusted PayU evidence received with valid reverse-hash, matching transaction ID, exact amount, and INR currency. |
| `CONFIRMED` | Terminal | Succeeded payment reconciled via PayU Verify Payment API. Ready for future ranking engine consumption. |
| `FAILED` | Terminal | Explicit gateway failure, amount mismatch, reverse-hash forgery, or timeout. |
| `CANCELLED` | Terminal | Internal payment intention cancelled by authorized member (`OWNER` / `ADMIN`) before confirmation. |
| `EXPIRED` | Terminal | Underlying `BidIntent` TTL elapsed before payment was received. |
| `UNKNOWN` | Safe Guard | Ambiguous or incomplete provider response. Safely frozen without advancing financial or ranking state. |

### 16.3 Transition Matrix & Safety Policies

| From \ To | `CREATED` | `PENDING` | `SUCCEEDED` | `CONFIRMED` | `FAILED` | `CANCELLED` | `EXPIRED` | `UNKNOWN` |
|---|---|---|---|---|---|---|---|---|
| `CREATED` | Duplicate | Valid | Valid | Invalid | Valid | Valid | Valid | Valid |
| `PENDING` | Invalid | Duplicate | Valid | Valid | Valid | Valid | Valid | Valid |
| `SUCCEEDED` | Invalid | Contradictory | Duplicate | Valid | Contradictory | Invalid | Invalid | Invalid |
| `CONFIRMED` | Invalid | Contradictory | Duplicate | Duplicate | Contradictory | Invalid | Invalid | Invalid |
| `FAILED` | Invalid | Invalid | Invalid | Invalid | Duplicate | Invalid | Invalid | Invalid |
| `CANCELLED`| Invalid | Invalid | Invalid | Invalid | Invalid | Duplicate | Invalid | Invalid |
| `EXPIRED`  | Invalid | Invalid | Invalid | Invalid | Invalid | Invalid | Duplicate | Invalid |

### 16.4 Terminal Protection & Contradictory Event Handling
1. **No Downgrade from Success:** A verified `SUCCEEDED` or `CONFIRMED` payment can never be downgraded to `FAILED` or `PENDING` by late-arriving or out-of-order failure callbacks.
2. **Contradictory Event Quarantine:** If a provider emits contradictory states (e.g. `FAILED` followed by `SUCCESS` without reconciliation), the transition is flagged as `CONTRADICTORY` and logged to the security audit trail.
3. **Idempotent Webhook Duplicate Handling:** Re-receiving an identical success webhook returns `DUPLICATE` with HTTP 200 without creating new payment records or re-executing state handlers.

### 16.5 The Zero-Mutation Invariant (Section 3.1 & 3.2)
> **Payment SUCCEEDED does NOT mutate ranking.**
> Under Milestone 0.12.0, transitioning a `PaymentOrder` to `SUCCEEDED` or `CONFIRMED` leaves `MarketParticipation.currentPosition`, `ranking_entries`, and `PositionHistory` completely untouched.
> Ranking mutations remain strictly deferred to the future Atomic Ranking Engine (Milestone 0.13.0).

---

## 17. Ranking Settlement Lifecycle & State Machine (Milestone 0.13.0)

### 17.1 Separation of Payment Confirmation and Ranking Settlement

Payment truth and ranking settlement truth are strictly decoupled:
- `PaymentOrder.status === 'CONFIRMED'`: Payment has been cryptographically verified and reconciled with PayU.
- `RankingSettlement.status === 'SETTLED'`: Confirmed payment has atomically mutated market ranking and produced append-only position history records.

A confirmed payment enters settlement through an independent, transaction-safe lifecycle.

### 17.2 State Machine Diagram

```text
                  PaymentOrder = CONFIRMED
                             │
                             ▼
                    ┌─────────────────┐
                    │     PENDING     │
                    └────────┬────────┘
                             │ (Acquire Market Lock & Begin Tx)
                             ▼
                    ┌─────────────────┐
                    │   PROCESSING    │
                    └────────┬────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │ (Atomic Mutation    │ (Business Conflict: │ (Infrastructure /
       │ & History Commit)   │ Floor Shifted)      │ Lock Conflict)
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   SETTLED   │       │   FAILED    │       │  RETRYABLE  │
└─────────────┘       └─────────────┘       └─────────────┘
  (Terminal)            (Terminal)            (Recoverable)
```

### 17.3 State Definitions & Invariants

| State | Classification | Description | Invariant & Side-Effects |
|---|---|---|---|
| `PENDING` | Initial | Settlement record initialized for a `CONFIRMED` payment order. | Zero ranking mutation. Unlocked. |
| `PROCESSING` | In-Flight | Market transaction active; market row-locked; ranking plan calculated. | Transient state inside database transaction. If process crashes, transaction rollback restores pre-transaction state. |
| `SETTLED` | Terminal | Positions updated, `PositionHistory` written, transaction committed. | Permanent immutable outcome. Idempotent replays return existing record without mutating ranking. |
| `FAILED` | Terminal | Business rule rejection (e.g. `RANKING_TARGET_NO_LONGER_ACHIEVABLE` or target exceeds capacity). | Zero ranking mutation. Payment remains `CONFIRMED`. No automatic charging or refunds. |
| `RETRYABLE` | Recoverable | Technical/transient error (e.g. database serialization conflict or lock acquisition timeout). | Zero ranking mutation. Payment remains `CONFIRMED`. Safe for subsequent automated or manual retry. |

### 17.4 State Transition Rules
1. **Confirmed Payment Gate:** Settlement may strictly transition from `PENDING` to `PROCESSING` only when `PaymentOrder.status === 'CONFIRMED'`. Statuses `SUCCEEDED`, `PENDING`, `CREATED` cannot enter settlement.
2. **Terminal Settlement Finality:** Once `SETTLED`, the record cannot transition back to `PENDING`, `PROCESSING`, or `FAILED`.
3. **Rollback Integrity:** Any unexpected runtime or database exception aborts the transaction, reverting in-memory and database state to pre-transaction snapshots.

---

## 18. Settlement Recovery Job State Machine (Milestone 0.14.0)

### 18.1 Recovery Job Lifecycle

To guarantee durable eventual settlement after process crashes, worker timeouts, or transient database serialization failures, `settlement_recovery_jobs` manages retryable asynchronous reconciliation:

```text
               Payment Confirmed / Recoverable Failure
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     PENDING     │
                         └────────┬────────┘
                                  │ (Worker Claims with SKIP LOCKED)
                                  ▼
                         ┌─────────────────┐
                         │   PROCESSING    │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
 (Settlement Succeeded)    (Transient DB/Lock       (Permanent Conflict:
        │                   Failure & attempts < 5)  Floor Shifted / Ineligible)
        ▼                         ▼                         ▼
 ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
 │  COMPLETED  │           │  RETRYABLE  │           │   FAILED    │
 └─────────────┘           └──────┬──────┘           └─────────────┘
   (Terminal)                     │ (Backoff Expired)  (Terminal)
                                  ▼
                             (Re-queue)
```

### 18.2 State Definitions & Invariants

| State | Classification | Description | Invariants |
|---|---|---|---|
| `PENDING` | Initial / Ready | Enqueued upon payment confirmation or discovered unsettled. | Awaiting worker polling. Unlocked. |
| `PROCESSING` | In-Flight | Claimed by recovery worker using `FOR UPDATE SKIP LOCKED`. | Exactly one worker holds lock; timeout resets after lease expiration. |
| `COMPLETED` | Terminal | Ranking settlement succeeded and committed atomically. | Immutable. Idempotent replays perform zero ranking mutations. |
| `FAILED` | Terminal | Business conflict (e.g. `TargetNoLongerAchievableError`) or max retry attempts (5) exhausted. | Permanently stopped. Will NOT be retried automatically. Payment remains `CONFIRMED`. |
| `RETRYABLE` | Transient Retry | Recoverable error (deadlock, serialization failure, network blip). | Increments `attempts`, applies exponential backoff ($2^{\text{attempts}} \times 30\text{s}$) to `next_run_at`. |

### 18.3 Invariant Separation Between Layers

- **Payment State (`PaymentOrder.status`):** Remains `CONFIRMED` throughout recovery. Failure of settlement does NOT roll back or cancel payment truth.
- **Settlement State (`RankingSettlement.status`):** Tracks domain settlement outcome (`SETTLED`, `FAILED`, `RETRYABLE`).
- **Recovery Job State (`SettlementRecoveryJob.status`):** Tracks operational outbox retry orchestration (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `RETRYABLE`).






