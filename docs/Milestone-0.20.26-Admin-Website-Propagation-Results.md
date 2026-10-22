# AageOnline — Milestone 0.20.26
# Admin-to-Website Propagation & Module Classification Matrix

> **Document Type:** Authoritative Propagation Audit  
> **Milestone:** 0.20.26  
> **Status:** AUDITED & CONFIGURED  

---

## 1. Classification Methodology

In accordance with Milestone 0.20.26 specifications, every administrative module in the Control Center is audited and classified into one of four persistence tiers:

1. **Persistent Business Data:** Core commercial entities that define markets, business identities, taxonomy, and editorial content.
2. **Persistent Financial/Transaction Data:** Monetary records, payment intents, payment orders, provider webhook events, and settled ranking ladder positions.
3. **Persistent Operational/Audit Data:** Immutable system audit trails, operator activities, lead prospect pipelines, and user consent records.
4. **Derived or Cacheable Data:** Analytics aggregates, worker heartbeats, rendered sitemaps/robots directives, and cache invalidation statuses.

---

## 2. Module Audit & Propagation Matrix

| Module | Route / UI | Persistence Tier | Database Entity | API Endpoint | Public Website Propagation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Markets & Taxonomy** | `/admin/markets`<br>`/admin/locations`<br>`/admin/categories` | Persistent Business Data | `markets`<br>`locations`<br>`categories` | `POST /api/admin/markets`<br>`POST /api/admin/locations`<br>`POST /api/admin/categories` | Visible on `/markets`, `/[location]`, `/categories/[category]`, and sitemap. Invalidation purged on publish. |
| **Business Directory** | `/admin/businesses` | Persistent Business Data | `businesses`<br>`business_verifications` | `POST /api/admin/businesses` | Visible on `/businesses`, `/businesses/[slug]`, and relevant market directory lists once verified. |
| **Live Rankings** | `/admin/rankings` | Persistent Financial / Commercial Data | `ranking_entries`<br>`position_history` | `GET /api/admin/rankings`<br>`POST /api/admin/rankings` | Authoritative visibility ladder on `/[location]/[category]` and `/markets`. Updated atomically with row locks. |
| **Discovery Requests** | `/admin/discovery` | Persistent Operational Data | `discovery_requests` | `GET /api/admin/discovery`<br>`POST /api/admin/discovery` | Internal review pipeline. Approved requests trigger automatic market/category creation for public discovery. |
| **Payment Orders** | `/admin/payments` | Persistent Financial Data | `payment_orders`<br>`payment_provider_events` | `GET /api/admin/payments`<br>`POST /api/admin/payments/:id/reconcile` | Internal financial ledger. Confirmed payments transition to atomic ranking settlement. |
| **Ranking Settlements** | `/admin/settlements` | Persistent Financial Data | `ranking_settlements` | `GET /api/admin/settlements` | Audit record of settled ranking transitions. Positions propagate immediately to public ranking cards. |
| **Operations & Reconciler** | `/admin/operations` | Persistent Operational Data + Derived | `reconciliation_runs`<br>`cache_invalidation_jobs` | `GET /api/admin/operations`<br>`POST /api/admin/operations` | Reconciles orphaned confirmed orders with live rankings and drains cache invalidation outboxes. |
| **Content Blocks** | `/admin/content` | Persistent Business Data | `content_blocks` | `GET /api/admin/content`<br>`POST /api/admin/content` | Public disclosures, legal banners, and hero copy on `/`, `/#trust`, and `/#how-it-works`. |
| **Blog & Editorial** | `/admin/blog` | Persistent Business Data | `blog_posts` | `GET /api/admin/blog`<br>`POST /api/admin/blog` | Visible on `/blog` and `/blog/[slug]` when `status === 'PUBLISHED'`. Drafts strictly return 404 on public route. |
| **URL Redirects** | `/admin/redirects` | Persistent Business Data | `url_redirects` | `GET /api/admin/redirects`<br>`POST /api/admin/redirects` | Evaluated by Edge routing middleware. 301/308 redirects execute before page rendering. |
| **Newsletter Subscribers** | `/admin/newsletter` | Persistent Operational Data | `newsletter_subscribers` | `GET /api/admin/newsletter`<br>`POST /api/newsletter/subscribe` | Public footer submission records subscriber with consent timestamp and double opt-in flag. |
| **Leads & Inquiries** | `/admin/leads` | Persistent Operational Data | `lead_prospects` | `GET /api/admin/leads`<br>`POST /api/admin/leads` | Captures inbound business claim inquiries and partner prospect records. |
| **Administrative Users** | `/admin/users` | Persistent Operational Data | `admin_users` | `GET /api/admin/users`<br>`POST /api/admin/users` | Platform operators with RBAC scopes (`SUPER_ADMIN`, `MARKETPLACE_MANAGER`, `FINANCE_RECONCILER`). |
| **System Settings** | `/admin/settings` | Persistent Operational Data | `system_settings` | `GET /api/admin/settings`<br>`PATCH /api/admin/settings` | Global feature gates, maintenance modes, and payment gateway configuration. |
| **Audit Logs** | `/admin/audit` | Persistent Operational Data (Immutable) | `audit_logs` | `GET /api/admin/audit` | Append-only event history for all administrative mutations and financial operations. |
| **Analytics & Telemetry** | `/admin/analytics` | Derived or Cacheable Data | Aggregate queries on `ranking_entries`, `transactions` | `GET /api/admin/analytics` | Dynamic aggregation across tables. Zero duplicate or unsynchronized totals stored in memory. |

---

## 3. Propagation Verification Rules

1. **Publication Invariants:**
   - Content with `status: 'DRAFT'` or `publicationStatus: 'DRAFT'` is strictly excluded from public directory endpoints (`/api/markets`, `/api/businesses`, `/api/blog`).
   - Draft items return HTTP 404 on public Next.js routes.
2. **SEO & Indexing Consistency:**
   - Sitemaps (`/sitemap.xml`) only index records with `status === 'PUBLISHED'` and `robots: 'index,follow'`.
   - Staging environments inject `X-Robots-Tag: noindex, nofollow` unconditionally.
3. **Restart Resilience:**
   - Because all records are queried from PostgreSQL (`api/src/db/repositories/`), mutations survive complete API process termination and restart.
