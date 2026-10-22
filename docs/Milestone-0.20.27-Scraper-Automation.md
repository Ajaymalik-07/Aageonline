# AageOnline — Milestone 0.20.27: Scraper Automation Architecture & Implementation

> **Product Category:** Business Visibility and Competitive Positioning Platform  
> **Milestone:** 0.20.27 — Unified Lead Scraper + Zero-Inspired Email Automation  
> **Component:** Business Lead Discovery & Scraper Engine  
> **Route:** `/leads/scraper`  
> **Authoritative Persistence:** PostgreSQL Schema `scraper_configs`, `scraper_jobs`, `lead_prospects` (Migration 013)  

---

## 1. Architectural Mission & Invariants

The Scraper Automation subsystem discovers eligible, unlisted, or under-positioned businesses across defined Indian location and category markets (e.g., *Hisar × Hospitals*, *Hisar × Diagnostic Centres*, *Noida × Interior Designers*).

### Strict System Boundaries
1. **Separation from Outreach Blasts:** Scraper runs on an independent daily schedule (or manual on-demand trigger) and **never** triggers an automatic email blast.
2. **PostgreSQL Authoritative Registry:** All leads are normalized, validated, and deduplicated inside PostgreSQL before any downstream system can view them.
3. **SSRF & Security Safeguards:** The website crawler enforces strict private network protections (blocking loopback, RFC1918 private IPs, and AWS IMDS `169.254.169.254`), with a 5-second timeout and 1MB buffer ceiling.
4. **Formula Injection Sanitization:** CSV ingestion sanitizes spreadsheet command prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) to protect back-office spreadsheet applications.
5. **Zero Browser Automation:** Anti-bot circumvention, browser headless hijacking, or aggressive scraping of protected consumer/personal profiles is strictly prohibited.

---

## 2. Reused & Adapted Scraper Logic

Based on the audit of `msmunnabd/Social-Media-AutoPilot-Engine`:

| Feature / Logic | Source | Adaptation in AageOnline |
| :--- | :--- | :--- |
| **Unicode Glyph Stripping** | `clean_text()` in `bulkScrape.py` | Strips Maps pin/phone/url glyphs (`\ue0c8`, `\ue0b0`, `\ue702`, `\ue80d`, `\ue52e`, `\ue000-\uf8ff`) |
| **Vernacular Number Mapping** | `convert_bengali_to_english_number()` | Maps Bengali (`০-৯`) and Devanagari (`०-९`) numerals to standard ASCII digits |
| **Deterministic Regional Fixtures** | Custom implementation | Pre-seeded with authentic regional businesses for Hisar and Noida |
| **Two-Stage Discovery Pipeline** | Architecture decision | Stage 1: Google Maps / Search extracts business domain & phone. Stage 2: SSRF-safe Website Crawler extracts public contact email from official domain. |

---

## 3. Source Connector Framework

AageOnline implements a pluggable `SourceConnector` interface with strict operational reporting:

| Connector | Type | Operational Status | Data Retention & Permissions |
| :--- | :--- | :--- | :--- |
| **Google Maps** | `GOOGLE_MAPS` | `OPERATIONAL` | Extracts public place listings, phone, website, address. Cleans glyphs & numerals. |
| **Website Crawler** | `WEBSITE_CRAWLER` | `OPERATIONAL` | Parses permitted public contact pages (`/contact`, `/about`) with SSRF filtering. |
| **CSV Directory Import** | `CSV_IMPORT` | `OPERATIONAL` | Bulk imports authorized CSV directories with formula injection neutralization. |
| **Google Search** | `GOOGLE_SEARCH` | `OPERATIONAL` | Uses official Google Search API query structure (`"Category" "Location"`). |
| **Meta Graph API** | `META` | `CONFIG_REQUIRED` | Requires verified Meta App & Pages access. Personal scraping is rejected. |
| **LinkedIn Developer** | `LINKEDIN` | `CONFIG_REQUIRED` | Requires LinkedIn Developer app approval. Member scraping is rejected. |
| **X Developer API** | `X` | `CONFIG_REQUIRED` | Requires Enterprise/Pro X API bearer tokens. |

---

## 4. Gemini AI Normalization & Deterministic Fallback

The optional Gemini API normalization layer structures raw scraped listings:
- **Server-Side API Key:** `GEMINI_API_KEY` is kept server-side only; never leaked to client bundles.
- **Strict Anti-Hallucination Invariant:** Gemini is instructed **never** to invent emails, phone numbers, or addresses.
- **Taxonomy Classification:** Classifies raw industry strings into official AageOnline taxonomy (`Hospitals`, `Diagnostic Centres`, `Interior Designers`, etc.).
- **Deterministic Offline Fallback:** If `GEMINI_API_KEY` is unconfigured, unreachable, or times out, the system automatically falls back to deterministic rule-based string cleaning and taxonomy lookup.

---

## 5. PostgreSQL Deduplication & Schema

Database migration `013_lead_scraper_and_email_automation.sql` introduces:
- `scraper_configs`: Multi-location, multi-category, frequency, concurrency, and limits.
- `scraper_jobs`: Append-only audit record of discovery execution, items found, new records, duplicates, and errors.
- `lead_prospects`: Extended with `normalized_name`, `outreach_eligible`, `suppressed`, `suppressed_at`, `provenance`, and `discovery_job_id`.

**Deduplication Invariant:**
```sql
WHERE (LOWER(city) = LOWER($1) AND LOWER(category) = LOWER($2) AND normalized_name = $3)
   OR (contact_email IS NOT NULL AND LOWER(contact_email) = LOWER($4))
```
Re-discovery never resets cooldown timers, never overrides verified suppression flags, and never overwrites high-confidence contact data with lower-confidence values.
