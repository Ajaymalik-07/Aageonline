# AageOnline — Decision Log

## ADR-001 — Product Model

**Decision:** AageOnline is a paid business-visibility positioning platform.

**Reason:** This is the core differentiated mechanism.

## ADR-002 — Market Definition

**Decision:** A market is defined by location + category.

**Reason:** It creates a clear competitive context.

## ADR-003 — Payment Finality

**Decision:** Each upward position change is a new payment. Previous payments are not refunded when another business overtakes the position.

**Reason:** Keeps the V1 financial model simple and directly tied to visibility purchases.

## ADR-004 — No Wallet

**Decision:** V1 has no wallet, withdrawal, points, or stored bid balance.

**Reason:** Avoids unnecessary financial complexity.

## ADR-005 — No Auto-Bidding

**Decision:** V1 uses explicit user-initiated position purchases.

**Reason:** Keeps bidding understandable and auditable.

## ADR-006 — Homepage Spotlight

**Decision:** Homepage may show the category/market with the strongest qualifying competitive activity.

**Reason:** Makes the competitive nature of the platform visible immediately.

## ADR-007 — Brand

**Decision:** AageOnline with tagline “Get Seen. Get Ahead.”

**Reason:** The name communicates forward movement and the product outcome.

## ADR-008 — Visual Identity

**Decision:** Teal + Emerald + Lime with Deep Navy foundation, supporting Light and Dark themes.

**Reason:** Balances trust, energy, and competitive visibility.

## ADR-009 — Motion and 3D

**Decision:** Controlled 3D and purposeful motion are part of the product language.

**Reason:** Movement is intrinsic to position competition, but transactional clarity remains the priority.

## ADR-010 — Public Transparency

**Decision:** Paid visibility must be clearly disclosed and must not be represented as objective business quality.

**Reason:** Trust and consumer clarity are core requirements.

## ADR-011 — Development Harness Architecture

**Decision:** Establish a structured, documentation-first AI agent development harness rooted in `.agents/` (skills, workflows, references, rules) with root-level `AGENTS.md` and `DESIGN.md`.

**Reason:** Guarantees that coding agents strictly adhere to product boundaries, V1 exclusions, documentation authority, and design tokens without architectural drift.

## ADR-012 — Agent Memory Architecture (AgentMemory vs OpenViking)

**Decision:** Select `agentmemory` as the development agent persistent memory system; reject `OpenViking` as active infrastructure while keeping it documented as an evaluated alternative.

**Reason:** `agentmemory` provides lightweight, local SQLite + embedded engine execution with native Antigravity MCP integration and keyless BM25/hybrid search. `OpenViking` requires an external server, Docker runtime, AGPLv3 licensing, and Doubao/Ark model dependencies, creating excessive operational complexity for a development harness. Critical invariant: Agent memory is strictly scoped to development context and must never store production credentials, secrets, or user data.

## ADR-013 — Browser Automation Tooling Scoping

**Decision:** Maintain browser automation (`browser-use`) strictly as development/QA tooling and do not include it as a production application dependency.

**Reason:** Antigravity IDE already provides built-in browser subagents and CDP tools. Adding Python browser-use to the application runtime would introduce severe dependency pollution, bloated installation footprints, and security attack surface without production benefit.

## ADR-014 — Selective Skill & Workflow Adoption (Ponytail & ECC)

**Decision:** Adopt Ponytail's code minimization principles as an active agent skill and rule. Selectively extract high-leverage workflows (TDD, security review, code review) from ECC rather than installing the monolithic 293-skill suite or global hooks.

**Reason:** Prevents hook conflicts, configuration bloat, and context degradation while enforcing disciplined, minimal-diff code generation across all development tasks.

## ADR-015 — AageOnline Ranking Integrity Model (Zero Client Authority & Defense-in-Depth)

**Decision:** The frontend possesses zero authority over position calculations, price determination, payment confirmation, or ranking state. The core platform sequence `Payment → Transaction → Qualification → Ranking` is strictly enforced server-side.

**Reason:** Prevents zero-payment attacks, client-side ranking injection, and underpayment exploits. Establishes that client validation exists strictly for UX while server verification remains the sole source of truth.

## ADR-016 — Strictly Higher Bid Rule & Integer Minor Units Standard

**Decision:** A qualifying bid displacement must strictly satisfy `new_amount > current_qualifying_amount` (with a minimum +100 paise increment). Equal payments cannot displace an incumbent. All monetary values across the database, APIs, and client code are represented as exact integer minor units (paise; zero floating-point arithmetic).

**Reason:** Eliminates rounding inaccuracies, floating-point drift, and ambiguous equal-bid conflicts while maintaining transparent competitive mechanics.

## ADR-017 — Atomic Ranking Mutations & Fail-Closed State Invariants

**Decision:** All ranking mutations execute inside PostgreSQL transactions with explicit row/advisory locks on the target market. If any inconsistency, currency mismatch, or concurrent conflict is detected, the transaction rolls back and fails closed (`RECONCILIATION_REQUIRED`), halting rank advancement.

**Reason:** Guarantees serializability, eliminates duplicate ranks (e.g. split #1s), prevents race condition corruptions, and maintains a clean, append-only position history ledger.

