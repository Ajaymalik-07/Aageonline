# Design System & Accessibility Rules

## 1. Design Token Integrity
- Always use designated design tokens from `DESIGN.md` for colors, spacing, radius, and elevation.
- Do not introduce arbitrary inline hex codes, ad-hoc pixel paddings, or one-off styles.
- Support both Light and Dark themes natively via semantic CSS variables.

## 2. WCAG 2.2 AA Compliance
- Ensure text contrast meets at least 4.5:1 for standard text and 3:1 for large text.
- Focus-visible rings must never be hidden or removed (`outline: none` without an explicit accessible replacement is forbidden).
- All interactive controls must be operable via keyboard (Tab, Enter, Space, Arrows, Escape).
- Interactive touch targets must meet a minimum size of 44x44px on touch devices.

## 3. 3D and Motion Guardrails
- 3D visual treatments must never obscure critical business data, text readability, or payment actions.
- Motion must communicate actual system changes (e.g. ranking movement, status transitions) rather than purely decorative agitation.
- All animations and transitions must strictly respect `@media (prefers-reduced-motion: reduce)`.
