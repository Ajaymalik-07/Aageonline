'use client';

import React from 'react';

interface KnowledgeItem {
  id: string;
  tag: string;
  type: 'Guide' | 'Question' | 'Glossary' | 'Market Insight';
  title: string;
  readTime: string;
  excerpt: string;
  slug: string;
}

const FEATURED_GUIDE: KnowledgeItem = {
  id: 'featured-1',
  tag: 'Market Architecture',
  type: 'Guide',
  title: 'Local Positioning vs. Broad Advertising: The Defined Market Edge',
  readTime: '5 min read',
  excerpt:
    'Why competing inside exactly one Location + Category pair delivers transparent commercial reach without pay-per-click wastage or opaque ad auction budgets.',
  slug: 'local-positioning-vs-broad-advertising',
};

const SECONDARY_ITEMS: KnowledgeItem[] = [
  {
    id: 'k-1',
    tag: 'Ladder Mechanics',
    type: 'Market Insight',
    title: 'Navigating Position Floors: How Qualifying Calculations Supersede Incumbents',
    readTime: '4 min read',
    excerpt:
      'A deep dive into atomic transaction locking, strict minimum increments (+₹1.00), and avoiding displacement down the ladder.',
    slug: 'navigating-position-floors',
  },
  {
    id: 'k-2',
    tag: 'Platform FAQ',
    type: 'Question',
    title: 'Does a higher paid visibility position certify business quality?',
    readTime: '3 min read',
    excerpt:
      'No. Paid visibility is strictly commercial positioning. Transparent statutory disclosures ensure consumers evaluate businesses independently.',
    slug: 'does-paid-visibility-certify-quality',
  },
  {
    id: 'k-3',
    tag: 'Governance',
    type: 'Glossary',
    title: 'Glossary: Qualifying Payment, Discrete Market, and Immutable Position History',
    readTime: '3 min read',
    excerpt:
      'Core definitions of non-negotiable architectural terms governing AageOnline transactions, row-level locks, and rankings.',
    slug: 'aageonline-core-glossary',
  },
];

export const KnowledgeGuides: React.FC = () => {
  return (
    <section
      aria-label="AageOnline Knowledge and Editorial Guides"
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--brand-emerald)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Editorial Knowledge &amp; Guidance
            </span>

            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                margin: 0,
              }}
            >
              AageOnline <span style={{ color: 'var(--brand-emerald)' }}>Knowledge</span>
            </h2>

            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
              Essential insights on local positioning, qualifying mechanics, and marketplace governance.
            </p>
          </div>

          <a
            href="/knowledge"
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--brand-emerald)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Explore Full Knowledge Base →
          </a>
        </div>

        {/* Probid-Inspired Asymmetric Editorial Rhythm (Featured Guide on Left + Stacked Items on Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'stretch',
          }}
        >
          {/* Left: Large Featured Guide Card */}
          <article
            className="card-lift"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Visual Header Artwork Banner */}
            <div
              style={{
                height: '220px',
                background: 'linear-gradient(135deg, #0b1f3b 0%, #064e3b 50%, #059669 100%)',
                position: 'relative',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(199, 240, 0, 0.25)',
                    color: 'var(--brand-lime)',
                    border: '1px solid rgba(199, 240, 0, 0.4)',
                  }}
                >
                  FEATURED GUIDE
                </span>

                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                  {FEATURED_GUIDE.readTime}
                </span>
              </div>

              {/* Decorative Vector Graphic Shape */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px' }}>📐</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--brand-lime)',
                  }}
                >
                  Competitive Market Theory
                </span>
              </div>
            </div>

            {/* Featured Article Body */}
            <div
              style={{
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--brand-emerald)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  {FEATURED_GUIDE.tag}
                </span>

                <h3
                  style={{
                    fontSize: 'clamp(20px, 2.5vw, 24px)',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {FEATURED_GUIDE.title}
                </h3>

                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    margin: 0,
                  }}
                >
                  {FEATURED_GUIDE.excerpt}
                </p>
              </div>

              <a
                href={`/knowledge/${FEATURED_GUIDE.slug}`}
                style={{
                  marginTop: 'var(--space-6)',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--brand-emerald)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'fit-content',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                Read Featured Guide →
              </a>
            </div>
          </article>

          {/* Right: Stacked Column of 3 Editorial Formats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {SECONDARY_ITEMS.map((item) => (
              <article
                key={item.id}
                className="card-lift"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--elevation-1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor:
                          item.type === 'Question'
                            ? 'rgba(245, 158, 11, 0.12)'
                            : item.type === 'Glossary'
                            ? 'rgba(11, 31, 59, 0.08)'
                            : 'rgba(5, 150, 105, 0.12)',
                        color:
                          item.type === 'Question'
                            ? 'var(--color-warning)'
                            : item.type === 'Glossary'
                            ? 'var(--brand-deep-navy)'
                            : 'var(--brand-emerald)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {item.tag}
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.readTime}
                  </span>
                </div>

                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.3,
                    margin: '4px 0 2px 0',
                  }}
                >
                  {item.title}
                </h4>

                <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                  {item.excerpt}
                </p>

                <a
                  href={`/knowledge/${item.slug}`}
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--brand-emerald)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '6px',
                  }}
                >
                  Read Entry →
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
