# AageOnline — Milestone 0.20.27
# Reference Repository Audit & Implementation Planning

> **Milestone:** 0.20.27  
> **Status:** AUDIT COMPLETE & ARCHITECTURE PLANNED  
> **Target Subsystems:** B2B Lead Scraper & Zero-Inspired Email Automation  
> **Date:** October 13, 2026  

---

## 1. Executive Summary

Milestone 0.20.27 integrates a complete B2B lead discovery pipeline and an automated invitation email outreach engine into the existing AageOnline Administrative Control Center.

To accelerate implementation without reinventing wheel-level logic or compromising AageOnline's architectural integrity, two open-source reference repositories were audited:
1. **Lead Scraper Reference:** `https://github.com/msmunnabd/Social-Media-AutoPilot-Engine` (MIT License)
2. **Email Application Reference:** `https://github.com/Mail-0/Zero` (MIT License)

This audit establishes:
- Which specific components, routines, and data schemas can be safely adapted.
- What code must **NOT** be merged or adopted due to architectural mismatch, legal/licensing boundaries, or operational anti-patterns.
- The precise data handoff boundary across PostgreSQL and the authoritative REST API (`api/`, port 4000).

---

## 2. Lead Scraper Reference Audit
**Repository:** `msmunnabd/Social-Media-AutoPilot-Engine`  
**License:** MIT License  
**Inspected Subsystem:** `Core_Project/02_Social_Media/37 Google Maps/`  
**Core Files Inspected:** `bulkScrape.py`, `scrapeLeads.py`, `importLeads.js`, `scraped_leads.json`, `scraped_leads.csv`

### 2.1 Extraction & Normalization Logic
- **Mechanism:** The reference uses Selenium WebDriver (configured with headless Microsoft Edge) to submit queries like `Photo Studio in {area}, Dhaka`, scroll down the Google Maps result list (`//a[contains(@href, '/maps/place/')]`), click place detail cards, and parse DOM elements.
- **Data Normalization:**
  - `clean_text()` strips Google Maps-specific Unicode icon glyphs (`\ue0c8` location pin, `\ue0b0` phone, `\ue702` website, `\ue80d` share, `\ue52e` transit directions).
  - `convert_bn_numbers()` normalizes non-Latin numeral strings (`০-৯` to `0-9`).
- **Extracted Fields:**
  - Business Name (`name`)
  - Physical Address (`address`)
  - Phone Number (`phone`)
  - Business Website / Social URL (`website`)
  - Star Rating (`rating`)
  - Business Category (`category`)
- **Export Format:** Outputs to both `scraped_leads.json` and `scraped_leads.csv`.

### 2.2 Critical Deficiencies & Required Adaptations
1. **No Direct Business Email Extraction:** Google Maps place cards generally do **not** display business email addresses. In the sample `scraped_leads.json`, email fields are absent; only phone numbers and websites (`http://www.facebook.com/...`) are captured.  
   *Adaptation for AageOnline:* AageOnline must pair the Google Maps place extractor with a **Deterministic Business Website Crawler** that safely visits the extracted website (`/`, `/contact`, `/about`) to discover publicly listed contact emails, or ingest verified email datasets via CSV import.
2. **Heavy Browser Dependency (Selenium Edge):** The reference requires a local desktop browser and Edge WebDriver. Running full desktop browsers inside lightweight Docker containers or headless servers introduces stability and resource overhead.  
   *Adaptation for AageOnline:* Create an isolated connector interface. Implement a lightweight HTTP/API-compatible Google Maps adapter alongside authorized Places/Search APIs, with rate-limiting, exponential backoff, and user-agent rotation.
3. **Absence of Server-Side Deduplication & ACID Storage:** The reference script appends to flat files and uploads tokens to Supabase storage.  
   *Adaptation for AageOnline:* Store all discovered records directly in PostgreSQL via the authoritative API repository, with unique indexes on `(normalized_name, city, category)` and `(website)` to ensure zero duplicates.
4. **Interactive CLI Blockers:** The reference script uses blocking `input()` prompts.  
   *Adaptation for AageOnline:* All discovery parameters (locations, categories, depth, limits) must be driven by the Admin Control Center UI and persisted in `scraper_configs` / `scraper_jobs`.

---

## 3. Email Application Reference Audit
**Repository:** `Mail-0/Zero`  
**License:** MIT License  
**Inspected Subsystem:** `apps/mail/components/mail/` and `apps/mail/components/create/`  
**Core Components Inspected:** `mail.tsx`, `mail-list.tsx`, `mail-display.tsx`, `email-composer.tsx`, `editor.tsx`, `toolbar.tsx`

### 3.1 Architecture & Design Patterns
- **User Interface Structure:**
  - Zero implements a modern, resizable 3-pane layout:
    1. *Left Navigation:* System folders (Inbox, Drafts, Sent, Archive, Trash) and custom labels with counter badges.
    2. *Middle Message List:* Chronological cards displaying sender avatar, name, subject preview, delivery timestamp, and priority/status tags.
    3. *Right Detail Pane / Composer:* Thread timeline view with action toolbar (Reply, Forward, Archive, Delete), rich text composer, and template selector.
- **Typography & Styling:** Built on TailwindCSS and Shadcn UI primitives, emphasizing clean typography, high contrast, and micro-interactions.

### 3.2 Evaluation for AageOnline Adaptation
1. **Architectural Scope Mismatch:** Zero is designed as a *personal mailbox client* (synchronizing Gmail/Outlook via IMAP/OAuth for an individual user). It is **not** an outbound B2B invitation scheduling engine.
2. **What to Reuse (Design System & UI Patterns):**
   - The 3-pane responsive layout pattern for `/leads/email-automation`.
   - Message list card layout with status badges (`QUEUED`, `SENT`, `FAILED`, `BOUNCED`, `OPTED_OUT`).
   - Split composer and message detail panel showing recipient details, variable replacement preview, and provider message IDs.
   - Clean template studio with live variable preview (`{{businessName}}`, `{{city}}`, `{{category}}`).
3. **What NOT to Import:**
   - Better Auth authentication system.
   - Drizzle ORM schema and database migrations.
   - Heavy ProseMirror/Tiptap dependencies that conflict with AageOnline's zero-dependency Vanilla/Next.js stack.
   - Client-side mailbox sync loops.

---

## 4. Unified System Architecture & Database Handoff

The PostgreSQL database is the **strict, authoritative handoff boundary** between the Lead Scraper and Email Automation:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN CONTROL CENTER                            │
│   ┌──────────────────────────┐        ┌────────────────────────────┐   │
│   │   Scraper Dashboard      │        │  Email Automation Studio   │   │
│   │   /leads/scraper         │        │  /leads/email-automation   │   │
│   └────────────┬─────────────┘        └─────────────▲──────────────┘   │
└────────────────┼────────────────────────────────────┼──────────────────┘
                 │ HTTP API Proxy                     │ HTTP API Proxy
                 ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AUTHORITATIVE REST API                          │
│   ┌──────────────────────────┐        ┌────────────────────────────┐   │
│   │  Scraper Engine Worker   │        │  Campaign Scheduler Worker │   │
│   │  - Connectors (Maps/Web) │        │  - Target Eligibility      │   │
│   │  - Gemini Normalization  │        │  - Cooldown & Suppression  │   │
│   │  - Deduplication         │        │  - Safe Template Rendering │   │
│   └────────────┬─────────────┘        └─────────────▲──────────────┘   │
└────────────────┼────────────────────────────────────┼──────────────────┘
                 │                                    │
                 ▼                                    │
┌─────────────────────────────────────────────────────┴──────────────────┐
│                      POSTGRESQL DATABASE                               │
│                                                                        │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │   lead_prospects       │ ◄────── │   email_outbox              │   │
│   │   (Authoritative SQL   │         │   (Queued, Sent, Bounced,   │   │
│   │    Registry)           │         │    Suppression Records)     │   │
│   └───────────▲────────────┘         └──────────────▲──────────────┘   │
│               │                                     │                  │
│   ┌───────────┴────────────┐         ┌──────────────┴──────────────┐   │
│   │   scraper_jobs         │         │   email_campaigns           │   │
│   │   scraper_configs      │         │   email_templates           │   │
│   └────────────────────────┘         └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Invariants
1. **Independent Schedules:** The Scraper daily discovery job and the Email campaign dispatch job run on separate worker schedules. A scraper discovery run **never** triggers an uncontrolled email blast.
2. **Durable Deduplication:** Re-scraping an existing business updates provenance without duplicating records, resetting cooldowns, or erasing suppression states.
3. **Opt-Out Safety:** Immediately before any message send attempt, the campaign worker checks the recipient's suppression status against `email_suppression_list` and `lead_prospects.suppressed`. Suppressed leads are rejected with zero provider dispatch.
4. **Truthful Telemetry:** Send metrics reflect verified database outbox statuses, not optimistic client assumptions.
