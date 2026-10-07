# AageOnline — Design System Implementation Specification

> **Brand:** AageOnline  
> **Tagline:** Get Seen. Get Ahead.  
> **Authoritative Baseline:** [docs/Design.md](file:///d:/Aage%20online/docs/Design.md)  
> **Accessibility Standard:** WCAG 2.2 AA Compliant  

---

## 1. Visual Identity & Brand Foundations

AageOnline merges high-trust business discovery with dynamic, competitive positioning. The interface must look modern, energetic, clean, and distinctively premium while ensuring complete transparency. Paid visibility must be instantly understandable and never masqueraded as objective editorial quality.

### Color Tokens

#### Brand Palette
```css
--brand-deep-emerald: #064E3B; /* High-contrast baseline and dark brand surfaces */
--brand-emerald:      #059669; /* Primary actions, verified badges, affirmative status */
--brand-teal:         #10B981; /* Interactive accents, hover states, ranking gains */
--brand-lime:         #C7F000; /* Vibrant competitive spotlights, position callouts */
--brand-deep-navy:    #0B1F3B; /* Primary typography, contrast anchors, deep background */
```

#### Light Theme Semantics
```css
--bg-page:            #F8FAFC; /* Neutral cool background */
--surface-card:       #FFFFFF; /* Elevated components and table rows */
--surface-raised:     #FFFFFF; /* Modals, popovers, floating overlays */
--border-subtle:      #E2E8F0; /* Row separators, card borders */
--border-strong:      #CBD5E1; /* Interactive component borders */
--text-primary:       #0B1F3B; /* Deep Navy - AA compliant on white/light gray */
--text-secondary:     #64748B; /* Slate gray supporting copy */
--text-muted:         #94A3B8; /* Disclaimers, inactive timestamps */
--action-primary:     #059669; /* Primary button background */
--action-hover:       #047857; /* Hover for emerald action */
--accent-focus:       #10B981; /* 2px solid visible focus ring */
--badge-spotlight:    #C7F000; /* Lime tag for high-visibility market spotlight */
```

#### Dark Theme Semantics
Dark mode uses a layered Deep Navy hierarchy instead of flat black or simple inversion:
```css
--dark-bg-page:       #071324; /* Deepest Navy canvas */
--dark-surface-card:  #0B1F3B; /* Standard card/row container */
--dark-surface-raised:#112B50; /* Modals, elevated cards, dropdowns */
--dark-border-subtle: #1E3A5F; /* Subtle panel borders */
--dark-border-strong: #2D4E7B; /* Interactive borders */
--dark-text-primary:  #F8FAFC; /* Clean off-white */
--dark-text-secondary:#94A3B8; /* Cool slate muted text */
--dark-text-muted:    #64748B; /* De-emphasized notes */
--dark-action-primary:#10B981; /* High-contrast teal for dark mode CTA */
--dark-action-hover:  #059669; /* Emerald hover in dark mode */
--dark-accent-focus:  #C7F000; /* Lime outline for high-contrast dark focus ring */
```

---

## 2. Typography, Spacing & Elevation

### Typography
- **Font Family:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Base Size:** `16px` | **Base Line Height:** `1.5` | **Base Weight:** `400`
- **Scale:**
  - `text-xs`: `12px` (Line height: `16px`) — Badges, table meta, position changes
  - `text-sm`: `14px` (Line height: `20px`) — Form labels, table subtext, disclosure copy
  - `text-md`: `16px` (Line height: `24px`) — Body copy, button text, standard inputs
  - `text-lg`: `18px` (Line height: `28px`) — Card headings, ranking row business names
  - `text-xl`: `20px` (Line height: `28px`) — Modal titles, section subheadings
  - `text-2xl`: `24px` (Line height: `32px`) — Section titles, dashboard cards
  - `text-3xl`: `30px` (Line height: `36px`) — Major market page titles
  - `text-4xl`: `40px` (Line height: `44px`) — Hero headlines
  - `text-5xl`: `52px` (Line height: `56px`) — Marketing display headers

### Spacing System (4px Base Grid)
| Token | Value | Primary Usage |
|---|---|---|
| `space-1` | `4px` | Fine badge padding, icon gap |
| `space-2` | `8px` | Button padding inline, item spacing |
| `space-3` | `12px` | Form field padding, compact card gaps |
| `space-4` | `16px` | Standard element spacing, card padding |
| `space-5` | `20px` | Table row padding, modal inline margins |
| `space-6` | `24px` | Grid gutters, container spacing |
| `space-8` | `32px` | Section layout gaps |
| `space-10` | `48px` | Subsection division |
| `space-12` | `64px` | Page block vertical separation |

### Border Radius
- `radius-sm`: `8px` (Form fields, sub-badges, dropdown items)
- `radius-md`: `12px` (Standard cards, ranking row elements)
- `radius-lg`: `16px` (Featured spotlight containers, modal dialogs)
- `radius-xl`: `24px` (Hero containers, promo banners)
- `radius-pill`: `9999px` (Position badges, pill tags, primary action pills)

### Elevation & Shadows
- `elevation-1`: `0 1px 3px rgba(11, 31, 59, 0.08)` (Subtle row boundaries)
- `elevation-2`: `0 4px 6px -1px rgba(11, 31, 59, 0.1), 0 2px 4px -2px rgba(11, 31, 59, 0.06)` (Cards)
- `elevation-3`: `0 10px 15px -3px rgba(11, 31, 59, 0.12), 0 4px 6px -4px rgba(11, 31, 59, 0.08)` (Floating ranking cards, spotlight)
- `elevation-4`: `0 20px 25px -5px rgba(11, 31, 59, 0.18)` (Modals & transactional dialogs)

---

## 3. Motion & Controlled 3D Language

### Motion Tokens
```css
--motion-instant:    120ms ease-out; /* Micro-interactions (toggle, checkbox) */
--motion-fast:       180ms ease-out; /* Button hover, tooltip appearance */
--motion-normal:     280ms cubic-bezier(0.16, 1, 0.3, 1); /* Modal open, card hover, row shift */
--motion-slow:       450ms cubic-bezier(0.16, 1, 0.3, 1); /* Ranking list reordering */
--motion-expressive: 650ms cubic-bezier(0.16, 1, 0.3, 1); /* Spotlight entry, celebratory confirmation */
```

### Motion Semantics
Motion is not decorative fluff—it communicates real platform events:
- **Position Gain:** Subtle upward spring translation with teal border highlight.
- **Position Drop:** Smooth glide downward when another business overtakes position.
- **Payment Success:** Crisp checkmark reveal and atomic transition into position view.

### Accessibility: `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Controlled 3D Guidelines
3D effects (depth tilting, subtle perspective layering, isometric market badges) are strictly regulated:
- **Allowed Contexts:**
  - Hero section visual header
  - Live Spotlight cards on homepage
  - Perspective depth on ranking milestone cards
  - Marketing illustrations
- **Strict Restrictions:**
  - ❌ Never reduce typography contrast or text readability.
  - ❌ Never obscure critical data or buttons.
  - ❌ Never use 3D tilting or perspective distortion in the checkout or payment flow.
  - ❌ Never introduce heavy canvas/WebGL bundles that degrade mobile performance.

---

## 4. Component Requirements & Lifecycle States

Every interactive component across Public, Workspace, and Admin surfaces must specify the complete set of states:

### Mandatory State Matrix
1. **Default:** Stable, accessible, clearly delineated bounds.
2. **Hover:** Predictable elevation/color shift (`--motion-fast`). Pointer cursor.
3. **Focus-Visible:** Mandatory 2px solid ring (`--brand-teal` or `--dark-accent-focus`) with 2px offset. Focus indicators must never be hidden (`outline: none` without replacement is forbidden).
4. **Active:** Pressed scale (`transform: scale(0.98)`), instantaneous feedback.
5. **Disabled:** Reduced opacity (0.5), `cursor: not-allowed`, inert to pointer/keyboard events, aria-disabled="true".
6. **Loading:** Accessible spinner or skeleton, aria-busy="true", preserve dimensions to prevent layout shifts.
7. **Error:** Clear crimson/coral border (`#EF4444`), descriptive error text with `role="alert"`.
8. **Success:** Affirmative emerald confirmation state.

### Device & Interaction Modalities
- **Keyboard Behavior:** Full Tab, Enter, Space, and Arrow navigation. ESC dismisses overlays.
- **Pointer & Touch:** Minimum 44x44px touch target on mobile viewports.
- **Responsive & Overflow:** Defensive layout handling. Truncate long business names with accessible tooltips; never break card boundaries.
- **Empty States:** Provide clear copy, guidance on how to participate, and affirmative CTAs.

---

## 5. Domain-Specific Component Specifications

### 1. Competitive Ranking Components
- **Ranking Table & Row:**
  - Distinct column hierarchy: Rank Position (`#1`, `#2`), Business Title, Category, Location, Paid Visibility Status (`Sponsored Visibility`), Action Button.
  - Clearly disclose paid ranking: Badged with `Paid Visibility` or `Sponsored Rank`.
  - Display ranking movements clearly: Up arrow (green/teal), down arrow (neutral gray/orange), or new entry badge.
- **Position Badge:**
  - Pill shape with bold numbers. #1 position uses distinctive Deep Emerald with Lime accent. Positions #2–#5 use Teal accents.
- **Target Position Selector:**
  - Interactive ladder showing current position vs. target position with quoted price.
  - Recalculates dynamically: "You are selecting #2 for ₹X. Next position #1 requires ₹Y."

### 2. Payment & Checkout Components
- **Payment Confirmation Dialog:**
  - Unambiguously presents: Business Name, Market (Location + Category), Target Position, Quoted Amount.
  - **Mandatory Disclosure Box:** Explicit statement that payment purchases paid visibility, and previous payments are non-refundable upon future position movement.
  - Explicit CTA: `Continue to Payment` (Avoid deceptive "Buy #1" or "Win Position" language).
  - Explicit States: Initiated, Processing (spinner + polling warning), Confirmed, Failed with retry option.

### 3. Business Workspace & Dashboard Components
- **Current Standing Widget:** High-impact card showing current rank, days at rank, recent outbid alerts.
- **Move Up CTA:** Action-oriented button directing owner to target position selector.
- **Position & Transaction History:** Immutable audit table with timestamp, previous rank, new rank, transaction reference, and receipt link.

### 4. Public Discovery Components
- **Live Spotlight:** Card featuring the most active competitive market with dynamic pulse badge.
- **Market Search & Filter:** Responsive location picker and category autocomplete with clear zero-result empty states.

---

## 6. UX Writing & Anti-Patterns

### Recommended Copy
- "Move Up"
- "Current Position"
- "Target Position"
- "You're now #3"
- "XYZ Studio moved ahead of you"
- "₹X to purchase position #2"
- "Continue to Payment"

### Forbidden Anti-Patterns
- ❌ Do not use "Pay to Win", "Guaranteed Best", or "Top Business Guaranteed".
- ❌ Do not disguise paid ranking as customer satisfaction or objective quality reviews.
- ❌ Do not use deceptive scarcity countdowns or artificial rush timers.
- ❌ Do not hide price changes or sneak in recurring charges.
