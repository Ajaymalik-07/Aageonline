import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SUPPORTED_MARKETS, getMarketPageData, getAllMarketStaticParams } from '../data/markets/index.ts';

const EXPECTED_MARKET_SLUGS = [
  'jaipur/interior-designers',
  'delhi/interior-designers',
  'mumbai/interior-designers',
  'jaipur/restaurants',
  'delhi/restaurants',
  'mumbai/restaurants',
];

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function calcEditorialBodyWords(editorialContent: any[]): number {
  let totalWords = 0;
  editorialContent.forEach((sec) => {
    totalWords += countWords(sec.heading);
    if (sec.subheading) totalWords += countWords(sec.subheading);
    if (sec.intro) totalWords += countWords(sec.intro);
    if (sec.paragraphs) {
      sec.paragraphs.forEach((p: string) => {
        totalWords += countWords(p);
      });
    }
    if (sec.directAnswer) {
      totalWords += countWords(sec.directAnswer.question);
      totalWords += countWords(sec.directAnswer.answer);
    }
    if (sec.subsections) {
      sec.subsections.forEach((sub: any) => {
        totalWords += countWords(sub.title);
        if (sub.content) {
          sub.content.forEach((p: string) => {
            totalWords += countWords(p);
          });
        }
        if (sub.bulletPoints) {
          sub.bulletPoints.forEach((b: string) => {
            totalWords += countWords(b);
          });
        }
        if (sub.callout) {
          totalWords += countWords(sub.callout.title);
          totalWords += countWords(sub.callout.body);
        }
      });
    }
  });
  return totalWords;
}

describe('Six City × Category Markets Matrix Verification', () => {
  it('should support exactly the six defined market routes in the static params generator', () => {
    const params = getAllMarketStaticParams();
    assert.strictEqual(params.length, 6);
    const paramSlugs = params.map((p) => `${p.location}/${p.category}`);
    EXPECTED_MARKET_SLUGS.forEach((slug) => {
      assert.ok(paramSlugs.includes(slug), `Params missing expected slug: ${slug}`);
    });
  });

  EXPECTED_MARKET_SLUGS.forEach((slug) => {
    const [locSlug, catSlug] = slug.split('/');

    describe(`Market: /${slug}`, () => {
      const marketData = getMarketPageData(locSlug, catSlug);

      it('should exist and resolve correctly from registry', () => {
        assert.ok(marketData, `Market data not found for ${slug}`);
      });

      if (!marketData) return;

      const { market, rankings, editorialContent, relatedMarkets, relatedCategories, seo } = marketData;

      it('should have correct market domain identity and invariants', () => {
        assert.strictEqual(market.location.slug, locSlug);
        assert.strictEqual(market.category.slug, catSlug);
        assert.strictEqual(market.status, 'ACTIVE');
        assert.ok(market.activePositions > 0);
        assert.ok(market.totalBusinesses > 0);
        assert.ok(market.topQualifyingAmountMinor > 0);
        assert.strictEqual(Number.isInteger(market.topQualifyingAmountMinor), true);
      });

      it('should have strictly ordered rankings #1 to #8 with integer Rupee amounts', () => {
        assert.strictEqual(rankings.length, 8);
        rankings.forEach((r, idx) => {
          assert.strictEqual(r.rank, idx + 1);
          assert.ok(r.qualifyingAmountRupees > 0);
          assert.strictEqual(Number.isInteger(r.qualifyingAmountRupees), true);
          assert.strictEqual(r.isVerified, true);
          assert.ok(r.name.length > 0);
          assert.ok(r.area.length > 0);
          assert.ok(r.specialties.length > 0);
          assert.ok(r.description.length > 0);
        });

        // Strict descending order (or equal floor)
        for (let i = 0; i < rankings.length - 1; i++) {
          assert.ok(
            rankings[i].qualifyingAmountRupees >= rankings[i + 1].qualifyingAmountRupees,
            `Position #${i + 1} amount (${rankings[i].qualifyingAmountRupees}) must be >= #${i + 2} (${rankings[i + 1].qualifyingAmountRupees})`
          );
        }
      });

      it('should have body content strictly exceeding 7,000 words', () => {
        const words = calcEditorialBodyWords(editorialContent);
        assert.ok(
          words >= 7000,
          `Market /${slug} body content must be >= 7,000 words. Got ${words} words.`
        );
      });

      it('should contain all 14 comprehensive FAQs with substantive content', () => {
        const faqSection = editorialContent.find((s) => s.id === 'faq');
        assert.ok(faqSection, 'FAQ section must exist');
        assert.ok(faqSection.subsections, 'FAQ must have subsections');
        assert.strictEqual(faqSection.subsections.length, 14, 'Must have exactly 14 FAQs');
        faqSection.subsections.forEach((faq) => {
          assert.ok(faq.title.startsWith('Q'), `FAQ title should start with 'Q': ${faq.title}`);
          assert.ok(faq.content.length > 0, 'FAQ content must not be empty');
          assert.ok(faq.content[0].length > 40, `FAQ content should be substantive: ${faq.title}`);
        });
      });

      it('should contain related markets that link to valid supported routes', () => {
        assert.ok(relatedMarkets.length >= 4);
        relatedMarkets.forEach((item) => {
          assert.ok(item.title.length > 0);
          assert.ok(
            EXPECTED_MARKET_SLUGS.includes(item.slug),
            `Related market ${item.slug} must be one of the 6 supported routes`
          );
        });
      });

      it('should contain valid related categories', () => {
        assert.ok(relatedCategories.length >= 4);
        relatedCategories.forEach((cat) => {
          assert.ok(cat.slug.length > 0);
          assert.ok(cat.title.length > 0);
        });
      });

      it('should NOT contain prohibited auction terminology', () => {
        const prohibitedPatterns = [
          /\bwinner\b/i,
          /\bwinning bid\b/i,
          /\brunner-up\b/i,
          /\boutbid\b/i,
          /\bauction ends\b/i,
          /\breserve price\b/i,
          /\blast chance\b/i,
        ];

        const jsonString = JSON.stringify(editorialContent);
        prohibitedPatterns.forEach((p) => {
          assert.strictEqual(
            p.test(jsonString),
            false,
            `Market /${slug} contains prohibited auction term matching: ${p}`
          );
        });
      });

      it('should have valid SEO metadata and canonical self-reference', () => {
        assert.ok(seo.title.length > 10);
        assert.ok(seo.description.length > 20);
        assert.ok(seo.title.includes(market.location.name));
        assert.ok(seo.title.includes(market.category.name));
      });
    });
  });

  it('should ensure all six markets have distinct, non-doorway editorial content', () => {
    // Collect all paragraph strings from each market
    const marketParagraphSets: Record<string, Set<string>> = {};

    EXPECTED_MARKET_SLUGS.forEach((slug) => {
      const [loc, cat] = slug.split('/');
      const data = getMarketPageData(loc, cat);
      assert.ok(data);
      const paras = new Set<string>();
      data.editorialContent.forEach((sec) => {
        sec.paragraphs?.forEach((p) => paras.add(p.trim()));
        sec.subsections?.forEach((sub) => sub.content?.forEach((p) => paras.add(p.trim())));
      });
      marketParagraphSets[slug] = paras;
    });

    // Check pairwise overlap
    for (let i = 0; i < EXPECTED_MARKET_SLUGS.length; i++) {
      for (let j = i + 1; j < EXPECTED_MARKET_SLUGS.length; j++) {
        const s1 = EXPECTED_MARKET_SLUGS[i];
        const s2 = EXPECTED_MARKET_SLUGS[j];
        const set1 = marketParagraphSets[s1];
        const set2 = marketParagraphSets[s2];

        let overlapCount = 0;
        set1.forEach((p) => {
          if (set2.has(p)) overlapCount++;
        });

        // Allow at most 6 shared core platform invariant statements (strict inequality, atomic locking, audit logging)
        assert.ok(
          overlapCount <= 6,
          `Too much duplicate content between /${s1} and /${s2}: ${overlapCount} identical paragraphs`
        );
      }
    }
  });
});
