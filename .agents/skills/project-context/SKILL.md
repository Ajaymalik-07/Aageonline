---
name: project-context
description: Authoritative project boundaries, market definitions, documentation hierarchy, and V1 exclusions for AageOnline. Trigger whenever onboarding a task, scoping a feature, or resolving domain questions.
---

# Project Context Skill

## Purpose
Provides fast, definitive grounding in AageOnline's core product rules, market model, non-goals, and documentation hierarchy. Ensures agents never violate core product assumptions or introduce excluded V1 features.

## Trigger Conditions
- Starting any new task or phase of implementation.
- Verifying whether a proposed feature is within V1 scope.
- Resolving conflicting requirements across documentation.
- Clarifying the competitive paid visibility model.

## Instructions
1. **Identify the Market Context:**
   - Always remember that a market is strictly defined as `Location + Category` (e.g. `Jaipur + Interior Designers`).
   - Businesses compete only within their designated market.
2. **Enforce Payment Finality:**
   - Higher-position purchase requires: authentication, verified eligible business, verified payment.
   - It changes ranking atomically and logs position history.
   - Previous payments are **never refunded** when overtaken. Each upward movement is a new payment.
3. **Check Documentation Hierarchy:**
   - Resolve any ambiguity using the authoritative order:
     `PRD.md` -> `State.md` -> `Architecture.md` -> `Database.md` -> `API.md` -> `Design.md` -> `Security.md` / `Compliance.md` / `Consent.md` -> `Testing.md`.
4. **Enforce Strict V1 Boundaries:**
   - Immediately reject any requirements or code proposing: wallets, withdrawals, auto-bidding, bid refunds, subscriptions, points/credits, reverse marketplaces, or mobile native apps.

## Constraints
- Do not introduce new business logic that contradicts `docs/PRD.md` or `docs/State.md`.
- Material decisions must be documented in `docs/Decision-Log.md`.

## Expected Output
- Explicit confirmation of feature alignment with V1 scope.
- Traceability back to the relevant document in `docs/`.

## Relevant Documentation References
- [docs/README.md](file:///d:/Aage%20online/docs/README.md)
- [docs/PRD.md](file:///d:/Aage%20online/docs/PRD.md)
- [docs/State.md](file:///d:/Aage%20online/docs/State.md)
- [docs/Architecture.md](file:///d:/Aage%20online/docs/Architecture.md)
- [AGENTS.md](file:///d:/Aage%20online/AGENTS.md)
