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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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

        {/* Business Overview Description */}
        <BusinessOverview description={business.description} />

        {/* Market Participations & Positions Section */}
        <BusinessMarketParticipationSection participations={business.marketParticipations} />

        {/* Categories & Municipal Locations Served */}
        <BusinessTaxonomyLinks
          categories={business.categories}
          locationsServed={business.locationsServed}
        />

        {/* Verified Business Details */}
        <BusinessInfoCard business={business} />

        {/* Business Claim CTA */}
        <BusinessClaimCta businessName={business.name} businessSlug={business.slug} />
      </div>
    </div>
  );
}
