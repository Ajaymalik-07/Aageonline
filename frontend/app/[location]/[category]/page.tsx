import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '../../../config/site';

// Unified Market Data Registry
import {
  getMarketPageData,
  getAllMarketStaticParams,
} from '../../../data/markets';
import { resolveMarket } from '../../../lib/taxonomy/resolver';

// Component imports
import { MarketBreadcrumbs } from '../../../features/market-page/MarketBreadcrumbs';
import { MarketHero } from '../../../features/market-page/MarketHero';
import { MarketSnapshot } from '../../../features/market-page/MarketSnapshot';
import { CurrentMarketRanking } from '../../../features/market-page/CurrentMarketRanking';
import { MarketLadderVisual } from '../../../features/market-page/MarketLadderVisual';
import { BusinessesInMarket } from '../../../features/market-page/BusinessesInMarket';
import { PageContentsNav } from '../../../features/market-page/PageContentsNav';
import { MarketEditorialContent } from '../../../features/market-page/MarketEditorialContent';
import { RankingExplanationSection } from '../../../features/market-page/RankingExplanationSection';
import { PaidVisibilityDisclosureSection } from '../../../features/market-page/PaidVisibilityDisclosureSection';
import { MarketFAQSection } from '../../../features/market-page/MarketFAQSection';
import { RelatedMarketsSection } from '../../../features/market-page/RelatedMarketsSection';
import { MarketCTA } from '../../../features/market-page/MarketCTA';

interface PageProps {
  params: Promise<{
    location: string;
    category: string;
  }>;
}

export const revalidate = 60;

export function generateStaticParams() {
  return getAllMarketStaticParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location, category } = await params;
  const resolution = resolveMarket(location, category);
  const marketData = getMarketPageData(location.toLowerCase(), category.toLowerCase());

  if (!marketData || !resolution.found || !resolution.isPublished) {
    return {
      title: 'Market Not Found — AageOnline',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { market, seo } = marketData;
  const canonicalUrl = `${siteConfig.url}/${market.slug}`;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
    robots: {
      index: resolution.isIndexable,
      follow: true,
    },
  };
}

export default async function MarketPage({ params }: PageProps) {
  const { location, category } = await params;
  const resolution = resolveMarket(location, category);
  const marketData = getMarketPageData(location.toLowerCase(), category.toLowerCase());

  // Strict route boundary: Only resolved and published markets are rendered
  if (!resolution.found || !resolution.isPublished || !marketData) {
    notFound();
  }

  const { market, rankings, editorialContent, relatedMarkets, relatedCategories } = marketData;

  // Filter editorial sections for the body (exclude separate interactive/dedicated sections)
  const editorialSections = editorialContent.filter(
    (s) =>
      s.id !== 'how-aageonline-rankings-work' &&
      s.id !== 'how-rankings-work' &&
      s.id !== 'paid-visibility-disclosure' &&
      s.id !== 'faq'
  );

  const faqSection = editorialContent.find((s) => s.id === 'faq');
  const faqs = (faqSection?.subsections || []).map((sub) => ({
    question: sub.title.replace(/^Q\d+:\s*/, ''),
    answer: sub.content.join(' '),
  }));

  // Table of Contents navigation items
  const navSections = [
    { id: 'market-snapshot', label: 'Snapshot' },
    { id: 'current-rankings', label: 'Rankings' },
    { id: 'market-ladder', label: 'Ladder Visual' },
    { id: 'businesses', label: 'Directory' },
    ...editorialSections.map((s) => ({ id: s.id, label: s.navTitle })),
    { id: 'how-rankings-work', label: 'Ranking Logic' },
    { id: 'disclosure', label: 'Disclosure' },
    { id: 'faq', label: 'FAQs' },
    { id: 'related-markets', label: 'Related Markets' },
  ];

  // Structured Data (JSON-LD)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
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
        name: market.location.name,
        item: `${siteConfig.url}/${market.location.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: market.category.name,
        item: `${siteConfig.url}/${market.slug}`,
      },
    ],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${market.category.name} in ${market.location.name} — AageOnline Market`,
    description: `Transparent commercial visibility ladder for ${market.category.name.toLowerCase()} in ${market.location.name}, ${market.location.state}.`,
    url: `${siteConfig.url}/${market.slug}`,
    inLanguage: 'en-IN',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Current Paid Visibility Rankings: ${market.category.name} in ${market.location.name}`,
    description: `Commercial paid visibility positions held by verified businesses based on server-verified qualifying amounts. Does not certify objective quality.`,
    numberOfItems: rankings.length,
    itemListElement: rankings.map((r) => ({
      '@type': 'ListItem',
      position: r.rank,
      item: {
        '@type': 'LocalBusiness',
        name: r.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: market.location.name,
          addressRegion: market.location.state,
          addressCountry: 'IN',
        },
      },
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <>
      {/* Structured Data Script Tags */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 1. BREADCRUMBS */}
        <MarketBreadcrumbs
          locationName={market.location.name}
          categoryName={market.category.name}
          locationSlug={market.location.slug}
          categorySlug={market.category.slug}
        />

        {/* 2. MARKET HERO */}
        <MarketHero market={market} />

        {/* 3. PAGE CONTENTS STICKY NAVIGATION */}
        <PageContentsNav sections={navSections} />

        {/* 4. MARKET SNAPSHOT */}
        <MarketSnapshot market={market} />

        {/* 5. CURRENT MARKET RANKING */}
        <CurrentMarketRanking
          rankings={rankings}
          locationName={market.location.name}
          categoryName={market.category.name}
          market={market}
        />

        {/* 6. POSITION / MARKET LADDER EXPLANATION */}
        <MarketLadderVisual
          rankings={rankings}
          locationName={market.location.name}
          categoryName={market.category.name}
        />

        {/* 7. BUSINESSES IN THIS MARKET */}
        <BusinessesInMarket
          businesses={rankings}
          locationName={market.location.name}
          categoryName={market.category.name}
        />

        {/* 8. EDITORIAL GUIDE: ABOUT, SERVICE TYPES, AREAS, HOW TO CHOOSE, MATERIALS, BUDGET */}
        <MarketEditorialContent sections={editorialSections} />

        {/* 9. HOW AAGEONLINE RANKINGS WORK */}
        <RankingExplanationSection
          locationName={market.location.name}
          categoryName={market.category.name}
        />

        {/* 10. PAID VISIBILITY DISCLOSURE */}
        <PaidVisibilityDisclosureSection />

        {/* 11. FREQUENTLY ASKED QUESTIONS */}
        <MarketFAQSection
          faqs={faqs}
          locationName={market.location.name}
          categoryName={market.category.name}
        />

        {/* 12. RELATED MARKETS & CATEGORIES */}
        <RelatedMarketsSection
          relatedMarkets={relatedMarkets}
          relatedCategories={relatedCategories}
          locationName={market.location.name}
        />

        {/* 13. BUSINESS CTA BANNER */}
        <MarketCTA
          locationName={market.location.name}
          categoryName={market.category.name}
        />
      </div>
    </>
  );
}
