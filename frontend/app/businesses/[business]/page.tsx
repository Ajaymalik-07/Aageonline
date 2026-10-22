import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '../../../config/site';
import { businessService } from '../../../data-access/businesses/index.ts';
import { BusinessBreadcrumbs } from '../../../features/business-profile/BusinessBreadcrumbs.tsx';
import { BusinessHero } from '../../../features/business-profile/BusinessHero.tsx';
import { BusinessOverview } from '../../../features/business-profile/BusinessOverview.tsx';
import { BusinessMarketParticipationSection } from '../../../features/business-profile/BusinessMarketParticipationSection.tsx';
import { BusinessTaxonomyLinks } from '../../../features/business-profile/BusinessTaxonomyLinks.tsx';
import { BusinessInfoCard } from '../../../features/business-profile/BusinessInfoCard.tsx';
import { BusinessClaimCta } from '../../../features/business-profile/BusinessClaimCta.tsx';

interface BusinessPageProps {
  params: Promise<{
    business: string;
  }>;
}

export async function generateStaticParams() {
  const paginated = await businessService.getPublishedBusinesses({ pageSize: 100 });
  return paginated.data.map((biz) => ({
    business: biz.slug,
  }));
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { business: businessSlug } = await params;
  const business = await businessService.getPublishedBusinessBySlug(businessSlug);

  if (!business) {
    return {
      title: 'Business Not Found — AageOnline',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${business.name} | Verified Business Profile on AageOnline`;
  const description =
    business.description ||
    `${business.name} commercial business profile on AageOnline. Explore verified market participations and local visibility positions.`;
  const canonicalUrl = `${siteConfig.url}/businesses/${business.slug}`;

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
      type: 'profile',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BusinessProfilePage({ params }: BusinessPageProps) {
  const { business: businessSlug } = await params;
  const business = await businessService.getPublishedBusinessBySlug(businessSlug);

  if (!business) {
    notFound();
  }

  const isVerified = business.verificationStatus === 'VERIFIED';

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
            name: 'Businesses',
            item: `${siteConfig.url}/businesses`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: business.name,
            item: `${siteConfig.url}${business.publicUrl}`,
          },
        ],
      },
      {
        '@type': 'Organization',
        name: business.name,
        legalName: business.legalName || undefined,
        description: business.description,
        url: business.website || `${siteConfig.url}${business.publicUrl}`,
        address: business.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: business.address,
              addressLocality: business.primaryLocation?.name,
              addressRegion: business.primaryLocation?.stateName,
              addressCountry: 'IN',
            }
          : undefined,
      },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        style={{
          flex: 1,
          maxWidth: 'var(--container-max)',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-4) var(--container-gutter) var(--space-16) var(--container-gutter)',
        }}
      >
        {/* Breadcrumb Navigation */}
        <BusinessBreadcrumbs businessName={business.name} />

        {/* Hero Section */}
        <BusinessHero business={business} />

        {/* 2-Column Responsive Showcase Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1.15fr)',
            gap: 'var(--space-8)',
            alignItems: 'flex-start',
            marginTop: 'var(--space-2)',
          }}
          className="business-profile-grid"
        >
          {/* Main Column: Story, Rankings, Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', minWidth: 0 }}>
            {/* Business Overview Description */}
            <BusinessOverview
              description={business.description}
              businessName={business.name}
              legalName={business.legalName}
              locationName={business.primaryLocation?.name}
              isVerified={isVerified}
            />

            {/* Market Participations & Authoritative Positions Section */}
            <BusinessMarketParticipationSection participations={business.marketParticipations} />

            {/* Categories & Municipal Locations Served */}
            <BusinessTaxonomyLinks
              categories={business.categories}
              locationsServed={business.locationsServed}
            />
          </div>

          {/* Sidebar Column: Verified Contacts, Social Media Showcase, Single Authoritative Management Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minWidth: 0 }}>
            {/* Verified Business Directory Details & Social Media Channels */}
            <BusinessInfoCard business={business} />

            {/* Single Authoritative Business Management / Claim Action (NO DUPLICATE CARDS) */}
            {isVerified ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFF7ED',
                      color: '#EA580C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #FED7AA',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 800, color: '#0F172A' }}>
                      Business Management Portal
                    </h3>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Authorized Enterprise Controls
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: '#475569', lineHeight: 1.5 }}>
                  Do you manage {business.name}? Access your dashboard to update profile details, manage paid visibility positions, and review transaction history.
                </p>
                <a
                  href={`/business/dashboard?businessId=${encodeURIComponent(business.id)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: 'var(--space-2)',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
                  }}
                >
                  <span>Open Business Dashboard</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            ) : (
              <BusinessClaimCta businessName={business.name} businessSlug={business.slug} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
