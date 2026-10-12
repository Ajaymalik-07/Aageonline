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
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
        boxShadow: 'var(--elevation-1)',
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
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-2) 0',
          }}
        >
          AageOnline Market Participation
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '680px',
            lineHeight: 1.5,
          }}
        >
          Markets where this business is registered and actively competes for paid visibility positions.
          Ranking positions are strictly market-specific and do not represent a global or subjective rating.
        </p>
      </div>

      {hasParticipations ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Left accent border */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: '3px',
                    backgroundColor: hasPosition ? '#EA580C' : 'var(--text-tertiary)',
                  }}
                  aria-hidden="true"
                />

                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      marginBottom: '4px',
                    }}
                  >
                    Location + Category Market
                  </div>
                  <h3
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
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
                          backgroundColor: 'rgba(234, 88, 12, 0.1)',
                          border: '1px solid rgba(234, 88, 12, 0.25)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#EA580C',
                          }}
                        >
                          #{p.currentPosition}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Paid Visibility Position
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          padding: '4px 10px',
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
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Participating in this market
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market link */}
                <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                  <a
                    href={p.marketUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--brand-deep-emerald)',
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
            backgroundColor: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-subtle)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
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
          backgroundColor: 'rgba(234, 88, 12, 0.05)',
          border: '1px solid rgba(234, 88, 12, 0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EA580C"
          strokeWidth="2"
          style={{ flexShrink: 0, marginTop: '2px' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
            Paid Visibility Disclosure
          </strong>
          This business&apos;s market position represents paid visibility within the selected AageOnline market
          and does not independently establish that the business is the best choice. Positions are maintained
          transparently via qualifying transactions.
        </div>
      </div>
    </section>
  );
}
