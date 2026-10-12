'use client';

import React, { useState } from 'react';

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
        backgroundColor: '#071018',
        backgroundImage: `
          radial-gradient(circle at 85% 15%, rgba(234, 88, 12, 0.16) 0%, transparent 50%),
          radial-gradient(circle at 15% 85%, rgba(251, 146, 60, 0.08) 0%, transparent 50%),
          linear-gradient(180deg, #071018 0%, #0B1F33 50%, #0a1b2e 100%)
        `,
        color: '#ffffff',
        padding: 'clamp(var(--space-10), 7vw, 96px) 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Spatial Grid & Mesh Background */}
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

      {/* Subtle Central Radial Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(234, 88, 12, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
        {/* Eyebrow Pill */}
        <div style={{ display: 'inline-flex', marginBottom: 'var(--space-5)', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '6px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              color: '#FB923C',
              border: '1px solid rgba(234, 88, 12, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 10px rgba(234, 88, 12, 0.15)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#EA580C',
                display: 'inline-block',
                boxShadow: '0 0 8px #EA580C',
              }}
            />
            Market = Location + Category
          </span>
        </div>

        {/* Hero Headline */}
        <h1
          style={{
            fontSize: 'clamp(46px, 7.5vw, 82px)',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            marginBottom: 'var(--space-5)',
          }}
        >
          GET SEEN. <br />
          <span style={{ color: '#EA580C' }}>
            GET AHEAD.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: 'clamp(16px, 1.85vw, 19px)',
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-8)',
            maxWidth: '780px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textWrap: 'balance' as any,
          }}
        >
          AageOnline connects businesses with competitive paid visibility within defined <strong>Location + Category</strong> markets. Qualifying payments purchase verifiable ranking positions (#1, #2, #3...) backed by immutable transaction history.
        </p>

        {/* Frosted Glass Market Quick Selector */}
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto var(--space-8) auto',
            backgroundColor: 'rgba(15, 31, 51, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-pill)',
            padding: '10px 14px 10px 24px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            textAlign: 'left',
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
                <option key={loc} value={loc} style={{ backgroundColor: '#0B1F33', color: '#ffffff' }}>
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
                <option key={cat} value={cat} style={{ backgroundColor: '#0B1F33', color: '#ffffff' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Action Button */}
          <a
            href={`/explore?location=${encodeURIComponent(selectedLocation.toLowerCase())}&category=${encodeURIComponent(selectedCategory.toLowerCase())}`}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EA580C',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: 'auto',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
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
            justifyContent: 'center',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-6)',
          }}
        >
          <a
            href="/explore"
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EA580C',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(234, 88, 12, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              transition: 'transform var(--motion-fast), box-shadow var(--motion-fast)',
            }}
          >
            Explore Local Markets →
          </a>

          <a
            href="/claim"
            style={{
              padding: '14px 32px',
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
              transition: 'background-color var(--motion-fast)',
            }}
          >
            Claim Your Business
          </a>
        </div>

        {/* Concise Trust Points */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.7)',
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
      </div>
    </section>
  );
};

