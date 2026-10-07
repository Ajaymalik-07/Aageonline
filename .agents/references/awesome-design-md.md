# DESIGN.md Implementation Principles

Extracted from [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md) and the Google Stitch DESIGN.md specification.

## 1. What is DESIGN.md?
A plain-text design system document located at the repository root that AI agents read to build visually consistent, brand-aligned interfaces without needing Figma files or JSON schemas.

## 2. Key Architecture Components
- **Brand Identity & Philosophy:** Expressive color tokens, core themes, and aesthetic intent.
- **Design Tokens:** Strict mathematical scales for typography, 4px grid spacing, radius, and elevation.
- **State Completeness:** Every interactive control defines all 8 states (default, hover, focus-visible, active, disabled, loading, error, success).
- **Responsive & Modality Behavior:** Keyboard navigation, pointer, touch targets (minimum 44x44px), and overflow rules.
- **Accessibility Invariants:** WCAG 2.2 AA contrast ratios, visible focus indicators, and reduced-motion adaptation.

## 3. Application to AageOnline
- The root `DESIGN.md` serves as the direct implementation contract for coding agents, derived directly from `docs/Design.md`.
- No separate or competing design system is permitted.
