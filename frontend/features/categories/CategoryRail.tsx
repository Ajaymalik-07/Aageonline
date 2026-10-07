'use client';

import React, { useRef } from 'react';

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
    <section className="container" aria-label="Explore Business Categories">
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
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-emerald)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Market Verticals
          </span>

          <h2
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore Business <span style={{ color: 'var(--brand-emerald)' }}>Categories</span>
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll categories right"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Category Cards Rail */}
      <div
        ref={scrollRef}
        className="carousel-track hide-scrollbar"
        style={{
          paddingBottom: 'var(--space-2)',
        }}
      >
        {BUSINESS_CATEGORIES.map((cat, idx) => {
          const imgNum = (idx % 9) + 1;

          return (
            <a
              key={cat.id}
              href={`/explore?category=${cat.slug}`}
              className="carousel-snap-item card-lift"
              style={{
                width: '220px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(11, 31, 59, 0.05)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Category Image Header with Icon Badge */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100px',
                  backgroundColor: '#0b1f3b',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`/assets/categories/category-img${imgNum}.jpg`}
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
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(11, 31, 59, 0.5) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Floating Icon Center Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    border: '2px solid #ffffff',
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
                      color: 'var(--text-primary)',
                      lineHeight: 1.25,
                      margin: '0 0 4px 0',
                    }}
                  >
                    {cat.name}
                  </h3>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {cat.locationCoverage}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--brand-emerald)',
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
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
    </section>
  );
};
