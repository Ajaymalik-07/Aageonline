import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '../../../config/site';
import {
  categoryService,
  marketService,
  MarketSummary,
} from '../../../data-access/index.ts';
import { MarketCard } from '../../../features/markets-directory/MarketCard';
import { CategoryBreadcrumbs } from '../../../features/category-page/CategoryBreadcrumbs';
import { CategoryHero } from '../../../features/category-page/CategoryHero';
import { CategorySnapshot } from '../../../features/category-page/CategorySnapshot';
import { CategoryLocationsRail } from '../../../features/category-page/CategoryLocationsRail';
import { CategoryFAQ } from '../../../features/category-page/CategoryFAQ';
import { RelatedCategoriesSection } from '../../../features/category-page/RelatedCategoriesSection';
import { MarketModelExplanation } from '../../../features/markets-directory/MarketModelExplanation';
import { BusinessCTA } from '../../../features/markets-directory/BusinessCTA';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  const publishedCategories = await categoryService.getPublishedCategories();
  return publishedCategories.map((cat) => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await categoryService.getPublishedCategoryBySlug(categorySlug);

  if (!category || (category.activeMarketCount ?? category.marketCount) === 0) {
    return {
      title: 'Category Not Found — AageOnline',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${category.name} Commercial Markets | AageOnline Category Directory`;
  const description = `Explore verified ${category.name} markets across Indian cities. View transparent competitive visibility ladders, qualification floors, and local positioning opportunities.`;
  const canonicalUrl = `${siteConfig.url}/categories/${category.slug}`;

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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;

  // Resolve canonical category via data-access layer
  const category = await categoryService.getPublishedCategoryBySlug(categorySlug);

  // If category does not exist or has zero published markets, return 404
  if (!category || (category.activeMarketCount ?? category.marketCount) === 0) {
    notFound();
  }

  // Retrieve published markets and related categories in parallel
  const [marketsResponse, relatedCategories] = await Promise.all([
    marketService.getPublishedMarketsByCategory(category.slug, { pageSize: 50 }),
    categoryService.getRelatedCategories(category.slug, 4),
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
            name: 'Categories',
            item: `${siteConfig.url}/categories`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: category.name,
            item: `${siteConfig.url}/categories/${category.slug}`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `AageOnline ${category.name} Commercial Markets`,
        description: `Official directory of competitive ${category.name} visibility markets across India.`,
        url: `${siteConfig.url}/categories/${category.slug}`,
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
      <CategoryBreadcrumbs category={category} />

      {/* 2. Category Hero */}
      <CategoryHero category={category} marketCount={markets.length} />

      {/* 3. Verified Category Snapshot Metrics */}
      <CategorySnapshot category={category} markets={markets} />

      {/* 4. Published Markets by Location */}
      <section
        id="category-markets"
        aria-labelledby="category-markets-heading"
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
              City-Specific Commercial Ladders
            </span>
            <h2
              id="category-markets-heading"
              style={{
                fontSize: 'var(--font-size-section)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {category.name} Markets by City
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                marginTop: 'var(--space-2)',
                maxWidth: '620px',
              }}
            >
              Select any municipal market to view its real-time visibility ladder, qualifying position floors, and participating local businesses.
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
            <strong>Transparency Notice:</strong> AageOnline rankings represent paid visibility inside specific municipal markets. Rankings reflect audited qualifying transactions on each local market ladder. There are no subjective or global category-wide ratings.
          </div>
        </div>
      </section>

      {/* 5. Explore Category by Location Rail */}
      <CategoryLocationsRail category={category} markets={markets} />

      {/* 6. Business Participation Guidance */}
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
              Industry Participation
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
              Operating a {category.name} Business?
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 var(--space-6) 0',
              }}
            >
              Businesses in {category.name} can explore their local municipal market to understand how transparent paid positioning works on AageOnline. Review qualification floors, assess competitive gaps, and position your brand with complete pricing transparency.
            </p>
            <a
              href={`/markets?category=${category.slug}`}
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
              <span>Explore {category.name} Market Opportunities</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 7. How the Market Model Works */}
      <MarketModelExplanation />

      {/* 8. Category-Level FAQ */}
      <CategoryFAQ category={category} markets={markets} />

      {/* 9. Related Commercial Categories */}
      <RelatedCategoriesSection
        currentCategory={category}
        relatedCategories={relatedCategories}
      />

      {/* 10. Business CTA Banner */}
      <BusinessCTA />
    </div>
  );
}
