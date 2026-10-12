import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../config/site.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

describe('UI & Navigation Consistency Regression Suite (Milestone 0.20.7 & 0.20.8)', () => {
  it('should verify canonical URLs in siteConfig', () => {
    assert.strictEqual(siteConfig.links.claim, '/business/claim');
    assert.strictEqual(siteConfig.links.howItWorks, '/#how-it-works');
    assert.strictEqual(siteConfig.links.trust, '/#trust');

    const publicHrefs = siteConfig.nav.public.map((item) => item.href);
    assert.ok(publicHrefs.includes('/business/claim'));
    assert.ok(publicHrefs.includes('/#how-it-works'));
    assert.ok(publicHrefs.includes('/#trust'));
    assert.ok(publicHrefs.includes('/markets'));

    const businessHrefs = siteConfig.nav.business.map((item) => item.href);
    assert.ok(businessHrefs.includes('/business/dashboard'));
    assert.ok(businessHrefs.includes('/business/dashboard/ranking-history'));
    assert.ok(businessHrefs.includes('/business/dashboard/markets'));
    assert.ok(businessHrefs.includes('/business/dashboard/notifications'));
  });

  it('should verify Next.js configuration defines canonical 308 redirects', async () => {
    const nextConfigFile = path.join(frontendDir, 'next.config.ts');
    assert.ok(fs.existsSync(nextConfigFile), 'next.config.ts must exist');

    const content = fs.readFileSync(nextConfigFile, 'utf-8');
    assert.ok(content.includes("source: '/claim'"));
    assert.ok(content.includes("destination: '/business/claim'"));
    assert.ok(content.includes("source: '/how-it-works'"));
    assert.ok(content.includes("destination: '/#how-it-works'"));
    assert.ok(content.includes("source: '/trust'"));
    assert.ok(content.includes("destination: '/#trust'"));
    assert.ok(content.includes("source: '/explore'"));
    assert.ok(content.includes("destination: '/markets'"));
  });

  it('should verify admin pages do not render duplicate Header or Footer components', () => {
    const adminPages = [
      path.join(frontendDir, 'app', 'admin', 'page.tsx'),
      path.join(frontendDir, 'app', 'admin', 'operations', 'page.tsx'),
      path.join(frontendDir, 'app', 'admin', 'discovery', 'page.tsx'),
    ];

    for (const pagePath of adminPages) {
      assert.ok(fs.existsSync(pagePath), `Admin page ${pagePath} must exist`);
      const content = fs.readFileSync(pagePath, 'utf-8');
      assert.ok(!content.includes('<Header'), `Page ${pagePath} must not render <Header`);
      assert.ok(!content.includes('<Footer'), `Page ${pagePath} must not render <Footer`);
      assert.ok(!content.includes('<main'), `Page ${pagePath} must not contain nested <main> landmark`);
    }
  });

  it('should verify businesses/[business] page respects single main landmark invariant', () => {
    const businessPage = path.join(frontendDir, 'app', 'businesses', '[business]', 'page.tsx');
    const loadingPage = path.join(frontendDir, 'app', 'businesses', '[business]', 'loading.tsx');

    assert.ok(fs.existsSync(businessPage));
    const content = fs.readFileSync(businessPage, 'utf-8');
    assert.ok(!content.includes('<main'), 'businesses/[business]/page.tsx must not contain nested <main>');

    assert.ok(fs.existsSync(loadingPage));
    const loadingContent = fs.readFileSync(loadingPage, 'utf-8');
    assert.ok(!loadingContent.includes('<main'), 'businesses/[business]/loading.tsx must not contain nested <main>');
  });

  it('should verify WorkspaceNav uses semantic nav tag instead of header', () => {
    const workspaceNavFile = path.join(frontendDir, 'app', 'business', 'dashboard', 'WorkspaceNav.tsx');
    assert.ok(fs.existsSync(workspaceNavFile));

    const content = fs.readFileSync(workspaceNavFile, 'utf-8');
    assert.ok(content.includes('<nav'), 'WorkspaceNav must use <nav>');
    assert.ok(content.includes('aria-label="Workspace Navigation"'), 'WorkspaceNav must have descriptive aria-label');
    assert.ok(!content.includes('<header'), 'WorkspaceNav must not introduce nested <header> landmark');
  });

  it('should verify global styles eliminate forbidden animations and 3D effects', () => {
    const globalsCss = path.join(frontendDir, 'app', 'globals.css');
    assert.ok(fs.existsSync(globalsCss));

    const content = fs.readFileSync(globalsCss, 'utf-8');
    assert.ok(!content.includes('@keyframes livePulse'), 'Must not define pulsing keyframe animation');
    assert.ok(!content.includes('@keyframes marqueeScroll'), 'Must not define marquee keyframe animation');
    assert.ok(!content.includes('rotateX('), 'Must not use 3D tilt rotations in perspective-tilt');
    assert.ok(!content.includes('rotateY('), 'Must not use 3D tilt rotations in perspective-tilt');
    assert.ok(!content.includes('translateY(-4px)'), 'Must not use bouncy hover translation on cards');
  });

  it('should verify Homepage sections define expected anchor landmarks', () => {
    const howItWorksFile = path.join(frontendDir, 'features', 'process', 'HowItWorksJourney.tsx');
    const trustFile = path.join(frontendDir, 'features', 'trust', 'TrustGovernance.tsx');

    assert.ok(fs.existsSync(howItWorksFile));
    const howContent = fs.readFileSync(howItWorksFile, 'utf-8');
    assert.ok(howContent.includes('id="how-it-works"'), 'HowItWorksJourney must have id="how-it-works"');
    assert.ok(!howContent.includes('isAutoPlaying'), 'HowItWorksJourney must not have auto-playing carousel');

    assert.ok(fs.existsSync(trustFile));
    const trustContent = fs.readFileSync(trustFile, 'utf-8');
    assert.ok(trustContent.includes('id="trust"'), 'TrustGovernance must have id="trust"');
  });
});
