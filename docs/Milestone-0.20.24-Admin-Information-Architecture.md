# Milestone 0.20.24 — Admin Information Architecture & Control Center Blueprint

> **Brand:** AageOnline Control Center  
> **Tagline:** Get Seen. Get Ahead.  
> **Visual Reference:** Reference Image 2 (Dark Dashboard, Grouped Left Navigation, Compact Top Bar, KPI Cards, Dense Data Tables)  
> **Security Model:** Decoupled REST, NIST scrypt Hashing, Signed HttpOnly Sessions, Zero Admin Direct DB Access  

---

## 1. Architectural Principles

1. **Strict Market Boundary:** Exactly one **Location + Category** pair represents a market. Rankings exist only within a market.
2. **Payment Finality Invariant:** Overtaken positions do **not** trigger refunds. Every upward position change is an independent, distinct transaction.
3. **Decoupled Admin Layer:** The administration portal (`localhost:3001`) never imports PostgreSQL clients (`pg`, `DATABASE_URL`) or executes direct database mutations. All operations proxy through the authenticated API (`localhost:4000`).
4. **Zero-Secret Client Bundles:** No passwords, hashes, session signing keys, or `ADMIN_TOKEN` secrets ever reach the browser bundle.
5. **Honest Data Presentation:** No fabricated metrics, mock blog posts, or fake newsletter subscribers. Unconnected features display setup/offline states.

---

## 2. Information Architecture & Navigation Map

```text
Admin Control Center (/login -> /)
├── 📊 OVERVIEW
│   └── Dashboard Overview (/) [KPIs, Market Vitals, Service Mesh, Recent Activity]
│
├── 🏢 MARKETPLACE MANAGEMENT
│   ├── Business Management (/businesses) [Directory, Verification, Profiles, Market Links]
│   ├── Location Hierarchy (/locations) [Cities, States, Canonical Slugs, Publication State]
│   ├── Taxonomy & Categories (/categories) [Categories, Slugs, Structured Data, Doorway Coverage]
│   ├── Markets & Ladders (/markets) [Location+Category Pairs, Base Bids, Position Ladders]
│   ├── Ranking Positions (/rankings) [Position Ladders, Qualification Ledger, History]
│   └── Discovery & Approvals (/discovery) [Discovered Entities, Approval/Rejection Workflow]
│
├── 💳 FINANCIAL OPERATIONS
│   ├── Transaction Ledger (/payments) [Payments, Paise Amounts, Webhook Events, Provider Refs]
│   ├── Ranking Settlements (/settlements) [Settled Positions, Atomic Locks, Audit References]
│   ├── Operations & Reconciler (/operations) [Worker Heartbeat, Lock Reaper, Reconciliation Triggers]
│   └── Recovery & Outbox (/recovery) [Supervisor Recovery Jobs, Lock Health, Stalled Retries]
│
├── 📝 WEBSITE CONTENT & CMS
│   ├── Site Content CMS (/content) [Homepage Copy, Hero, FAQs, Disclosures, Announcements]
│   ├── Blog Management (/blog) [Blog Posts, Draft/Publish, Authors, SEO Metadata]
│   └── Newsletter Subscribers (/newsletter) [Subscribers, Consent Log, Unsubscribe Suppression]
│
├── 🌐 SEO & TECHNICAL GOVERNANCE
│   ├── SEO / AEO / GEO Engine (/seo) [Meta Status, Canonical Audits, JSON-LD, Entity Coverage]
│   ├── Sitemap & Robots (/sitemap-robots) [Sitemap Generator Preview, Robots Validation]
│   ├── Analytics & Telemetry (/analytics) [Search Trends, Market Discovery, Conversion Funnel]
│   └── Lead Acquisition (/leads) [Connector Registry, Prospect Records, Suppression List]
│
└── ⚙️ SYSTEM & GOVERNANCE
    ├── In-App Notifications (/notifications) [Operational Alerts, Stale Locks, Failed Payments]
    ├── Mail Management (/mail) [SMTP/Provider Config, Transactional Templates, Test Send]
    ├── Platform Audit Trail (/audit) [Immutable Append-Only Audit Log]
    ├── Admin Users & Roles (/users) [Administrator Directory, scrypt Passwords, Role Matrix]
    └── Settings & Diagnostics (/settings) [Site Identity, Approved Origin, Cryptographic Health]
```

---

## 3. Administrative Role & Permission Matrix

| Module / Operation | Super Admin | Marketplace Manager | Finance & Reconciler | Content & SEO Manager | Auditor (Read-Only) |
|---|---|---|---|---|---|
| **Overview Dashboard** | Read / Full | Read / Full | Read / Full | Read / Full | Read / Full |
| **Business Verification** | Full (Verify/Suspend) | Full (Verify/Suspend) | Read-only | Read-only | Read-only |
| **Taxonomy (Loc/Cat)** | Full | Full (Create/Edit) | Read-only | Full (Edit descriptions) | Read-only |
| **Market Publishing** | Full | Full | Read-only | Read-only | Read-only |
| **Direct Rank Overwrite** | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN |
| **Payments Inspection** | Full | Read-only | Full | Read-only | Read-only |
| **Settlement Reconcile** | Full (Trigger) | Read-only | Full (Trigger) | Read-only | Read-only |
| **Website Content CMS** | Full | Read-only | Read-only | Full (Draft/Publish) | Read-only |
| **Blog Publishing** | Full | Read-only | Read-only | Full | Read-only |
| **Newsletter Export** | Full | Read-only | Read-only | Full | Read-only |
| **SEO & Sitemap** | Full | Read-only | Read-only | Full | Read-only |
| **Lead Connector Toggle**| Full | Full | Read-only | Read-only | Read-only |
| **Admin Accounts** | Full (Create/Rotate) | Read-only | Read-only | Read-only | Read-only |
| **Audit Logs** | Full (Append-only) | Read-only | Read-only | Read-only | Read-only |

> [!IMPORTANT]
> In accordance with product invariants, **no administrator role** can directly overwrite ranking order. Rankings change strictly through verified server-side payment transactions.

---

## 4. Feature Availability & Status Matrix

| Module | Route | API Endpoint | DB Table / Model | Status |
|---|---|---|---|---|
| Dashboard Overview | `/` | `/api/health`, `/api/markets` | Vitals & entities | **Implemented** |
| Businesses | `/businesses` | `/api/admin/businesses` | `businesses` | **Implemented** |
| Locations | `/locations` | `/api/admin/locations` | `locations` | **Implementing** |
| Categories | `/categories` | `/api/admin/categories` | `categories` | **Implementing** |
| Markets | `/markets` | `/api/admin/markets` | `markets` | **Implemented** |
| Rankings | `/rankings` | `/api/admin/rankings` | `ranking_positions` | **Implementing** |
| Discovery | `/discovery` | `/api/admin/discovery` | `business_claims` | **Implemented** |
| Payments | `/payments` | `/api/admin/payments` | `payments` | **Implementing** |
| Settlements | `/settlements` | `/api/admin/settlements` | `ranking_settlements` | **Implemented** |
| Operations | `/operations` | `/api/admin/operations` | Reconciler lock | **Implemented** |
| Recovery Jobs | `/recovery` | `/api/admin/recovery-jobs` | `outbox_events` | **Implementing** |
| Content CMS | `/content` | `/api/admin/content` | Content store | **Implementing** |
| Blog | `/blog` | `/api/admin/blog`, `/api/blog` | Blog store | **Implementing** |
| Newsletter | `/newsletter` | `/api/admin/newsletter` | Subscriber store | **Implementing** |
| SEO Engine | `/seo` | `/api/admin/seo/audit` | `seo_audits` | **Implementing** |
| Sitemap & Robots | `/sitemap-robots` | `/api/admin/seo/sitemap` | Dynamic sitemap | **Implementing** |
| Analytics | `/analytics` | `/api/admin/analytics` | Telemetry logs | **Implementing** |
| Lead Framework | `/leads` | `/api/admin/leads` | Lead prospects | **Implementing** |
| Mail Management | `/mail` | `/api/admin/mail` | Mail config | **Implementing** |
| Notifications | `/notifications` | `/api/admin/notifications` | Alerts queue | **Implementing** |
| Audit Trail | `/audit` | `/api/admin/audit-logs` | Immutable audit | **Implemented** |
| Users & Roles | `/users` | `/api/admin/users` | `admin_users` | **Implementing** |
| Settings | `/settings` | `/api/admin/settings` | App settings | **Implemented** |

---

## 5. UI/UX Specifications

- **Sidebar:** Width 260px (collapsed 72px), icon + label, section headers, active border indicator `#EA580C`.
- **Toolbar:** 64px height, breadcrumb path, live status pill (`API 4000 Connected`), public website quick-link, profile dropdown, sign-out button.
- **Containers:** Max width 1600px, 24px/32px padding, responsive horizontal scrolling for dense data tables.
- **Data Tables:** Dense layout, 11px uppercase table headers, zebra-subtle hover states, monospaced ID/price columns, status badges.
- **Actions:** Modals with confirmation buttons, loading states, and toast notifications.
