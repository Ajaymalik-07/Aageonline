---
name: testing-and-verification
description: Guides unit, integration, concurrency, accessibility, and SEO verification. Trigger when writing tests, verifying PRs, or validating delivery phase acceptance gates.
---

# Testing and Verification Skill

## Purpose
Ensures comprehensive verification across business logic, ranking concurrency, payment edge cases, accessibility standards (WCAG 2.2 AA), and SEO indexability in accordance with `docs/Testing.md`.

## Trigger Conditions
- Adding or modifying unit tests (calculations, milestone rules).
- Implementing integration tests (payment -> transaction -> ranking).
- Testing concurrent position bidding scenarios.
- Verifying accessibility and SEO compliance before closing a phase.

## Instructions
1. **Unit Test Coverage:**
   - Test ranking calculations: moving business to #1, #3, or bottom.
   - Test pricing calculations: incremental pricing per rank position.
   - Test milestone ladders: #1 -> #5, #5 -> #10, etc.
   - Test state machine transitions: Draft -> Claim Pending -> Active -> Suspended.
2. **Concurrency Testing:**
   - Simulate two businesses bidding on the exact same target position simultaneously.
   - Verify deterministic outcome: exactly one business wins the target rank; the other is placed at the appropriate recalculated rank or refunded cleanly at payment gateway before ranking mutation. Duplicate positions are forbidden.
3. **Payment Test Scenarios:**
   - Test payment success, failure, cancellation, timeout, and delayed webhook delivery.
   - Test duplicate webhook delivery to guarantee idempotency.
4. **Accessibility Verification:**
   - Verify keyboard navigation for all interactive controls (Tab, Enter, Space).
   - Check focus-visible rings (never allow hidden focus).
   - Verify minimum contrast ratios (4.5:1 text, 3:1 non-text).
   - Verify that `@media (prefers-reduced-motion: reduce)` disables motion.
5. **SEO & Structured Data Verification:**
   - Check canonical tags, unique title/description metadata, OpenGraph tags, and robots.txt.
   - Ensure local business and ranking schema markup is valid.

## Constraints
- No phase is complete without passing all documented acceptance gates in `docs/Phases.md`.
- Flaky tests must be diagnosed and resolved, not ignored.

## Expected Output
- Automated test suites (unit, integration, concurrency).
- Test execution reports with zero regressions.

## Relevant Documentation References
- [docs/Testing.md](file:///d:/Aage%20online/docs/Testing.md)
- [docs/Phases.md](file:///d:/Aage%20online/docs/Phases.md)
- [docs/SEO.md](file:///d:/Aage%20online/docs/SEO.md)
- [DESIGN.md](file:///d:/Aage%20online/DESIGN.md)
