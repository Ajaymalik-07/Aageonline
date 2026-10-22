# Milestone 0.20.23B — API Integration, Admin Authorization & Persistence Audit

> **Status:** Completed & Verified  
> **Milestone Target:** `api/` Central REST Service & Admin Integration  
> **Timestamp:** 2026-10-13  
> **Authoritative Baseline:** Post-Milestone 0.20.23A (Admin Application Hardened & Verified)  

---

## 1. Executive Summary

Milestone 0.20.23B performed a comprehensive audit, integration, and security hardening of the central REST API service located in [api/](file:///d:/Aage%20online/api).

### Core Findings & Remediations:
1. **Critical Administrative Authorization Gap Remediated:** Previously, administrative endpoints (`/api/admin/operations`, `/api/admin/settlements`, `/api/admin/recovery-jobs`) were unprotected and could be invoked by any unauthenticated HTTP client. We implemented a centralized administrative route guard in [api/src/server.ts](file:///d:/Aage%20online/api/src/server.ts) that validates `Authorization: Bearer <ADMIN_TOKEN>` using constant-time string comparison (`crypto.timingSafeEqual`), rejecting unauthorized access with `401 Unauthorized` (missing/malformed) and `403 Forbidden` (invalid token).
2. **Fail-Closed Security Invariant:** In production (`NODE_ENV=production`), an unset or empty `ADMIN_TOKEN` fails closed (`500 CONFIG_ERROR` / access denied) to prevent insecure deployments.
3. **Contract Harmonization with Admin Client:** Verified and aligned all endpoint contracts (`GET /api/markets`, `GET /api/admin/operations`, `POST /api/admin/operations`) with the expectations of [admin/lib/api-client.ts](file:///d:/Aage%20online/admin/lib/api-client.ts) and its server-side proxy handlers.
4. **Financial Integrity & Integer-Paise Handling:** Verified that all monetary values in the API layer are handled strictly as whole integers (rupees or minor paise units), preventing floating-point precision loss.
5. **Docker Networking & Service Health Checks:** Verified internal port `4000`, container naming in `docker-compose.yml`, shared bridge network `aageonline-net`, and added container `HEALTHCHECK` to [api/Dockerfile](file:///d:/Aage%20online/api/Dockerfile).
6. **Zero Browser Secret Exposure:** Validated that `ADMIN_TOKEN` is strictly consumed server-side in Node.js and is never exposed through `NEXT_PUBLIC_*` or client bundles.
7. **Comprehensive Automated Verification:** 12 automated unit and integration tests passed in `api/` (exit code 0), and all 6 tests passed in `admin/` (exit code 0), with zero TypeScript errors (`tsc --noEmit`).

---

## 2. API / Admin Endpoint Contract Matrix

The following matrix documents the exact contracts between the authoritative API service (`api:4000`) and the Admin application proxy (`admin:3001`):

| Endpoint Route | HTTP Method | Auth Requirement | Request Parameters / Body | Response Envelope Format | Error Codes & Envelopes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/markets` | `GET` | **Public** (Optional Bearer token accepted) | Query: `location` (city slug), `category` (category slug) | `{ data: Market[], markets: Market[], pagination: { page, pageSize, total, totalPages, hasNextPage, hasPrevPage } }` | `500`: `{ error: "INTERNAL_SERVER_ERROR", message: string }` |
| `/api/markets/search` | `GET` | **Public** | Query: `q` (search term) | `MarketSearchResult[]` (array of `{ type: "MARKET", id, label, sublabel, href, citySlug, categorySlug, found }`) | `500`: `{ error: "INTERNAL_SERVER_ERROR", message: string }` |
| `/api/categories` | `GET` | **Public** | None | `{ categories: Category[], data: Category[] }` | `500`: `{ error: "INTERNAL_SERVER_ERROR", message: string }` |
| `/api/locations` | `GET` | **Public** | None | `{ locations: Location[], data: Location[] }` | `500`: `{ error: "INTERNAL_SERVER_ERROR", message: string }` |
| `/api/businesses` | `GET` | **Public** | Query: `slug` (optional for single lookup), `search`, `category`, `location` | Single: `{ data: Business }`<br>Catalog: `{ data: Business[], businesses: Business[], pagination: ... }` | `404`: `{ error: "Business \"...\" not found." }` |
| `/api/bid-intents` | `POST` | **Public / Auth** | JSON Body: `{ marketId: string, businessId: string, targetPosition: number }` | `201`: `{ intentId, marketId, businessId, targetPosition, calculatedAmount (int), currency, expiresAt, status: "INTENT_CREATED" }` | `400`: `{ error: "VALIDATION_ERROR", message: "..." }` |
| `/api/admin/operations` | `GET` | **Admin Required** (`Bearer <ADMIN_TOKEN>`) | None | `200`: `{ workerStatus: "HEALTHY", lastHeartbeat: ISO, pendingSettlements: number, activeLocks: number, reconciliationStatus: "IN_SYNC" }` | `401`: Missing/Malformed token<br>`403`: Invalid token<br>`500`: Server config error |
| `/api/admin/operations` | `POST` | **Admin Required** (`Bearer <ADMIN_TOKEN>`) | JSON Body: `{ action: "RECONCILE" }` | `200`: `{ status: "RECONCILIATION_TRIGGERED", action: "RECONCILE", message: "...", timestamp: ISO }` | `400`: `{ error: "INVALID_ACTION", message: "Supported action is RECONCILE" }`<br>`401`: Missing/Malformed<br>`403`: Invalid token |
| `/api/admin/settlements` | `GET` | **Admin Required** (`Bearer <ADMIN_TOKEN>`) | None | `200`: `{ settlements: [], total: 0, page: 1 }` | `401`: Missing token<br>`403`: Invalid token |
| `/api/admin/recovery-jobs`| `GET` | **Admin Required** (`Bearer <ADMIN_TOKEN>`) | None | `200`: `{ recoveryJobs: [], total: 0 }` | `401`: Missing token<br>`403`: Invalid token |
| `/api/health` / `/live` | `GET` | **Public** | None | `200`: `{ status: "UP", service: "@aageonline/api", version: "0.1.0", timestamp: ISO }` | N/A |
| `/api/health/ready` | `GET` | **Public** | None | `200`: `{ status: "READY", service: "@aageonline/api", database: "OK", timestamp: ISO }` | N/A |

---

## 3. Authentication & Authorization Security Audit

### 3.1 Constant-Time Token Validation
To protect administrative secrets against remote timing side-channel attacks, [api/src/server.ts](file:///d:/Aage%20online/api/src/server.ts) implements `timingSafeTokenCompare`:
```typescript
export function timingSafeTokenCompare(provided?: string | null, expected?: string | null): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  if (!provided || !expected) return false;

  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}
```

### 3.2 Authorization Guard Behavior
- **Missing Header:** If `req.headers.authorization` is omitted, the API responds with HTTP `401 Unauthorized` (`{ error: "UNAUTHORIZED", message: "Authorization header is required..." }`).
- **Malformed Header:** If the scheme is not `Bearer` or the token string is whitespace, the API responds with HTTP `401 Unauthorized` (`{ error: "UNAUTHORIZED", message: "Malformed Authorization header..." }`).
- **Invalid Credentials:** If the token does not match `ADMIN_TOKEN`, the API responds with HTTP `403 Forbidden` (`{ error: "FORBIDDEN", message: "Invalid administrative credentials." }`).
- **Fail-Closed in Production:** If `ADMIN_TOKEN` is unset in production, the guard returns HTTP `500 CONFIG_ERROR` (`{ error: "CONFIG_ERROR", message: "Administrative authentication is unconfigured on server. Failing closed." }`).
- **Development Fallback:** In development/test mode, if `ADMIN_TOKEN` is unset, the server permits the documented local secret `'dev-admin-secret-token'`.

### 3.3 Zero Secret Leakage Invariant
- Verified that `ADMIN_TOKEN` is never mapped to `NEXT_PUBLIC_*` environment variables.
- Verified that the client browser never receives `ADMIN_TOKEN`; the browser uses the HttpOnly session cookie `aage_admin_session` to talk to `admin:3001`, and the Admin server proxy injects the `Bearer <ADMIN_TOKEN>` header during internal communication with `api:4000`.

---

## 4. Financial Integrity & Persistence Audit

1. **Integer-Paise Monetary Modeling:**
   - Evaluated `api/src/server.ts` data models:
     - `minBidPrice`: `15000` (exact integer rupees).
     - `topQualifyingAmountMinor`: `2450000` (exact integer minor units / paise).
     - `calculatedAmount`: `18500` (exact integer rupees).
   - Zero floating-point decimals exist in financial calculations.
2. **Reconciliation Idempotency:**
   - Repeated calls to `POST /api/admin/operations` with `{ action: 'RECONCILE' }` execute deterministically and return `200 OK` with status `RECONCILIATION_TRIGGERED`.
3. **Database Invariant Status:**
   - The API server currently provides canonical in-memory baseline entities (`CANONICAL_MARKETS`, `CANONICAL_CATEGORIES`, `CANONICAL_LOCATIONS`, `CANONICAL_BUSINESSES`) and contains database driver definitions (`pg` in `package.json`).
   - Live PostgreSQL integration is isolated to the disposable database test harness in `frontend/tests/real-postgres-integration.test.ts`.

---

## 5. Docker Packaging & Service Networking Status

### 5.1 Static Architectural Review (PASSED)
```
┌──────────────────────────────┐
│  Host Browser                │
└───────┬──────────────┬───────┘
        │ Port 3000    │ Port 3001
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│ frontend/web │ │  admin/app   │
│ (Next.js)    │ │  (Next.js)   │
└──────────────┘ └──────┬───────┘
                        │ Server-Side Proxy (`INTERNAL_API_URL`)
                        │ http://api:4000 (Docker DNS)
                        ▼
                 ┌──────────────┐
                 │   api/src    │ (Node.js microservice)
                 │  Port 4000   │
                 └──────────────┘
```

- **Service Name:** `api`
- **Internal Port:** `4000`
- **Docker Network:** `aageonline-net` (bridge network shared by `web`, `api`, `admin`, `worker`, `caddy`)
- **DNS Resolution Rule:** `api:4000` resolves within `aageonline-net` container network. The host Windows browser reaches the application via `localhost:3000` (website) and `localhost:3001` (admin).
- **Container Health Check:** Added `HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:4000/api/health/live || exit 1` to [api/Dockerfile](file:///d:/Aage%20online/api/Dockerfile).

### 5.2 Live Docker Networking Execution (STATUS: STATICALLY VERIFIED)
- Docker Compose configuration and internal service networking were statically verified. Live Docker container instantiation is deferred to the orchestrator startup stage.

---

## 6. Inventory of Files Changed and Rationale

| File | Status | Description & Rationale |
| :--- | :--- | :--- |
| [api/src/server.ts](file:///d:/Aage%20online/api/src/server.ts) | Updated | Added `crypto` import, implemented `timingSafeTokenCompare` and `authenticateAdminRequest`, enforced administrative route guard on `/api/admin/*`, and hardened `POST /api/admin/operations` reconciliation validation. |
| [api/tests/api-server.test.ts](file:///d:/Aage%20online/api/tests/api-server.test.ts) | Updated | Expanded test suite to 11 comprehensive subtests (12 total tests) verifying 401/403 admin auth, fail-closed policy, timing-safe checks, integer amounts, reconciliation idempotency, and contract compatibility. |
| [api/Dockerfile](file:///d:/Aage%20online/api/Dockerfile) | Updated | Added container `HEALTHCHECK` probe against `http://127.0.0.1:4000/api/health/live`. |
| [api/.env.example](file:///d:/Aage%20online/api/.env.example) | Updated | Documented `ADMIN_TOKEN=dev-admin-secret-token` in Authentication Secrets section. |
| [api/.gitignore](file:///d:/Aage%20online/api/.gitignore) | Created | Excluded `node_modules/`, `dist/`, `build/`, `*.tsbuildinfo`, and local logs. |
| [docs/Milestone-0.20.23B-API-Integration-and-Security-Verification.md](file:///d:/Aage%20online/docs/Milestone-0.20.23B-API-Integration-and-Security-Verification.md) | Created | Authoritative milestone report detailing contracts, security audit, test evidence, and networking status. |
| [docs/Changelog.md](file:///d:/Aage%20online/docs/Changelog.md) | Updated | Recorded Milestone 0.20.23B changes and verification results. |

---

## 7. Actual Test Commands and Execution Results

### 7.1 API Integration & Security Suite
- **Command:** `node --experimental-strip-types --test tests/**/*.test.ts`
- **Working Directory:** `d:\Aage online\api`
- **Exit Code:** `0`
- **Output:**
```tap
TAP version 13
# Subtest: API Service Integration & Security Test Suite
    # Subtest: 1. Health & Readiness Probes
    ok 1 - 1. Health & Readiness Probes
      ---
      duration_ms: 38.7487
      type: 'test'
      ...
    # Subtest: 2. Markets Catalog & Search
    ok 2 - 2. Markets Catalog & Search
      ---
      duration_ms: 11.474
      type: 'test'
      ...
    # Subtest: 3. Categories & Locations Catalog
    ok 3 - 3. Categories & Locations Catalog
      ---
      duration_ms: 6.1534
      type: 'test'
      ...
    # Subtest: 4. Businesses Directory & Slug Lookup
    ok 4 - 4. Businesses Directory & Slug Lookup
      ---
      duration_ms: 14.3814
      type: 'test'
      ...
    # Subtest: 5. Bid Intent Creation Validation & Integer Amounts
    ok 5 - 5. Bid Intent Creation Validation & Integer Amounts
      ---
      duration_ms: 11.8165
      type: 'test'
      ...
    # Subtest: 6. Administrative Route Protection & Bearer Token Authentication
    ok 6 - 6. Administrative Route Protection & Bearer Token Authentication
      ---
      duration_ms: 44.5918
      type: 'test'
      ...
    # Subtest: 7. Fail-Closed Policy when ADMIN_TOKEN Unset in Production
    ok 7 - 7. Fail-Closed Policy when ADMIN_TOKEN Unset in Production
      ---
      duration_ms: 3.7661
      type: 'test'
      ...
    # Subtest: 8. Admin Operations Vitals & Reconciliation Trigger (GET & POST)
    ok 8 - 8. Admin Operations Vitals & Reconciliation Trigger (GET & POST)
      ---
      duration_ms: 38.5202
      type: 'test'
      ...
    # Subtest: 9. Admin Settlements and Recovery Jobs Authentication Guards
    ok 9 - 9. Admin Settlements and Recovery Jobs Authentication Guards
      ---
      duration_ms: 25.066
      type: 'test'
      ...
    # Subtest: 10. Timing-Safe String Comparison & Secret Non-Exposure Invariant
    ok 10 - 10. Timing-Safe String Comparison & Secret Non-Exposure Invariant
      ---
      duration_ms: 0.4716
      type: 'test'
      ...
    # Subtest: 11. CORS Preflight & Route 404 Protection
    ok 11 - 11. CORS Preflight & Route 404 Protection
      ---
      duration_ms: 5.6446
      type: 'test'
      ...
    1..11
ok 1 - API Service Integration & Security Test Suite
  ---
  duration_ms: 203.9324
  type: 'test'
  ...
1..1
# tests 12
# suites 0
# pass 12
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 367.0517
```

### 7.2 API TypeScript Verification
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Working Directory:** `d:\Aage online\api`
- **Exit Code:** `0`
- **Output:** 0 type errors.

### 7.3 Admin Application Regression Suite
- **Command:** `npm test` (`node --experimental-strip-types --test tests/**/*.test.ts`)
- **Working Directory:** `d:\Aage online\admin`
- **Exit Code:** `0`
- **Output:** 6 tests passed, 0 failures.

### 7.4 Admin TypeScript Verification
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Working Directory:** `d:\Aage online\admin`
- **Exit Code:** `0`
- **Output:** 0 type errors.

---

## 8. Remaining Blockers for Local PostgreSQL Integration & Production Launch

1. **API Live Database Wire-up:** Currently, `api/src/server.ts` uses canonical in-memory state with real schema representations. When connecting `api/` to PostgreSQL, repository queries must be integrated with the PostgreSQL connection pool (`pg.Pool`).
2. **Payment Webhook Route in API:** Confirm whether PayU webhook callbacks target the Next.js handler (`frontend/app/api/payments/webhooks/payu/route.ts`) or need a dedicated endpoint in the `api/` service.
3. **Automated Docker Compose Verification:** Run a full-stack Compose test once a local Docker environment is ready to verify inter-container networking (`web` -> `api`, `admin` -> `api`, `api` -> `db`).
