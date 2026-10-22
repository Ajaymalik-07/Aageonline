# Milestone 0.20.24 — Complete Website & Admin Control Audit

> **Brand:** AageOnline  
> **Platform Category:** Business Visibility and Competitive Positioning Platform  
> **Host Architecture:** Decoupled Web (`localhost:3000`), Admin (`localhost:3001`), and REST API (`localhost:4000`)  
> **Document Purpose:** Authoritative route inventory, component mapping, administrative gap matrix, and implementation blueprint.

---

## 1. Executive Audit Summary

AageOnline is an architectural foundation for transparent, paid competitive business visibility.
Markets are strictly defined as exactly one **Location + Category** pair (e.g. *Jaipur × Interior Designers*, *Noida × Restaurants & Dining*).
Businesses compete for paid visibility ranking positions (#1, #2, #3, etc.) within that market.

This audit inspects the entire codebase across:
1. `frontend/` (Public website, business claim flow, workspace, SEO engine, sitemap).
2. `api/` (Authoritative REST API service on port 4000).
3. `admin/` (Administrative control center on port 3001).
4. Database schemas, migrations (`frontend/lib/db/migrations/`), repository interfaces, and worker services.

---

## 2. Public Website Route & Feature Inventory

| # | Public URL / Interaction | Source Component & Data Source | API Endpoint & DB Entity | Implementation Status | Admin Editable Today? | Safe Administration Requirement | Public Website Propagation |
|---|---|---|---|---|---|---|---|
| **1** | `/` (Homepage) | `frontend/app/page.tsx`<br/>Hero, Features, Market Carousel, Categories Rail, FAQ | Config: `siteConfig.ts`, `markets.ts`, `STATIC_CATEGORIES` | Fully Implemented | ❌ No (Hardcoded in config) | Content Management Module for homepage copy, hero headline, FAQs, and featured markets. | ISR / dynamic revalidation of homepage cache tag. |
| **2** | `/markets` (Markets Explorer) | `frontend/app/markets/page.tsx`<br/>Filterable grid of all Location + Category markets | `GET /api/markets`<br/>Entity: `markets` | Fully Implemented | ⚠️ Partial (Markets viewable in Admin, but publication state & base bid editing needed) | Market Management module to edit base bid price, active state, and SEO threshold. | Instant query revalidation on `/markets`. |
| **3** | `/[location]` (City Doorway) | `frontend/app/[location]/page.tsx`<br/>E.g. `/jaipur`, `/noida` | `locationService`, `STATIC_LOCATIONS`<br/>Entity: `locations` | Fully Implemented | ❌ No (Static files & seed DB) | Location Management module to manage canonical slug, state, country, aliases, and publication status. | Revalidates city doorway route on publication. |
| **4** | `/[location]/[category]` (Market Landing) | `frontend/app/[location]/[category]/page.tsx`<br/>E.g. `/jaipur/interior-designers` | `rankingService`, `markets`, `ranking_positions` | Fully Implemented | ⚠️ Indirect (Ranks only via paid settlements; cannot manually edit ranks) | Market Rules module to audit qualifying price ladder, inspect settlement logs. No direct rank overwrite. | Atomic PostgreSQL transaction triggers page revalidation. |
| **5** | `/categories` (Category Hub) | `frontend/app/categories/page.tsx` | `categoryService`, `STATIC_CATEGORIES`<br/>Entity: `categories` | Fully Implemented | ❌ No | Category Management module: create, edit, archive categories, meta descriptions, icons. | Revalidates `/categories` index. |
| **6** | `/locations` (Locations Directory) | `frontend/app/locations/page.tsx` | `locationService`, `STATIC_LOCATIONS`<br/>Entity: `locations` | Fully Implemented | ❌ No | Location Management module: enable/disable active cities, region hierarchy. | Revalidates `/locations`. |
| **7** | `/businesses/[business]` (Public Profile) | `frontend/app/businesses/[business]/page.tsx`<br/>E.g. `/businesses/biz-abc-interiors` | `businessService`, `BusinessHero`, `BusinessInfoCard` | Fully Implemented | ⚠️ Partial (Directory exists, editing/verification status pending) | Business Profile Editor: update verification badges, suspension state, contact info, claim state. | Revalidates public business slug route. |
| **8** | `/business/claim` (Claim Business) | `frontend/app/business/claim/page.tsx` | `POST /api/business-claims`<br/>Entity: `business_claims` | Fully Implemented | ⚠️ Partial | Discovery & Approvals: review claim submissions, verify ownership documents, approve/reject. | Updates `businesses.is_claimed` flag. |
| **9** | `/business/dashboard/*` (Workspace) | `frontend/app/business/dashboard/page.tsx` | `workspace/store.ts`, Local session | Fully Implemented | ❌ No (Business user private session) | Administrator read-only view of business rank history and active market participation. | Internal to claimed business. |
| **10**| Bid Placement Modal (`BidModal.tsx`) | `frontend/features/bidding/BidModal.tsx` | `POST /api/bid-intents`<br/>Entity: `bid_intents`, `payments` | Fully Implemented (Mock-safe) | ⚠️ Partial | Financial Operations: search payments, inspect webhooks, view transaction references. | Triggers atomic settlement upon payment verification. |
| **11**| `/blog` & `/blog/[slug]` | *Missing* (No models, components or routes exist) | *None* | ❌ Missing | ❌ No | Blog CMS Foundation: title, slug, excerpt, body, author, SEO metadata, draft/publish lifecycle. | New `/blog` and `/blog/[slug]` public routes. |
| **12**| Newsletter Subscription | *Missing* (No form or subscriber store exists) | *None* | ❌ Missing | ❌ No | Newsletter Subscription API (`POST /api/newsletter/subscribe`), deduplication, consent log, subscriber manager. | In-app subscription footer/modal. |
| **13**| `/sitemap.xml` | `frontend/app/sitemap.ts`<br/>`sitemap-service.ts` | Dynamic eligibility evaluator<br/>Entity: `seo_audits` | Fully Implemented | ❌ No | Sitemap & Robots Control Center: inspect candidate inclusion/exclusion, live robots preview. | Emitted via technical XML route. |
| **14**| `/robots.txt` | `frontend/app/robots.ts` | Technical metadata route | Fully Implemented | ❌ No | Robots Preview & Rule Inspection: ensures admin/api routes are disallowed. | Emitted via technical TXT route. |

---

## 3. Database Schema & Persistence State

The repository contains 11 SQL migrations in `frontend/lib/db/migrations/`:
- `001_initial_schema.sql`: Core taxonomy (`locations`, `categories`, `markets`, `businesses`).
- `002_bid_intents.sql`: Bid intents with integer minor unit pricing.
- `003_payments_and_events.sql`: Append-only payment intents and webhook events.
- `004_ranking_settlements_and_history.sql`: Atomic settlement records and immutable position history.
- `005_outbox_and_recovery.sql`: Transactional outbox for event publishing.
- `006_admin_operations.sql`: Operational reconciliation and supervisor lock state.
- `007_ranking_notifications.sql`: Notification events for overtaken positions and milestones.
- `008_seo_audits.sql`: Technical SEO audit snapshots and doorway eligibility.
- `009_performance_indexes.sql`: Composite indexes for market queries.
- `010_durable_invalidation_and_rate_limits.sql`: Cache invalidation tags and brute-force tracking.
- `011_user_sessions.sql`: Session state management.

### Crucial Invariants
1. **Zero Database Invariant in Admin:** The `admin/` application has **no direct PostgreSQL connections or credentials**. All operations must execute through authenticated REST calls to `api/`.
2. **Payment Finality Invariant:** No refunds when a business is overtaken. Every position jump is an independent transaction.
3. **Integer Currency Invariant:** All amounts stored in integer minor units (paise) or exact rupees. Zero floating-point math.

---

## 4. Current Admin Status vs Full Control Center Gap Matrix

| Admin Capability | Current Status | Required Control Center Scope | Implementation Plan |
|---|---|---|---|
| **Overview Dashboard** | Basic KPI cards | Real-time KPI summary, service mesh vitals, active markets, payment totals, recent audit events | Enhance `admin/app/page.tsx` with real API feeds |
| **Business Management** | Dense read table | View details, verify, suspend, archive, restore, edit supported profile fields with audit reasons | Create `/businesses/[id]` detail & edit modal |
| **Location Management** | Missing | Create/edit location records, canonical slug, state, country, publication status | Build `admin/app/locations/page.tsx` |
| **Category Management** | Missing | Create/edit/archive categories, name, slug, description, structured data | Build `admin/app/categories/page.tsx` |
| **Market Management** | Basic view table | Create/edit markets, base bid floor, publication status, ranking ladder, position history | Build `admin/app/markets/page.tsx` |
| **Rankings Ledger** | Basic settlement view | Current position, qualifying amount, change history, linked to settlement & audit. No direct rank overwrite | Build `admin/app/rankings/page.tsx` |
| **Discovery & Approvals** | Basic table | Review discovered locations/categories/markets, approve/reject/defer with audit reason | Build `admin/app/discovery/page.tsx` with action modals |
| **Payments Management** | Missing | Search by ID/provider ref/business, amount in INR/paise, payment state machine, webhook events | Build `admin/app/payments/page.tsx` |
| **Settlements & Recovery** | Basic settlement table | Pending/completed/failed settlements, worker vitals, manual reconciliation trigger with audit logging | Build `admin/app/settlements/page.tsx` & `admin/app/recovery/page.tsx` |
| **Website Content CMS** | Missing | Approved text fields, FAQs, disclosures, announcements, preview & publication workflow | Build `admin/app/content/page.tsx` |
| **Blog Management** | Missing | Blog post list, create/edit, draft/in-review/published, author, excerpt, body, SEO metadata | Build `admin/app/blog/page.tsx` |
| **Newsletter Management**| Missing | Subscriber directory, consent log, unsubscribe handling, suppression rules | Build `admin/app/newsletter/page.tsx` |
| **SEO / AEO / GEO** | Missing | Per-route title/meta/canonical status, OpenGraph, JSON-LD schema status, thin content findings | Build `admin/app/seo/page.tsx` |
| **Sitemap & Robots** | Missing | Technical sitemap preview, inclusion/exclusion reasons, robots.txt preview & validation | Build `admin/app/sitemap-robots/page.tsx` |
| **Analytics Dashboard** | Missing | Traffic sources, discovery searches, conversion funnel; honest setup state when uninstrumented | Build `admin/app/analytics/page.tsx` |
| **Lead Acquisition** | Missing | Extensible prospect registry, connectors (source deferred to owner), deduplication, suppression | Build `admin/app/leads/page.tsx` |
| **Mail Management** | Missing | SMTP/provider config status, transactional email templates, safe test preview | Build `admin/app/mail/page.tsx` |
| **Operational Alerts** | Basic log | In-app operational notifications: failed payments, stale locks, discovery approvals | Build `admin/app/notifications/page.tsx` |
| **Audit Logs** | Basic table | Append-only immutable actor, action, entity, timestamp, details, severity | Build `admin/app/audit/page.tsx` |
| **Admin Users & Roles** | Settings view | Admin identities, scrypt password hashes, role matrix (`SUPER_ADMIN`, `MARKETPLACE_MANAGER`, etc.) | Build `admin/app/users/page.tsx` |
| **Settings & Security** | Basic view | Site identity, approved origin, feature readiness, cryptographic policy | Build `admin/app/settings/page.tsx` |

---

## 5. Architectural Blueprint for Phase B, C, and D

1. **API Expansion (`api/src/server.ts`):**
   - Provide dedicated, strongly-typed endpoints for all 15 administrative operational modules.
   - Guard every endpoint with `authenticateAdminRequest` using session tokens or `ADMIN_TOKEN`.
   - Implement persistent/in-memory operational state with strict validation.
2. **Admin Proxy Routes (`admin/app/api/*`):**
   - Create proxy routes passing the signed session cookie `aage_admin_session` to the API.
3. **Admin Shell & Navigation (`admin/components/AdminShell.tsx`):**
   - Group navigation logically according to the owner's specification.
   - Provide badges, tooltips, responsive drawer, breadcrumbs, search, user profile menu.
4. **Data Management Pages:**
   - Implement all 15 screens with dark theme, dense tables, search filters, modal actions, and honest empty/error states.
