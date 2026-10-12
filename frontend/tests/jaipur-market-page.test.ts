import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  JAIPUR_INTERIOR_DESIGNERS_MARKET,
  JAIPUR_INTERIOR_DESIGNERS_RANKINGS,
  RELATED_JAIPUR_MARKETS,
  RELATED_CATEGORIES,
} from '../data/markets/jaipur-interior-designers.ts';
import { JAIPUR_EDITORIAL_CONTENT } from '../data/markets/jaipur-interior-designers-content.ts';

describe('Jaipur Interior Designers Market Page Verification', () => {
  it('should have correct market domain identity and invariants', () => {
    assert.strictEqual(JAIPUR_INTERIOR_DESIGNERS_MARKET.location.slug, 'jaipur');
    assert.strictEqual(JAIPUR_INTERIOR_DESIGNERS_MARKET.category.slug, 'interior-designers');
    assert.strictEqual(JAIPUR_INTERIOR_DESIGNERS_MARKET.status, 'ACTIVE');
    assert.ok(JAIPUR_INTERIOR_DESIGNERS_MARKET.activePositions > 0);
    assert.ok(JAIPUR_INTERIOR_DESIGNERS_MARKET.totalBusinesses > 0);
    assert.ok(JAIPUR_INTERIOR_DESIGNERS_MARKET.topQualifyingAmountMinor > 0);
  });

  it('should have strictly ordered rankings #1 to #8 with integer minor amounts', () => {
    assert.strictEqual(JAIPUR_INTERIOR_DESIGNERS_RANKINGS.length, 8);
    JAIPUR_INTERIOR_DESIGNERS_RANKINGS.forEach((rank, index) => {
      assert.strictEqual(rank.rank, index + 1);
      assert.ok(rank.qualifyingAmountRupees > 0);
      assert.strictEqual(Number.isInteger(rank.qualifyingAmountRupees), true);
      assert.strictEqual(rank.isVerified, true);
      assert.ok(rank.name.length > 0);
      assert.ok(rank.area.length > 0);
      assert.ok(rank.specialties.length > 0);
    });

    // Positions should be descending in qualifying amount
    for (let i = 0; i < JAIPUR_INTERIOR_DESIGNERS_RANKINGS.length - 1; i++) {
      assert.ok(
        JAIPUR_INTERIOR_DESIGNERS_RANKINGS[i].qualifyingAmountRupees >=
          JAIPUR_INTERIOR_DESIGNERS_RANKINGS[i + 1].qualifyingAmountRupees,
        `Position ${i + 1} should be >= position ${i + 2}`
      );
    }
  });

  it('should have editorial content exceeding 7,000 words strictly in body content', () => {
    function countWords(str: string): number {
      return str.trim().split(/\s+/).filter(Boolean).length;
    }

    let totalWords = 0;
    JAIPUR_EDITORIAL_CONTENT.forEach((sec) => {
      totalWords += countWords(sec.heading);
      if (sec.subheading) totalWords += countWords(sec.subheading);
      if (sec.intro) totalWords += countWords(sec.intro);
      sec.paragraphs.forEach((p) => {
        totalWords += countWords(p);
      });
      if (sec.directAnswer) {
        totalWords += countWords(sec.directAnswer.question);
        totalWords += countWords(sec.directAnswer.answer);
      }
      if (sec.subsections) {
        sec.subsections.forEach((sub) => {
          totalWords += countWords(sub.title);
          sub.content.forEach((p) => {
            totalWords += countWords(p);
          });
          if (sub.bulletPoints) {
            sub.bulletPoints.forEach((b) => {
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

    // Content must strictly exceed 7,000 words
    assert.ok(
      totalWords >= 7000,
      `Expected total body words to be >= 7000, got ${totalWords}`
    );
  });

  it('should contain all 14 comprehensive FAQs in the FAQ section', () => {
    const faqSection = JAIPUR_EDITORIAL_CONTENT.find((sec) => sec.id === 'faq');
    assert.ok(faqSection, 'FAQ section should exist');
    assert.ok(faqSection.subsections, 'FAQ section should contain subsections');
    assert.strictEqual(faqSection.subsections.length, 14);
    faqSection.subsections.forEach((faq) => {
      assert.ok(faq.title.startsWith('Q'), 'FAQ question title should start with Q');
      assert.ok(faq.content.length > 0, 'FAQ answer should not be empty');
      assert.ok(faq.content[0].length > 50, 'FAQ answer should be substantive');
    });
  });

  it('should contain related markets and categories with valid relative slugs', () => {
    assert.ok(RELATED_JAIPUR_MARKETS.length >= 4);
    RELATED_JAIPUR_MARKETS.forEach((item) => {
      assert.ok(/^[a-z]+\/[a-z-]+$/.test(item.slug), `Slug should match location/category format: ${item.slug}`);
      assert.ok(item.title.length > 0);
    });

    assert.ok(RELATED_CATEGORIES.length >= 4);
    RELATED_CATEGORIES.forEach((item) => {
      assert.ok(item.slug.length > 0);
      assert.ok(item.title.length > 0);
    });
  });

  it('should NOT contain prohibited auction terms in marketing or editorial content', () => {
    const prohibitedWords = [
      /\bwinner\b/i,
      /\bwinning bid\b/i,
      /\brunner-up\b/i,
      /\boutbid\b/i,
    ];

    const allContent = JSON.stringify(JAIPUR_EDITORIAL_CONTENT);
    prohibitedWords.forEach((pattern) => {
      assert.strictEqual(
        pattern.test(allContent),
        false,
        `Forbidden auction term matched by pattern ${pattern}`
      );
    });
  });
});
