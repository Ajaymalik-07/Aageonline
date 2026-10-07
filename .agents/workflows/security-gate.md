# Workflow: Security Gate Verification

This checklist must pass before any pull request, major merge, or deployment.

## Gate 1: Zero Secret Leakage
- [ ] Run `git status` and inspect all modified and untracked files.
- [ ] Verify `.gitignore` is active and ignores all `.env`, `.key`, `.pem`, and credential files.
- [ ] Check git diffs for hardcoded tokens, passwords, or connection strings.

## Gate 2: Authorization & Boundary Validation
- [ ] Every API endpoint with mutating actions verifies authenticated user session server-side.
- [ ] Ownership verification confirmed: user is authorized to act on behalf of the business.
- [ ] Business state check: business is verified and in `ACTIVE` state before permitting bids.
- [ ] Admin endpoints require verified admin claims and log to `audit_logs`.

## Gate 3: Webhook Cryptographic Verification
- [ ] Webhook handlers verify signatures using raw request buffers.
- [ ] Idempotency keys enforced; duplicate webhooks are handled without side effects.

## Gate 4: Financial Data Safety
- [ ] Monetary fields use integer minor units or SQL `NUMERIC`.
- [ ] Financial ledgers are append-only.
- [ ] Client pricing input is discarded in favor of server calculation.
