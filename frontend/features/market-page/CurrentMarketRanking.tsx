'use client';

import React, { useState } from 'react';
import type { MarketBusinessItem } from '../../data/markets/jaipur-interior-designers';
import { JAIPUR_INTERIOR_DESIGNERS_MARKET } from '../../data/markets/jaipur-interior-designers';
import type { Market, RankingEntry } from '../../types/market';
import { formatINR } from '../../lib/utils/format';
import { BidModal } from '../bidding/BidModal';

interface CurrentMarketRankingProps {
  rankings: MarketBusinessItem[];
  locationName: string;
  categoryName: string;
  market?: Market;
}

export const CurrentMarketRanking: React.FC<CurrentMarketRankingProps> = ({
  rankings,
  locationName,
  categoryName,
  market,
}) => {
  const [selectedBusiness, setSelectedBusiness] = useState<MarketBusinessItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const rankingEntries: RankingEntry[] = rankings.map((r) => ({
    position: r.rank,
    businessId: r.id,
    businessName: r.name,
    businessSlug: r.slug,
    isVerified: r.isVerified,
    visibilityAmountMinor: r.qualifyingAmountRupees * 100,
    updatedAt: new Date().toISOString(),
  }));

  const handleOpenMoveUp = (item: MarketBusinessItem) => {
    setSelectedBusiness(item);
    setIsModalOpen(true);
  };

  return (
    <section
      id="current-rankings"
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(40px, 6vw, 64px) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#EA580C',
              }}
            >
              TRANSPARENT COMMERCIAL LADDER
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            Current Market Ranking
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
            See businesses currently holding paid visibility positions within the {locationName} {categoryName} market. Qualifying amounts are verified on the server and recorded in the audit trail.
          </p>
        </div>

        {/* Ranking Table Container */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(11, 31, 51, 0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      width: '90px',
                    }}
                  >
                    RANK
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    BUSINESS
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    AREA / NEIGHBORHOOD
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    QUALIFYING AMOUNT
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                      width: '140px',
                    }}
                  >
                    ACTION
                  </th>
                </tr>
              </thead>

              <tbody>
                {rankings.map((item) => {
                  const isHovered = hoveredRowId === item.id;
                  const isRank1 = item.rank === 1;
                  const isRank2 = item.rank === 2;
                  const isRank3 = item.rank === 3;

                  const rowBg = isHovered
                    ? isRank1
                      ? 'rgba(234, 88, 12, 0.08)'
                      : isRank2
                      ? 'rgba(71, 85, 105, 0.06)'
                      : isRank3
                      ? 'rgba(217, 119, 6, 0.06)'
                      : 'rgba(255, 247, 237, 0.7)'
                    : isRank1
                    ? 'rgba(234, 88, 12, 0.03)'
                    : isRank2
                    ? 'rgba(71, 85, 105, 0.02)'
                    : isRank3
                    ? 'rgba(217, 119, 6, 0.02)'
                    : 'transparent';

                  return (
                    <tr
                      key={item.id}
                      onMouseEnter={() => setHoveredRowId(item.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: rowBg,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* 1. RANK Badge */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {isRank1 ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 900,
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            👑 #1
                          </span>
                        ) : isRank2 ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            🥈 #2
                          </span>
                        ) : isRank3 ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            🥉 #3
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: '#F8FAFC',
                              color: '#64748B',
                              border: '1px solid #E2E8F0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            #{item.rank}
                          </span>
                        )}
                      </td>

                      {/* 2. BUSINESS Column */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div>
                          <strong
                            style={{
                              fontSize: isRank1 ? '15px' : '14px',
                              fontWeight: isRank1 ? 900 : 700,
                              color: 'var(--text-primary)',
                              display: 'block',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.name}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {item.specialties.slice(0, 2).join(' · ')}
                          </span>
                        </div>
                      </td>

                      {/* 3. AREA / NEIGHBORHOOD */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          📍 {item.area}, Jaipur
                        </span>
                      </td>

                      {/* 4. QUALIFYING AMOUNT */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <strong
                          style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: isRank1 ? '#EA580C' : 'var(--text-primary)',
                          }}
                        >
                          {formatINR(item.qualifyingAmountRupees * 100)}
                        </strong>
                      </td>

                      {/* 5. STATUS */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#16a34a',
                            backgroundColor: 'rgba(22, 163, 74, 0.1)',
                            border: '1px solid rgba(22, 163, 74, 0.25)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          ✓ Verified
                        </span>
                      </td>

                      {/* 6. ACTION */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenMoveUp(item)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: '#EA580C',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all var(--motion-fast)',
                            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                          }}
                        >
                          Move Up →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Banner */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#FAFAFA',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span>Showing top {rankings.length} qualifying {categoryName === 'Restaurants' ? 'restaurants' : 'businesses'} in {locationName}</span>
            <span>Amounts verified server-side in Indian Rupees (INR)</span>
          </div>
        </div>
      </div>

      {/* Claim / Move Up Modal */}
      {selectedBusiness && (
        <BidModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          market={market || JAIPUR_INTERIOR_DESIGNERS_MARKET}
          currentRankings={rankingEntries}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
          initialTargetPosition={selectedBusiness.rank}
        />
      )}
    </section>
  );
};
