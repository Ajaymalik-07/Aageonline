'use client';

import React, { useState } from 'react';
import { HeroMarketVisual } from '../ranking/HeroMarketVisual';

export const HeroSection: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('Jaipur');
  const [selectedCategory, setSelectedCategory] = useState<string>('Interior Designers');

  const locations = ['Jaipur', 'Noida', 'Delhi', 'Gurugram', 'Hisar', 'Pune', 'Mumbai'];
  const categories = [
    'Interior Designers',
    'Restaurants & Dining',
    'Commercial Architects',
    'Hospitals & Healthcare',
    'Digital Marketing Agencies',
  ];

  return (
    <section
      className="section-dark-immersive"
      style={{
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
      }}
    >
      {/* Decorative Spatial Grid & Mesh Background (Section 1) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      <div
        className="container hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Left Column: Editorial Vision + Market Selectors */}
        <div>
          <div style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '4px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--brand-teal)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-teal)',
                  display: 'inline-block',
                }}
              />
              Market = Location + Category
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(42px, 6.5vw, 72px)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              marginBottom: 'var(--space-4)',
            }}
          >
            GET SEEN. <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--brand-lime) 0%, var(--brand-teal) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              GET AHEAD.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2.2vw, 19px)',
              color: 'rgba(255, 255, 255, 0.82)',
              lineHeight: 1.6,
              marginBottom: 'var(--space-6)',
              maxWidth: '540px',
            }}
          >
            AageOnline connects businesses with competitive paid visibility within defined <strong>Location + Category</strong> markets. Qualifying payments purchase verifiable ranking positions (#1, #2, #3...) backed by immutable transaction history.
          </p>

          {/* Frosted Glass Market Quick Selectors (Probid Home 2 split hero inspiration) */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 18px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Location Selector */}
            <div style={{ flex: '1 1 140px' }}>
              <label
                htmlFor="hero-location-select"
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                }}
              >
                📍 Location
              </label>
              <select
                id="hero-location-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  paddingTop: '2px',
                }}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc} style={{ backgroundColor: '#0b1f3b', color: '#ffffff' }}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

            {/* Category Selector */}
            <div style={{ flex: '1 1 180px' }}>
              <label
                htmlFor="hero-category-select"
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                }}
              >
                🏷️ Category
              </label>
              <select
                id="hero-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  paddingTop: '2px',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} style={{ backgroundColor: '#0b1f3b', color: '#ffffff' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Action */}
            <a
              href={`/explore?location=${encodeURIComponent(selectedLocation.toLowerCase())}&category=${encodeURIComponent(selectedCategory.toLowerCase())}`}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--brand-lime)',
                color: 'var(--brand-deep-navy)',
                fontWeight: 800,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: 'auto',
                boxShadow: '0 2px 8px rgba(199, 240, 0, 0.3)',
                transition: 'transform var(--motion-fast)',
              }}
            >
              Explore →
            </a>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-6)',
            }}
          >
            <a
              href="/explore"
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--brand-emerald)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '15px',
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              Explore Local Markets →
            </a>

            <a
              href="/claim"
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Claim Your Business
            </a>
          </div>

          {/* Concise Trust Points */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.65)',
              fontWeight: 600,
            }}
          >
            <span>✓ Transparent Positions</span>
            <span>•</span>
            <span>✓ Verified Payments</span>
            <span>•</span>
            <span>✓ Auditable Ranking</span>
          </div>
        </div>

        {/* Right Column: 2.5D Interactive Market Ladder Visual */}
        <div>
          <HeroMarketVisual />
        </div>
      </div>
    </section>
  );
};
