# AageOnline — Design System

## 1. Design Intent

AageOnline must feel modern, premium, energetic, and trustworthy while making competitive visibility and paid position changes immediately understandable.

## 2. Brand

- Product: AageOnline
- Tagline: Get Seen. Get Ahead.
- Primary domain: aageonline.com
- Primary palette: Orange + Coral + Deep Navy
- Foundation: Deep Navy + White / warm neutral surfaces
- Modes: Light and Dark
- Accessibility target: WCAG 2.2 AA

## 3. Design Principles

1. **Clarity before spectacle.**
2. **Competition must be understandable.**
3. **Paid visibility must never masquerade as objective quality.**
4. **Motion should communicate change.**
5. **3D should create depth, not visual noise.**
6. **Public discovery should feel spacious.**
7. **Business workspace should prioritize action and data.**
8. **Admin should prioritize density and operational clarity.**

## 4. Color Tokens

### Brand

```text
brand.primary       = #EA580C  (Orange — high-attention CTAs, #1 badge)
brand.secondary     = #F97316  (Secondary orange — active states, gains)
brand.accent        = #FB923C  (Coral — interactive highlights)
brand.soft-accent   = #FED7AA  (Soft accent — backgrounds, callouts)
brand.deep-navy     = #0B1F33  (Deep Navy — dark surfaces, contrast anchors)
```

### Neutral

```text
neutral.white      = #FFFFFF
neutral.background = #FFF7ED
neutral.secondary  = #64748B
```

> **Note:** Do NOT use the previous emerald/teal/lime palette. All new components must use the orange/coral/navy tokens above.

Semantic tokens must be used by components instead of hard-coded hex values.

## 5. Light Theme

- page background: #FFFFFF
- elevated surface: #FFFFFF
- soft background: #FFF7ED
- primary text: #111827
- secondary text: #64748B
- border: #E5E7EB
- primary action: #EA580C (orange)
- interactive accent: #FB923C (coral)
- highlight / soft accent: #FED7AA

## 6. Dark Theme

Dark mode must use a deep navy/near-black hierarchy rather than simple color inversion.

Recommended semantic structure:

```text
dark.page          = #071018
dark.surface       = #0B1F33
dark.surface-raised= #152C47
dark.text-primary  = #F8FAFC
dark.text-secondary= #94A3B8
dark.border        = #1E3A5F
dark.brand         = #F97316  (orange CTA)
dark.accent        = #FB923C  (coral focus)
```

Orange and coral remain recognizable while maintaining contrast.

## 7. Typography

Primary recommendation:

```text
font.family.primary = Inter
font.family.stack = Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
font.size.base = 16px
font.weight.base = 400
line.height.base = 1.5
```

Suggested scale:

```text
xs   12px
sm   14px
md   16px
lg   18px
xl   20px
2xl  24px
3xl  30px
4xl  40px
5xl  52px
```

Marketing headlines may use larger display sizes when responsive constraints are respected.

## 8. Layout & Grid Tokens

```text
container.max       = 1200px (--container-max)
container.gutter-sm = 16px   (--container-gutter-sm, mobile < 768px)
container.gutter    = 24px   (--container-gutter, tablet 768px+)
container.gutter-lg = 32px   (--container-gutter-lg, desktop 1280px+)

section.padding-y         = clamp(48px, 6vw, 80px) (--section-padding-y)
section.padding-y-compact = clamp(32px, 4vw, 48px) (--section-padding-y-compact)
```

### Layout Invariants
1. **Canonical Alignment:** Every page header, section header, breadcrumb bar, table, and grid aligns with the 1200px canonical `.container`.
2. **Carousel Bleed:** Horizontal scroll tracks (`carousel-bleed-track`) compute left and right padding dynamically (`calc((100% - var(--container-max)) / 2 + ...)`), ensuring the first card starts precisely at the container margin while enabling edge-to-edge touch scrolling.
3. **Reading Constraint:** Long-form prose, FAQ items, and legal disclosures are constrained to `840px` inside the 1200px container for optimal line-length and scannability, never shifting the outer container bounds.

## 9. Spacing Scale

Use a rational 4px-based grid:

```text
space.1  = 4px
space.2  = 8px
space.3  = 12px
space.4  = 16px
space.5  = 20px
space.6  = 24px
space.7  = 28px
space.8  = 32px
space.9  = 36px
space.10 = 40px
space.11 = 44px
space.12 = 48px
space.14 = 56px
space.16 = 64px
space.20 = 80px
space.24 = 96px
```

One-off spacing values should not be introduced without a documented reason.

## 9. Radius

```text
radius.sm = 8px
radius.md = 12px
radius.lg = 16px
radius.xl = 24px
radius.pill = 9999px
```

## 10. Motion

```text
motion.instant = 120ms
motion.fast = 180ms
motion.normal = 280ms
motion.slow = 450ms
motion.expressive = 650ms
```

Motion must respect `prefers-reduced-motion`.

## 11. 3D Language

3D may be used for:

- hero compositions
- floating ranking cards
- spotlight visuals
- promotional illustrations
- layered competitive-position visuals

3D must not reduce readability, obscure controls, or become the dominant visual treatment inside transactional flows.

## 12. Competitive Visibility Components

Required components:

- Live Spotlight
- Ranking Table
- Ranking Row
- Position Badge
- Current Position
- Target Position Selector
- Bid Amount
- Move Up CTA
- Outbid Alert
- Position Change
- Position History
- Payment Confirmation

### Ranking row

Must communicate:

- position
- business identity
- paid visibility amount where appropriate
- movement
- interaction availability
- paid-visibility disclosure

### Position movement

When a business moves from one position to another, the UI should visually communicate the change without making the ranking difficult to scan.

## 13. Payment UI

Payment confirmation must clearly show:

- business
- market
- target position
- amount
- payment status
- paid visibility disclosure
- non-refund explanation where applicable

Success, failure, processing, cancelled, and retry states must be distinct.

## 14. Public vs Workspace vs Admin

### Public
Spacious, visual, discoverable, selective 3D and motion.

### Business workspace
Focused, data-rich, competitive, action-oriented.

### Admin
Dense, operational, table-oriented.

## 15. Component States

Every interactive component must define:

- default
- hover
- focus-visible
- active
- disabled
- loading
- error
- success where relevant

## 16. Accessibility

All interactive controls must be keyboard accessible.

Focus indicators must be visible.

Color must not be the sole carrier of ranking movement, payment state, error, or success.

Touch targets should meet accessible sizing expectations.

Reduced-motion preferences must be respected.

## 17. UX Writing

Preferred:

- Move Up
- Current Position
- Target Position
- You're now #3
- XYZ moved ahead of you
- ₹X to move to #3
- Continue to Payment

Avoid:

- Buy #1
- Pay to Win
- Guaranteed Best
- Highest Payer Wins

## 18. Anti-patterns

Must not:

- disguise paid visibility as objective ranking quality
- use fake urgency
- use deceptive countdowns
- animate critical payment information excessively
- hide price changes
- use inaccessible contrast
- create inconsistent one-off components

## 19. QA Checklist

- Light theme reviewed
- Dark theme reviewed
- Keyboard navigation reviewed
- Focus-visible reviewed
- Contrast reviewed
- Reduced-motion reviewed
- Mobile reviewed
- Ranking movement reviewed
- Payment states reviewed
- Long business names reviewed
- Empty ranking reviewed
- Loading/error states reviewed
