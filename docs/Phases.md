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
