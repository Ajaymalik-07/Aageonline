'use client';

import React, { useState, useEffect } from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';

export interface FeaturedMarketsShuffleProps {
  markets: Market[];
}

export const FeaturedMarketsShuffle: React.FC<FeaturedMarketsShuffleProps> = ({
  markets,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [displayedIndices, setDisplayedIndices] = useState<number[]>([0, 1, 2, 3]);
  const [shufflingIndex, setShufflingIndex] = useState<number | null>(null);
  const [isAutoShuffling, setIsAutoShuffling] = useState<boolean>(true);

  const filteredMarkets = activeCategoryFilter === 'ALL'
    ? markets
    : markets.filter((m) => {
        if (activeCategoryFilter === 'DESIGN') return m.category.slug.includes('interior') || m.category.slug.includes('architect');
        if (activeCategoryFilter === 'DINING') return m.category.slug.includes('restaurant');
        if (activeCategoryFilter === 'HEALTH') return m.category.slug.includes('hospital');
        if (activeCategoryFilter === 'TECH') return m.category.slug.includes('digital') || m.category.slug.includes('software');
        return true;
      });

  // Ensure displayedIndices point within valid filtered markets
  const pool = filteredMarkets.length > 0 ? filteredMarkets : markets;

  // Single card 1-by-1 shuffle transition
  const shuffleNextCard = () => {
    if (pool.length <= 4) return;

    // Pick slot 0 to cycle out
    setShufflingIndex(0);

    setTimeout(() => {
      setDisplayedIndices((prev) => {
        const next = [...prev];
        // Find next market index not currently displayed
        const currentlyShown = new Set(next);
        let candidate = (next[next.length - 1] + 1) % pool.length;
        while (currentlyShown.has(candidate) && currentlyShown.size < pool.length) {
          candidate = (candidate + 1) % pool.length;
        }

        // Shift array: remove first, add new at end
        next.shift();
        next.push(candidate);
        return next;
      });
      setShufflingIndex(null);
    }, 450);
  };

  useEffect(() => {
    if (!isAutoShuffling) return;

    const timer = setInterval(() => {
      shuffleNextCard();
    }, 5500);

    return () => clearInterval(timer);
  }, [isAutoShuffling, pool.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
          <div style={{ display: 'inline-flex', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--brand-emerald)',
              }}
            >
              Active Local Markets ({pool.length})
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
            Featured City <span style={{ color: 'var(--brand-emerald)' }}>Position Ladders</span>
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Live business discovery ladders. Smooth 1-by-1 market card shuffle.
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
                  setDisplayedIndices([0, 1, 2, 3]);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  backgroundColor: activeCategoryFilter === cat.id ? 'var(--brand-emerald)' : 'transparent',
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
            onClick={shuffleNextCard}
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

      {/* 4-Card Grid with 1-by-1 FLIP-style card shuffle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {displayedIndices.map((marketIndex, slotIndex) => {
          const market = pool[marketIndex % pool.length];
          const isShuffling = shufflingIndex === slotIndex;

          const imageNumber = ((marketIndex % 18) + 1);

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
                transition: 'transform var(--motion-normal), opacity var(--motion-normal), box-shadow var(--motion-normal)',
                opacity: isShuffling ? 0.3 : 1,
                transform: isShuffling ? 'translateY(12px) scale(0.96)' : 'none',
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
                  src={`/assets/markets/auction-img${imageNumber}.jpg`}
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
                      backgroundColor: 'rgba(5, 150, 105, 0.9)',
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
                      fontWeight: 700,
                      color: 'var(--brand-teal)',
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
                      <strong style={{ fontSize: '15px', color: 'var(--brand-deep-emerald)', fontWeight: 900 }}>
                        {formatINR(market.topQualifyingAmountMinor)}
                      </strong>
                    </div>

                    {/* Mini Position Preview Ladder Bars */}
                    <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--brand-lime)', borderRadius: '2px' }} title="#1 Active" />
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--brand-teal)', borderRadius: '2px' }} title="#2 Active" />
                      <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--brand-emerald)', borderRadius: '2px' }} title="#3 Active" />
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
                      color: 'var(--brand-emerald)',
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
