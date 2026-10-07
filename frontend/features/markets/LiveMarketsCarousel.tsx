'use client';

import React, { useRef } from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';

export interface LiveMarketsCarouselProps {
  markets: Market[];
}

export const LiveMarketsCarousel: React.FC<LiveMarketsCarouselProps> = ({ markets }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      aria-label="Live Competitive Markets"
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-teal)',
                display: 'inline-block',
              }}
              className="live-indicator-dot"
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-teal)',
              }}
            >
              Real-Time Activity
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
            Live Local <span style={{ color: 'var(--brand-emerald)' }}>Markets</span>
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Active competition for paid visibility positions across verified Indian cities.
          </p>
        </div>

        {/* Carousel Navigation Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll live markets left"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--elevation-1)',
              transition: 'all var(--motion-fast)',
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll live markets right"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--elevation-1)',
              transition: 'all var(--motion-fast)',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="carousel-track hide-scrollbar"
        style={{
          paddingBottom: 'var(--space-2)',
        }}
      >
        {markets.map((market, index) => {
          const isHighActivity = market.totalBusinesses > 50;
          const imageNumber = (index % 18) + 1;

          return (
            <div
              key={market.id}
              className="carousel-snap-item card-lift"
              style={{
                width: '320px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(11, 31, 59, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Rich Visual Image Banner with Badges */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
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
                    transition: 'transform var(--motion-normal)',
                  }}
                  onError={(e) => {
                    // Fallback gradient if image not accessible
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Ambient Image Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(11, 31, 59, 0.5) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Floating Badges */}
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
                      backgroundColor: 'rgba(5, 150, 105, 0.9)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                      }}
                      className="live-indicator-dot"
                    />
                    LIVE
                  </span>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isHighActivity ? 'rgba(199, 240, 0, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                      color: isHighActivity ? '#0b1f3b' : 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  >
                    {isHighActivity ? 'High Competition' : 'Active Market'}
                  </span>
                </div>
              </div>

              {/* Card Body Content */}
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {/* Header: Live Badge + Competition Level */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--brand-emerald)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-emerald)',
                      }}
                      className="live-indicator-dot"
                    />
                    LIVE
                  </span>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: isHighActivity ? 'rgba(199, 240, 0, 0.2)' : 'rgba(11, 31, 59, 0.06)',
                      color: isHighActivity ? 'var(--brand-deep-navy)' : 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isHighActivity ? 'High Competition' : 'Active Market'}
                  </span>
                </div>

                {/* Location & Category Typography */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--brand-teal)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  📍 {market.location.name}, {market.location.state}
                </span>

                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.25,
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {market.category.name}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 var(--space-4) 0' }}>
                  {market.totalBusinesses} businesses competing · {market.activePositions} positions
                </p>

                {/* #1 Leader & Qualifying Amount Badge */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Position #1 Floor</span>
                    <strong style={{ fontSize: '15px', fontWeight: 900, color: 'var(--brand-deep-emerald)' }}>
                      {formatINR(market.topQualifyingAmountMinor)}
                    </strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-emerald)', fontWeight: 600, marginTop: '2px' }}>
                    Leading: Active qualifying position
                  </div>
                </div>

                {/* Action Link */}
                <a
                  href={`/${market.slug}`}
                  style={{
                    marginTop: 'auto',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'transparent',
                    border: '1.5px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all var(--motion-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--brand-emerald)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = 'var(--brand-emerald)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                  }}
                >
                  Explore Market Ladder →
                </a>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
};
