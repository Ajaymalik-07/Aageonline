'use client';

import React from 'react';

interface GuideItem {
  id: string;
  tag: string;
  title: string;
  readTime: string;
  excerpt: string;
  slug: string;
}

const GUIDES: GuideItem[] = [
  {
    id: 'g-1',
    tag: 'Market Strategy',
    title: 'Local Positioning vs. Broad Advertising: The Defined Market Edge',
    readTime: '4 min read',
    excerpt:
      'Why competing inside exactly one Location + Category pair delivers transparent commercial reach without pay-per-click wastage.',
    slug: 'local-positioning-vs-broad-advertising',
  },
  {
    id: 'g-2',
    tag: 'Ladder Mechanics',
    title: 'Navigating Position Floors: How Qualifying Calculations Supercede Incumbents',
    readTime: '6 min read',
    excerpt:
      'A deep dive into atomic transaction locking, strict minimum increments (+₹1.00), and avoiding displacement down the ladder.',
    slug: 'navigating-position-floors',
  },
  {
    id: 'g-3',
    tag: 'Trust & Compliance',
    title: 'Why Transparent Paid Visibility Builds Enduring Consumer Trust',
    readTime: '5 min read',
    excerpt:
      'Understanding the ethics of clear statutory disclosure and why honest commercial labeling outperforms hidden algorithmic bias.',
    slug: 'why-transparent-paid-visibility-builds-trust',
  },
];

export const KnowledgeGuides: React.FC = () => {
  return (
    <section className="container" aria-label="AageOnline Knowledge and Guides">
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-emerald)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Insights &amp; Architecture
          </span>

          <h2
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            AageOnline <span style={{ color: 'var(--brand-emerald)' }}>Knowledge</span>
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Guides on local visibility, competitive mechanics, and market governance.
          </p>
        </div>

        <a
          href="/knowledge"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--brand-emerald)',
            textDecoration: 'none',
          }}
        >
          View All Guides →
        </a>
      </div>

      {/* 3-Card Editorial Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {GUIDES.map((guide) => (
          <article
            key={guide.id}
            className="card-lift"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px',
            }}
          >
            <div>
              {/* Meta Tag & Read Time */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    color: 'var(--brand-emerald)',
                  }}
                >
                  {guide.tag}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {guide.readTime}
                </span>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.3,
                  marginBottom: 'var(--space-3)',
                }}
              >
                {guide.title}
              </h3>

              {/* Excerpt */}
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {guide.excerpt}
              </p>
            </div>

            {/* Read Link */}
            <a
              href={`/knowledge/${guide.slug}`}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--brand-emerald)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: 'var(--space-4)',
              }}
            >
              Read Full Article →
            </a>
          </article>
        ))}
      </div>
    </section>
  );
};
