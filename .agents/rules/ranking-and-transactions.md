# Ranking Engine & Transaction Integrity Rules

## 1. Concurrency & Atomicity
- All ranking mutations MUST execute inside a database transaction (`SERIALIZABLE` or with explicit row/advisory locking on the `market_id`).
- Under no circumstances should concurrent position purchases produce duplicate positions (e.g., two businesses sharing #1) or dropped updates.
- Recalculate all affected ranks (#1 through #N) deterministically before committing.

## 2. Server-Side Price & Eligibility Recalculation
- NEVER trust client-supplied price or position data.
- The server must verify that:
  1. The business is `ACTIVE` and verified.
  2. The target position is valid and currently calculated.
  3. The payment is verified via provider signature and matches the exact quoted amount.
  4. The idempotency key has not been processed.

## 3. Financial Finality & Immutability
- Position drops do NOT trigger refunds. Previous payments remain spent.
- Transaction records (`transactions`) and position history (`position_history`) are strictly append-only.
- Never update or delete existing financial rows.
- Use exact minor units (integer cents/paise) or SQL `NUMERIC` for monetary values. Floating-point numbers are prohibited.
