---
name: design-system
description: Guides UI implementation using AageOnline design tokens, theme modes, 3D limits, motion rules, and WCAG 2.2 AA states. Trigger when creating or editing components, styles, or UI layouts.
---

# Design System Skill

## Purpose
Enforces the visual identity, token architecture, component states, and accessibility standards specified in `DESIGN.md` and `docs/Design.md`. Prevents ad-hoc styling, unapproved colors, and excessive 3D decoration.

## Trigger Conditions
- Creating or editing UI components (buttons, cards, ranking tables, modals).
- Implementing Light and Dark theme modes.
- Adding motion, transitions, or 3D visual treatments.
- Reviewing UI layouts for mobile responsiveness and accessibility.

## Instructions
1. **Apply Core Brand Tokens:**
   - Deep Emerald (`#064E3B`), Emerald (`#059669`), Teal (`#10B981`), Lime (`#C7F000`), Deep Navy (`#0B1F3B`).
   - Use CSS semantic variables (e.g. `var(--text-primary)`, `var(--action-primary)`) rather than hard-coded hex values.
2. **Implement Mandatory Component States:**
   - Every interactive component must define 8 states:
     `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`, `success`.
   - Never suppress focus rings without a visible replacement (`:focus-visible` must have 2px solid ring).
3. **Respect Motion & 3D Boundaries:**
   - Motion is strictly communicative: position gains, position drops, payment success.
   - Respect `@media (prefers-reduced-motion: reduce)` on all animated elements.
   - 3D perspective is limited to Hero, Live Spotlight, and marketing illustrations. Prohibited in checkout/payment modals and ranking data tables.
4. **Enforce UX Writing Standards:**
   - Use: "Move Up", "Current Position", "Target Position", "You're now #3", "Continue to Payment".
   - Avoid: "Pay to Win", "Buy #1", "Guaranteed Best".

## Constraints
- Never disguise paid ranking as customer rating or objective quality.
- Never use low-contrast text that violates WCAG 2.2 AA (minimum 4.5:1 ratio).
- Avoid arbitrary spacing or radius outside the design system scale.

## Expected Output
- Responsive, accessible UI components matching `DESIGN.md`.
- Fully functional Light/Dark theme support.

## Relevant Documentation References
- [DESIGN.md](file:///d:/Aage%20online/DESIGN.md)
- [docs/Design.md](file:///d:/Aage%20online/docs/Design.md)
- [docs/PRD.md](file:///d:/Aage%20online/docs/PRD.md)
