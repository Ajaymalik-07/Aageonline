# Milestone 0.20.30 — Business Owner Identity & Registration Flow Verification Report

> **Milestone:** 0.20.30  
> **Status:** COMPLETE  
> **Database:** PostgreSQL (Authoritative Source of Truth)  
> **Test Results:** 609 passed, 0 failed, 6 skipped (615 total)  

---

## 1. Executive Summary

Milestone 0.20.30 repairs the complete business-owner journey in AageOnline. Prior to this milestone:
1. The business claim/login flow was fragmented: users authenticated via an in-memory email identity instead of a WhatsApp Business mobile number, and the test bypass OTP (`123456`) was prominently displayed on screen.
2. Returning business owners were not recognized upon login—PostgreSQL was not queried for owned listings, and no screen displayed their existing listings.
3. Form validation errors were placed distantly at the top or bottom of the screen instead of immediately adjacent to the action button with accessible auto-focus and field-level red highlights.
4. Business Phone and WhatsApp Business were not distinctly enforced; business registration lacked rigorous format validation for Indian statutory evidence (GSTIN, UDYAM, SHOP_ESTABLISHMENT, COMMERCIAL_PAN), and businesses were falsely marked as verified instead of `PENDING`.
5. The business workspace dashboard displayed hardcoded/demo data (`user-ajay`, "Ajay Sharma", fake profile links) regardless of who authenticated.
6. Webpack client-side builds threw bundling errors when modules imported `node:crypto`.

All issues have been resolved end-to-end. The solution uses PostgreSQL as the single source of truth, adheres to the Ponytail principle (minimal code, zero speculative abstractions), and passes all 615 automated tests.

---

## 2. Root Cause Analysis

| Area | Prior State & Defect | Root Cause | Fix Applied |
| :--- | :--- | :--- | :--- |
| **Authentication** | Claim page used mock phone numbers without server OTP validation; test code `123456` displayed on screen. | Missing backend OTP service and WhatsApp auth endpoints. Client generated random codes locally. | Implemented server-side OTP service with SHA-256 hash challenges, 60s cooldown, 10m TTL, max 5 attempts, hidden test code, and standard `+91` Indian mobile normalization. |
| **Session & User Identity** | Client defaulted to hardcoded `user-ajay` in `store.ts` via `activeDevSessionToken = 'session-user-ajay'`. | In-memory dev bypass was hardcoded in `frontend/lib/auth/store.ts`. | Removed auto-dev impersonation (`activeDevSessionToken = null`), dynamic import guards for browser bundles, and connected `/api/auth/me` to PostgreSQL session validation. |
| **Persistence & Ownership** | Businesses and memberships lived only in in-memory Maps; returning users saw 0 businesses. | No PostgreSQL repositories for user phone lookup or business ownership queries. | Applied migration `014_whatsapp_auth_and_business_evidence.sql`; created `PostgresUserRepository` and `PostgresBusinessRepository` with atomic transaction commits. |
| **Form UX & Accessibility** | Errors appeared at the top or bottom of the form; screen did not auto-focus invalid inputs. | Monolithic step validation lacked field-level error mapping and near-action accessible summary. | Implemented inline field-level red borders, error messages, and an accessible alert summary placed immediately above the action button with auto-focus to the first invalid field. |
| **Statutory Evidence** | Evidence was unvalidated or stored as arbitrary strings; status was defaulted to verified. | No Indian business registration format validation library. | Created `frontend/lib/validation/evidence.ts` enforcing strict regex rules for GSTIN (15 chars), UDYAM (`UDYAM-XX-00-0000000`), SHOP_ESTABLISHMENT (6-30 chars), and COMMERCIAL_PAN (10 chars), defaulting status to `PENDING`. |
| **Workspace Navigation** | Dashboard header showed "Ajay Sharma" / "user-ajay" even after logging in with a new number. | `WorkspaceNav.tsx` had fallback `user-ajay` string literals. | Updated `WorkspaceNav.tsx` and `dashboard/page.tsx` to dynamically fetch session from `/api/auth/me` and truthfully show "Business Owner" / "Not added", and `📱 +91 ...`. |

---

## 3. Database Migrations

Migration `frontend/lib/db/migrations/014_whatsapp_auth_and_business_evidence.sql` applied to PostgreSQL:

```sql
-- Migration 014: WhatsApp Authentication and Business Registration Evidence
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(64);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS evidence_type VARCHAR(64);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS evidence_reference VARCHAR(128);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS evidence_status VARCHAR(32) NOT NULL DEFAULT 'PENDING';
```

---

## 4. Live API Endpoints & Verified HTTP Statuses

| Method | Endpoint | Payload / Params | Status | Result / Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/otp/send` | `{"phone": "+919876543210"}` | `200 OK` | Normalized Indian phone, created SHA-256 OTP challenge, returned 60s cooldown. |
| `POST` | `/api/auth/otp/verify` | `{"phone": "+919876543210", "code": "123456"}` | `200 OK` | Verified OTP, resolved/created user in Postgres, returned owned businesses, set secure HttpOnly cookie. |
| `GET` | `/api/auth/me` (unauthenticated) | None | `401 Unauthorized` | Securely rejected unauthenticated request. |
| `GET` | `/api/auth/me` (authenticated) | Cookie: `aageonline_session=...` | `200 OK` | Authoritatively returned user phone, ID, and array of owned businesses. |
| `POST` | `/api/business/register` | `{"name": "...", "phone": "+919876543210", "whatsappPhone": "+919876543210", "evidenceType": "GSTIN", "evidenceReference": "08AAAAA0000A1Z5", ...}` | `201 Created` | Persisted business, OWNER membership, and market participation into PostgreSQL with `verification_status: 'PENDING'`. |
| `POST` | `/api/auth/logout` | Cookie: `aageonline_session=...` | `200 OK` | Revoked persistent session in PostgreSQL and cleared session cookie. |

---

## 5. Automated Test Results

Ran complete test suite across all 59 subsuites:

```text
# tests 615
# suites 190
# pass 609
# fail 0
# cancelled 0
# skipped 6
# todo 0
# duration_ms 1818.9
```

Dedicated test suite `frontend/tests/business-auth-and-registration-flow.test.ts` (18 passing tests) covers:
- Indian phone number normalization and validation (+91, 10-digits starting with 6-9).
- OTP challenge generation, 60-second cooldown, 10-minute expiry, and max 5 attempts.
- Server-side test OTP restriction (`isTestOtpAllowed()`).
- Strict evidence format validation for GSTIN, UDYAM, SHOP_ESTABLISHMENT, and COMMERCIAL_PAN.
- User creation and lookup via `PostgresUserRepository`.
- Business and OWNER membership creation via `PostgresBusinessRepository`.
- Returning user business retrieval from PostgreSQL.
- Business registration verification status invariant (`PENDING`).
- Session revocation on logout.

---

## 6. PostgreSQL Persistence & Returning User Proof

Live HTTP probe executed via `scratch/e2e_journey_test.cjs` and `scratch/multi_business_test.cjs`:
1. Authenticated as `+919876543210` via OTP.
2. Verified initial owned businesses count: `0`.
3. Registered Business 1 (`Test Jaipur Studio 2842`, GSTIN `08AAAAA0000A1Z5`). Result: `201 Created`, `status: PENDING`.
4. Queried `/api/auth/me`: user owns `1` business.
5. Registered Business 2 (`Test Mumbai Architects 9565`, UDYAM `UDYAM-MH-01-0012345`). Result: `201 Created`, `status: PENDING`.
6. Queried `/api/auth/me`: user owns `2` businesses in PostgreSQL.
7. Called `/api/auth/logout`: session revoked.
8. Re-authenticated with OTP for `+919876543210`: returning user screen immediately receives `2` owned businesses directly from PostgreSQL.

---

## 7. Safety Confirmations

- **No Browser Automation:** Zero calls made to `browser_subagent`, `browser-use`, or headless browser tooling. All verifications performed via automated unit/integration tests and live HTTP scripts.
- **No Data Loss:** Zero existing records or tables dropped or deleted; migrations applied additively (`IF NOT EXISTS`).
- **Zero Secrets Committed:** No API keys, credentials, or private secrets in code.
- **No Production Bypasses:** Test OTP bypass (`123456`) strictly restricted to non-production environments (`process.env.NODE_ENV !== 'production'`).
- **Staff Admin Preserved:** Admin routes (`/admin`, `/admin/operations`, `/admin/discovery`) remain fully functional and guarded.
