'use client';

import React from 'react';
import type { MarketBusinessItem } from '../../data/markets/jaipur-interior-designers';
import { formatINR } from '../../lib/utils/format';

interface BusinessesInMarketProps {
  businesses: MarketBusinessItem[];
  locationName: string;
  categoryName: string;
}

export const BusinessesInMarket: React.FC<BusinessesInMarketProps> = ({
  businesses,
  locationName,
  categoryName,
}) => {
  return (
    <section
      id="businesses"
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(40px, 6vw, 64px) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: '28px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#EA580C',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            DISCOVERY DIRECTORY
          </span>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            Businesses in the {locationName} {categoryName} Market
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
            Explore verified local {categoryName.toLowerCase()} holding active visibility positions within {locationName}.
          </p>
        </div>

        {/* 3-Column Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {businesses.map((biz) => {
            const isRank1 = biz.rank === 1;

            return (
              <div
                key={biz.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: isRank1 ? '1.5px solid #EA580C' : '1px solid var(--border-subtle)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(11, 31, 51, 0.05)',
                  transition: 'transform var(--motion-normal), box-shadow var(--motion-normal)',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Top Header: Rank + Verification Status */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isRank1 ? '#EA580C' : '#0B1F33',
                        color: '#ffffff',
                      }}
                    >
                      #{biz.rank}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#16a34a',
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ✓ Verified Entity
                    </span>
                  </div>

                  {/* Business Name */}
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      margin: '0 0 6px 0',
                    }}
                  >
                    {biz.name}
                  </h3>

                  {/* Area and Category */}
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <span>📍 {biz.area}, {locationName}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {biz.category}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: '0 0 16px 0',
                    }}
                  >
                    {biz.description}
                  </p>

                  {/* Specialties Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {biz.specialties.map((spec, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: 'var(--surface-raised)',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer: Qualifying Floor + Action */}
                <div
                  style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>
                      Qualifying Floor
                    </span>
                    <strong style={{ fontSize: '15px', fontWeight: 900, color: isRank1 ? '#EA580C' : 'var(--text-primary)' }}>
                      {formatINR(biz.qualifyingAmountRupees * 100)}
                    </strong>
                  </div>

                  <a
                    href={`/businesses/${biz.slug}`}
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#EA580C',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View business →
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
