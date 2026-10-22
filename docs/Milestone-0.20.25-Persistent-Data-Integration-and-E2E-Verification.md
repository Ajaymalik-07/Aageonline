# Milestone 0.20.25: Persistent Data Integration & Admin-to-Website End-to-End Verification

> **Date:** October 13, 2026  
> **Milestone Status:** VERIFIED & AUDITED (Integration Reality Verified; Live Docker/DB tests BLOCKED on Host Engine)  
> **Execution Context:** Windows Host Development Environment (Node.js v22.23.2, Next.js 15.1.6, Zero-Secret Compliance)  
> **Authority Order:** PRD.md → State.md → Architecture.md → Database.md → API.md → Design.md → Security.md → Testing.md  

---

## 1. Executive Summary

Milestone 0.20.25 establishes an exhaustive, truthful integration and reliability audit across all three subsystems of the AageOnline platform:
1. **Public Website Frontend** (`frontend/`, Port 3000)
2. **Central Backend REST API Service** (`api/`, Port 4000)
3. **Administrative Control Center** (`admin/`, Port 3001)

This milestone verifies that the newly implemented administrative Control Center (Milestone 0.20.24) communicates securely with the central API service via cryptographic bearer sessions, isolates sensitive backend credentials from browser client bundles, and eliminates redundant operational views (such as the legacy experimental `/recovery` supervisor page, now consolidated under `/operations`).

Crucially, this audit establishes the **ground-truth persistence architecture** across the codebase:
- The standalone API service (`api/src/server.ts`) currently maintains **in-memory canonical state stores** (`CANONICAL_MARKETS`, `CANONICAL_BUSINESSES`, `CANONICAL_LOCATIONS`, `CANONICAL_CATEGORIES`, `PAYMENTS_DATASET`, `CANONICAL_RANKINGS`, `BLOG_POSTS_DATASET`, etc.) without a direct runtime link to PostgreSQL. Mutations via the Admin Control Center persist in API server memory during the process lifecycle, but reset upon server restart.
- The public website (`frontend/`) contains the complete PostgreSQL database schema (Migrations 001–011) and 15 typed repository entities, but currently resolves public traffic through typed `local-adapter` data sources unless explicit remote API environment flags (`NEXT_PUBLIC_DATA_SOURCE=api` and `NEXT_PUBLIC_USE_REMOTE_API=true`) are activated.
- On this Windows development workstation, **Docker Desktop / Docker Engine is not installed/running in PATH** (`docker info` fails). In strict accordance with user constraints and testing rules, live container database instantiation, live `pg_dump` physical extraction, and live multi-process worker locks are marked as **BLOCKED (prerequisite missing)**. No mock victories or synthetic database reports have been fabricated.

---

## 2. Task 1 — Repository and Configuration Preflight

### 2.1 Service Architecture & Inter-Process Communication
The repository configures three discrete services designed to operate both as individual Node.js processes and within Docker Compose:

```
┌─────────────────────────────────┐
│     Admin Control Center        │ (Port 3001)
│  (Next.js App Router / SSR)     │
└───────────────┬─────────────────┘
                │ HTTP Proxy Routes (/api/*) + Bearer Session Token
                ▼
┌─────────────────────────────────┐
│     Authoritative REST API      │ (Port 4000)
│    (Node.js Native HTTP)        │
└───────────────▲─────────────────┘
                │ Remote API Adapter (when configured)
                │ (Default: Local in-memory taxonomy store)
┌───────────────┴─────────────────┐
│      Public AageOnline Web      │ (Port 3000)
│   (Next.js App Router + SSR)    │
└─────────────────────────────────┘
```

1. **Admin to API:** `admin/` has **zero direct PostgreSQL dependencies** and zero direct database driver imports. All admin UI actions dispatch to server-side Next.js route handlers (`admin/app/api/*`), which invoke `fetchFromApi()` injecting an authoritative HTTP `Authorization: Bearer <token>` header to `http://localhost:4000` (or `http://api:4000` in Docker).
2. **API Runtime Data Layer:** `api/src/server.ts` imports standard Node.js libraries (`node:http`, `node:url`, `node:crypto`) and maintains typed in-memory datasets. It does **not** import `pg` or connect to PostgreSQL at runtime.
3. **Frontend Runtime Data Layer:** `frontend/` contains PostgreSQL migration scripts `001` through `011` (`frontend/lib/db/migrations/`) and 15 repository interfaces (`frontend/lib/db/repositories/`). When `DATABASE_URL` is unconfigured, it utilizes resilient in-memory fallback stores (`MARKETS_STORE`, `BUSINESSES_STORE`, `LOCATIONS_STORE`, `CATEGORIES_STORE`).

### 2.2 Security & Credential Preflight
- **Zero Secrets in Git:** Git status confirms `.env`, `.env.local`, and credential stores are strictly ignored.
- **Constant-Time Verification:** Passwords use salted `scrypt` hashing with constant-time buffer comparison (`crypto.timingSafeEqual`).
- **Session Protection:** Administrative sessions use HMAC-SHA256 signatures (`signData` / `signSession`), set in `HttpOnly`, `SameSite=Strict` cookies.
- **Elimination of Broken Endpoints:** Redundant experimental `/recovery` page ("Worker Supervisor & Outbox Recovery") which produced HTTP 403 telemetry errors has been removed from sidebar navigation and redirected to `/operations`.

---

## 3. Task 2 — Safe Disposable PostgreSQL Status

| Parameter | Host Finding | Status |
| :--- | :--- | :--- |
| **Docker Engine Detection** | `docker info` / `docker --version` command not found in PATH | **BLOCKED** |
| **Local PostgreSQL Service** | Port 5432 is closed / unallocated on localhost | **BLOCKED** |
| **Cloud Provisioning Workaround** | Strictly forbidden by milestone constraints | **SKIPPED / PROHIBITED** |
| **Migrations Preflight** | Migrations 001 through 011 inspected and verified on disk | **VERIFIED** |

### Prerequisite Required for Live Database Tests:
To execute live container database tests (Task 2, Task 6 live locks, and Task 8 backup/restore):
1. Install and launch Docker Desktop for Windows.
2. Ensure Docker CLI is available in the user's system PATH.
3. Run `docker compose up -d postgres` to start the disposable test database container.
4. Execute `npm test` against `DATABASE_URL=postgresql://aage_test_user:aage_test_password@localhost:5432/aage_test_db`.

---

## 4. Task 3 — Admin-to-API Authorization & Role Enforcement

Every administrative endpoint enforces server-side authorization:

1. **Authentication Gate:** `authenticateAdminRequest` checks the HTTP `Authorization: Bearer <token>` header against active admin sessions or `ADMIN_TOKEN`.
2. **Stateless Session Validation:** Admin session tokens format `adm_sess_<userId>_<expiresAt>_<signature>` are validated in constant time via HMAC-SHA256. Invalid or expired tokens return HTTP 403 Forbidden.
3. **Role-Based Access Control (RBAC):**
   - `SUPER_ADMIN`: Unrestricted access across all operational, financial, editorial, and user modules.
   - `MARKETPLACE_MANAGER`: Authorized for businesses, locations, categories, markets, and discovery.
   - `FINANCE_RECONCILER`: Authorized for payments, settlements, and operations reconciliation.
   - `CONTENT_SEO_MANAGER`: Authorized for CMS, blog posts, newsletter, and SEO audits.
   - `AUDITOR`: Read-only access to audit trail and operational metrics.
4. **Credential Isolation:** Neither `ADMIN_TOKEN`, database passwords, nor session signing secrets are exported to client bundles.

---

## 5. Task 4 — Real Persistence Audit Across Admin Modules

| Admin Module | Admin UI Route | Backend API Route | Storage Layer | Persistence Reality |
| :--- | :--- | :--- | :--- | :--- |
| **Businesses** | `/businesses` | `/api/admin/businesses` | In-Memory `CANONICAL_BUSINESSES` | Transient (Process-lifetime) |
| **Locations** | `/locations` | `/api/admin/locations` | In-Memory `CANONICAL_LOCATIONS` | Transient (Process-lifetime) |
| **Categories** | `/categories` | `/api/admin/categories` | In-Memory `CANONICAL_CATEGORIES` | Transient (Process-lifetime) |
| **Markets** | `/markets` | `/api/admin/markets` | In-Memory `CANONICAL_MARKETS` | Transient (Process-lifetime) |
| **Rankings** | `/rankings` | `/api/admin/rankings` | In-Memory `CANONICAL_RANKINGS` | Transient (Process-lifetime) |
| **Discovery** | `/discovery` | `/api/admin/discovery` | In-Memory `DISCOVERY_REQUESTS` | Transient (Process-lifetime) |
| **Payments** | `/payments` | `/api/admin/payments` | In-Memory `PAYMENTS_DATASET` | Transient (Process-lifetime) |
| **Settlements** | `/settlements` | `/api/admin/settlements` | In-Memory `SETTLEMENTS_DATASET` | Transient (Process-lifetime) |
| **Operations** | `/operations` | `/api/admin/operations` | In-Memory Telemetry | Transient (Process-lifetime) |
| **Content CMS** | `/content` | `/api/admin/content` | In-Memory `CONTENT_BLOCKS` | Transient (Process-lifetime) |
| **Blog Articles** | `/blog` | `/api/admin/blog` | In-Memory `BLOG_POSTS_DATASET` | Transient (Process-lifetime) |
| **Newsletter** | `/newsletter` | `/api/admin/newsletter` | In-Memory `NEWSLETTER_SUBSCRIBERS` | Transient (Process-lifetime) |
| **SEO & Robots** | `/seo`, `/sitemap-robots` | `/api/admin/seo/audit` | In-Memory `SEO_AUDIT_DATASET` | Transient (Process-lifetime) |
| **Analytics** | `/analytics` | `/api/admin/analytics` | In-Memory Derived Metrics | Transient (Process-lifetime) |
| **Lead Registry** | `/leads` | `/api/admin/leads` | In-Memory `LEADS_DATASET` | Transient (Process-lifetime) |
| **Notifications** | `/notifications` | `/api/admin/notifications` | In-Memory `OPERATIONAL_NOTIFICATIONS` | Transient (Process-lifetime) |
| **Mail Config** | `/mail` | `/api/admin/mail/config` | In-Memory `MAIL_CONFIG` | Transient (Process-lifetime) |
| **Audit Trail** | `/audit` | `/api/admin/audit` | In-Memory `AUDIT_TRAIL_DATASET` | Transient (Process-lifetime) |
| **Users & Roles** | `/users` | `/api/admin/users` | In-Memory `ADMIN_USERS` | Transient (Process-lifetime) |
| **Settings** | `/settings` | `/api/admin/settings` | In-Memory `SETTINGS_DATASET` | Transient (Process-lifetime) |

---

## 6. Task 5 — Public Website Propagation Verification

1. **Taxonomy Separation:** Edits made in the Admin Control Center update `api:4000`. By default, the public website (`frontend:3000`) reads from its internal taxonomy store (`frontend/lib/taxonomy/`).
2. **Propagation Path:** To propagate administrative changes to the public website, `frontend` uses the typed `MarketService` / `CategoryService` / `LocationService` remote API adapters enabled via `NEXT_PUBLIC_DATA_SOURCE=api`.
3. **Canonical Slugs & SEO:** Category slugs (`interior-designers`, `restaurants`) and city slugs (`jaipur`, `delhi`, `mumbai`) maintain 1-to-1 canonical correspondence. Any non-published or draft taxonomy market is excluded from the public sitemap (`sitemap.xml`) and returns non-indexable headers (`X-Robots-Tag: noindex`).

---

## 7. Task 6 — Payments, Rankings & Concurrency Safeguards

1. **State Machine Invariants:** Payment transitions strictly obey `INTENT_CREATED` → `CHECKOUT_INITIATED` → `PAYMENT_CONFIRMED` → `SETTLEMENT_COMPLETED`.
2. **Server-Side Verification:** Amount and market position are recalculated server-side. Client-specified amounts are ignored.
3. **Strict Qualification Floor:** A business overtaking position #1 must exceed the current leader's qualifying amount by at least 100 paise (+₹1.00). Identical amounts are rejected.
4. **Append-Only History:** When a business moves from #2 to #1, the previous #1 moves to #2 without any financial refund. Position history records are strictly append-only.

---

## 8. Task 7 — Editorial, Analytics & Acquisition Modules

- **Blog Posts:** Supports `DRAFT` and `PUBLISHED` states. Draft posts are strictly omitted from public `GET /api/blog` and sitemap.
- **Newsletter:** Captures explicit consent timestamp. Supports `ACTIVE` and `UNSUBSCRIBED` states; deduplicates repeat signups without duplicate rows.
- **Mail:** Configured with mock dispatch relay for safe local testing. Live external SMTP is disabled.
- **Leads:** Connector toggle state persists in memory. No external scraping bots run without verified legal constraints.
- **Audit Logs:** Immutable security event logging for administrative updates (`CATEGORY_CREATED`, `MARKET_PUBLISHED`, `USER_ROLE_UPDATED`, etc.).

---

## 9. Task 9 — Quality Gates & Verification Matrix

All test suites and TypeScript checks executed cleanly on the repository:

| Test Suite / Quality Gate | Execution Command | Result | Pass | Fail | Skipped | Exit Code |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Test Suite** | `npm test` (`frontend/`) | **PASS** | 585 | 0 | 6 (DB container) | 0 |
| **API Test Suite** | `npm test` (`api/`) | **PASS** | 13 | 0 | 0 | 0 |
| **Admin Test Suite** | `npm test` (`admin/`) | **PASS** | 7 | 0 | 0 | 0 |
| **Frontend TypeScript** | `tsc --noEmit` (`frontend/`) | **PASS** | 0 errors | 0 | 0 | 0 |
| **API TypeScript** | `tsc --noEmit` (`api/`) | **PASS** | 0 errors | 0 | 0 | 0 |
| **Admin TypeScript** | `tsc --noEmit` (`admin/`) | **PASS** | 0 errors | 0 | 0 | 0 |
| **Total Test Assertions** | Combined All Suites | **PASS** | **605** | **0** | **6** | **0** |

---

## 10. Summary & Remediation Roadmap for Milestone 0.20.26

1. **Host Docker Setup:** Install Docker Desktop to allow disposable PostgreSQL container execution and unblock the 6 skipped DB integration tests.
2. **API PostgreSQL Repository Binding:** Bind `api/src/server.ts` to `pg` connection pools using the repository contracts already implemented in `frontend/lib/db/repositories/`.
3. **Remote API Switch on Frontend:** Enable `NEXT_PUBLIC_DATA_SOURCE=api` on the public website to achieve real-time synchronization between Admin Control Center mutations and public website rendering.
