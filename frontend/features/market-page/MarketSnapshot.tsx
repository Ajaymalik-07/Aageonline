'use client';

import React from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';

interface MarketSnapshotProps {
  market: Market;
}

export const MarketSnapshot: React.FC<MarketSnapshotProps> = ({ market }) => {
  const cards = [
    {
      label: 'Businesses Competing',
      value: `${market.totalBusinesses}`,
      subtext: 'Verified local entities',
      icon: '🏢',
    },
    {
      label: 'Paid Visibility Positions',
      value: `${market.activePositions}`,
      subtext: 'Numbered ladder slots',
      icon: '📊',
    },
    {
      label: 'Top Qualifying Amount',
      value: formatINR(market.topQualifyingAmountMinor),
      subtext: '#1 position qualification floor',
      icon: '₹',
      highlight: true,
    },
    {
      label: 'Market Definition',
      value: `${market.location.name}`,
      subtext: `${market.location.state}, India`,
      icon: '📍',
    },
  ];

  return (
    <section
      id="market-snapshot"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '32px 0',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform var(--motion-fast), box-shadow var(--motion-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {c.label}
                </span>
                <span style={{ fontSize: '16px' }} aria-hidden="true">
                  {c.icon}
                </span>
              </div>

              <div>
                <strong
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: c.highlight ? '#EA580C' : 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {c.value}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  {c.subtext}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
