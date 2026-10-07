# AageOnline — Changelog

## 0.1.0 — Documentation Foundation

### Added

- Product documentation structure.
- Core paid-visibility model.
- Ranking/payment state model.
- Initial architecture.
- API conventions.
- Database model.
- Design system foundation.
- Security/compliance/consent baseline.
- Testing strategy.
- Delivery phases.
- SEO/content/AIO-GEO/analytics foundations.

### Locked Brand Decisions

- AageOnline
- Get Seen. Get Ahead.
- Teal + Emerald + Lime
- Deep Navy foundation
- Light and Dark themes
- Controlled 3D
- Purposeful motion
- WCAG 2.2 AA

## 0.2.0 — Development Harness Foundation

### Added
- Root-level `AGENTS.md` defining core product model, V1 exclusions, documentation hierarchy, and engineering safety rules.
- Root-level `DESIGN.md` defining brand tokens, Light/Dark themes, 4px grid spacing, typography, 8 mandatory component states, motion tokens, and 3D boundaries.
- `.agents/` development harness structure:
  - Skills: `project-context`, `ranking-engine`, `payments-integrity`, `database-migrations`, `security-audit`, `testing-and-verification`, `design-system`, `code-review`, and `ponytail`.
  - Rules: `engineering-standards.md`, `ranking-and-transactions.md`, `security-and-data-protection.md`, and `design-and-accessibility.md`.
  - Workflows: `feature-implementation.md`, `ranking-mutation-verification.md`, and `security-gate.md`.
  - References: `awesome-harness-engineering.md`, `awesome-design-md.md`, and `evaluated-tools-matrix.md`.
- Dev-scoped `.agents/mcp_config.json` for persistent agent memory (`agentmemory`).
- Hardened `.gitignore` excluding secrets, credentials, environment variables, build artifacts, and dependency directories.
- ADR-011 through ADR-014 in `docs/Decision-Log.md`.

