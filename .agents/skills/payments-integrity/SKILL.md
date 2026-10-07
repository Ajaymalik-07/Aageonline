---
name: payments-integrity
description: Guides payment intents, provider webhook signature verification, idempotency keys, financial audit trails, and reconciliation. Trigger when implementing checkout, payment callbacks, webhooks, or transaction records.
---

# Payments Integrity Skill

## Purpose
Guarantees financial transaction integrity, webhook security, replay attack prevention, and reconciliation between external payment providers and internal ranking state.

## Trigger Conditions
- Integrating external payment gateways (e.g. Razorpay, Stripe, Cashfree).
- Handling webhook payloads and signature verification.
- Writing to `transactions` or `bids` database tables.
- Debugging payment timeouts, duplicate deliveries, or webhook discrepancies.

## Instructions
1. **Server-Side Pricing Verification:**
   - Client requests target position quote via `POST /api/v1/markets/:marketId/position-quote`.
   - Before initiating checkout, the server calculates the exact required payment for the target position. Never accept an amount provided by the client.
2. **Idempotency Key Enforcement:**
   - Require an `idempotency_key` (UUID v4) on every bid/payment initiation.
   - Enforce database uniqueness constraints on `idempotency_key` and `provider_transaction_id`.
3. **Cryptographic Webhook Signature Verification:**
   - Verify provider signatures using raw, unparsed request bodies before deserializing JSON.
   - Reject unverified or malformed payloads immediately with 400/401 status.
4. **Append-Only Financial Ledger:**
   - Store monetary values as integers (minor units / paise) or exact SQL `NUMERIC`. Floating-point values are prohibited.
   - Never update or delete successful transaction rows.
5. **Decouple Payment from Ranking:**
   - Payment verification must succeed first. Only upon confirmed receipt does the ranking engine service receive the mutation command.

## Constraints
- Never commit or log API secret keys, webhook secrets, or cardholder data.
- Never grant rank on client-side "success" redirects alone—only verified server webhooks or server polling can confirm payment.

## Expected Output
- Secure payment intent generation.
- Tamper-proof webhook handlers with idempotent transaction deduplication.
- Exact financial auditing records.

## Relevant Documentation References
- [docs/Architecture.md](file:///d:/Aage%20online/docs/Architecture.md)
- [docs/Database.md](file:///d:/Aage%20online/docs/Database.md)
- [docs/API.md](file:///d:/Aage%20online/docs/API.md)
- [docs/Security.md](file:///d:/Aage%20online/docs/Security.md)
