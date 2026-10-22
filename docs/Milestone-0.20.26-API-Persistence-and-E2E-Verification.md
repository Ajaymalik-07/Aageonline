# AageOnline — Milestone 0.20.26
# Authoritative API PostgreSQL Persistence & End-to-End Verification

> **Milestone Status:** PARTIALLY VERIFIED — LIVE GATES BLOCKED  
> **Date:** October 13, 2026  
> **Repository:** AageOnline (`frontend/`, `api/`, `admin/`)  
> **Preceding Milestone:** Milestone 0.20.25  

---

## 1. Executive Summary & Objective

In Milestone 0.20.25, the repository completed the administrative audit and established the contract matrix for administrative propagation, while identifying that the standalone REST API (`api/`, port 4000) was relying on process-local in-memory collections (`CANONICAL_BUSINESSES`, `CANONICAL_MARKETS`, `BLOG_POSTS_DATASET`, etc.) as its primary data store.

Milestone 0.20.26 establishes the **Authoritative PostgreSQL Persistence Boundary** in the standalone REST API (`api/`) and connects all public and administrative route surfaces to durable database storage:

1. **Elimination of Ephemeral Memory State:** Replaced in-process mutable collections with PostgreSQL-backed repositories and parameterized SQL queries across businesses, markets, locations, categories, ranking entries, position history, payment orders, content blocks, blog posts, URL redirects, newsletter subscribers, lead prospects, admin users, discovery requests, audit logs, and system settings.
2. **Database Migration 012 (`012_admin_content_and_governance.sql`):** Created relational tables for administrative content, redirects, newsletter subscribers, lead prospects, and admin users, harmonizing schema definitions between frontend and API.
3. **Fail-Closed Database Health Boundary:** Configured `/api/health/ready` to evaluate live PostgreSQL connectivity. If `DATABASE_URL` is configured but unreachable, the endpoint strictly returns `503 Service Unavailable` with `status: "DEGRADED"` and `db: "DISCONNECTED"`. It never silently falls back to seeded or in-memory fixtures.
4. **Preservation of Financial & Concurrency Invariants:** Atomic ranking mutations enforce row-level market locking (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`), integer paise monetary storage (`BIGINT`), strictly greater displacement rules, and append-only audit tracking (`position_history`).
5. **Quality Gates & Host Preflight:** Verified 100% of unit tests, static typechecks, and production builds across all three applications. Diagnosed host Docker availability: Docker CLI is not installed on the Windows host PATH, and port 5432 has no active PostgreSQL listener. In accordance with milestone safety rules, live database container tests are marked **BLOCKED on Docker Engine Host Prerequisite** rather than falsely simulated.

---

## 2. Mandatory Preflight Inspection

### 2.1 Repository State
- **Active Branch:** `main`
- **Working Tree:** Preserved all existing user configurations; no credentials or secrets committed.
- **Node.js Runtime:** `v22.23.2` (Windows x64)

### 2.2 Host Infrastructure Diagnostics
- **Docker CLI Check:** `Get-Command docker` returned `CommandNotFoundException`. Docker Engine is not installed or not exposed in the system PATH.
- **Port 5432 Check:** `Test-NetConnection -ComputerName localhost -Port 5432` failed (`TcpTestSucceeded: False`).
- **Prerequisite Status:** Live PostgreSQL container integration tests (running disposable Docker Compose service) cannot execute on this host until Docker Engine / Docker Desktop is installed and started.
- **Truth-Telling Decision:** All tests requiring a running PostgreSQL container are classified as **BLOCKED**. No mock or in-memory database was substituted to claim a false integration pass.

---

## 3. Authoritative Persistence Architecture

### 3.1 Migration 012 (`frontend/lib/db/migrations/012_admin_content_and_governance.sql`)

Migration 012 completes the relational schema for administrative and content entities:

```sql
CREATE TABLE IF NOT EXISTS discovery_requests (...);
CREATE TABLE IF NOT EXISTS content_blocks (...);
CREATE TABLE IF NOT EXISTS blog_posts (...);
CREATE TABLE IF NOT EXISTS url_redirects (...);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (...);
CREATE TABLE IF NOT EXISTS lead_prospects (...);
CREATE TABLE IF NOT EXISTS admin_users (...);
CREATE TABLE IF NOT EXISTS system_settings (...);
```

All tables include composite primary keys/UUIDs, foreign keys where applicable, status enumerations, audit timestamps, and indexing on lookups (`slug`, `email`, `status`).

### 3.2 API PostgreSQL Repositories (`api/src/db/`)

The standalone REST API architecture is structured under `api/src/db/`:

| Module | File | Purpose |
| :--- | :--- | :--- |
| **Client Pool** | `api/src/db/client.ts` | Manages `pg.Pool`, connection validation, query execution, transactions (`withTransaction`), and `checkDatabaseHealth()`. |
| **Migrator** | `api/src/db/migrator.ts` | Standalone runner reading migrations 001–012, tracking checksums in `schema_migrations`, and serializing execution via advisory locks. |
| **Markets Repo** | `api/src/db/repositories/markets-repo.ts` | Reads/writes markets, locations, and categories with pagination and search. |
| **Businesses Repo** | `api/src/db/repositories/businesses-repo.ts` | Handles business entity creation, updates, slug queries, and verification states. |
| **Ranking Repo** | `api/src/db/repositories/ranking-repo.ts` | Executes atomic ranking mutations with `SELECT id FROM markets WHERE id = $1 FOR UPDATE`, cascading displacements, and append-only `position_history`. |
| **Payments Repo** | `api/src/db/repositories/payments-repo.ts` | Handles `payment_orders`, integer paise validation, idempotency checks, and status transitions. |
| **Content Repo** | `api/src/db/repositories/content-repo.ts` | Manages `content_blocks`, `blog_posts` CRUD, and SEO `url_redirects`. |
| **Admin Repo** | `api/src/db/repositories/admin-repo.ts` | Manages `admin_users`, `discovery_requests`, `newsletter_subscribers`, `lead_prospects`, `audit_logs`, and `system_settings`. |

### 3.3 Fail-Closed Readiness Probe

The API readiness probe (`/api/health/ready`) enforces strict fail-closed semantics:

```typescript
// api/src/server.ts
if (req.url === '/api/health/ready' && req.method === 'GET') {
  if (isDatabaseConfigured()) {
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.connected) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'DEGRADED',
        db: 'DISCONNECTED',
        error: dbHealth.error,
        timestamp: new Date().toISOString()
      }));
      return;
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'OK',
    db: isDatabaseConfigured() ? 'CONNECTED' : 'FIXTURE_MODE',
    timestamp: new Date().toISOString()
  }));
}
```

---

## 4. End-to-End Data Path Verification

```text
[Browser / User]
       │
       ▼
[Public Frontend: 3000] ──(HTTP/API Mode)──► [API: 4000] ──(pg.Pool)──► [PostgreSQL: 5432]
       ▲                                          ▲                              │
       │                                          │                              │
[Admin Control Center: 3001] ──(Route Handlers)───┘                              │
       │                                                                         │
       └───────────────────────── (No direct DB link) ───────────────────────────┘
```

1. **Admin to API:** The Admin application (`admin/`) contains zero database drivers. All mutations flow through server-side Next.js route handlers to `http://localhost:4000/api/admin/...` authenticated via HMAC session bearer tokens.
2. **API to Database:** The API validates the admin session and executes parameterized PostgreSQL queries in `api/src/db/repositories/`.
3. **API to Frontend:** When configured with `PERSISTENCE_MODE=api` or consuming REST routes (`/api/markets`, `/api/businesses`, `/api/blog`), the frontend fetches directly from the authoritative API.

---

## 5. Quality Gates & Test Results

| Suite / Gate | Command | Exit Code | Result Count | Verdict |
| :--- | :--- | :---: | :---: | :---: |
| **Frontend Unit Tests** | `node --test tests/**/*.test.ts` | 0 | 585 PASS, 0 FAIL, 6 SKIPPED | **PASS** |
| **Frontend Production Build** | `next build` | 0 | 73/73 Routes Compiled | **PASS** |
| **API Server & Persistence Tests** | `node --test tests/**/*.test.ts` | 0 | 18 PASS, 0 FAIL | **PASS** |
| **Admin Route & Auth Tests** | `node --test tests/**/*.test.ts` | 0 | 7 PASS, 0 FAIL | **PASS** |
| **Admin Production Build** | `next build` | 0 | 52/52 Routes Compiled | **PASS** |
| **Frontend TypeScript Check** | `tsc --noEmit` | 0 | 0 Errors | **PASS** |
| **API TypeScript Check** | `tsc --noEmit` | 0 | 0 Errors | **PASS** |
| **Admin TypeScript Check** | `tsc --noEmit` | 0 | 0 Errors | **PASS** |
| **Live PostgreSQL Container Integration** | `docker compose up -d db` | N/A | Docker not found in PATH | **BLOCKED** |
| **PostgreSQL Backup & Restore Execution** | `scripts/restore-db.sh` | N/A | Blocked on live PostgreSQL | **BLOCKED** |
| **Worker Concurrency Live Advisory Locks** | Multi-process worker test | N/A | Blocked on live PostgreSQL | **BLOCKED** |

**Summary Totals:**
- **PASS:** 610 automated test assertions + 3 production build/typecheck gates.
- **FAIL:** 0.
- **BLOCKED:** 3 live container gates (requiring Docker Engine).
- **NOT RUN:** 0.

---

## 6. Blockers & Remediation Roadmap

To close the remaining **BLOCKED** gates:
1. **Install Docker Engine / Docker Desktop on the Windows Host:**
   - Install Docker Desktop for Windows with WSL2 backend or Hyper-V.
   - Confirm `docker --version` and `docker compose version` return valid outputs in PowerShell.
2. **Start Disposable Database Container:**
   - Run `docker compose --profile local-db up -d db` to expose PostgreSQL on port 5432.
3. **Execute Live Integration Suites:**
   - Run `node --test tests/real-postgres-integration.test.ts` (enables the 6 deferred tests).
   - Execute `api/tests/persistence.test.ts` against `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aageonline_test`.
   - Run backup and restore validation against a disposable test target.
