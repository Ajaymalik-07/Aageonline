'use client';

import React, { useRef } from 'react';
import { getCategoryImage } from '../../lib/category-images';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  locationCoverage: string;
  slug: string;
}

const BUSINESS_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-interior',
    name: 'Interior Designers',
    icon: '🛋️',
    locationCoverage: 'Jaipur, Noida, Delhi & Gurugram',
    slug: 'interior-designers',
  },
  {
    id: 'cat-dining',
    name: 'Restaurants & Dining',
    icon: '🍽️',
    locationCoverage: 'Noida, Jaipur, Mumbai & Pune',
    slug: 'restaurants',
  },
  {
    id: 'cat-arch',
    name: 'Commercial Architects',
    icon: '📐',
    locationCoverage: 'Delhi, Gurugram & Chandigarh',
    slug: 'architects',
  },
  {
    id: 'cat-health',
    name: 'Hospitals & Healthcare',
    icon: '🏥',
    locationCoverage: 'Hisar, Jaipur & Delhi NCR',
    slug: 'hospitals',
  },
  {
    id: 'cat-photo',
    name: 'Wedding Photographers',
    icon: '📷',
    locationCoverage: 'Chandigarh, Jaipur & Delhi',
    slug: 'wedding-photographers',
  },
  {
    id: 'cat-digital',
    name: 'Digital Marketing',
    icon: '📈',
    locationCoverage: 'Gurugram, Noida & Bengaluru',
    slug: 'digital-marketing-agencies',
  },
  {
    id: 'cat-software',
    name: 'Software Development',
    icon: '💻',
    locationCoverage: 'Noida, Bengaluru & Pune',
    slug: 'software-companies',
  },
  {
    id: 'cat-real-estate',
    name: 'Real Estate Advisory',
    icon: '🏢',
    locationCoverage: 'Gurugram, Noida & Mumbai',
    slug: 'real-estate-advisory',
  },
];

export const CategoryRail: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 260;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div aria-label="Explore Business Categories" role="region" style={{ width: '100%', overflow: 'hidden' }}>
      <div className="container">
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
          <div style={{ display: 'inline-flex', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                border: '1px solid rgba(234, 88, 12, 0.35)',
                color: '#FB923C',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Market Verticals
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 900,
              color: '#F8FAFC',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore Business <span style={{ color: '#FB923C' }}>Categories</span>
          </h2>

          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '4px 0 0 0' }}>
            Local businesses compete exclusively within their verified industry category.
          </p>
        </div>

        {/* Scroll Arrows */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll categories left"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#11253E',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1E3A5F';
              e.currentTarget.style.borderColor = '#FB923C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#11253E';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll categories right"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#11253E',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1E3A5F';
              e.currentTarget.style.borderColor = '#FB923C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#11253E';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Category Cards Rail (Aligned with canonical container grid) */}
      <div
        ref={scrollRef}
        className="carousel-bleed-track hide-scrollbar"
        style={{
          paddingTop: '6px',
        }}
      >
        {BUSINESS_CATEGORIES.map((cat, idx) => {
          const isFeatured = idx === 2; // Card 3 highlighted like in screenshot 3
          const catImage = getCategoryImage(cat.slug || cat.name);

          return (
            <a
              key={cat.id}
              href={`/explore?category=${cat.slug}`}
              className="carousel-snap-item card-lift"
              style={{
                width: '240px',
                backgroundColor: '#0F2137',
                borderRadius: 'var(--radius-lg)',
                border: isFeatured ? '1.5px solid #FB923C' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isFeatured ? '0 10px 30px rgba(234, 88, 12, 0.25)' : '0 6px 20px rgba(0, 0, 0, 0.35)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all var(--motion-fast)',
              }}
            >
              {/* Category Image Header with Icon Badge */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '110px',
                  backgroundColor: '#071526',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={catImage}
                  alt={cat.name}
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
                    background: 'linear-gradient(180deg, rgba(15, 33, 55, 0.1) 0%, rgba(15, 33, 55, 0.9) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Floating Icon Center Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#162F4D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    zIndex: 2,
                  }}
                >
                  {cat.icon}
                </div>
              </div>

              {/* Card Body */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '6px',
                  flexGrow: 1,
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#F8FAFC',
                      lineHeight: 1.25,
                      margin: '0 0 4px 0',
                    }}
                  >
                    {cat.name}
                  </h3>

                  <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
                    {cat.locationCoverage}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FB923C',
                    backgroundColor: 'rgba(234, 88, 12, 0.15)',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    marginTop: '8px',
                    transition: 'all var(--motion-fast)',
                  }}
                >
                  Explore Category →
                </span>
              </div>
            </a>
          );
        })}
      </div>
      </div>
    </div>
  );
};
