import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../../config/site';
import {
  marketService,
  locationService,
  categoryService,
  MarketSummary,
} from '../../data-access/index.ts';
import { MarketSearch } from '../../features/markets-directory/MarketSearch';
import { MarketFilters } from '../../features/markets-directory/MarketFilters';
import { MarketsGrid } from '../../features/markets-directory/MarketsGrid';
import { ExploreLocations } from '../../features/markets-directory/ExploreLocations';
import { ExploreCategories } from '../../features/markets-directory/ExploreCategories';
import { MarketModelExplanation } from '../../features/markets-directory/MarketModelExplanation';
import { BusinessCTA } from '../../features/markets-directory/BusinessCTA';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Markets Directory — Commercial Visibility Rankings | AageOnline',
  description:
    'Browse transparent competitive visibility markets across India. Search active Location + Category markets, view published ranking ladders, and discover local positioning opportunities.',
  alternates: {
    canonical: `${siteConfig.url}/markets`,
  },
  openGraph: {
    title: 'Markets Directory — Commercial Visibility Rankings | AageOnline',
    description:
      'Search and browse transparent, competitive business visibility markets across Indian cities and industry verticals.',
    url: `${siteConfig.url}/markets`,
    siteName: siteConfig.name,
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface MarketsPageProps {
  searchParams: Promise<{
    location?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function MarketsPage({ searchParams }: MarketsPageProps) {
  const resolvedParams = await searchParams;
  const locationParam = resolvedParams?.location?.toLowerCase().trim();
  const categoryParam = resolvedParams?.category?.toLowerCase().trim();
  const pageParam = parseInt(resolvedParams?.page || '1', 10);
  const page = isNaN(pageParam) ? 1 : pageParam;

  let markets: MarketSummary[] = [];
  let totalMarketCount = 0;
  let locations: Awaited<ReturnType<typeof locationService.getPublishedLocations>> = [];
  let categories: Awaited<ReturnType<typeof categoryService.getPublishedCategories>> = [];
  let loadError: string | null = null;

  try {
    // Parallel data retrieval via typed domain services
    const [locationsData, categoriesData, countData, marketsResponse] = await Promise.all([
      locationService.getPublishedLocations(),
      categoryService.getPublishedCategories(),
      marketService.getPublishedMarketCount(),
      marketService.getPublishedMarkets({
        locationSlug: locationParam,
        categorySlug: categoryParam,
        page,
        pageSize: 50,
      }),
    ]);

    locations = locationsData;
    categories = categoriesData;
    totalMarketCount = countData;
    markets = marketsResponse.data;
  } catch (err: unknown) {
    loadError = err instanceof Error ? err.message : 'Unable to retrieve markets data';
  }

  // Active filter labels
  const isFiltered = Boolean(locationParam || categoryParam);
  const activeLocationGroup = locations.find((l) => l.slug === locationParam);
  const activeCategoryGroup = categories.find((c) => c.slug === categoryParam);

  let filterHeading = 'All Active Markets';
  if (activeLocationGroup && activeCategoryGroup) {
    filterHeading = `${activeCategoryGroup.name} in ${activeLocationGroup.name}`;
  } else if (activeLocationGroup) {
    filterHeading = `All Markets in ${activeLocationGroup.name}`;
  } else if (activeCategoryGroup) {
    filterHeading = `All ${activeCategoryGroup.name} Markets`;
  }

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AageOnline Commercial Markets Directory',
    description:
      'Official public directory of competitive business visibility markets across India.',
    url: `${siteConfig.url}/markets`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    numberOfItems: markets.length,
    itemListElement: markets.slice(0, 10).map((m, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${m.cityName} ${m.categoryName} Market`,
      url: `${siteConfig.url}${m.publicUrl}`,
    })),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* JSON-LD for Search Engines & Answer Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section (Dark Immersive) */}
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
              Public Market Directory • {totalMarketCount} Active Markets
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
            Explore Verified Commercial Markets
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
            An AageOnline Market is defined by exactly one Location and Category. Search any city or industry to view verified ranking ladders and transparent competitive positions.
          </p>

          {/* Integrated Search Component */}
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'left' }}>
            <MarketSearch />
          </div>
        </div>
      </section>

      {/* 2. Main Directory & Grid Section */}
      <section
        style={{
          padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0',
          backgroundColor: 'var(--bg-page)',
        }}
        aria-labelledby="active-markets-heading"
      >
        <div className="container">
          {/* Section Subheading & Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <h2
                id="active-markets-heading"
                style={{
                  fontSize: 'var(--font-size-section)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {filterHeading}
              </h2>
              {isFiltered && (
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    margin: 'var(--space-1) 0 0 0',
                  }}
                >
                  Showing filtered results from the published market registry.
                </p>
              )}
            </div>
          </div>

          {/* Filter Controls (Suspense wrapped) */}
          <Suspense fallback={<div style={{ height: '60px' }} />}>
            <MarketFilters
              locations={locations}
              categories={categories}
              selectedLocation={locationParam}
              selectedCategory={categoryParam}
              totalResults={markets.length}
            />
          </Suspense>

          {/* Error State: Graceful API Degradation (API failure ≠ zero data) */}
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
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}
                aria-hidden="true"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                We couldn't load markets right now
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
                The market directory service experienced a connection issue. Please try refreshing or reloading the page.
              </p>
              <a
                href="/markets"
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'var(--brand-deep-emerald)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                Try Again
              </a>
            </div>
          ) : (
            /* Grid of Published Markets */
            <MarketsGrid
              markets={markets}
              emptyMessage={
                isFiltered
                  ? `No published markets match "${activeLocationGroup?.name || locationParam || ''} ${activeCategoryGroup?.name || categoryParam || ''}".`
                  : 'No published markets currently available.'
              }
            />
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
            <strong>Transparency Notice:</strong> All positions displayed within AageOnline markets represent paid competitive visibility ranking positions. Positions are established through verified, auditable transactions on the public ladder and do not imply editorial endorsement, subjective merit, or organic popularity ratings.
          </div>
        </div>
      </section>

      {/* 3. Explore by Location */}
      <ExploreLocations locations={locations} />

      {/* 4. Explore by Category */}
      <ExploreCategories categories={categories} />

      {/* 5. How the Market Model Works */}
      <MarketModelExplanation />

      {/* 6. Business CTA Banner */}
      <BusinessCTA />
    </div>
  );
}
