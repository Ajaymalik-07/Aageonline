'use client';

import React, { useState, useEffect } from 'react';
import type { MarketSpotlight } from '../../types/market';
import { PositionBadge } from './PositionBadge';
import { PositionMovement } from './PositionMovement';
import { formatINR } from '../../lib/utils/format';

export interface LiveSpotlightProps {
  spotlight: MarketSpotlight;
  onExploreMarket?: (slug: string) => void;
}

interface StageEntry {
  id: string;
  name: string;
  position: number;
  amountMinor: number;
  movement: 'up' | 'down' | 'same';
  movementCount?: number;
  tier: 'crown' | 'podium-flank' | 'support';
}

const INITIAL_STAGE_ENTRIES: StageEntry[] = [
  {
    id: 'biz-abc',
    name: 'ABC Interiors',
    position: 1,
    amountMinor: 2600000,
    movement: 'same',
    tier: 'crown',
  },
  {
    id: 'biz-xyz',
    name: 'Studio XYZ',
    position: 2,
    amountMinor: 2450000,
    movement: 'same',
    tier: 'podium-flank',
  },
  {
    id: 'biz-des',
    name: 'Design House',
    position: 3,
    amountMinor: 2200000,
    movement: 'same',
    tier: 'podium-flank',
  },
  {
    id: 'biz-urb',
    name: 'Urban Interiors',
    position: 4,
    amountMinor: 2050000,
    movement: 'same',
    tier: 'support',
  },
  {
    id: 'biz-spc',
    name: 'SpaceCraft Studio',
    position: 5,
    amountMinor: 1900000,
    movement: 'same',
    tier: 'support',
  },
];

export const LiveSpotlight: React.FC<LiveSpotlightProps> = ({
  spotlight,
  onExploreMarket,
}) => {
  const { market } = spotlight;
  const [entries, setEntries] = useState<StageEntry[]>(INITIAL_STAGE_ENTRIES);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(true);
  const [activeShiftNotice, setActiveShiftNotice] = useState<string>(
    'Live Market Stage · Real-time position hierarchy'
  );

  // Deterministic demonstration cycle: swaps #2 and #3 to illustrate competitive shift
  useEffect(() => {
    if (!isDemoActive) return;

    const timer = setInterval(() => {
      setEntries((prev) => {
        const next = [...prev];
        const second = next[1];
        const third = next[2];

        if (second.amountMinor > third.amountMinor) {
          // Third outbids second
          const newThirdAmount = second.amountMinor + 100000;
          next[1] = {
            ...third,
            position: 2,
            amountMinor: newThirdAmount,
            movement: 'up',
            movementCount: 1,
          };
          next[2] = {
            ...second,
            position: 3,
            movement: 'down',
            movementCount: 1,
          };
          setActiveShiftNotice(`${third.name} qualified with ${formatINR(newThirdAmount)} and moved to #2`);
        } else {
          // Second reclaims
          const newSecondAmount = third.amountMinor + 100000;
          next[1] = {
            ...second,
            position: 2,
            amountMinor: newSecondAmount,
            movement: 'up',
            movementCount: 1,
          };
          next[2] = {
            ...third,
            position: 3,
            movement: 'down',
            movementCount: 1,
          };
          setActiveShiftNotice(`${second.name} qualified with ${formatINR(newSecondAmount)} and reclaimed #2`);
        }

        return next;
      });
    }, 6500);

    return () => clearInterval(timer);
  }, [isDemoActive]);

  const leader = entries.find((e) => e.position === 1) || entries[0];
  const numberTwo = entries.find((e) => e.position === 2) || entries[1];
  const numberThree = entries.find((e) => e.position === 3) || entries[2];
  const numberFour = entries.find((e) => e.position === 4) || entries[3];
  const numberFive = entries.find((e) => e.position === 5) || entries[4];

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--brand-deep-navy)',
        color: '#ffffff',
        padding: 'var(--space-8) var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--elevation-4)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Ambient Radial Spotlight Lighting & Background Grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Stage Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-lime)',
              }}
              className="live-indicator-dot"
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--brand-lime)',
              }}
            >
              Live Competitive Stage
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              High Market Activity
            </span>
          </div>

          <h3
            style={{
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {market.location.name} · <span style={{ color: 'var(--brand-teal)' }}>{market.category.name}</span>
          </h3>

          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0 0' }}>
            {market.totalBusinesses} businesses competing · 24 transparent paid positions
          </p>
        </div>

        {/* Demo Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsDemoActive(!isDemoActive)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isDemoActive ? '⏸ Pause Stage' : '▶ Play Stage'}
          </button>
          <a
            href={`/${market.slug}`}
            onClick={(e) => {
              if (onExploreMarket) {
                e.preventDefault();
                onExploreMarket(market.slug);
              }
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--brand-lime)',
              color: 'var(--brand-deep-navy)',
              fontWeight: 800,
              fontSize: '12px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(199, 240, 0, 0.3)',
            }}
          >
            Explore Market Ladder →
          </a>
        </div>
      </div>

      {/* Real-time Movement Status Bar */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-pill)',
          padding: '8px 16px',
          marginBottom: 'var(--space-8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.9)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span style={{ color: 'var(--brand-lime)', fontWeight: 800 }}>● ACTIVITY:</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeShiftNotice}
        </span>
      </div>

      {/* Spatial Stage / Podium Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--space-6)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Tier 1: Elevated Crown (#1 Position Leader) */}
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            border: '2px solid var(--brand-lime)',
            boxShadow: '0 0 35px rgba(199, 240, 0, 0.25)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--brand-lime)',
              color: 'var(--brand-deep-navy)',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '2px 14px',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            Leading Position
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
            <PositionBadge position={1} size="lg" />
          </div>

          <h4
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '4px',
            }}
          >
            {leader.name}
          </h4>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-teal)' }}>
              VERIFIED BUSINESS
            </span>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: 'var(--space-3)',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                Leading Qualifying Amount
              </span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--brand-lime)' }}>
                {formatINR(leader.amountMinor)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                Market Status
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-teal)' }}>
                Active Hold
              </span>
            </div>
          </div>
        </div>

        {/* Tier 2: Flanking Podium Positions (#2 and #3) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* #2 Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all var(--motion-normal)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PositionBadge position={numberTwo.position} size="md" />
              <div>
                <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {numberTwo.name}
                </h5>
                <PositionMovement direction={numberTwo.movement} positions={numberTwo.movementCount} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                {formatINR(numberTwo.amountMinor)}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Qualifying</span>
            </div>
          </div>

          {/* #3 Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all var(--motion-normal)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PositionBadge position={numberThree.position} size="md" />
              <div>
                <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {numberThree.name}
                </h5>
                <PositionMovement direction={numberThree.movement} positions={numberThree.movementCount} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                {formatINR(numberThree.amountMinor)}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Qualifying</span>
            </div>
          </div>
        </div>

        {/* Tier 3: Supporting Ladder Positions (#4 and #5) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* #4 Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PositionBadge position={numberFour.position} size="sm" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                {numberFour.name}
              </span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>
              {formatINR(numberFour.amountMinor)}
            </span>
          </div>

          {/* #5 Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PositionBadge position={numberFive.position} size="sm" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                {numberFive.name}
              </span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>
              {formatINR(numberFive.amountMinor)}
            </span>
          </div>
        </div>
      </div>

      {/* Statutory Paid Visibility Disclaimer */}
      <div
        style={{
          marginTop: 'var(--space-8)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0, maxWidth: '640px' }}>
          * Rankings reflect verified paid competitive visibility positions and do not constitute an independent assessment or guarantee of business quality.
        </p>

        <a
          href={`/${market.slug}`}
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--brand-lime)',
            textDecoration: 'none',
          }}
        >
          View Full 24-Position Ladder →
        </a>
      </div>
    </div>
  );
};
