import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../../config/site';
import {
  locationService,
  LocationSummary,
  StateSummary,
} from '../../data-access/index.ts';
import { LocationSearch } from '../../features/locations-directory/LocationSearch';
import { LocationsGrid } from '../../features/locations-directory/LocationsGrid';
import { StateRegionRail } from '../../features/locations-directory/StateRegionRail';
import { MarketModelExplanation } from '../../features/markets-directory/MarketModelExplanation';
import { BusinessCTA } from '../../features/markets-directory/BusinessCTA';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Locations Directory — Commercial Market Centers | AageOnline',
  description:
    'Discover commercial business visibility markets across Indian cities. Browse published commercial centers, inspect local ranking ladders, and find regional positioning opportunities.',
  alternates: {
    canonical: `${siteConfig.url}/locations`,
  },
  openGraph: {
    title: 'Locations Directory — Commercial Market Centers | AageOnline',
    description:
      'Explore active commercial locations and verified competitive business ranking ladders across Indian cities.',
    url: `${siteConfig.url}/locations`,
    siteName: siteConfig.name,
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface LocationsPageProps {
  searchParams: Promise<{
    state?: string;
  }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const resolvedParams = await searchParams;
  const stateParam = resolvedParams?.state?.toLowerCase().trim();

  let locations: LocationSummary[] = [];
  let states: StateSummary[] = [];
  let totalLocationCount = 0;
  let loadError: string | null = null;

  try {
    const [allLocations, stateData, countData] = await Promise.all([
      stateParam
        ? locationService.getPublishedLocationsByState(stateParam)
        : locationService.getPublishedLocations(),
      locationService.getStatesWithPublishedLocations(),
      locationService.getPublishedLocationCount(),
    ]);

    locations = allLocations;
    states = stateData;
    totalLocationCount = countData;
  } catch (err: unknown) {
    loadError = err instanceof Error ? err.message : 'Unable to retrieve location data.';
  }

  const selectedStateObj = states.find((s) => s.slug === stateParam);
  const sectionHeading = selectedStateObj
    ? `Active Locations in ${selectedStateObj.name}`
    : 'All Commercial Locations';

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AageOnline Commercial Locations Directory',
    description:
      'Official public directory of commercial business visibility centers across India.',
    url: `${siteConfig.url}/locations`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    numberOfItems: locations.length,
    itemListElement: locations.map((loc, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${loc.name}, ${loc.stateName}`,
      url: `${siteConfig.url}/${loc.slug}`,
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
              Commercial Locations Directory • {totalLocationCount} Published Centers
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
            Explore Markets by Location
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
            Discover commercial business markets across Indian cities. Choose any location to explore published industry categories, active ranking ladders, and verified positioning opportunities.
          </p>

          {/* Integrated Search Component */}
          <Suspense fallback={<div style={{ height: '52px' }} />}>
            <LocationSearch locations={locations} />
          </Suspense>
        </div>
      </section>

      {/* 2. Main Directory Grid */}
      <section
        style={{
          padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0',
          backgroundColor: 'var(--bg-page)',
        }}
        aria-labelledby="active-locations-heading"
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
                id="active-locations-heading"
                style={{
                  fontSize: 'var(--font-size-section)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {sectionHeading}
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  margin: 'var(--space-1) 0 0 0',
                }}
              >
                Showing verified commercial centers with active paid-visibility markets.
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
                We couldn't load locations right now
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
                The location service experienced a connection issue. Please try refreshing or reloading the page.
              </p>
              <a
                href="/locations"
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
            <LocationsGrid
              locations={locations}
              emptyMessage={
                stateParam
                  ? `No published commercial locations found in ${selectedStateObj?.name || stateParam}.`
                  : 'No published commercial locations available.'
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
            <strong>Transparency Notice:</strong> AageOnline locations represent geographic jurisdictions for commercial markets. Positioning within each city is determined on an industry-by-industry basis through transparent, verified qualification ladders and does not constitute city-wide exclusivity.
          </div>
        </div>
      </section>

      {/* 3. Explore by State / Region */}
      <StateRegionRail states={states} selectedState={stateParam} />

      {/* 4. How the Market Model Works */}
      <MarketModelExplanation />

      {/* 5. Business CTA Banner */}
      <BusinessCTA />
    </div>
  );
}
