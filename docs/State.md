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
