# Milestone 0.20.25: Admin-to-Website Propagation & Module Matrix

> **Scope:** Authoritative matrix documenting every administrative module, its backend API route, storage layer, propagation behavior to the public website, authorization enforcement, and remediation requirements.  
> **Status:** AUDITED & ACCURATELY DOCUMENTED  

---

## 1. Administrative Propagation Matrix

| Module / Entity | Admin UI Route | Backend API Endpoint | Active Storage Layer | Public Propagation Route | Public Propagation Status | Required Admin Role | Audit Action Emitted | Remediation Needed for V1 DB Persistence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Businesses** | `/businesses` | `GET/POST /api/admin/businesses` | In-Memory `CANONICAL_BUSINESSES` | `/businesses/[slug]` | Propagates via API (Requires `DATA_SOURCE=api`) | `MARKETPLACE_MANAGER` | `BUSINESS_PROFILE_UPDATED` | Bind `businesses` repository to PostgreSQL table `businesses` |
| **Locations (Cities/States)** | `/locations` | `GET/POST /api/admin/locations` | In-Memory `CANONICAL_LOCATIONS` | `/[city]` | Propagates via API (Requires `DATA_SOURCE=api`) | `MARKETPLACE_MANAGER` | `CITY_CREATED`, `CITY_CORRECTED` | Bind `locations` repository to PostgreSQL tables `states`, `cities` |
| **Categories** | `/categories` | `GET/POST /api/admin/categories` | In-Memory `CANONICAL_CATEGORIES` | `/categories/[slug]` | Propagates via API (Requires `DATA_SOURCE=api`) | `MARKETPLACE_MANAGER` | `CATEGORY_CREATED`, `CATEGORY_EDITED` | Bind `categories` repository to PostgreSQL table `categories` |
| **Markets** | `/markets` | `GET/POST /api/admin/markets` | In-Memory `CANONICAL_MARKETS` | `/[city]/[category]` | Propagates via API (Requires `DATA_SOURCE=api`) | `MARKETPLACE_MANAGER` | `MARKET_CREATED`, `MARKET_PUBLISHED` | Bind `markets` repository to PostgreSQL table `markets` |
| **Rankings** | `/rankings` | `GET/POST /api/admin/rankings` | In-Memory `CANONICAL_RANKINGS` | `/[city]/[category]` (Rank Board) | Propagates via API (Requires `DATA_SOURCE=api`) | `SUPER_ADMIN` / `FINANCE_RECONCILER` | `RANKING_POSITION_CHANGED` | Bind `market_positions` & `position_history` to PostgreSQL |
| **Discovery Requests** | `/discovery` | `GET/POST /api/admin/discovery` | In-Memory `DISCOVERY_REQUESTS` | Internal / Approval only | Internal (Promotes to market upon approval) | `MARKETPLACE_MANAGER` | `DISCOVERY_REVIEWED`, `DISCOVERY_MAPPED` | Bind `discovery_requests` repository to PostgreSQL |
| **Payments** | `/payments` | `GET /api/admin/payments` | In-Memory `PAYMENTS_DATASET` | Internal Ledger | Internal-Only | `FINANCE_RECONCILER` | `PAYMENT_CONFIRMED`, `PAYMENT_FAILED` | Bind `payment_orders` repository to PostgreSQL table `payment_orders` |
| **Settlements** | `/settlements` | `GET /api/admin/settlements` | In-Memory `SETTLEMENTS_DATASET` | Public Ledger verification | Internal-Only | `FINANCE_RECONCILER` | `RANKING_SETTLEMENT_CREATED` | Bind `settlements` repository to PostgreSQL table `ranking_settlements` |
| **Operations & Reconciler** | `/operations` | `GET/POST /api/admin/operations` | In-Memory Worker Telemetry | None | Internal-Only | `SUPER_ADMIN` | `PAYMENT_RECONCILIATION_TRIGGERED` | Bind worker lock check to PostgreSQL advisory locks `pg_try_advisory_xact_lock` |
| **Site Content CMS** | `/content` | `GET/POST /api/admin/content` | In-Memory `CONTENT_BLOCKS` | `/#trust`, `/#how-it-works`, Disclosures | Propagates via API (Requires `DATA_SOURCE=api`) | `CONTENT_SEO_MANAGER` | `CONTENT_BLOCK_UPDATED` | Store CMS block strings in database `content_blocks` table |
| **Blog Articles** | `/blog` | `GET/POST /api/admin/blog` | In-Memory `BLOG_POSTS_DATASET` | `/blog`, `/blog/[slug]` | Propagates upon `PUBLISHED` status | `CONTENT_SEO_MANAGER` | `BLOG_POST_PUBLISHED` | Bind blog repository to PostgreSQL table `blog_posts` |
| **Newsletter Subscribers** | `/newsletter` | `GET /api/admin/newsletter` | In-Memory `NEWSLETTER_SUBSCRIBERS` | None (Public subscribe endpoint) | Internal-Only | `CONTENT_SEO_MANAGER` | `NEWSLETTER_CONSENT_RECORDED` | Bind subscriber repository to PostgreSQL table `newsletter_subscribers` |
| **SEO & Robots** | `/seo`, `/sitemap-robots` | `GET /api/admin/seo/audit` | In-Memory `SEO_AUDIT_DATASET` | `/sitemap.xml`, `/robots.txt` | Propagates sitemap cache invalidation | `CONTENT_SEO_MANAGER` | `SEO_AUDIT_TRIGGERED` | Store SEO audit history in `seo_audit_runs` table |
| **Analytics** | `/analytics` | `GET /api/admin/analytics` | In-Memory Aggregations | None | Internal-Only | `AUDITOR` / `SUPER_ADMIN` | None (Read-only) | Aggregate views from `analytics_events` table |
| **Lead Registry** | `/leads` | `GET/POST /api/admin/leads` | In-Memory `LEADS_DATASET` | None | Internal-Only | `SUPER_ADMIN` | `LEAD_CONNECTOR_UPDATED` | Store prospect contacts in database `leads` table |
| **Notifications** | `/notifications` | `GET/POST /api/admin/notifications` | In-Memory `OPERATIONAL_NOTIFICATIONS` | Business Workspace alerts | Propagates to business dashboard via API | `SUPER_ADMIN` | `NOTIFICATION_MARKED_READ` | Bind notifications to PostgreSQL table `business_notifications` |
| **Mail Config** | `/mail` | `GET/POST /api/admin/mail` | In-Memory `MAIL_CONFIG` | Transactional Email Relay | Internal-Only | `SUPER_ADMIN` | `MAIL_CONFIG_UPDATED` | Store mail transport preferences in `mail_settings` table |
| **Audit Trail** | `/audit` | `GET /api/admin/audit` | In-Memory `AUDIT_TRAIL_DATASET` | None | Internal-Only | `AUDITOR` / `SUPER_ADMIN` | Append-only logger | Bind audit service to PostgreSQL table `audit_events` |
| **Users & Roles** | `/users` | `GET/POST /api/admin/users` | In-Memory `ADMIN_USERS` | None | Internal-Only | `SUPER_ADMIN` | `USER_ROLE_UPDATED` | Bind admin accounts to PostgreSQL table `admin_users` |
| **Settings** | `/settings` | `GET/PATCH /api/admin/settings` | In-Memory `SETTINGS_DATASET` | Platform maintenance banner | Propagates via API | `SUPER_ADMIN` | `PLATFORM_SETTINGS_UPDATED` | Store key-value system settings in database `system_settings` table |

---

## 2. Invariant & Propagation Guarantees

1. **Publication Gating:**
   - A newly created category, city, or market remains in `DRAFT` status until explicitly published by an administrator.
   - Public route resolution checks `publicationStatus === 'PUBLISHED'`. If `DRAFT` or `ARCHIVED`, it returns HTTP 404 or non-indexable status.
2. **SEO Canonical Protection:**
   - Canonical URLs on public pages strictly follow `https://aageonline.com/{city}/{category}` and `https://aageonline.com/businesses/{slug}`.
   - Unpublished markets and administrative URLs are excluded from `sitemap.xml` and include `X-Robots-Tag: noindex, nofollow`.
3. **Cache Invalidation:**
   - When an administrator modifies a market ranking floor or publishes a new market, the server invalidates the internal taxonomy cache tag.
