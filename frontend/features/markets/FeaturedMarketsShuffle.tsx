'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';
import { getCategoryImage } from '../../lib/category-images';

export interface FeaturedMarketsShuffleProps {
  markets: Market[];
}

export const FeaturedMarketsShuffle: React.FC<FeaturedMarketsShuffleProps> = ({
  markets,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isInstant, setIsInstant] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [stepWidth, setStepWidth] = useState<number>(310);

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sort pool primarily by highest top floor (topQualifyingAmountMinor) descending:
  // This ensures top-ranked categories are shown first.
  const pool = useMemo(() => {
    return [...markets].sort(
      (a, b) => (b.topQualifyingAmountMinor ?? 0) - (a.topQualifyingAmountMinor ?? 0)
    );
  }, [markets]);

  // Clone list to achieve seamless infinite loop when scrolling one by one
  const displayItems = useMemo(() => {
    if (pool.length === 0) return [];
    return [...pool, ...pool];
  }, [pool]);

  // Dynamically measure distance between cards to ensure pixel-perfect translate distance
  const measureStep = useCallback(() => {
    if (trackRef.current && trackRef.current.children.length > 1) {
      const first = trackRef.current.children[0] as HTMLElement;
      const second = trackRef.current.children[1] as HTMLElement;
      if (first && second) {
        const dist = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
        if (dist > 0) {
          setStepWidth(dist);
        }
      }
    }
  }, []);

  useEffect(() => {
    measureStep();
    window.addEventListener('resize', measureStep);
    return () => window.removeEventListener('resize', measureStep);
  }, [measureStep]);

  // Next one-by-one advance
  const advanceNext = useCallback(() => {
    if (pool.length <= 1) return;
    setCurrentIndex((prev) => prev + 1);
  }, [pool.length]);

  // Prev one-by-one retreat
  const retreatPrev = useCallback(() => {
    if (pool.length <= 1) return;
    if (currentIndex === 0) {
      setIsInstant(true);
      setCurrentIndex(pool.length);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsInstant(false);
          setCurrentIndex(pool.length - 1);
        });
      });
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, pool.length]);

  // Seamless wrap-around after transition to pool.length finishes
  useEffect(() => {
    if (currentIndex >= pool.length) {
      const resetTimer = setTimeout(() => {
        setIsInstant(true);
        setCurrentIndex(0);
        setTimeout(() => {
          setIsInstant(false);
        }, 50);
      }, 650);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, pool.length]);

  // Automatic one-by-one scroll timer (pauses when hovered or user prefers reduced motion)
  useEffect(() => {
    if (isHovered || prefersReducedMotion || pool.length <= 1) return;

    const timer = setInterval(() => {
      advanceNext();
    }, 3800);

    return () => clearInterval(timer);
  }, [isHovered, prefersReducedMotion, pool.length, advanceNext]);

  return (
    <div
      role="region"
      aria-label="Featured City Market Ladders"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}
    >
      <style>{`
        .featured-market-slide-card {
          flex: 0 0 calc((100% - 3 * 20px) / 4);
          min-width: 260px;
          box-sizing: border-box;
          text-decoration: none;
        }
        @media (max-width: 1024px) {
          .featured-market-slide-card {
            flex: 0 0 calc((100% - 2 * 16px) / 3);
            min-width: 240px;
          }
        }
        @media (max-width: 768px) {
          .featured-market-slide-card {
            flex: 0 0 calc((100% - 16px) / 2);
            min-width: 220px;
          }
        }
        @media (max-width: 520px) {
          .featured-market-slide-card {
            flex: 0 0 85%;
            min-width: 220px;
          }
        }
      `}</style>

      {/* Section Header */}
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

        {/* Subtle Accessible Navigation Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={retreatPrev}
            aria-label="Previous market"
            className="aage-button"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all var(--motion-fast)',
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={advanceNext}
            aria-label="Next market"
            className="aage-button"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all var(--motion-fast)',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* One-by-One Smooth Horizontal Scroll Track */}
      <div
        style={{
          width: '100%',
          overflow: 'hidden',
          paddingTop: '6px',
          paddingBottom: '12px',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: '20px',
            transform: `translateX(-${currentIndex * stepWidth}px)`,
            transition: isInstant || prefersReducedMotion
              ? 'none'
              : 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {displayItems.map((market, slotIndex) => {
            const categoryImage = getCategoryImage(market.category.slug || market.category.name);

            return (
              <a
                key={`${market.id}-${slotIndex}`}
                href={`/${market.slug}`}
                className="featured-market-slide-card card-lift"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 4px 16px rgba(11, 31, 59, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
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
                <div
                  style={{
                    padding: 'var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    justifyContent: 'space-between',
                  }}
                >
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
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
    </div>
  );
};
