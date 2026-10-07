# AageOnline — Verification Matrix & Security Test Strategy

## 1. Quality & Security Assurance Philosophy

AageOnline implements a verification-first test harness. The security of the payment-to-ranking pipeline is subject to rigorous automated verification.

---

## 2. Mandatory Security Test Suite (20 Core Scenarios)

Every PR, release candidate, and architectural iteration must pass the following 20 core security scenarios:

| ID | Test Scenario | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **SEC-01** | **Lower Bid Rejected** | Offered amount < current qualifying amount fails validation | Returns `422 INVALID_BID_QUALIFICATION`; zero DB mutation |
| **SEC-02** | **Equal Bid Rejected** | Offered amount == current qualifying amount fails validation | Returns `422 INVALID_BID_QUALIFICATION`; zero DB mutation |
| **SEC-03** | **Higher Bid Accepted** | Offered amount > current qualifying amount is accepted | Returns 200 with valid payment intent |
| **SEC-04** | **Unpaid Mutation Rejected** | Direct attempt to mutate rank without confirmed payment | Returns `403 Forbidden` / `401 Unauthorized`; zero mutation |
| **SEC-05** | **Forged Client Callback** | Client redirects with `?payment=success` or modified state | Ignored by backend; rank updates ONLY on verified webhook |
| **SEC-06** | **Forged Webhook Signature**| Webhook payload with invalid or missing HMAC signature | Returns `401 UNVERIFIED_WEBHOOK_SIGNATURE`; zero DB update |
| **SEC-07** | **Replayed Webhook Idempotency**| Same valid webhook delivered twice | First updates rank; second returns `200 OK` with zero duplicate shift |
| **SEC-08** | **Duplicate Submission Guard**| Double-click on payment/bid button with same Idempotency-Key | Single transaction created; duplicate request returns cached result |
| **SEC-09** | **Concurrent Bid Collision** | Two users bid for position #1 simultaneously | One transaction commits; second transaction rejected with `409` |
| **SEC-10** | **BOLA Business Manipulation** | User A submits bid for User B's business | Returns `403 UNAUTHORIZED_BUSINESS_ACCESS`; security alert logged |
| **SEC-11** | **BOLA Transaction Access** | User A queries User B's private transaction history | Returns `403 Forbidden` or `404 Not Found` |
| **SEC-12** | **Direct API Ranking Injection**| Attacker bypasses frontend with custom `curl` script | Server independently enforces price, auth, and webhook rules |
| **SEC-13** | **Privilege Escalation Attack**| Non-admin user calls `/api/v1/admin/*` endpoints | Returns `403 Forbidden`; logged to security audit log |
| **SEC-14** | **Invalid Amount Injection** | Bid with 0, negative, NaN, Infinity, decimal, string, float | Rejection at type/schema layer; fails closed safely |
| **SEC-15** | **Currency Mismatch Attack** | Gateway payment executed in USD or EUR | Webhook checks `currency === 'INR'`; rejects transaction |
| **SEC-16** | **Expired Transaction Rejection**| Webhook arrives after hold window (120s) elapsed | Handled via reconciliation protocol; rank not silently moved |
| **SEC-17** | **Cancelled Transaction Lock** | User cancels payment on provider modal | Transaction moves to `CANCELLED`; cannot be re-activated |
| **SEC-18** | **Failed Payment Safety** | Provider reports `payment.failed` | Transaction marked `FAILED`; ranking remains untouched |
| **SEC-19** | **Network Retry Deduplication** | Network timeout during API fetch retries request | `Idempotency-Key` prevents duplicate transaction row |
| **SEC-20** | **Authoritative Position Derivability** | Audit query checks: "Why is business X at rank #N?" | Exact transaction, amount, timestamp, and cause verifiable |

---

## 3. Concurrency Verification Harness

A concurrency test fixture simulates:
- 10 virtual users simultaneously attempting to purchase position #1 in market `Jaipur + Interior Designers`.
- Execution asserts that:
  - Exactly 1 user successfully claims position #1 at their bid price.
  - Exactly 9 users receive `409 TARGET_POSITION_SUPERSEDED` with updated required floors.
  - The database maintains zero duplicate ranks (`COUNT(DISTINCT position) == COUNT(*)`).
  - Positions shift deterministically with zero gaps.

---

## 4. Accessibility (WCAG 2.2 AA) Verification

- 100% keyboard navigable without mouse.
- Visible focus rings with minimum 3:1 contrast against surface.
- Screen reader announcements using `aria-live="polite"` for dynamic rank notifications.
- All touch targets meet or exceed $44 \times 44\text{px}$.
- Motion respects `prefers-reduced-motion` media queries.

---

## 5. SEO / AEO / GEO Verification

- HTML documents render critical content without waiting for client JavaScript hydration.
- Structured data validation: WebSite, Breadcrumbs, and ItemList JSON-LD contain transparent paid visibility disclosures.
- Robots.txt and sitemap.xml dynamically updated with canonical URLs.

---

## 6. Security Acceptance Gate

No code may be merged or deployed if any of the 20 security scenarios fail, or if synthetic Lighthouse scores degrade Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1).
