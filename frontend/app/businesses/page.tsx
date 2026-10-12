import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../../config/site';
import { businessService } from '../../data-access/businesses/index.ts';
import type { BusinessSummary } from '../../data-access/types.ts';
import { BusinessSearch } from '../../features/businesses-directory/BusinessSearch.tsx';
import { BusinessGrid } from '../../features/businesses-directory/BusinessGrid.tsx';
import { BusinessCTA } from '../../features/markets-directory/BusinessCTA';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Business Directory — Verified Commercial Entities | AageOnline',
  description:
    'Explore verified businesses across AageOnline markets. Discover service specializations, municipal service areas, and transparent paid visibility positions in local and regional economies.',
  alternates: {
    canonical: `${siteConfig.url}/businesses`,
  },
  openGraph: {
    title: 'Business Directory — Verified Commercial Entities | AageOnline',
    description:
      'Explore verified businesses across AageOnline markets with transparent market participations and local ranking ladders.',
    url: `${siteConfig.url}/businesses`,
    siteName: siteConfig.name,
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BusinessesPage() {
  let businesses: BusinessSummary[] = [];
  let totalBusinessCount = 0;
  let loadError: string | null = null;

  try {
    const paginated = await businessService.getPublishedBusinesses({ pageSize: 24 });
    businesses = paginated.data;
    totalBusinessCount = paginated.pagination.total;
  } catch (err: unknown) {
    loadError = err instanceof Error ? err.message : 'Unable to retrieve business directory data.';
  }

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AageOnline Commercial Business Directory',
    description: 'Official directory of verified business entities participating in AageOnline visibility markets.',
    url: `${siteConfig.url}/businesses`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    numberOfItems: businesses.length,
    itemListElement: businesses.map((biz, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: biz.name,
      url: `${siteConfig.url}${biz.publicUrl}`,
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
          {/* Eyebrow badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 14px',
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
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: '#FB923C',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Commercial Directory
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.15,
              margin: '0 auto var(--space-4) auto',
              maxWidth: '820px',
              letterSpacing: '-0.02em',
            }}
          >
            Explore Businesses on AageOnline
          </h1>

          <p
            style={{
              fontSize: 'clamp(var(--font-size-base), 2vw, var(--font-size-lg))',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: 1.55,
              margin: '0 auto var(--space-8) auto',
              maxWidth: '680px',
            }}
          >
            Discover verified businesses across municipal markets. View business specializations, regional
            service footprints, and active paid visibility positions in local and regional economies.
          </p>

          {/* Interactive Search */}
          <Suspense fallback={<div style={{ height: '48px' }} />}>
            <BusinessSearch businesses={businesses} />
          </Suspense>
        </div>
      </section>

      {/* 2. Main Directory Content */}
      <div
        className="container"
        style={{
          flex: 1,
          padding: 'var(--space-10) 0',
        }}
      >
        {loadError ? (
          <div
            role="alert"
            style={{
              textAlign: 'center',
              padding: 'var(--space-12) var(--space-6)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              maxWidth: '540px',
              margin: '0 auto',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-2) 0',
              }}
            >
              Unable to Load Business Directory
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                margin: '0 0 var(--space-6) 0',
              }}
            >
              {loadError}
            </p>
            <a
              href="/businesses"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                textDecoration: 'none',
              }}
            >
              Retry
            </a>
          </div>
        ) : (
          <>
            {/* Header with counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  Verified Commercial Profiles
                </h2>
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-tertiary)',
                    margin: '4px 0 0 0',
                  }}
                >
                  Independent business entities qualified to compete in local and regional visibility markets.
                </p>
              </div>

              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {totalBusinessCount} {totalBusinessCount === 1 ? 'Business' : 'Businesses'} Listed
              </div>
            </div>

            {/* Business Cards Grid */}
            <BusinessGrid businesses={businesses} />
          </>
        )}

        {/* 3. Market Participation & Transparency Governance */}
        <section
          style={{
            marginTop: 'var(--space-16)',
            padding: 'var(--space-8)',
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--elevation-1)',
          }}
        >
          <div style={{ maxWidth: '780px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#EA580C',
                display: 'block',
                marginBottom: 'var(--space-2)',
              }}
            >
              Governance &amp; Positioning Architecture
            </span>
            <h2
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-4) 0',
              }}
            >
              How Business Profiles Work on AageOnline
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0 }}>
                AageOnline maintains a strict distinction between a <strong>Business</strong>, a{' '}
                <strong>Market</strong>, and a <strong>Ranking Position</strong>:
              </p>
              <ul style={{ paddingLeft: 'var(--space-5)', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Business Entity:</strong> Independent commercial identity representing a verified or listed
                  operating business with its own categories and service regions.
                </li>
                <li>
                  <strong>Market Participation:</strong> The distinct relationship when a business participates in a
                  specific <em>Location + Category</em> market (e.g. <em>Jaipur × Interior Designers</em>).
                </li>
                <li>
                  <strong>Paid Visibility Positions:</strong> Visibility positions (#1, #2, #3) are market-specific
                  competitive ranks maintained via verified transactions. A business profile remains stable regardless of
                  position fluctuations.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Business Participation CTA */}
        <div style={{ marginTop: 'var(--space-12)' }}>
          <BusinessCTA />
        </div>
      </div>
    </div>
  );
}
