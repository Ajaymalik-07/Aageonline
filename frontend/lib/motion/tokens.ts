/**
 * AageOnline — Authoritative Motion Tokens & Interaction System
 * Milestone 0.20.15: Complete Website-Wide Motion, Hover & Interaction System
 *
 * Implements restrained, accessible, WCAG 2.2 AA compliant motion tokens:
 * - Micro-interactions (140ms): button press, icon shifts, active feedback
 * - Fast component transitions (180ms): hover elevation, border highlights, color transitions
 * - Standard transitions (260ms): card elevations, dialogs, tab switches
 * - Section reveals (380ms): viewport entrance fades with subtle translation
 * - Deliberate transitions (450ms): complex state changes, accordion expansions
 * - Stagger interval (60ms): sequential card/list item entrance delay
 */

export const MOTION_DURATIONS = {
  instant: '120ms',
  micro: '140ms',
  fast: '180ms',
  normal: '260ms',
  reveal: '380ms',
  deliberate: '450ms',
  expressive: '650ms',
  stagger: '60ms',
} as const;

export const MOTION_DURATIONS_MS = {
  instant: 120,
  micro: 140,
  fast: 180,
  normal: 260,
  reveal: 380,
  deliberate: 450,
  expressive: 650,
  stagger: 60,
} as const;

export const MOTION_EASINGS = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
} as const;

export const MOTION_TRANSLATIONS = {
  micro: '2px',
  cardHover: '-2px',
  buttonPress: '1px',
  reveal: '12px',
} as const;

export const MOTION_ELEVATION = {
  subtle: 'translateY(-1px)',
  card: 'translateY(-2px)',
  pressed: 'translateY(1px)',
} as const;

export function getStaggerDelay(index: number, maxItems = 5, stepMs = 60): number {
  return Math.min(index, maxItems) * stepMs;
}

export type MotionIntensity = 'marketing' | 'dashboard' | 'transaction' | 'admin';

export const MOTION_INTENSITY_CONFIG: Record<
  MotionIntensity,
  {
    intensity: 'rich' | 'focused' | 'lightweight' | 'minimal';
    scrollReveals: boolean;
    cardElevationOnHover: boolean;
    buttonScaleOnActive: boolean;
    staggerDelayMs: number;
  }
> = {
  marketing: {
    intensity: 'rich',
    scrollReveals: true,
    cardElevationOnHover: true,
    buttonScaleOnActive: true,
    staggerDelayMs: 60,
  },
  dashboard: {
    intensity: 'focused',
    scrollReveals: false,
    cardElevationOnHover: true,
    buttonScaleOnActive: true,
    staggerDelayMs: 40,
  },
  transaction: {
    intensity: 'lightweight',
    scrollReveals: false,
    cardElevationOnHover: false,
    buttonScaleOnActive: false,
    staggerDelayMs: 0,
  },
  admin: {
    intensity: 'minimal',
    scrollReveals: false,
    cardElevationOnHover: false,
    buttonScaleOnActive: false,
    staggerDelayMs: 0,
  },
};


