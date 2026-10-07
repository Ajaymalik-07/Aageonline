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
      className="bg-ambient-market"
      style={{
        padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      <div
        className="container hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Editorial Vision + Market Selectors */}
        <div>
          <div style={{ display: 'inline-flex', marginBottom: 'var(--space-3)' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '4px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--brand-emerald)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
              }}
            >
              Market = Location + Category
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 68px)',
              fontWeight: 900,
              color: 'var(--brand-deep-navy)',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              marginBottom: 'var(--space-4)',
            }}
          >
            GET SEEN. <br />
            <span style={{ color: 'var(--brand-emerald)' }}>GET AHEAD.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2.2vw, 19px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--space-6)',
              maxWidth: '540px',
            }}
          >
            Compete for transparent paid visibility in your local market. Qualifying payments purchase verifiable ranking positions (#1, #2, #3...) within defined Location + Category pairs.
          </p>

          {/* Interactive Market Quick Selectors (Inspired by Probid Hero 2 search) */}
          <div
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-2)',
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
                style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}
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
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  paddingTop: '2px',
                }}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-subtle)' }} />

            {/* Category Selector */}
            <div style={{ flex: '1 1 180px' }}>
              <label
                htmlFor="hero-category-select"
                style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}
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
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  paddingTop: '2px',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Action */}
            <a
              href={`/explore?location=${encodeURIComponent(selectedLocation.toLowerCase())}&category=${encodeURIComponent(selectedCategory.toLowerCase())}`}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--action-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: 'auto',
                boxShadow: 'var(--elevation-1)',
              }}
            >
              Go →
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
                backgroundColor: 'var(--action-primary)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '15px',
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: 'var(--elevation-2)',
              }}
            >
              Explore Local Markets →
            </a>

            <a
              href="/claim"
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'transparent',
                border: '2px solid var(--border-strong)',
                color: 'var(--text-primary)',
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
              gap: '12px',
              fontSize: '12px',
              color: 'var(--text-muted)',
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
