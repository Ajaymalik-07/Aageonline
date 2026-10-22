# AageOnline — Motion & Interaction System Specification

> **Milestone:** 0.20.15 — Complete Website-Wide Motion, Hover & Interaction System  
> **Brand:** AageOnline — Get Seen. Get Ahead.  
> **Status:** Production-Ready & Verified  
> **Conformance:** WCAG 2.2 AA Accessible / Zero Layout Shift (CLS = 0)  

---

## 1. Executive Summary & Design-Lock Invariants

Milestone 0.20.15 establishes an authoritative, website-wide motion and interaction system for AageOnline while strictly honoring the **CRITICAL DESIGN-LOCK REQUIREMENT**:

- **Zero Redesign:** Every existing page layout, section hierarchy, content copy, brand token, responsive breakpoint, and spacing structure is 100% preserved.
- **Restrained Motion:** Enhances existing elements through subtle micro-interactions, viewport-aware section reveals, and state-transition feedback without large-scale 3D transformations, parallax, continuous loops, or scroll hijacking.
- **Zero Layout Shifts (CLS = 0):** Animations are strictly confined to GPU-composited `transform` (translations $\le 12\text{px}$ for reveals, $\le 2\text{px}$ for hovers) and `opacity`. Width, height, margin, and padding are never animated.
- **Universal Reduced-Motion Support:** Full compliance with `prefers-reduced-motion: reduce` across both CSS custom properties and client React hooks.

---

## 2. Authoritative Motion Tokens

All motion tokens are defined in [`frontend/lib/motion/tokens.ts`](file:///d:/Aage%20online/frontend/lib/motion/tokens.ts) and synchronized with CSS custom properties in [`frontend/app/globals.css`](file:///d:/Aage%20online/frontend/app/globals.css):

### 2.1 Duration Scale

| Token | Milliseconds | CSS Variable | Semantic Application |
| :--- | :--- | :--- | :--- |
| `instant` | `120ms` | `--motion-instant` | Tooltips, keyboard focus rings, active press resets |
| `micro` | `140ms` | `--motion-duration-micro` | Button press, icon nudges, toggle switches |
| `fast` | `180ms` | `--motion-duration-fast` | Hover elevations, link color changes, badge shifts |
| `normal` | `260ms` | `--motion-duration-normal` | Card lifts, modal backdrop fades, tab transitions |
| `reveal` | `380ms` | `--motion-duration-reveal` | Viewport scroll reveals, section entrances |
| `deliberate` | `450ms` | `--motion-duration-deliberate` | Accordion panels, state feedback banners |
| `stagger` | `60ms` | `--motion-stagger-step` | Delay between consecutive items in lists or grids |

### 2.2 Easing Curves

```css
/* Natural ease-out for entering elements and hover elevations */
--motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);

/* Balanced ease-in-out for expandable panels and toggles */
--motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Restrained spring for micro-press button feedback */
--motion-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 2.3 Elevation Distances

```typescript
export const MOTION_ELEVATION = {
  subtle:  'translateY(-1px)',  // Primary buttons, list rows
  card:    'translateY(-2px)',  // Interactive market and business cards
  pressed: 'translateY(1px)',   // Active mouse press / button click
} as const;
```

---

## 3. Reusable Motion Components & Primitives

All motion primitives reside in [`frontend/components/motion/`](file:///d:/Aage%20online/frontend/components/motion/):

### 3.1 `MotionReveal`
- **Location:** [`frontend/components/motion/MotionReveal.tsx`](file:///d:/Aage%20online/frontend/components/motion/MotionReveal.tsx)
- **Role:** Viewport-triggered entrance component using native `IntersectionObserver`.
- **Behavior:**
  - Triggers **exactly once** and automatically unobserves the DOM node to eliminate scroll overhead.
  - Defaults to `threshold: 0.1` and `rootMargin: '0px 0px -40px 0px'`.
  - Polymorphic via the `as` prop (`div`, `section`, `article`, etc.), preserving semantic HTML.
  - Automatically renders in the revealed state during SSR and when `prefers-reduced-motion: reduce` is active.

### 3.2 `StaggerContainer`
- **Location:** [`frontend/components/motion/StaggerContainer.tsx`](file:///d:/Aage%20online/frontend/components/motion/StaggerContainer.tsx)
- **Role:** Coordinates staggered entrance delays across children.
- **Behavior:**
  - Wraps each child in a `MotionReveal` with delay calculated by `getStaggerDelay(index, maxItems = 6, step = 60ms)`.
  - Caps maximum delay at 300ms to keep page scanning rapid.
  - Immediately zeroes delays when reduced motion is preferred.

### 3.3 `useReducedMotion`
- **Location:** [`frontend/components/motion/useReducedMotion.ts`](file:///d:/Aage%20online/frontend/components/motion/useReducedMotion.ts)
- **Role:** Client hook detecting OS/browser reduced-motion settings.
- **Behavior:**
  - Safely handles SSR (`typeof window === 'undefined'`).
  - Listens to media query changes in real time and updates React state instantly.

---

## 4. Shared Interactive Component Polish

### 4.1 Buttons (`.aage-button`)
- **Hover:** `translateY(-1px)`, subtle orange glow `box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2)`.
- **Active / Pressed:** `translateY(1px) scale(0.99)`.
- **Focus:** 3px outline with high-contrast accent ring (`var(--accent-focus)`).
- **Loading:** In-place spinning circle (`@keyframes spin`), maintaining layout width and disabling pointer events.
- **Accessibility:** 44px minimum touch target enforced across all sizes.

### 4.2 Interactive Cards (`.aage-card-interactive`, `.card-lift`)
- **Hover:** `translateY(-2px)`, elevated elevation shadow (`var(--elevation-3)`).
- **Active:** `translateY(0)`.
- **Constraints:** Applied only to interactive cards (links and selectable items). Static informational panels remain motionless.

### 4.3 Form Inputs (`.aage-input`)
- **Focus:** Smooth border color shift to `var(--brand-emerald)` with `0 0 0 3px rgba(234, 88, 12, 0.16)`.
- **Validation:** Error state immediately outlines in `var(--color-danger)` without jumping or moving layout.

### 4.4 Navigation Links (`.aage-nav-link`)
- **Hover:** Smooth background tint to `var(--surface-card)` with coral color shift.
- **Active:** Subtle `scale(0.98)` feedback.

### 4.5 Modals & Dialogs (`.aage-modal-backdrop`, `.aage-bid-modal-content`)
- **Backdrop:** Smooth `fadeIn` (180ms ease-out).
- **Dialog Surface:** `scaleIn` (from `scale(0.97) translateY(4px)` to `scale(1) translateY(0)`).

### 4.6 Accordions (`FaqAccordion`)
- **Trigger:** Rotating `+` icon to `45deg` (180ms ease-out).
- **Panel Expansion:** Restrained `fadeIn` with clean border highlight.

---

## 5. Experience-Specific Motion Intensity

AageOnline categorizes routes into four distinct experience tiers:

```
┌────────────────────────────────────────────────────────┐
│ 1. Public Marketing & Discovery: Rich Experience       │
│    - Hero entrances, subtle section reveals, card lift │
├────────────────────────────────────────────────────────┤
│ 2. Business Dashboard: Focused & Dense                 │
│    - Fast micro-interactions, zero scroll reveals      │
├────────────────────────────────────────────────────────┤
│ 3. Financial & Bid Flows: Lightweight & Trust-First    │
│    - Explicit status transitions, zero marketing flair │
├────────────────────────────────────────────────────────┤
│ 4. Platform Administration: Minimal & Immediate        │
│    - Instant feedback, high information density        │
└────────────────────────────────────────────────────────┘
```

| Tier | Target Routes | Scroll Reveals | Card Lift | Micro Press | Focus |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Marketing** | `/`, `/[location]`, `/[location]/[category]`, `/markets`, `/categories`, `/businesses` | ✅ Yes | ✅ Yes | ✅ Yes | Discovery, engagement, trust |
| **Dashboard** | `/business/dashboard`, `/business/dashboard/ranking-history`, `/business/dashboard/markets`, `/business/dashboard/notifications` | ❌ No | ✅ Yes | ✅ Yes | Efficiency, clarity, ranking history |
| **Transaction** | `/business/claim`, `BidModal`, Payment confirmation dialogs | ❌ No | ❌ No | ❌ No | Accuracy, verified amounts, trust |
| **Admin** | `/admin`, `/admin/operations`, `/admin/discovery` | ❌ No | ❌ No | ❌ No | Speed, diagnostic density |

---

## 6. Route-by-Route Motion Coverage Matrix

Audited from the complete Next.js route build (70 static, dynamic, and administrative routes):

| Route | Category | Components Covered | Motion Patterns | Reduced Motion Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Marketing | `HeroSection`, `CategoryRail`, `FeaturedMarketsShuffle`, `FaqAccordion`, `BusinessCtaBanner` | Section reveals, `.aage-button`, `.card-lift`, accordion fade | Instant display, transforms disabled |
| `/[location]` | Marketing | Location header, category grid, market cards | Staggered cards, `.card-lift`, `.aage-button` | Instant display |
| `/[location]/[category]` | Reference Market | `MarketHero`, `CurrentMarketRanking`, `MarketLadderVisual`, `BusinessesInMarket`, `MarketFAQSection`, `MarketCTA` | Table row hover, ladder pill hover, CTA button press | Instant display |
| `/markets` | Directory | Market search input, market cards grid | `.aage-input` focus, `.card-lift`, tag filters | Instant display |
| `/categories` | Directory | Category cards, icon badges | `.card-lift`, `.aage-button` | Instant display |
| `/categories/[category]` | Directory | Category detail header, location market ladder | Card lift, filter button transitions | Instant display |
| `/businesses` | Directory | Business cards list, search filter | `.aage-input`, `.aage-card-interactive` | Instant display |
| `/businesses/[business]` | Detail | Verified claim banner, market position card, CTA | Position badge highlight, `.aage-button` | Instant display |
| `/business/claim` | Onboarding | Claim form inputs, verification steps | `.aage-input` focus, submit spinner | Instant display |
| `/business/dashboard` | Workspace | Metrics cards, current ranking summary | Fast card hover, refresh icon spin | Instant display |
| `/business/dashboard/ranking-history` | Workspace | Append-only history table, position change indicators | Row hover highlight, audit timestamp tooltip | Instant display |
| `/business/dashboard/markets` | Workspace | Active market list, bid initiation triggers | Button press, status badge pulse | Instant display |
| `/business/dashboard/notifications` | Workspace | Notification items, mark-as-read buttons | Item fade-out, button press | Instant display |
| `/business/dashboard/profile` | Workspace | Profile edit inputs, save button | `.aage-input`, `.aage-button` | Instant display |
| `/auth/login` | Auth | Email/password inputs, login submit button | Form validation fade, spinner on submit | Instant display |
| `/admin` | Admin | System status cards, quick nav links | Fast link hover | Instant display |
| `/admin/operations` | Admin | Reconciler trigger buttons, audit logs table | Button spinner on action | Instant display |
| `/admin/discovery` | Admin | Market discovery requests table, approve buttons | Button spinner on approve | Instant display |
| `BidModal` | Financial Modal | Positioning slider, qualifying quote card, PayU action | Backdrop fade, dialog scale-in | Instant display |

---

## 7. Accessibility & Reduced-Motion Invariants

AageOnline satisfies **WCAG 2.2 AA** motion requirements:

1. **Global CSS Suppression:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       transition-delay: 0ms !important;
       scroll-behavior: auto !important;
       transform: none !important;
     }
     .card-lift:hover,
     .aage-card-interactive:hover,
     .aage-button:hover,
     .aage-button:active,
     .aage-ranking-card:hover,
     .aage-nav-link:active {
       transform: none !important;
     }
     .aage-motion-reveal {
       opacity: 1 !important;
       transform: none !important;
       transition: none !important;
     }
   }
   ```
2. **Keyboard Focus Integrity:** Visible focus rings (`3px solid var(--accent-focus)`) are never hidden by motion transitions.
3. **No Continuous Motion:** No infinite auto-scrolling, blinking text, or distracting background animations.
4. **Touch Device Usability:** Hover effects do not hold critical information; all features remain operable via touch.
5. **No Visual Manipulation:** Ranking numbers (#1, #2, #3), qualifying amounts, and payment statuses are rendered as raw text values, never masked or delayed by decorative animations.

---

## 8. Verification & Test Evidence

### 8.1 Automated Test Execution
- **Test File:** [`frontend/tests/motion-and-interaction-system.test.ts`](file:///d:/Aage%20online/frontend/tests/motion-and-interaction-system.test.ts)
- **Suite Results:**
  ```text
  ▶ Motion & Interaction System Test Suite (Milestone 0.20.15)
    ✔ 1. Shared Motion Tokens & Constraints (5 subtests passed)
    ✔ 2. Global CSS Motion System Invariants (5 subtests passed)
    ✔ 3. Reusable Motion Components & Hook Architecture (3 subtests passed)
    ✔ 4. Interactive Shared Component Coverage (6 subtests passed)
    ✔ 5. Preservation of Existing Routes & Layout Structure (2 subtests passed)
  ✔ Motion & Interaction System Test Suite (21 tests passed, 0 failed)
  ```
- **Full Repository Suite:** 563 passed, 0 failed, 6 skipped (live PostgreSQL tests deferred).

### 8.2 Production Build & Typecheck
- **TypeScript:** `tsc --noEmit` executed with 0 errors.
- **Next.js Production Build:** `next build` executed with 0 errors across all 70 static and dynamic routes.
- **Bundle Impact:** Reused native CSS and React primitives. Zero third-party motion libraries (Framer Motion, GSAP) added. Bundle size remained identical.

---

## 9. Maintenance & Guidelines for Future Milestones

1. **Always use standard motion classes:** When creating new components, attach `.aage-button`, `.aage-card-interactive`, or `.aage-input` rather than writing ad-hoc transition rules.
2. **Never animate layout geometry:** Never transition `width`, `height`, `margin`, or `padding`. Use `transform: scale()` or `transform: translateY()` exclusively.
3. **Keep transaction interfaces still:** Financial payment screens must prioritize readability and immediate confirmation over visual motion.
