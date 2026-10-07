---
name: database-migrations
description: Enforces PostgreSQL schema integrity, unique constraints, index optimization, and data modeling invariants. Trigger when modifying database schemas, writing migrations, or inspecting entity relationships.
---

# Database Migrations Skill

## Purpose
Ensures PostgreSQL data modeling strictly adheres to `docs/Database.md`, enforces relational integrity, prevents duplicate markets, and optimizes queries for high-throughput ranking reads.

## Trigger Conditions
- Creating or editing database migration scripts (e.g. Prisma, Drizzle, Kysely, raw SQL).
- Adding or altering tables for users, businesses, markets, rankings, bids, transactions, or audit logs.
- Designing indices for ranking tables and location/category lookup.

## Instructions
1. **Model Core Entities:**
   - Adhere to the entity list in `docs/Database.md`:
     `users`, `businesses`, `business_owners`, `business_claims`, `business_verifications`, `categories`, `states`, `districts`, `cities`, `business_categories`, `business_locations`, `markets`, `ranking_entries`, `bids`, `transactions`, `position_history`, `notifications`, `audit_logs`.
2. **Enforce Database Constraints:**
   - **Market Uniqueness:** `UNIQUE(location_id, category_id)` constraint on `markets`.
   - **Transaction Uniqueness:** `UNIQUE(provider_transaction_id)` and `UNIQUE(idempotency_key)` on `transactions`.
   - **Monetary Constraints:** `CHECK (amount >= 0)` on bids and transactions.
   - **Foreign Keys:** Enforce `ON DELETE RESTRICT` for financial and historical audit records to prevent orphan data or silent deletion.
3. **Optimize Indexing:**
   - Index `(market_id, position)` for fast ranking page retrieval.
   - Index `(business_id, market_id)` for quick business status queries.
   - Index `(status, created_at)` for transaction reconciliation and notification dispatch.
4. **Data Types:**
   - Use `NUMERIC(12, 2)` or `BIGINT` (minor units / paise) for all monetary fields. Prohibit `FLOAT` or `DOUBLE PRECISION`.
   - Use `TIMESTAMPTZ` for all temporal fields, defaulting to `NOW()`.

## Constraints
- Never drop columns or tables in production migrations without a phased deprecation plan.
- Never write destructive migrations that truncate or wipe audit/financial data.

## Expected Output
- Reversible, idempotent SQL migration scripts.
- Verified relational constraints and indexing strategies.

## Relevant Documentation References
- [docs/Database.md](file:///d:/Aage%20online/docs/Database.md)
- [docs/Architecture.md](file:///d:/Aage%20online/docs/Architecture.md)
- [docs/Security.md](file:///d:/Aage%20online/docs/Security.md)
