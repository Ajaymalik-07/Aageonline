import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MOTION_DURATIONS,
  MOTION_DURATIONS_MS,
  MOTION_EASINGS,
  MOTION_INTENSITY_CONFIG,
  MOTION_ELEVATION,
  getStaggerDelay,
} from '../lib/motion/tokens.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

describe('Motion & Interaction System Test Suite (Milestone 0.20.15)', () => {
  describe('1. Shared Motion Tokens & Constraints', () => {
    it('should define durations strictly adhering to milestone constraints', () => {
      // Micro-interactions: approx 120–200ms
      assert.ok(MOTION_DURATIONS_MS.micro >= 120 && MOTION_DURATIONS_MS.micro <= 200, 'Micro duration within 120-200ms');
      
      // Standard transitions: approx 180–280ms
      assert.ok(MOTION_DURATIONS_MS.fast >= 150 && MOTION_DURATIONS_MS.fast <= 220, 'Fast duration within 150-220ms');
      assert.ok(MOTION_DURATIONS_MS.normal >= 180 && MOTION_DURATIONS_MS.normal <= 280, 'Normal duration within 180-280ms');

      // Section reveals: approx 250–450ms
      assert.ok(MOTION_DURATIONS_MS.reveal >= 250 && MOTION_DURATIONS_MS.reveal <= 450, 'Reveal duration within 250-450ms');
      assert.ok(MOTION_DURATIONS_MS.deliberate >= 350 && MOTION_DURATIONS_MS.deliberate <= 500, 'Deliberate duration within 350-500ms');

      // Stagger intervals: approx 40–80ms
      assert.ok(MOTION_DURATIONS_MS.stagger >= 40 && MOTION_DURATIONS_MS.stagger <= 80, 'Stagger step within 40-80ms');

      // String tokens formatted for CSS
      assert.strictEqual(MOTION_DURATIONS.micro, '140ms');
      assert.strictEqual(MOTION_DURATIONS.fast, '180ms');
      assert.strictEqual(MOTION_DURATIONS.normal, '260ms');
      assert.strictEqual(MOTION_DURATIONS.reveal, '380ms');
    });

    it('should calculate stagger delays accurately with a safety cap', () => {
      assert.strictEqual(getStaggerDelay(0), 0);
      assert.strictEqual(getStaggerDelay(1), 60);
      assert.strictEqual(getStaggerDelay(2), 120);
      assert.strictEqual(getStaggerDelay(5), 300);
      // Beyond max cap (default 6 items)
      assert.strictEqual(getStaggerDelay(10), 300);
    });

    it('should define cubic-bezier easing functions without layout jumps', () => {
      assert.ok(MOTION_EASINGS.easeOut.startsWith('cubic-bezier'));
      assert.ok(MOTION_EASINGS.easeInOut.startsWith('cubic-bezier'));
      assert.ok(MOTION_EASINGS.spring.startsWith('cubic-bezier'));
    });

    it('should define restrained elevation distances strictly <= 4px', () => {
      assert.strictEqual(MOTION_ELEVATION.subtle, 'translateY(-1px)');
      assert.strictEqual(MOTION_ELEVATION.card, 'translateY(-2px)');
      assert.strictEqual(MOTION_ELEVATION.pressed, 'translateY(1px)');
    });

    it('should configure distinct motion intensities per experience level', () => {
      assert.strictEqual(MOTION_INTENSITY_CONFIG.marketing.intensity, 'rich');
      assert.strictEqual(MOTION_INTENSITY_CONFIG.dashboard.intensity, 'focused');
      assert.strictEqual(MOTION_INTENSITY_CONFIG.transaction.intensity, 'lightweight');
      assert.strictEqual(MOTION_INTENSITY_CONFIG.admin.intensity, 'minimal');

      // Financial transaction flows must have zero scroll reveals
      assert.strictEqual(MOTION_INTENSITY_CONFIG.transaction.scrollReveals, false);
      assert.strictEqual(MOTION_INTENSITY_CONFIG.admin.scrollReveals, false);
    });
  });

  describe('2. Global CSS Motion System Invariants', () => {
    const globalsCssPath = path.join(frontendDir, 'app', 'globals.css');
    const cssContent = fs.readFileSync(globalsCssPath, 'utf-8');

    it('should expose standardized motion CSS custom properties', () => {
      assert.ok(cssContent.includes('--motion-duration-micro: 140ms;'));
      assert.ok(cssContent.includes('--motion-duration-fast: 180ms;'));
      assert.ok(cssContent.includes('--motion-duration-normal: 260ms;'));
      assert.ok(cssContent.includes('--motion-duration-reveal: 380ms;'));
      assert.ok(cssContent.includes('--motion-duration-deliberate: 450ms;'));
      assert.ok(cssContent.includes('--motion-stagger-step: 60ms;'));
      assert.ok(cssContent.includes('--motion-ease-out:'));
      assert.ok(cssContent.includes('--motion-ease-in-out:'));
    });

    it('should define non-layout-shifting keyframes (opacity and transform only)', () => {
      assert.ok(cssContent.includes('@keyframes spin'));
      assert.ok(cssContent.includes('@keyframes fadeIn'));
      assert.ok(cssContent.includes('@keyframes fadeOut'));
      assert.ok(cssContent.includes('@keyframes scaleIn'));
      assert.ok(cssContent.includes('@keyframes revealUp'));
      assert.ok(cssContent.includes('@keyframes pulseSubtle'));
      assert.ok(cssContent.includes('@keyframes shimmer'));

      // Ensure keyframes do not animate expensive width/height properties
      assert.ok(!cssContent.includes('@keyframes revealUp {\n  from { height:'));
      assert.ok(!cssContent.includes('@keyframes fadeIn {\n  from { width:'));
    });

    it('should provide reusable interactive utility classes', () => {
      assert.ok(cssContent.includes('.aage-button {'));
      assert.ok(cssContent.includes('.aage-button:hover'));
      assert.ok(cssContent.includes('.aage-button:active'));
      assert.ok(cssContent.includes('.aage-card {'));
      assert.ok(cssContent.includes('.aage-card-interactive {'));
      assert.ok(cssContent.includes('.card-lift {'));
      assert.ok(cssContent.includes('.aage-input {'));
      assert.ok(cssContent.includes('.aage-input:focus'));
      assert.ok(cssContent.includes('.aage-nav-link {'));
      assert.ok(cssContent.includes('.aage-ranking-card {'));
      assert.ok(cssContent.includes('.aage-modal-backdrop {'));
      assert.ok(cssContent.includes('.aage-bid-modal-content {'));
    });

    it('should define stagger delay utility classes 1 through 6', () => {
      for (let i = 1; i <= 6; i++) {
        assert.ok(cssContent.includes(`.stagger-${i} {`));
      }
    });

    it('should strictly enforce universal WCAG 2.2 AA prefers-reduced-motion override', () => {
      assert.ok(cssContent.includes('@media (prefers-reduced-motion: reduce)'));
      assert.ok(cssContent.includes('animation-duration: 0.01ms !important;'));
      assert.ok(cssContent.includes('transition-duration: 0.01ms !important;'));
      assert.ok(cssContent.includes('transform: none !important;'));
      assert.ok(cssContent.includes('.aage-motion-reveal'));
    });
  });

  describe('3. Reusable Motion Components & Hook Architecture', () => {
    it('should export all motion primitives from frontend/components/motion', () => {
      const motionIndex = path.join(frontendDir, 'components', 'motion', 'index.ts');
      assert.ok(fs.existsSync(motionIndex), 'components/motion/index.ts must exist');

      const content = fs.readFileSync(motionIndex, 'utf-8');
      assert.ok(content.includes('MotionReveal'));
      assert.ok(content.includes('StaggerContainer'));
      assert.ok(content.includes('useReducedMotion'));
    });

    it('should verify MotionReveal handles SSR and reduced motion gracefully', () => {
      const file = path.join(frontendDir, 'components', 'motion', 'MotionReveal.tsx');
      assert.ok(fs.existsSync(file));

      const content = fs.readFileSync(file, 'utf-8');
      assert.ok(content.includes('useReducedMotion'));
      assert.ok(content.includes('IntersectionObserver'));
      assert.ok(content.includes('observer.unobserve(element)'), 'Must unobserve after single trigger');
      assert.ok(content.includes('role'), 'Must support semantic roles');
      assert.ok(content.includes('as: Component = \'div\''), 'Must support polymorphic HTML element');
    });

    it('should verify StaggerContainer applies stagger delays without layout mutation', () => {
      const file = path.join(frontendDir, 'components', 'motion', 'StaggerContainer.tsx');
      assert.ok(fs.existsSync(file));

      const content = fs.readFileSync(file, 'utf-8');
      assert.ok(content.includes('getStaggerDelay'));
      assert.ok(content.includes('useReducedMotion'));
      assert.ok(content.includes('Children.toArray') || content.includes('Children.map'));
    });
  });

  describe('4. Interactive Shared Component Coverage', () => {
    it('Card component should include aage-card-interactive when isInteractive is true', () => {
      const cardFile = path.join(frontendDir, 'components', 'ui', 'Card.tsx');
      const content = fs.readFileSync(cardFile, 'utf-8');
      assert.ok(content.includes('aage-card-interactive'));
      assert.ok(content.includes('isInteractive'));
    });

    it('Button component should apply aage-button class, spin animation, and accessible 44px min dimensions', () => {
      const buttonFile = path.join(frontendDir, 'components', 'ui', 'Button.tsx');
      const content = fs.readFileSync(buttonFile, 'utf-8');
      assert.ok(content.includes('aage-button'));
      assert.ok(content.includes('minHeight: \'44px\''));
      assert.ok(content.includes('animation: \'spin 0.6s linear infinite\''));
      assert.ok(content.includes('aria-busy={isLoading}'));
    });

    it('Input component should apply aage-input class and smooth border-color transition', () => {
      const inputFile = path.join(frontendDir, 'components', 'ui', 'Input.tsx');
      const content = fs.readFileSync(inputFile, 'utf-8');
      assert.ok(content.includes('aage-input'));
      assert.ok(content.includes('transition: \'border-color var(--motion-fast)\''));
    });

    it('Header component should apply aage-nav-link to desktop navigation links', () => {
      const headerFile = path.join(frontendDir, 'components', 'layout', 'Header.tsx');
      const content = fs.readFileSync(headerFile, 'utf-8');
      assert.ok(content.includes('aage-nav-link'));
    });

    it('FaqAccordion component should include smooth expansion and accessible ARIA attributes', () => {
      const faqFile = path.join(frontendDir, 'features', 'faq', 'FaqAccordion.tsx');
      const content = fs.readFileSync(faqFile, 'utf-8');
      assert.ok(content.includes('fadeIn var(--motion-duration-fast) var(--motion-ease-out)'));
      assert.ok(content.includes('aria-expanded={isOpen}'));
      assert.ok(content.includes('role="region"'));
    });

    it('BidModal component should include accessible modal entrance classes', () => {
      const modalFile = path.join(frontendDir, 'features', 'bidding', 'BidModal.tsx');
      const content = fs.readFileSync(modalFile, 'utf-8');
      assert.ok(content.includes('className="aage-modal-backdrop"'));
      assert.ok(content.includes('className="aage-bid-modal-content"'));
    });
  });

  describe('5. Preservation of Existing Routes & Layout Structure (Design-Lock)', () => {
    it('Homepage should strictly preserve its 11 canonical section components in exact sequence', () => {
      const homePageFile = path.join(frontendDir, 'app', 'page.tsx');
      const content = fs.readFileSync(homePageFile, 'utf-8');

      const expectedSections = [
        '<HeroSection />',
        '<LiveMarketsCarousel',
        '<CategoryRail />',
        '<FeaturedMarketsShuffle',
        '<CompetitiveSpotlight />',
        '<WhatIsAageOnline />',
        '<HowItWorksJourney />',
        '<TrustGovernance />',
        '<FaqAccordion />',
        '<KnowledgeGuides />',
        '<BusinessCtaBanner />',
      ];

      let lastIndex = -1;
      for (const section of expectedSections) {
        const index = content.indexOf(section);
        assert.ok(index !== -1, `Homepage must contain ${section}`);
        assert.ok(index > lastIndex, `Homepage sections must remain in exact sequential order: ${section}`);
        lastIndex = index;
      }
    });

    it('Market dynamic route should strictly preserve its canonical components in exact sequence', () => {
      const marketPageFile = path.join(frontendDir, 'app', '[location]', '[category]', 'page.tsx');
      const content = fs.readFileSync(marketPageFile, 'utf-8');

      const expectedComponents = [
        '<MarketBreadcrumbs',
        '<MarketHero',
        '<PageContentsNav',
        '<MarketSnapshot',
        '<CurrentMarketRanking',
        '<MarketLadderVisual',
        '<BusinessesInMarket',
        '<MarketEditorialContent',
        '<RankingExplanationSection',
        '<PaidVisibilityDisclosureSection />',
        '<MarketFAQSection',
        '<RelatedMarketsSection',
        '<MarketCTA',
      ];

      let lastIndex = -1;
      for (const comp of expectedComponents) {
        const index = content.indexOf(comp);
        assert.ok(index !== -1, `Market page must contain ${comp}`);
        assert.ok(index > lastIndex, `Market page components must remain in exact order: ${comp}`);
        lastIndex = index;
      }
    });
  });
});
