import React from 'react';
import type { CategorySummary, MarketSummary } from '../../data-access/types.ts';

interface CategoryFAQProps {
  category: CategorySummary;
  markets: MarketSummary[];
}

export function CategoryFAQ({ category, markets }: CategoryFAQProps) {
  const cityNames = Array.from(new Set(markets.map((m) => m.cityName))).join(', ');

  const faqs = [
    {
      question: `What is the ${category.name} category on AageOnline?`,
      answer: `The ${category.name} category represents a dedicated commercial industry classification on AageOnline. Rather than operating as a nationwide leaderboard, it groups independent competitive visibility ladders across specific geographic municipal markets.`,
    },
    {
      question: `How are ${category.name} markets organized across cities?`,
      answer: `Each city operates its own independent market (e.g. ${cityNames || 'local municipal markets'}). Rankings and qualification floors in one city do not affect positions in any other jurisdiction.`,
    },
    {
      question: `Why does each city have a separate ${category.name} market?`,
      answer: `Commercial visibility is inherently regional. Consumers hire and interact with businesses locally. AageOnline defines each market strictly as Location + Category to provide transparent local competition rather than meaningless national aggregations.`,
    },
    {
      question: `Does a higher paid visibility position mean a ${category.name} business is objectively better?`,
      answer: `No. All positions (#1, #2, #3, etc.) on AageOnline represent transparent paid competitive visibility. They reflect a business's verified financial qualification on the market ladder, and do not constitute an editorial endorsement, quality guarantee, or consumer satisfaction rating.`,
    },
  ];

  return (
    <section
      aria-labelledby="category-faq-heading"
      style={{
        padding: 'var(--space-12) 0',
        backgroundColor: 'var(--surface-subtle)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <span
            style={{
              fontSize: 'var(--font-size-eyebrow)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-deep-emerald)',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            Frequently Asked Questions
          </span>
          <h2
            id="category-faq-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {category.name} Market Structure & Governance FAQ
          </h2>
        </div>

        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                padding: 'var(--space-5) var(--space-6)',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--space-2) 0',
                  lineHeight: 1.4,
                }}
              >
                {faq.question}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
