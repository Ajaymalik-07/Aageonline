# AageOnline — Milestone 0.20.27: End-to-End Verification Matrix

> **Milestone:** 0.20.27 — Unified Lead Scraper + Zero-Inspired Email Automation  
> **Verification Date:** 2026-10-13  
> **Host Environment:** Windows 10/11 x64, Node.js v22.23.2  
> **Authoritative Persistence:** PostgreSQL Schema `migrations/013_lead_scraper_and_email_automation.sql`  

---

## 1. Executive Summary & Verification Matrix

All unit tests, integration tests, contract assertions, TypeScript typechecks, and Next.js production builds have passed with zero regressions.

| Subsystem / Test Suite | Command Executed | Result | Count / Coverage | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Milestone 0.20.27 Suite** | `node --experimental-strip-types --test tests/scraper-and-email-automation.test.ts` | **PASS** | 11 / 11 subtests (12 assertions) | Migration 013, Maps glyphs, crawler SSRF, CSV injection, Gemini fallback, templates, deduplication, suppression, admin RBAC |
| **API Core & Security Suite** | `node --experimental-strip-types --test tests/api-server.test.ts` | **PASS** | 12 / 12 tests | Health probes, auth tokens, login rate limits, scrypt, timing-safe tokens |
| **API Persistence & Schema** | `node --experimental-strip-types --test tests/persistence.test.ts` | **PASS** | 4 / 4 tests | Forward migration sequence 001–013 validated, fail-closed database readiness |
| **Full API Suite Combined** | `npm test` (in `api/`) | **PASS** | 30 / 30 tests (0 fail) | Exit code 0 |
| **Admin App Typecheck** | `npx tsc --noEmit` (in `admin/`) | **PASS** | 0 errors | Exit code 0 |
| **Admin Production Build** | `npm run build` (in `admin/`) | **PASS** | 56 static/dynamic routes | Exit code 0, `/leads/scraper` and `/leads/email-automation` compiled |
| **Frontend App Typecheck** | `npx tsc --noEmit` (in `frontend/`) | **PASS** | 0 errors | Exit code 0 |
| **Live Docker Engine DB** | `docker compose up -d postgres` | **BLOCKED** | Gated | Docker Engine host prerequisite unavailable on local Windows host. Unit/contract suites validated with fail-closed and memory fallback. |

---

## 2. Source Connector Verification

### 2.1 Google Maps Connector
- **Test:** Stripping unicode glyph icons (`\ue0c8`, `\ue0b0`, `\ue702`) from location, phone, and website fields.
- **Test:** Bengali (`০-৯`) and Devanagari (`०-९`) numeral translation to standard ASCII phone numbers (`+৯১ ৯৮১২৩ ৪৫৬৭৮` → `+91 98123 45678`).
- **Target Extraction:** Evaluated with target pairs:
  - `Hisar × Hospitals`: Yields *Jindal Super Speciality Hospital*, *Apex Multispeciality Hospital*.
  - `Hisar × Diagnostic Centres`: Yields *Bansal Modern Diagnostic & Scan Lab*.
  - `Noida × Interior Designers`: Yields *SpaceCraft Architectural Solutions*.

### 2.2 Website Crawler Connector
- **Test:** SSRF Protection blocks loopback (`127.0.0.1`), local hosts (`localhost`), RFC1918 private IPs (`10.0.0.1`, `192.168.1.1`, `172.16.0.1`), and AWS Instance Metadata Service (`169.254.169.254`).
- **Test:** HTML parsing deterministic extraction of public business email addresses and phone numbers with bounded buffers and timeouts.

### 2.3 CSV Ingestion Connector
- **Test:** Neutralizes formula injection attack payloads starting with `=`, `+`, `-`, `@`, `\t`, `\r` by prefixing with a single apostrophe (`'`).

### 2.4 Social Connectors (Google Search, Meta, LinkedIn, X)
- **Test:** Connectors report truthful status (`CONFIG_REQUIRED`). When unconfigured, they fail safe and return empty candidate arrays rather than fabricating leads.

---

## 3. Gemini API Normalization & Fallback

- **Test:** Server-side `GeminiNormalizer` structures raw listings and standardizes business category and city casing against the AageOnline taxonomy.
- **Test:** In offline test environments (without `GEMINI_API_KEY`), automatically falls back to deterministic rule-based taxonomy mapping without throwing exceptions.

---

## 4. PostgreSQL Deduplication & Authoritative State

- **Test:** Re-insertion of the same lead via a different connector (e.g., Maps then Website Crawler) resolves to the identical canonical lead ID.
- **Test:** Re-discovery never resets the lead's invitation count, suppression status, or last contacted date.

---

## 5. Outreach Safety & Email Automation

- **Test:** Template engine escapes HTML injection payloads (e.g. `<Script>Alert(1)</script>`) into safe entities (`&lt;Script&gt;...`).
- **Test:** All rendered email HTML includes the mandatory unsubscribe disclosure and link.
- **Test:** One-click opt-out endpoint (`/api/public/leads/opt-out`) adds the address to `email_suppression_list` and marks matching records suppressed.
- **Test:** Cooldown windows prevent sending to recipients contacted within the configured period.

---

## 6. Live Infrastructure Status & Blockers

- **Host Prerequisite:** Docker Desktop / Docker Engine is not installed on this local Windows machine.
- **Status Classification:** Live containerized PostgreSQL testing is marked **BLOCKED** on the Docker Engine host prerequisite.
- **Integrity Guarantee:** In accordance with Milestone preflight rules, in-memory simulations are **not** claimed as live Docker execution. All DDL schemas (`001–013`), SQL queries, and transactional repository queries were verified via static analysis and isolated Node test suites.
