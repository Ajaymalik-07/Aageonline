# AageOnline Documentation

> **Brand:** AageOnline  
> **Tagline:** Get Seen. Get Ahead.  
> **Product:** Business visibility and competitive positioning platform  
> **Status:** Foundation / pre-implementation

## Purpose

This directory is the source of truth for AageOnline product, engineering, design, security, compliance, growth, and operational decisions.

## Core Product Rule

AageOnline allows businesses to compete for paid visibility positions within a defined **location + category market**.

A higher qualifying payment moves the paying business into the selected position and pushes lower-ranked businesses down. Previous payments are **not refunded**. Each upward move is a new payment.

## Non-Goals for V1

V1 must not introduce:

- wallets
- withdrawals
- refunds for previous bids
- subscriptions
- reverse marketplaces
- auto-bidding
- mobile apps
- unrelated AI/AR/VR features
- unnecessary global location expansion
- complex points or credit systems

## Documentation Map

| File | Source of truth for |
|---|---|
| PRD.md | Product requirements and V1 scope |
| State.md | Authoritative business/application state transitions |
| Architecture.md | System boundaries and technical architecture |
| API.md | API contracts |
| Database.md | PostgreSQL data model |
| Design.md | UI/UX design system |
| Environment.md | Configuration and environment variables |
| Infrastructure.md | Runtime infrastructure and services |
| Deployment.md | Release and deployment process |
| Security.md | Security controls |
| Compliance.md | Compliance requirements and review gates |
| Consent.md | Consent, disclosures, and records |
| Testing.md | Verification strategy |
| Phases.md | Delivery phases and gates |
| Changelog.md | Version history |
| SEO.md | Search-engine optimization |
| Content.md | Content system |
| AIO-GEO.md | AI-search / answer-engine / GEO strategy |
| Analytics.md | Measurement and event taxonomy |
| Troubleshooting.md | Operational diagnosis |
| Decision-Log.md | Important decisions and rationale |

## Authority Rules

1. `PRD.md` defines product intent and scope.
2. `State.md` defines authoritative state transitions.
3. `Database.md` defines persistence.
4. `API.md` defines service contracts.
5. `Design.md` defines presentation and interaction behavior.
6. `Security.md`, `Compliance.md`, and `Consent.md` define mandatory safeguards.
7. No implementation should silently contradict these documents.
8. Material changes must be recorded in `Decision-Log.md` and `Changelog.md`.
