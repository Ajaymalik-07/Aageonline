import React from 'react';
import { formatINR } from '../../lib/utils/format';

export interface MarketStatsProps {
  totalBusinesses: number;
  activePositions: number;
  topQualifyingAmountMinor: number;
  recentMovements24h?: number;
  competitionLevel?: string;
  className?: string;
}

export const MarketStats: React.FC<MarketStatsProps> = ({
  totalBusinesses,
  activePositions,
  topQualifyingAmountMinor,
  recentMovements24h = 12,
  competitionLevel = 'High',
  className = '',
}) => {
  const stats = [
    {
      label: 'Businesses Competing',
      value: String(totalBusinesses),
      subtext: 'Within Location + Category',
    },
    {
      label: 'Active Paid Positions',
      value: String(activePositions),
      subtext: 'Disclosed visibility ladder',
    },
    {
      label: 'Top Position Qualifying',
      value: formatINR(topQualifyingAmountMinor),
      subtext: 'Leading qualifying threshold',
      highlight: true,
    },
    {
      label: 'Movements in 24h',
      value: `${recentMovements24h} updates`,
      subtext: `${competitionLevel} competitive rate`,
    },
  ];

  return (
    <div
      className={`aage-market-stats ${className}`.trim()}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--elevation-1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {stat.label}
          </span>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: stat.highlight ? 'var(--brand-emerald)' : 'var(--brand-deep-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            {stat.value}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {stat.subtext}
          </span>
        </div>
      ))}
    </div>
  );
};
