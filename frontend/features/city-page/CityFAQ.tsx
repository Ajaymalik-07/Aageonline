import React from 'react';
import type { LocationSummary, MarketSummary } from '../../data-access/types.ts';

interface CityFAQProps {
  location: LocationSummary;
  markets: MarketSummary[];
}

export function CityFAQ({ location, markets }: CityFAQProps) {
  const categoryNames = markets.map((m) => m.categoryName).join(', ');

  const faqs = [
    {
      question: `What commercial markets are currently active in ${location.name}?`,
      answer: `Currently, ${location.name} has ${markets.length} verified commercial ${
        markets.length === 1 ? 'market' : 'markets'
      }: ${categoryNames || 'active commercial verticals'}. Each market represents a dedicated competitive ladder for verified businesses operating within ${location.name}.`,
    },
    {
      question: `How are rankings determined in ${location.name} markets?`,
      answer: `Rankings on AageOnline represent transparent paid visibility positions (#1, #2, #3, etc.) determined purely through audited qualification transactions on the market ladder. Positions reflect financial visibility commitment rather than subjective editorial opinions or consumer reviews.`,
    },
    {
      question: `Can my business qualify for a position in ${location.name}?`,
      answer: `Yes. Any legitimate, verified business with operational presence in ${location.name} and operating within a published industry category can review the market's qualification floor and submit a bid to secure a ranked visibility tier.`,
    },
    {
      question: `How are new commercial categories introduced in ${location.name}?`,
      answer: `New categories are created and published through AageOnline's dynamic taxonomy pipeline. If your business operates in an unlisted vertical in ${location.name}, you can submit a discovery request to prioritize its creation on the platform.`,
    },
  ];

  return (
    <section
      aria-labelledby="city-faq-heading"
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
            id="city-faq-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {location.name} Market Governance & Participation FAQ
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
