# AageOnline — Milestone 0.20.27: Email Automation Architecture & Zero Adaptation

> **Product Category:** Business Visibility and Competitive Positioning Platform  
> **Milestone:** 0.20.27 — Unified Lead Scraper + Zero-Inspired Email Automation  
> **Component:** Email Automation & Campaign Dispatcher  
> **Route:** `/leads/email-automation`  
> **Authoritative Persistence:** PostgreSQL Schema `email_templates`, `email_campaigns`, `email_outbox`, `email_suppression_list` (Migration 013)  

---

## 1. Architectural Mission & Invariants

The Email Automation subsystem selectively consumes eligible B2B leads stored in PostgreSQL, allows administrators to manage rich templates with strict XSS sanitization, and dispatches commercial visibility invitations on an independent campaign schedule.

### Strict System Boundaries
1. **Separation from Discovery:** Email Automation operates independently of the Scraper. Leads discovered today can be contacted weeks later. Disabling the Scraper does not pause active email campaigns.
2. **Authoritative Suppression Enforcement:** Before every queued send, the system checks `email_suppression_list` and `lead_prospects.suppressed`. If an address is suppressed, delivery is blocked immediately.
3. **Contact Cooldown Enforcement:** Campaigns configure contact cooldowns (e.g., 30 days). Leads contacted within the cooldown window are filtered out.
4. **Mandatory Unsubscribe & Indian Electronic Communication Compliance:** Every commercial HTML email automatically includes a one-click unsubscribe URL pointing to `/api/public/leads/opt-out` and clear attribution.
5. **No Blind Inbox Architecture Merge:** Mail-0 Zero was audited for its visual 3-pane layout, message inspectors, and status badge design tokens. We did **not** import Zero's personal inbox sync (IMAP/Gmail OAuth), user authentication, or Drizzle schema.

---

## 2. Zero-Inspired 3-Pane Interface Architecture

Implemented in `admin/app/leads/email-automation/page.tsx`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TOP SUB-NAVIGATION TABS                         │
│  [🧲 Lead Registry]    [🕷️ Scraper Dashboard]    [✉️ Email Automation]  │
├───────────────────┬───────────────────────────┬────────────────────────┤
│ PANE 1: CONTROL   │ PANE 2: CAMPAIGN / OUTBOX │ PANE 3: STUDIO &       │
│ FOLDERS & METRICS │ CARD LIST (ZERO CARDS)    │ INSPECTOR              │
│                   │                           │                        │
│ • Overview KPIs   │ • Campaign Card (#1)      │ • Campaign Inspector   │
│ • Campaigns (3)   │   - Status Badge (ACTIVE) │   - Targets & Limiter  │
│ • Templates (2)   │   - Recipient stats       │   - Cooldown settings  │
│ • Outbox Log (50) │ • Campaign Card (#2)      │ • Run Cycle Now        │
│ • Suppression Box │   - Status Badge (PAUSED) │ • Live HTML Preview    │
│ • Test Email Box  │ • Outbox Message Card     │ • Template Editor      │
│                   │   - Status (DELIVERED)    │ • Instant Suppress     │
└───────────────────┴───────────────────────────┴────────────────────────┘
```

### Visual Tokens & Design Alignment
- Backgrounds: `#071526` (Canvas) and `#0B1F33` (Card/Elevated).
- Primary Accent: `#EA580C` (AageOnline Flame Orange).
- Status Colors: Emerald `#10B981` (Delivered/Active), Amber `#F59E0B` (Queued/Paused), Red `#EF4444` (Suppressed/Bounced).
- Typography: Inter typography with tabular numerals.

---

## 3. Template Rendering & XSS Protection

The template engine (`api/src/services/email/template-renderer.ts`) safely evaluates personalization tokens:
- `{{businessName}}`: Normalized business name (HTML-escaped).
- `{{category}}`: Normalized business category (HTML-escaped).
- `{{city}}`: Business target market location (HTML-escaped).
- `{{registrationUrl}}`: Direct listing claim and verification URL.
- `{{optOutUrl}}`: Unique or query-bound one-click unsubscribe route.

Any script tags or malicious HTML entities embedded within scraped candidate names are neutralized via constant-time entity conversion (`<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`).

---

## 4. Email Outbox & Dispatch Lifecycle

Messages follow an append-only state transition:

```
[SQL Lead Ingested]
        ↓
[Campaign Selection Query]
        ↓ Filter: outreach_eligible = TRUE, suppressed = FALSE, cooldown_days satisfied
[Queued in email_outbox] (status: QUEUED)
        ↓
[Dispatch Attempt via Configured Provider] (status: SENDING)
        ├── Success → (status: SENT / DELIVERED, record providerMessageId)
        └── Failure → (status: FAILED / BOUNCED, record errorMessage)
        ↓
[Recipient Clicks Opt-Out] → (email_suppression_list populated, status: SUPPRESSED)
```

---

## 5. Public Opt-Out & Instant Suppression Route

- **GET `/api/public/leads/opt-out?email=...`**: Renders a clean, branded confirmation page and suppresses the email address.
- **POST `/api/public/leads/opt-out`**: Accepts JSON `{ "email": "...", "reason": "USER_UNSUBSCRIBE" }` for programmatic suppression.
- Suppressed emails are recorded in `email_suppression_list` with a unique ID and timestamp, and all matching records in `lead_prospects` have `suppressed = TRUE` and `outreach_eligible = FALSE`.
