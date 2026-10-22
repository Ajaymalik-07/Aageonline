# AageOnline — Delivery Phases

## Phase 0 — Foundation

- documentation structure
- product rules
- decision log
- repository conventions
- environment strategy

**Gate:** documentation internally consistent.

## Phase 1 — Data & Identity

- PostgreSQL foundation
- authentication
- users
- businesses
- categories
- locations
- markets

**Gate:** secure CRUD and ownership rules pass.

## Phase 2 — Ranking Engine

- market ranking
- position calculation
- position history
- concurrency controls

**Gate:** deterministic ranking tests pass.

## Phase 3 — Payments & Position Purchase

- payment integration
- transaction records
- verified callbacks
- idempotency
- position application

**Gate:** successful payment cannot produce an inconsistent ranking.

## Phase 4 — Notifications

- milestone detection
- email events
- outbid notifications
- preference controls

**Gate:** notifications are correct and idempotent.

## Phase 5 — Business Workspace

- dashboard
- position view
- target selection
- payment flow
- history

**Gate:** real business test flow passes.

## Phase 6 — Public Experience

- homepage
- Live Spotlight
- explore
- ranking pages
- business profiles
- responsive experience

**Gate:** usability, accessibility, SEO checks pass.

## Phase 7 — Admin & Governance

- admin
- verification
- transactions
- audit logs
- governance controls

**Gate:** privileged actions are authorized and auditable.

## Phase 8 — Production Readiness

- security review
- compliance review
- payment review
- backups
- monitoring
- incident procedures
- launch checklist

**Gate:** production launch approval.

### Phase 8 Status (Milestone 0.20.32)
- **API Persistence Boundary (0.20.26):** Complete. API eliminated in-process ephemeral collections for mutable business records; Migration 012 and PostgreSQL repositories established.
- **Unified Lead Scraper & Zero Email Automation (0.20.27):** Complete. Migration 013 (`scraper_configs`, `scraper_jobs`, `email_templates`, `email_campaigns`, `email_outbox`, `email_suppression_list`), Indic/glyph cleaner adaptation, SSRF-safe website crawler, CSV injection defense, Gemini API extraction with fallback, 3-pane Zero-inspired UI at `/leads/email-automation`, Scraper UI at `/leads/scraper`, and public one-click opt-out endpoint (`/api/public/leads/opt-out`).
- **PostgreSQL Persistence & Scheduler Recovery (0.20.28):** Complete. User-space portable PostgreSQL 16 cluster, SCRAM-SHA-256 authenticated `aage_app` role, durable PostgreSQL scheduler engine with advisory locking (`94827105`), and SQL cooldown enforcement.
- **Public Page Linking Repair (0.20.29):** Complete. Statutory legal and grievance routes (`/privacy`, `/terms`, `/grievance`), canonical redirects (`/knowledge` -> `/blog`), published market registry sync, and canonical feature link remapping.
- **Business Owner Identity & Registration Flow (0.20.30):** Complete. Migration 014, mobile OTP challenge verification, PostgreSQL user and business ownership persistence, returning owner dashboard view, and statutory evidence format validation.
- **PayU Sandbox Payment Provider & External Webhook Verification (0.20.32):** COMPLETE (Sandbox Testing); Production Release — BLOCKED PENDING RELEASE GATES. 12/12 integration tests passed on disposable database `aageonline_integration_test`; PayU sandbox negative handshake verified; WhatsApp excluded from milestone; production credentials, HTTPS webhook ingress, and release authorization remain outstanding release blockers.
- **Linux Worker Concurrency, Advisory Lock Handover & Heartbeat Lifecycle (0.21.0):** COMPLETE (Launch Gate 3 Closed); Production Release — BLOCKED PENDING REMAINING GATES. Genuine POSIX `SIGTERM` shutdown drill executed under native Linux (Ubuntu 26.04 WSL2) via mirrored networking against isolated disposable database `aageonline_worker_drill_disposable`. Advisory lock (`829104812`) mutual exclusion, drain (<20ms), and automatic handover verified with zero duplicate jobs. Worker heartbeat repository lifecycle consistency fix implemented and verified (top-level `status = 'STOPPED'`, 12/12 lifecycle tests passing, 51/51 ops/supervision tests passing, 0 TypeScript errors). Production launch remains strictly BLOCKED by Gates 4 (Cloud Managed DB), 5 (PayU Merchant Onboarding), and 6 (Domain/TLS/Monitoring).

