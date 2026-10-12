import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../../config/site';
import {
  categoryService,
  CategorySummary,
} from '../../data-access/index.ts';
import { CategorySearch } from '../../features/categories-directory/CategorySearch';
import { CategoriesGrid } from '../../features/categories-directory/CategoriesGrid';
import { MarketModelExplanation } from '../../features/markets-directory/MarketModelExplanation';
import { BusinessCTA } from '../../features/markets-directory/BusinessCTA';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Categories Directory — Business Industry Verticals | AageOnline',
  description:
    'Explore transparent business visibility markets by category. Browse published commercial verticals across Indian cities, inspect local ranking ladders, and find regional positioning opportunities.',
  alternates: {
    canonical: `${siteConfig.url}/categories`,
  },
  openGraph: {
    title: 'Categories Directory — Business Industry Verticals | AageOnline',
    description:
      'Explore active commercial categories and verified competitive business ranking ladders across Indian cities.',
    url: `${siteConfig.url}/categories`,
    siteName: siteConfig.name,
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function CategoriesPage() {
  let categories: CategorySummary[] = [];
  let totalCategoryCount = 0;
  let loadError: string | null = null;

  try {
    const [allCategories, countData] = await Promise.all([
      categoryService.getPublishedCategories(),
      categoryService.getPublishedCategoryCount(),
    ]);

    categories = allCategories;
    totalCategoryCount = countData;
  } catch (err: unknown) {
    loadError = err instanceof Error ? err.message : 'Unable to retrieve category data.';
  }

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AageOnline Commercial Categories Directory',
    description:
      'Official public directory of commercial business visibility verticals across India.',
    url: `${siteConfig.url}/categories`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    numberOfItems: categories.length,
    itemListElement: categories.map((cat, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${cat.name} Markets`,
      url: `${siteConfig.url}${cat.publicUrl}`,
    })),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section */}
      <section
        style={{
          backgroundColor: '#071526',
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(234, 88, 12, 0.12) 0%, rgba(7, 21, 38, 0) 70%)',
          color: '#FFFFFF',
          padding: 'clamp(var(--space-10), 6vw, var(--space-14)) 0 clamp(var(--space-8), 4vw, var(--space-10)) 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          {/* Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 14px',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: 'var(--radius-pill)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#EA580C',
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FB923C',
              }}
            >
              Industry Categories Directory • {totalCategoryCount} Active Verticals
            </span>
          </div>

          {/* Heading 1 */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#FFFFFF',
              margin: '0 auto var(--space-4) auto',
              maxWidth: '840px',
            }}
          >
            Explore Business Categories
          </h1>

          {/* Subtitle / Definition for AEO */}
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto var(--space-8) auto',
            }}
          >
            Discover AageOnline markets by business category. Explore industry verticals and find the commercial locations where verified paid-visibility competitive ladders are currently active.
          </p>

          {/* Integrated Search Component */}
          <Suspense fallback={<div style={{ height: '52px' }} />}>
            <CategorySearch categories={categories} />
          </Suspense>
        </div>
      </section>

      {/* 2. Main Directory Grid */}
      <section
        style={{
          padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0',
          backgroundColor: 'var(--bg-page)',
        }}
        aria-labelledby="active-categories-heading"
      >
        <div className="container">
          {/* Section Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div>
              <h2
                id="active-categories-heading"
                style={{
                  fontSize: 'var(--font-size-section)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                All Published Business Categories
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  margin: 'var(--space-1) 0 0 0',
                }}
              >
                Showing verified commercial verticals with active paid-visibility markets.
              </p>
            </div>
          </div>

          {/* Error State */}
          {loadError ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 'var(--space-10) var(--space-6)',
                backgroundColor: 'var(--surface-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                margin: 'var(--space-6) 0',
              }}
              role="alert"
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                We couldn't load categories right now
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  maxWidth: '460px',
                  lineHeight: 1.5,
                  marginBottom: 'var(--space-6)',
                }}
              >
                The category service experienced a connection issue. Please try refreshing or reloading the page.
              </p>
              <a
                href="/categories"
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'var(--brand-deep-emerald)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Try Again
              </a>
            </div>
          ) : (
            <CategoriesGrid categories={categories} />
          )}

          {/* Transparent Regulatory Disclosure */}
          <div
            style={{
              marginTop: 'var(--space-8)',
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <strong>Transparency Notice:</strong> AageOnline business categories represent industry classifications for local and regional markets. Rankings are market-specific (Location + Category) and determined through verified qualification transactions. There are no global or subjective category-wide ratings.
          </div>
        </div>
      </section>

      {/* 3. How the Market Model Works */}
      <MarketModelExplanation />

      {/* 4. Business CTA Banner */}
      <BusinessCTA />
    </div>
  );
}
