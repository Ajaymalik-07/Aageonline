# AageOnline — AI Coding Agent Guide

> **Brand:** AageOnline  
> **Tagline:** Get Seen. Get Ahead.  
> **Product Category:** Business Visibility and Competitive Positioning Platform  
> **Architecture Status:** Foundation / Pre-Implementation  

---

## 1. Project Identity & Purpose

AageOnline is a business visibility and competitive positioning platform that allows businesses to achieve transparent, paid visibility inside well-defined local and regional markets.

- **Market Definition:** Exactly one **Location + Category** pair (e.g., *Jaipur + Interior Designers*, *Noida + Restaurants*, *India + Business Consultants*).
- **Core Competitive Mechanism:** Eligible businesses compete for paid visibility ranking positions (#1, #2, #3, etc.) within that market.
- **Position Purchase Mechanics:**
  1. Requires user authentication.
  2. Requires an eligible, verified business record.
  3. Requires a verified, server-recalculated payment via a payment provider.
  4. Changes ranking atomically within a strict database transaction.
  5. Produces an auditable, append-only position history record.
  6. **Payment Finality:** Does **NOT** refund previous payments when a business is overtaken or moves down in ranking. Each upward position change is a distinct transaction.

---

## 2. Definitive V1 Exclusions (Strict Boundary)

Coding agents must **NEVER** introduce, scaffold, or propose any of the following features in V1:

- ❌ **Wallets** or pre-funded balances
- ❌ **Withdrawals** or payout mechanisms
- ❌ **Refunds** for previous bids/overtaken positions
- ❌ **Subscriptions** or recurring recurring-billing locks
- ❌ **Auto-bidding** bots or automated escalation routines
- ❌ **Points, tokens, or credit systems**
- ❌ **Reverse marketplaces** (e.g., lead bidding by consumers)
- ❌ **Mobile applications** (V1 is responsive web-first)
- ❌ **Unnecessary AI/AR/VR features**
- ❌ **Unrelated SaaS or business-suite functionality**

Any attempt to introduce these concepts contradicts core product strategy.

---

## 3. Documentation Authority Order

AageOnline is documentation-first. Agents must read the authoritative documentation before implementing any feature or modifying code.

When requirements conflict, resolve them using this strict hierarchy:

```text
1. docs/PRD.md                     (Product requirements & V1 scope)
      ↓
2. docs/State.md                   (Authoritative state transitions & lifecycle invariants)
      ↓
3. docs/Architecture.md            (System boundaries, concurrency & runtime model)
      ↓
4. docs/Database.md                (Persistence, entities, constraints & relational rules)
      ↓
5. docs/API.md                     (Endpoint contracts, serialization & validation rules)
      ↓
6. docs/Design.md / DESIGN.md      (Design system, tokens, component states & accessibility)
      ↓
7. docs/Security.md / Compliance.md / Consent.md (Mandatory controls & legal review gates)
      ↓
8. docs/Testing.md                 (Acceptance criteria & verification matrices)
```

No implementation may silently contradict these documents. Material architectural choices must be documented in [docs/Decision-Log.md](file:///d:/Aage%20online/docs/Decision-Log.md) and recorded in [docs/Changelog.md](file:///d:/Aage%20online/docs/Changelog.md).

---

## 4. Engineering & Safety Rules

Every AI agent working in this repository must strictly adhere to the following principles:

1. **Inspect Before Modifying:** Always inspect existing files, dependencies, database entities, and interfaces before executing changes. Never write blind code.
2. **Make Minimal Changes (Ponytail Principle):** Write the smallest possible diff that completely satisfies the requirements. Avoid premature generalization, speculative abstractions, and unused utility wrappers.
3. **Preserve Existing Behavior:** Preserve existing contracts, tests, and comments unless the explicit task requires an update.
4. **Avoid Unnecessary Dependencies:** Do not add external packages or libraries when standard runtime capabilities suffice. Production dependencies must be rigorously justified.
5. **Never Trust the Client:**
   - Client-provided amounts, prices, positions, or eligibility flags are **never authoritative**.
   - The server must recalculate position pricing and verify payment webhook signatures independently.
6. **Atomic Ranking Mutations:**
   - Every ranking change must occur inside a database transaction with appropriate row/market locking.
   - Prevent lost updates, replayed payments, and race conditions.
7. **Append-Only Financial & Audit Records:**
   - Transactions, position history, and audit events must never be overwritten or silently deleted.
   - Store monetary values using exact integer minor units or decimal types—never floating-point numbers.
8. **Test Business-Critical Logic:**
   - Unit tests for ranking recalculation, price derivation, and milestone detection.
   - Integration tests for payment verification, webhook handling, and concurrency.
9. **Zero-Secret Tolerance:**
   - Never commit API keys, webhook secrets, connection strings, or private tokens.
   - Keep `.env` and credential files excluded via `.gitignore`.
10. **Accessibility & Design Token Compliance:**
    - Reference tokens defined in [DESIGN.md](file:///d:/Aage%20online/DESIGN.md).
    - Every interactive element must satisfy WCAG 2.2 AA standards (visible focus, minimum contrast, keyboard navigation, accessible states).

---

## 5. Agent Harness Structure

The repository development harness is organized under `.agents/`:

```text
.agents/
├── skills/          # Reusable operational capabilities (ranking-engine, payments, security, etc.)
├── workflows/       # Multi-step verification flows (feature implementation, security gate)
├── references/      # Curated engineering and design specifications
├── rules/           # Enforced linting and architectural boundaries
└── mcp_config.json  # Dev-only MCP tooling definitions
```

Always execute tasks with precision, safety, and deep contextual grounding.
