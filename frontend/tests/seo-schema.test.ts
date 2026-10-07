import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateWebsiteSchema, generateBreadcrumbSchema, generateMarketRankingSchema } from '../lib/seo/schema.ts';
import { INITIAL_FEATURED_MARKETS } from '../config/markets.ts';

describe('SEO & Structured Data Verification', () => {
  it('should generate valid WebSite JSON-LD schema', () => {
    const schema = generateWebsiteSchema();
    assert.strictEqual(schema['@context'], 'https://schema.org');
    assert.strictEqual(schema['@type'], 'WebSite');
    assert.strictEqual(schema.name, 'AageOnline');
    assert.ok(schema.potentialAction);
  });

  it('should generate valid BreadcrumbList schema', () => {
    const breadcrumbs = [
      { label: 'Home', url: '/' },
      { label: 'Jaipur', url: '/jaipur' },
      { label: 'Interior Designers', url: '/jaipur/interior-designers', isCurrent: true },
    ];
    const schema = generateBreadcrumbSchema(breadcrumbs);
    assert.strictEqual(schema['@type'], 'BreadcrumbList');
    assert.strictEqual(schema.itemListElement.length, 3);
    assert.strictEqual(schema.itemListElement[0].position, 1);
    assert.strictEqual(schema.itemListElement[2].name, 'Interior Designers');
  });

  it('should generate Market ItemList schema with explicit Paid Visibility disclosure', () => {
    const market = INITIAL_FEATURED_MARKETS[0];
    const mockRankings = [
      {
        position: 1,
        businessId: 'biz-1',
        businessName: 'ABC Interiors',
        businessSlug: 'abc-interiors',
        isVerified: true,
        visibilityAmountMinor: 2600000,
        updatedAt: new Date().toISOString(),
      },
    ];

    const schema = generateMarketRankingSchema(market, mockRankings);
    assert.strictEqual(schema['@type'], 'ItemList');
    assert.strictEqual(schema.numberOfItems, 1);

    const firstItem = schema.itemListElement[0].item;
    assert.strictEqual(firstItem['@type'], 'LocalBusiness');
    assert.strictEqual(firstItem.name, 'ABC Interiors');

    // Confirm mandatory paid visibility disclosure in schema properties
    const additionalProps = firstItem.additionalProperty;
    const rankingModelProp = additionalProps.find((p) => p.name === 'RankingModel');
    assert.ok(rankingModelProp);
    assert.strictEqual(rankingModelProp.value, 'Paid Competitive Visibility');

    const qualityDisclosureProp = additionalProps.find((p) => p.name === 'QualityDisclosure');
    assert.ok(qualityDisclosureProp);
    assert.match(qualityDisclosureProp.value, /do not constitute an independent assessment/);
  });
});
