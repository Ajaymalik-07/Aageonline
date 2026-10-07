# Workflow: Ranking Mutation Verification

This workflow guides testing and validating changes to the competitive ranking engine.

## Step 1: Pre-Flight State Verification
1. Inspect `docs/State.md` to confirm state machine invariants.
2. Confirm market uniqueness: `market_id` represents exactly one `location_id + category_id`.

## Step 2: Atomic Transaction Isolation
1. Verify database queries acquire explicit row/advisory locks on `market_id`.
2. Confirm recalculation algorithm deterministically updates positions without gaps or duplicate ranks.
3. Validate that `position_history` record is written inside the same transaction.

## Step 3: Concurrency Stress Test
1. Execute multi-threaded/concurrent test simulating 2+ businesses attempting to purchase the same target rank simultaneously.
2. Validate:
   - Exactly one business wins the target rank.
   - The other is displaced down or refunded at payment gateway before state update.
   - Zero duplicated ranks (e.g. two businesses sharing #1).
   - Zero lost updates.

## Step 4: Financial Immutability Check
1. Verify that overtaken businesses do NOT trigger refund events.
2. Verify that `transactions` and `position_history` rows remain unchanged.
