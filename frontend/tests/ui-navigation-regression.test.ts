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
    assert.ok((publicHrefs as readonly string[]).includes('/#markets') || (publicHrefs as readonly string[]).includes('/markets'));

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
    const homePageFile = path.join(frontendDir, 'app', 'page.tsx');
    const liveMarketsFile = path.join(frontendDir, 'features', 'markets', 'LiveMarketsCarousel.tsx');
    const headerFile = path.join(frontendDir, 'components', 'layout', 'Header.tsx');

    assert.ok(fs.existsSync(howItWorksFile));
    const howContent = fs.readFileSync(howItWorksFile, 'utf-8');
    assert.ok(howContent.includes('id="how-it-works"'), 'HowItWorksJourney must have id="how-it-works"');
    assert.ok(!howContent.includes('isAutoPlaying'), 'HowItWorksJourney must not have auto-playing carousel');

    assert.ok(fs.existsSync(trustFile));
    const trustContent = fs.readFileSync(trustFile, 'utf-8');
    assert.ok(trustContent.includes('id="trust"'), 'TrustGovernance must have id="trust"');

    assert.ok(fs.existsSync(liveMarketsFile));
    const marketsContent = fs.readFileSync(liveMarketsFile, 'utf-8');
    assert.ok(marketsContent.includes('id="markets"'), 'LiveMarketsCarousel must have id="markets"');

    assert.ok(fs.existsSync(homePageFile));
    const homeContent = fs.readFileSync(homePageFile, 'utf-8');
    assert.ok(homeContent.includes('id="categories"'), 'HomePage must define id="categories"');
    assert.ok(homeContent.includes('id="cities"'), 'HomePage must define id="cities"');

    const rankingsSpotlightFile = path.join(frontendDir, 'features', 'spotlight', 'CompetitiveSpotlight.tsx');
    assert.ok(fs.existsSync(rankingsSpotlightFile));
    const spotlightContent = fs.readFileSync(rankingsSpotlightFile, 'utf-8');
    assert.ok(spotlightContent.includes('id="rankings"'), 'CompetitiveSpotlight must have id="rankings"');

    assert.ok(fs.existsSync(headerFile));
    const headerContent = fs.readFileSync(headerFile, 'utf-8');
    assert.ok(headerContent.includes('#markets'), 'Header must contain #markets anchor');
    assert.ok(headerContent.includes('#categories'), 'Header must contain #categories anchor');
    assert.ok(headerContent.includes('#cities'), 'Header must contain #cities anchor');
    assert.ok(headerContent.includes('#rankings'), 'Header must contain #rankings anchor');
    assert.ok(headerContent.includes('Live Rankings'), 'Header must contain Live Rankings navigation link');
    assert.ok(headerContent.includes('#how-it-works'), 'Header must contain #how-it-works anchor');
    assert.ok(headerContent.includes('#trust'), 'Header must contain #trust anchor');
  });

  it('should verify Milestone 0.20.29: Legal & grievance routes exist with statutory disclosures', () => {
    const privacyPage = path.join(frontendDir, 'app', 'privacy', 'page.tsx');
    const termsPage = path.join(frontendDir, 'app', 'terms', 'page.tsx');
    const grievancePage = path.join(frontendDir, 'app', 'grievance', 'page.tsx');

    assert.ok(fs.existsSync(privacyPage), '/privacy page must exist');
    assert.ok(fs.existsSync(termsPage), '/terms page must exist');
    assert.ok(fs.existsSync(grievancePage), '/grievance page must exist');

    const privacyContent = fs.readFileSync(privacyPage, 'utf-8');
    assert.ok(privacyContent.includes('Zero Cardholder Data Storage Invariant'), 'Privacy must state zero cardholder data storage');
    assert.ok(privacyContent.includes('privacy@aageonline.in'), 'Privacy must define privacy officer email');

    const termsContent = fs.readFileSync(termsPage, 'utf-8');
    assert.ok(termsContent.includes('Payment Finality') && termsContent.includes('No-Refund'), 'Terms must state payment finality invariant');
    assert.ok(termsContent.includes('Statutory Disclosure') || termsContent.includes('Paid Visibility'), 'Terms must disclose paid visibility');

    const grievanceContent = fs.readFileSync(grievancePage, 'utf-8');
    assert.ok(grievanceContent.includes('Rule 5(2) of the Information Technology'), 'Grievance must cite IT Rules 2021');
    assert.ok(grievanceContent.includes('grievance@aageonline.in'), 'Grievance must specify contact email');
    assert.ok(grievanceContent.includes('48 Hours') || grievanceContent.includes('48 hours'), 'Grievance must state 48h acknowledgment SLA');
  });

  it('should verify Milestone 0.20.29: Footer links to legal pages and blog', () => {
    const footerFile = path.join(frontendDir, 'components', 'layout', 'Footer.tsx');
    assert.ok(fs.existsSync(footerFile));
    const content = fs.readFileSync(footerFile, 'utf-8');

    assert.ok(content.includes('href="/privacy"'), 'Footer must link to /privacy');
    assert.ok(content.includes('href="/terms"'), 'Footer must link to /terms');
    assert.ok(content.includes('href="/grievance"'), 'Footer must link to /grievance');
    assert.ok(content.includes('href="/blog"'), 'Footer must link to /blog');
  });

  it('should verify Milestone 0.20.29: Knowledge base links redirect and KnowledgeGuides uses real blog slugs', () => {
    const nextConfigFile = path.join(frontendDir, 'next.config.ts');
    const nextContent = fs.readFileSync(nextConfigFile, 'utf-8');
    assert.ok(nextContent.includes("source: '/knowledge'"), 'next.config.ts must redirect /knowledge');
    assert.ok(nextContent.includes("destination: '/blog'"), 'next.config.ts destination must be /blog');

    const knowledgeGuidesFile = path.join(frontendDir, 'features', 'knowledge', 'KnowledgeGuides.tsx');
    assert.ok(fs.existsSync(knowledgeGuidesFile));
    const kgContent = fs.readFileSync(knowledgeGuidesFile, 'utf-8');

    assert.ok(!kgContent.includes('href="/knowledge"'), 'KnowledgeGuides must not link to /knowledge');
    assert.ok(!kgContent.includes('href={`/knowledge/'), 'KnowledgeGuides must not link to /knowledge/[slug]');
    assert.ok(kgContent.includes('href="/blog"'), 'KnowledgeGuides must link to /blog');
    assert.ok(kgContent.includes('startup-website-development-complete-guide'), 'Must link to real article slug');
    assert.ok(kgContent.includes('custom-software-development-vs-off-the-shelf-software'), 'Must link to real article slug');
  });

  it('should verify Milestone 0.20.29: CategoryRail links to canonical /categories/[slug]', () => {
    const categoryRailFile = path.join(frontendDir, 'features', 'categories', 'CategoryRail.tsx');
    assert.ok(fs.existsSync(categoryRailFile));
    const railContent = fs.readFileSync(categoryRailFile, 'utf-8');

    assert.ok(!railContent.includes('/explore?category='), 'CategoryRail must not use /explore?category=');
    assert.ok(railContent.includes('href={`/categories/${cat.slug}`}'), 'CategoryRail must link to /categories/${cat.slug}');
  });

  it('should verify Milestone 0.20.29: Featured and footer markets contain only published markets', () => {
    const marketsConfigFile = path.join(frontendDir, 'config', 'markets.ts');
    assert.ok(fs.existsSync(marketsConfigFile));
    const marketsContent = fs.readFileSync(marketsConfigFile, 'utf-8');

    assert.ok(marketsContent.includes('SUPPORTED_MARKETS'), 'INITIAL_FEATURED_MARKETS must derive from SUPPORTED_MARKETS');
    assert.ok(!marketsContent.includes('noida/restaurants'), 'Must not contain unseeded noida/restaurants');
    assert.ok(!marketsContent.includes('hisar/hospitals'), 'Must not contain unseeded hisar/hospitals');

    const footerFile = path.join(frontendDir, 'components', 'layout', 'Footer.tsx');
    const footerContent = fs.readFileSync(footerFile, 'utf-8');
    assert.ok(!footerContent.includes('/noida/restaurants'), 'Footer must not link to unpublished noida/restaurants');
    assert.ok(!footerContent.includes('/hisar/hospitals'), 'Footer must not link to unpublished hisar/hospitals');
    assert.ok(footerContent.includes('/jaipur/interior-designers'), 'Footer must link to jaipur/interior-designers');
    assert.ok(footerContent.includes('/delhi/interior-designers'), 'Footer must link to delhi/interior-designers');
    assert.ok(footerContent.includes('/mumbai/interior-designers'), 'Footer must link to mumbai/interior-designers');
  });

  it('should verify Milestone 0.20.29: No internal link href="/claim" or href="/explore" remains in features', () => {
    const heroFile = path.join(frontendDir, 'features', 'hero', 'HeroSection.tsx');
    const heroContent = fs.readFileSync(heroFile, 'utf-8');
    assert.ok(!heroContent.includes('href="/claim"'), 'HeroSection must not have href="/claim"');
    assert.ok(!heroContent.includes('href="/explore"'), 'HeroSection must not have href="/explore"');
    assert.ok(heroContent.includes('href="/business/claim"'), 'HeroSection must have href="/business/claim"');
    assert.ok(heroContent.includes('href="/markets"'), 'HeroSection must have href="/markets"');

    const bannerFile = path.join(frontendDir, 'features', 'cta', 'BusinessCtaBanner.tsx');
    const bannerContent = fs.readFileSync(bannerFile, 'utf-8');
    assert.ok(!bannerContent.includes('href="/claim"'), 'BusinessCtaBanner must not have href="/claim"');
    assert.ok(!bannerContent.includes('href="/explore"'), 'BusinessCtaBanner must not have href="/explore"');

    const businessCTAFile = path.join(frontendDir, 'features', 'markets-directory', 'BusinessCTA.tsx');
    const businessCTAContent = fs.readFileSync(businessCTAFile, 'utf-8');
    assert.ok(!businessCTAContent.includes('href="/claim"'), 'BusinessCTA must not have href="/claim"');
    assert.ok(!businessCTAContent.includes('href="/how-it-works"'), 'BusinessCTA must use canonical /#how-it-works');
  });
});
