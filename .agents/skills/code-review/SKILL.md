---
name: code-review
description: Performs rigorous code review combining Ponytail minimal diffs, ECC quality checklists, and security invariant checks. Trigger before committing, opening PRs, or finalizing changes.
---

# Code Review Skill

## Purpose
Acts as a critical, fresh-context reviewer. Identifies unnecessary code bloat, speculative abstractions, secret leakage, database transaction risks, and accessibility regressions.

## Trigger Conditions
- Reviewing code changes prior to commit or push.
- Conducting self-review after completing a feature or bugfix.
- Assessing diff size and architectural simplicity.

## Instructions
1. **Ponytail Code Minimization Check:**
   - Did the agent write 50 lines where 5 lines would suffice?
   - Are there speculative abstractions, unused utility functions, or premature generic wrappers?
   - Strip all extraneous code. Keep the diff minimal and focused.
2. **Security & Secrets Check:**
   - Are there any API keys, credentials, or `.env` entries staged?
   - Does any public endpoint expose private financial or personal data?
   - Is server-side authorization checked for every mutating operation?
3. **Database & Concurrency Check:**
   - Are ranking and payment mutations enclosed in database transactions?
   - Are monetary values stored as exact numbers/integers rather than floating-point?
   - Are transaction tables append-only?
4. **Design & Accessibility Check:**
   - Are semantic design tokens used from `DESIGN.md`?
   - Are focus rings visible on interactive elements?
   - Does text meet WCAG 2.2 AA contrast?
5. **Documentation Drift Check:**
   - Did the change contradict `docs/PRD.md`, `State.md`, or `Architecture.md`?
   - If an architectural decision was made, was `docs/Decision-Log.md` updated?

## Constraints
- Block any code that introduces V1 excluded features (wallets, withdrawals, auto-bidding, subscriptions).
- Enforce clean git diffs with zero dependency bloat.

## Expected Output
- Actionable review feedback with pass/fail status on all 5 gates.
- Concrete minimization suggestions for oversized diffs.

## Relevant Documentation References
- [AGENTS.md](file:///d:/Aage%20online/AGENTS.md)
- [DESIGN.md](file:///d:/Aage%20online/DESIGN.md)
- [docs/Decision-Log.md](file:///d:/Aage%20online/docs/Decision-Log.md)
