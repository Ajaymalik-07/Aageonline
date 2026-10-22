import React from 'react';
import type { BusinessMarketParticipation } from '../../data-access/types.ts';

interface BusinessMarketParticipationSectionProps {
  participations: BusinessMarketParticipation[];
}

export function BusinessMarketParticipationSection({
  participations,
}: BusinessMarketParticipationSectionProps) {
  const hasParticipations = participations && participations.length > 0;

  return (
    <section
      id="market-participations"
      aria-labelledby="market-participation-heading"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#EA580C',
            marginBottom: 'var(--space-1)',
          }}
        >
          Competitive Visibility Landscapes
        </div>
        <h2
          id="market-participation-heading"
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 var(--space-2) 0',
            letterSpacing: '-0.01em',
          }}
        >
          Market Positions & Paid Visibility
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: '#475569',
            margin: 0,
            maxWidth: '680px',
            lineHeight: 1.55,
          }}
        >
          Markets where this business is verified and holds transparent paid visibility ranking positions.
          Ranking positions are strictly market-specific (Location + Category) and audited via immutable transaction records.
        </p>
      </div>

      {hasParticipations ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {participations.map((p) => {
            const hasPosition = typeof p.currentPosition === 'number' && p.currentPosition > 0;

            return (
              <div
                key={p.id}
                style={{
                  padding: 'var(--space-5)',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Left accent border */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: '4px',
                    backgroundColor: hasPosition ? '#EA580C' : '#94A3B8',
                  }}
                  aria-hidden="true"
                />

                <div style={{ paddingLeft: '4px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '4px',
                    }}
                  >
                    Location + Category Market
                  </div>
                  <h3
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: '0 0 var(--space-3) 0',
                    }}
                  >
                    {p.marketName}
                  </h3>

                  {/* Position badge */}
                  <div>
                    {hasPosition ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#FFF7ED',
                          border: '1px solid #FED7AA',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#EA580C',
                          }}
                        >
                          Rank #{p.currentPosition}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#7C2D12',
                          }}
                        >
                          Verified Paid Position
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                          }}
                          aria-hidden="true"
                        />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#475569',
                          }}
                        >
                          Eligible Market Participant
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market link */}
                <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid #E2E8F0', paddingLeft: '4px' }}>
                  <a
                    href={p.marketUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#EA580C',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Explore {p.cityName} Market Ladder
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: 'var(--space-6)',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed #CBD5E1',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: '#475569',
              margin: '0 0 var(--space-4) 0',
            }}
          >
            No active AageOnline market participation registered for this business.
          </p>
          <a
            href="/markets"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#EA580C',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              textDecoration: 'none',
            }}
          >
            Explore Available Commercial Markets →
          </a>
        </div>
      )}

      {/* Mandatory Paid Visibility Transparency Disclosure */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: '#FFF7ED',
          border: '1px solid #FED7AA',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-xs)',
          color: '#451A03',
          lineHeight: 1.55,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EA580C"
          strokeWidth="2.5"
          style={{ flexShrink: 0, marginTop: '2px' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          <strong style={{ color: '#9A3412', display: 'block', marginBottom: '2px' }}>
            Paid Visibility Transparency Disclosure
          </strong>
          This business&apos;s market position represents transparent paid visibility within the selected AageOnline market
          and does not independently establish an editorial endorsement. Rankings are maintained strictly through verified,
          server-audited transactions.
        </div>
      </div>
    </section>
  );
}
