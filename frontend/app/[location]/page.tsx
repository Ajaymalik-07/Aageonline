import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '../../config/site';
import {
  locationService,
  marketService,
  MarketSummary,
} from '../../data-access/index.ts';
import { MarketCard } from '../../features/markets-directory/MarketCard';
import { CityBreadcrumbs } from '../../features/city-page/CityBreadcrumbs';
import { CityHero } from '../../features/city-page/CityHero';
import { CitySnapshot } from '../../features/city-page/CitySnapshot';
import { CityCategoriesRail } from '../../features/city-page/CityCategoriesRail';
import { CityFAQ } from '../../features/city-page/CityFAQ';
import { RelatedLocationsSection } from '../../features/city-page/RelatedLocationsSection';
import { MarketModelExplanation } from '../../features/markets-directory/MarketModelExplanation';
import { BusinessCTA } from '../../features/markets-directory/BusinessCTA';

interface CityPageProps {
  params: Promise<{
    location: string;
  }>;
}

export async function generateStaticParams() {
  const publishedLocations = await locationService.getPublishedLocations();
  return publishedLocations.map((loc) => ({
    location: loc.slug,
  }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { location: locationSlug } = await params;
  const location = await locationService.getPublishedLocationBySlug(locationSlug);

  if (!location || (location.activeMarketCount ?? location.marketCount) === 0) {
    return {
      title: 'Location Not Found — AageOnline',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `AageOnline Markets in ${location.name} | Commercial Visibility Directory`;
  const description = `Explore verified business categories and paid-visibility markets across ${location.name}, ${location.stateName}. View transparent ranking ladders and competitive positioning opportunities.`;
  const canonicalUrl = `${siteConfig.url}/${location.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: 'en_IN',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { location: locationSlug } = await params;

  // Resolve canonical location via data-access layer
  const location = await locationService.getPublishedLocationBySlug(locationSlug);

  // If location does not exist or has zero published markets, return 404
  if (!location || (location.activeMarketCount ?? location.marketCount) === 0) {
    notFound();
  }

  // Retrieve published markets and related regional centers in parallel
  const [marketsResponse, relatedLocations] = await Promise.all([
    marketService.getPublishedMarketsByLocation(location.slug, { pageSize: 50 }),
    locationService.getRelatedLocations(location.slug, 4),
  ]);

  const markets = marketsResponse.data;

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteConfig.url,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Locations',
            item: `${siteConfig.url}/locations`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: location.name,
            item: `${siteConfig.url}/${location.slug}`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `AageOnline Commercial Markets in ${location.name}`,
        description: `Official directory of competitive business visibility markets in ${location.name}, ${location.stateName}.`,
        url: `${siteConfig.url}/${location.slug}`,
        isPartOf: {
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
        },
        numberOfItems: markets.length,
        itemListElement: markets.map((m, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${m.cityName} ${m.categoryName} Market`,
          url: `${siteConfig.url}${m.publicUrl}`,
        })),
      },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* JSON-LD for Search & Answer Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Breadcrumbs */}
      <CityBreadcrumbs location={location} />

      {/* 2. City Hero */}
      <CityHero location={location} marketCount={markets.length} />

      {/* 3. Verified City Snapshot Metrics */}
      <CitySnapshot location={location} markets={markets} />

      {/* 4. Published Markets in this City */}
      <section
        id="city-markets"
        aria-labelledby="city-markets-heading"
        style={{
          padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0',
          backgroundColor: 'var(--bg-page)',
        }}
      >
        <div className="container">
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <span
              style={{
                fontSize: 'var(--font-size-eyebrow)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--action-primary)',
                display: 'block',
                marginBottom: 'var(--space-1)',
              }}
            >
              Active Commercial Ladders
            </span>
            <h2
              id="city-markets-heading"
              style={{
                fontSize: 'var(--font-size-section)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Markets in {location.name}
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                marginTop: 'var(--space-2)',
                maxWidth: '620px',
              }}
            >
              Select any commercial market to view its real-time visibility ladder, qualifying position floors, and participating local businesses.
            </p>
          </div>

          {/* Grid of Published Markets */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {markets.map((m: MarketSummary) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>

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
            <strong>Transparency Notice:</strong> AageOnline market positions in {location.name} represent paid visibility and do not independently establish that a business is the best choice for a customer. Rankings reflect financial positioning commitments on an auditable ladder.
          </div>
        </div>
      </section>

      {/* 5. Explore Categories in this City */}
      <CityCategoriesRail location={location} markets={markets} />

      {/* 6. Business Discovery Guidance Section */}
      <section
        style={{
          padding: 'var(--space-10) 0',
          backgroundColor: 'var(--surface-subtle)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <span
              style={{
                fontSize: 'var(--font-size-eyebrow)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--action-primary)',
                display: 'block',
                marginBottom: 'var(--space-2)',
              }}
            >
              Business Participation
            </span>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: '0 0 var(--space-3) 0',
              }}
            >
              Operating a Business in {location.name}?
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 var(--space-6) 0',
              }}
            >
              Businesses in {location.name} can explore their local industry market to understand how transparent paid positioning works on AageOnline. Review qualification floors, assess competitive gaps, and position your brand with complete pricing transparency.
            </p>
            <a
              href={`/markets?location=${location.slug}`}
              style={{
                padding: '10px 24px',
                backgroundColor: 'var(--action-primary)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--elevation-1)',
              }}
            >
              <span>Explore {location.name} Positioning Opportunities</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 7. How the Market Model Works */}
      <MarketModelExplanation />

      {/* 8. City-Level FAQ */}
      <CityFAQ location={location} markets={markets} />

      {/* 9. Related Commercial Locations */}
      <RelatedLocationsSection
        currentLocation={location}
        relatedLocations={relatedLocations}
      />

      {/* 10. Business CTA Banner */}
      <BusinessCTA />
    </div>
  );
}
