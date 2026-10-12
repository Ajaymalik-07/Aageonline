'use client';

import React, { useState, useEffect } from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';
import { getCategoryImage } from '../../lib/category-images';

export interface FeaturedMarketsShuffleProps {
  markets: Market[];
}

export const FeaturedMarketsShuffle: React.FC<FeaturedMarketsShuffleProps> = ({
  markets,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [windowOffset, setWindowOffset] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isAutoShuffling, setIsAutoShuffling] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const filteredMarkets = activeCategoryFilter === 'ALL'
    ? markets
    : markets.filter((m) => {
        if (activeCategoryFilter === 'DESIGN') return m.category.slug.includes('interior') || m.category.slug.includes('architect');
        if (activeCategoryFilter === 'DINING') return m.category.slug.includes('restaurant');
        if (activeCategoryFilter === 'HEALTH') return m.category.slug.includes('hospital');
        if (activeCategoryFilter === 'TECH') return m.category.slug.includes('digital') || m.category.slug.includes('software');
        return true;
      });

  // Sort pool primarily by highest top floor (topQualifyingAmountMinor) descending:
  const basePool = filteredMarkets.length > 0 ? filteredMarkets : markets;
  const pool = [...basePool].sort(
    (a, b) => (b.topQualifyingAmountMinor ?? 0) - (a.topQualifyingAmountMinor ?? 0)
  );

  // Advance to next data-driven market set in the sorted pool
  const advanceNext = () => {
    if (pool.length <= 4 || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setWindowOffset((prev) => (prev + 1) % pool.length);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 450);
  };

  useEffect(() => {
    if (!isAutoShuffling || isHovered || pool.length <= 4) return;

    const timer = setInterval(() => {
      advanceNext();
    }, 5500);

    return () => clearInterval(timer);
  }, [isAutoShuffling, isHovered, pool.length, isTransitioning]);

  const displayedMarkets = pool.length <= 4
    ? pool
    : [0, 1, 2, 3].map((i) => pool[(windowOffset + i) % pool.length]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      {/* Section Header with Category Tabs & Shuffle Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: '#EA580C',
              }}
            >
              Active Local Markets ({pool.length})
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '1px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                color: '#EA580C',
                border: '1px solid rgba(234, 88, 12, 0.25)',
              }}
            >
              Illustrative Markets
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Featured City <span style={{ color: '#EA580C' }}>Market Ladders</span>
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Explore illustrative Location + Category markets and see how paid visibility positions are formed.
          </p>
        </div>

        {/* Category Filters & Shuffle Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'var(--surface-raised)',
              padding: '3px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { id: 'ALL', label: 'All' },
              { id: 'DESIGN', label: 'Design' },
              { id: 'TECH', label: 'Tech & Marketing' },
              { id: 'DINING', label: 'Dining' },
              { id: 'HEALTH', label: 'Health' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryFilter(cat.id);
                  setWindowOffset(0);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  backgroundColor: activeCategoryFilter === cat.id ? '#EA580C' : 'transparent',
                  color: activeCategoryFilter === cat.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--motion-fast)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={advanceNext}
            title="Rotate to next data-driven market set"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            🔀 Next Shuffle
          </button>

          <button
            type="button"
            onClick={() => setIsAutoShuffling(!isAutoShuffling)}
            title={isAutoShuffling ? 'Pause automatic market rotation' : 'Resume automatic market rotation'}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {isAutoShuffling ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* 4-Card Grid with smooth transform & opacity transitions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {displayedMarkets.map((market, slotIndex) => {
          const categoryImage = getCategoryImage(market.category.slug || market.category.name);

          return (
            <a
              key={`${market.id}-${slotIndex}`}
              href={`/${market.slug}`}
              className="perspective-tilt"
              style={{
                textDecoration: 'none',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(11, 31, 59, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: prefersReducedMotion
                  ? 'opacity 300ms ease, box-shadow var(--motion-normal)'
                  : 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease, box-shadow var(--motion-normal)',
                opacity: isTransitioning ? (prefersReducedMotion ? 0.7 : 0.35) : 1,
                transform: isTransitioning && !prefersReducedMotion ? 'translateY(10px) scale(0.98)' : 'none',
              }}
            >
              {/* Visual Card Image Header with Floating Badges */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '145px',
                  backgroundColor: '#0b1f3b',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={categoryImage}
                  alt={`${market.category.name} in ${market.location.name}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(11, 31, 59, 0.5) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: 'var(--brand-deep-navy)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  >
                    📍 {market.location.name}
                  </span>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'rgba(234, 88, 12, 0.9)',
                      color: '#ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  >
                    {market.totalBusinesses} listings
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#EA580C',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    {market.location.state} Market
                  </span>

                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.25,
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {market.category.name}
                  </h3>

                  {/* Competitive Metrics */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-raised)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top Position Floor</span>
                      <strong style={{ fontSize: '15px', color: '#EA580C', fontWeight: 900 }}>
                        {formatINR(market.topQualifyingAmountMinor)}
                      </strong>
                    </div>

                    {/* Mini Position Preview Ladder Bars */}
                    <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                      <div style={{ flex: 1, height: '4px', backgroundColor: '#EA580C', borderRadius: '2px' }} title="#1 Active" />
                      <div style={{ flex: 1, height: '4px', backgroundColor: '#F97316', borderRadius: '2px' }} title="#2 Active" />
                      <div style={{ flex: 1, height: '4px', backgroundColor: '#FB923C', borderRadius: '2px' }} title="#3 Active" />
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-strong)', borderRadius: '2px' }} title="#4 Active" />
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px' }} title="20+ Open" />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {market.activePositions} paid positions
                  </span>

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#EA580C',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Explore Ladder →
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
