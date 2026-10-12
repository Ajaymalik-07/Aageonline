'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LocationSummary, CategorySummary } from '../../data-access/types.ts';

interface MarketFiltersProps {
  locations:
    | LocationSummary[]
    | Array<{
        citySlug?: string;
        slug?: string;
        cityName?: string;
        name?: string;
        marketCount: number;
      }>;
  categories:
    | CategorySummary[]
    | Array<{
        categorySlug?: string;
        slug?: string;
        categoryName?: string;
        name?: string;
        marketCount: number;
      }>;
  selectedLocation?: string;
  selectedCategory?: string;
  totalResults: number;
}

export function MarketFilters({
  locations,
  categories,
  selectedLocation,
  selectedCategory,
  totalResults,
}: MarketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeLoc = selectedLocation || searchParams.get('location') || '';
  const activeCat = selectedCategory || searchParams.get('category') || '';
  const hasActiveFilters = Boolean(activeLoc || activeCat);

  const applyFilters = (newLoc: string, newCat: string) => {
    const params = new URLSearchParams();
    if (newLoc) params.set('location', newLoc);
    if (newCat) params.set('category', newCat);
    const qs = params.toString();
    const url = qs ? `/markets?${qs}` : '/markets';

    startTransition(() => {
      router.push(url);
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters(e.target.value, activeCat);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters(activeLoc, e.target.value);
  };

  const handleClear = () => {
    startTransition(() => {
      router.push('/markets');
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-5) var(--space-6)',
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-6)',
        boxShadow: 'var(--elevation-1)',
        opacity: isPending ? 0.7 : 1,
        transition: 'opacity var(--motion-fast)',
      }}
      role="search"
      aria-label="Filter markets"
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flex: '1 1 300px',
        }}
      >
        {/* Location Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor="filter-location"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
            }}
          >
            Location
          </label>
          <select
            id="filter-location"
            value={activeLoc}
            onChange={handleLocationChange}
            aria-label="Filter by location"
            style={{
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-card, var(--surface-card))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => {
              const slug = loc.slug || (loc as any).citySlug;
              const name = loc.name || (loc as any).cityName;
              return (
                <option key={slug} value={slug}>
                  {name} ({loc.marketCount})
                </option>
              );
            })}
          </select>
        </div>

        {/* Category Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            htmlFor="filter-category"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
            }}
          >
            Category
          </label>
          <select
            id="filter-category"
            value={activeCat}
            onChange={handleCategoryChange}
            aria-label="Filter by category"
            style={{
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-card, var(--surface-card))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '180px',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => {
              const slug = cat.slug || (cat as any).categorySlug;
              const name = cat.name || (cat as any).categoryName;
              return (
                <option key={slug} value={slug}>
                  {name} ({cat.marketCount})
                </option>
              );
            })}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              marginTop: '18px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--brand-deep-emerald)',
              backgroundColor: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              transition: 'background var(--motion-fast)',
            }}
          >
            Reset Filters ✕
          </button>
        )}
      </div>

      {/* Result Count Status */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
        aria-live="polite"
      >
        <span>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{totalResults}</strong> {totalResults === 1 ? 'market' : 'markets'}
        </span>
      </div>
    </div>
  );
}
