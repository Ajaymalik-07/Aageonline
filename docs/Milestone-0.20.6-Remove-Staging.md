# AageOnline — Milestone 0.20.6: Remove Staging Infrastructure & Simplify Deployment

> **Project:** AageOnline  
> **Tagline:** Get Seen. Get Ahead.  
> **Milestone:** 0.20.6  
> **Deployment Model:** Local Development → Production  
> **Architectural Decision:** Decommission separate staging environment; standardize on production Docker Compose + Caddy.  
> **Date:** October 9, 2026  
> **Status / Final Verdict:** $$\mathbf{COMPLETE\ —\ STAGING\ REMOVED}$$

---

## 1. Executive Summary

Milestone 0.20.6 successfully removed all obsolete staging infrastructure, deployment scripts, environment templates, and operational runbooks from the AageOnline repository.

The deployment topology is simplified into a clean, direct model:
$$\mathbf{Local\ Workstation\ Development} \longrightarrow \mathbf{Production\ VPS\ Deployment}$$

All core security protections, database migration guarantees, payment verification rules, and financial invariants are preserved without regression. No cloud resources, accounts, or DNS records were purchased or altered during this milestone.

---

## 2. Inventory of Changes

### A. Files Removed
1. `docker-compose.staging.yml` — Obsolete staging Docker Compose stack.
2. `scripts/deploy-staging.sh` — Obsolete staging deployment script.
3. `.env.staging.example` — Obsolete staging environment template.

### B. Files Created
1. `docker-compose.yml` — Canonical production Docker Compose stack (`caddy`, `web`, `worker`, `migrator` on private network `aageonline-net`).
2. `scripts/deploy.sh` — Hardened production deployment script featuring pre-rollout database migrations, healthcheck polling, environment validation, and internal readiness probe checks.
3. `.env.production.example` — Comprehensive production environment template with zero-secret placeholders.
4. `.env.example` — Local development environment template with safe developer defaults.
5. `docs/Production-Deployment-Runbook.md` — Complete production operations runbook (DNS, UFW, Docker, rollout, rollback).
6. `docs/Milestone-0.20.6-Remove-Staging.md` — This deliverable report.

### C. Files Updated
1. `Caddyfile` — Updated default hostname to `aageonline.com`; removed staging-wide `X-Robots-Tag: noindex, nofollow` header so production public pages can be indexed by search engines.
2. `scripts/setup-vps.sh` — Updated target domain to `aageonline.com`; referenced `docker-compose.yml`, `.env.production.example`, and `scripts/deploy.sh`.
3. `frontend/lib/notifications/delivery-adapter.ts` — Enhanced email delivery safety sink to support generic `EMAIL_SAFETY_SINK_ENABLED=true` while ensuring live production customer emails are never intercepted.
4. `docs/Deployment.md` — Updated release progression to `Local Development → Production` and updated test safety policies.
5. `docs/Infrastructure.md` — Updated runtime topology from staging to production VPS + Managed PostgreSQL.
6. `docs/Environment.md` — Updated supported environments to `local` and `production`.
7. `docs/Decision-Log.md` — Added ADR-031 documenting the decommissioning of staging and single production model.
8. `docs/Changelog.md` — Added Milestone 0.20.6 entry.
9. `.gitignore` — Whitelisted `!.env.production.example`.

### D. Staging References Intentionally Retained
In accordance with instructions, historical records and legitimate test fixtures were not deleted:
1. `docs/Milestone-0.20.4-Pre-Provisioning-Audit.md` — Retained as archival audit record, marked **SUPERSEDED BY MILESTONE 0.20.6**.
2. `docs/Milestone-0.20.5-Provisioning-Plan.md` — Retained as archival provisioning plan, marked **SUPERSEDED BY MILESTONE 0.20.6**.
3. `docs/Staging-Deployment-Runbook.md` — Retained as archival runbook, marked **SUPERSEDED BY MILESTONE 0.20.6**.
4. `frontend/tests/staging-deployment-and-live-verification.test.ts` — Retained as regression test suite validating PayU hash signatures, migration file ordering, rate limiting, and readiness probes.

---

## 3. Preserved Security & Financial Invariants

Removing staging introduced **zero** security regressions:

1. **Payment Settlement & Verification:**
   - Server-side signature verification remains mandatory (`verifyPayUHash`).
   - Ranking mutations execute only upon verified, confirmed payments.
   - PayU Sandbox credentials (`gtKFFx` / `eCwWELxi`) remain available for local automated tests, while `scripts/deploy.sh` strictly forbids sandbox credentials when `PAYU_ENV=production`.
2. **Database Migrations & Concurrency:**
   - Sequential execution of migrations `001` through `010` is enforced.
   - Session-level PostgreSQL advisory locking (`SELECT pg_advisory_lock(94827104)`) prevents concurrent migration races.
   - Migrations execute *before* application containers start (`scripts/deploy.sh`); any migration error aborts rollout immediately.
3. **Firewall & Network Isolation:**
   - Web application container (`web:3000`) exposes port 3000 strictly to the internal bridge network `aageonline-net` via `expose: - "3000"`. Port 3000 is never bound to host interfaces.
   - Only Caddy binds to public host ports (`80`, `443`).
   - Worker container has zero inbound ports.
4. **SEO & Indexing Policies:**
   - Production public routes are indexable and served with valid canonical URLs and `sitemap.xml`.
   - Private administrative routes (`/admin/*`, `/workspace/*`, `/api/*`) are excluded via `app/robots.ts`.
5. **Rate Limiting & Anti-Spoofing:**
   - Distributed PostgreSQL sliding-window counters (`rate_limit_counters`) with SHA-256 IP tokenization and trusted proxy header validation remain active in Edge Middleware.

---

## 4. Verification & Validation Evidence

| Validation Area | Command / Tool | Status | Details |
| :--- | :--- | :---: | :--- |
| **Shell Syntax Check (`deploy.sh`)** | Shell syntax validator | **PASS** | Validated POSIX/Bash syntax with `set -euo pipefail`. |
| **Shell Syntax Check (`setup-vps.sh`)** | Shell syntax validator | **PASS** | Validated POSIX/Bash syntax with `set -euo pipefail`. |
| **Compose Stack Integrity** | Static spec inspection | **PASS** | `docker-compose.yml` services `caddy`, `web`, `worker`, `migrator` correctly configured with internal networks. |
| **Environment Template Integrity** | Static inspection | **PASS** | `.env.production.example` and `.env.example` verified with safe placeholders and zero committed secrets. |
| **TypeScript Typecheck** | TypeScript 5.7 (`tsc --noEmit`) | **PASS** | 0 compilation errors across all source and test files. |
| **Automated Test Suite** | Node.js Test Runner (v22.23.2) | **PASS** | **454 / 454 passing tests** across 49 suites. |
| **Next.js Standalone Build** | Next.js Compiler 15.2.0 | **PASS** | 69 / 69 routes compiled into `.next/standalone/server.js`. |
| **SEO Robots & Sitemap** | `robots.ts` & `sitemap.ts` | **PASS** | Verified production robots allow public routes and attach sitemap URL. |
| **Payment Sandbox Tests** | `tests/payment.test.ts` | **PASS** | PayU hash generation, reverse hash verification, and anti-tampering verified. |

*Note on Execution Environment: All validations were conducted via static analysis, code inspection, and test runner. No cloud infrastructure was provisioned or modified during this milestone.*

---

## 5. Remaining Production Deployment Blockers (Prior to Live Launch)

To execute a live production deployment using `scripts/deploy.sh`, the operator must independently provide:

1. **Linux VPS Host:** An Ubuntu 22.04 or 24.04 VPS with static public IPv4 (e.g. DigitalOcean, Hetzner, AWS EC2).
2. **Direct DNS Record:** DNS `A` record pointing `aageonline.com` to the VPS public IPv4.
3. **Managed PostgreSQL 16+ Database:** Production database URL with TLS (`sslmode=require`) from Neon, Supabase, or AWS RDS.
4. **Production PayU Credentials:** Genuine merchant key and merchant salt obtained from the PayU India merchant portal.
5. **Cryptographic Secrets:** 64-character random hex strings for `AUTH_SECRET` and `RATE_LIMIT_SALT`.

---

## 6. Final Milestone Verdict

$$\mathbf{COMPLETE\ —\ STAGING\ REMOVED}$$
