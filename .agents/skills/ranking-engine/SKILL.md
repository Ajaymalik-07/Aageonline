---
name: ranking-engine
description: Guides atomic ranking mutations, market-level concurrency locking, position recalculation, and position history tracking. Trigger when building or modifying ranking algorithms, bid processing, or market position queries.
---

# Ranking Engine Skill

## Purpose
Governs the core competitive ranking calculations, market concurrency controls, atomic position updates, and historical auditing. Ensures zero duplicate ranks and deterministic state transitions.

## Trigger Conditions
- Implementing or modifying ranking calculation algorithms.
- Handling position purchase fulfillment after payment.
- Updating ranking queries, target position quotes, or milestone alerts.
- Implementing market-level locking and concurrency tests.

## Instructions
1. **Enforce Atomic State Transitions:**
   - Follow the state machine in `docs/State.md`:
     `Payment verified` -> `Lock market (row/advisory lock on market_id)` -> `Validate target position` -> `Recalculate positions` -> `Write position_history` -> `Commit transaction` -> `Emit notifications` -> `Unlock market`.
2. **Deterministic Position Reordering:**
   - If business B purchases position #N, all businesses currently at rank >= N shift down by 1 position.
   - Maintain contiguous ranks: no duplicate positions (two businesses sharing #1) and no phantom gaps.
3. **Audit History Generation:**
   - Every mutation must append a record into `position_history`:
     `business_id`, `market_id`, `previous_position`, `new_position`, `cause`, `transaction_id`, `timestamp`.
4. **Milestone Ladder Detection:**
   - Check if movement crosses milestone thresholds: #1 -> #5, #5 -> #10, #10 -> #20, #20 -> #30, #30 -> #50, #50 -> #75, #75 -> #100.
   - Queue notification events idempotently.

## Constraints
- Never execute ranking changes outside a database transaction.
- Client-provided target pricing is never trusted; prices must be re-evaluated server-side.
- Outbid events never trigger financial refunds.

## Expected Output
- Atomic transaction queries with explicit locking.
- Correctly updated `ranking_entries` and immutable `position_history` rows.
- Concurrency test cases validating simultaneous bids.

## Relevant Documentation References
- [docs/State.md](file:///d:/Aage%20online/docs/State.md)
- [docs/Architecture.md](file:///d:/Aage%20online/docs/Architecture.md)
- [docs/Database.md](file:///d:/Aage%20online/docs/Database.md)
- [docs/API.md](file:///d:/Aage%20online/docs/API.md)
