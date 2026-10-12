'use client';

import React from 'react';

export const PaidVisibilityDisclosureSection: React.FC = () => {
  return (
    <section
      id="disclosure"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(40px, 5vw, 64px) 0',
      }}
    >
      <div className="container">
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'var(--surface-soft)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(24px, 4vw, 36px)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '24px' }} aria-hidden="true">
              ⚖️
            </span>
            <h2
              style={{
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              Paid Visibility & Consumer Protection Disclosure
            </h2>
          </div>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            <strong>AageOnline rankings represent commercial paid visibility positions</strong> acquired through verified qualifying transactions by eligible businesses within this Location + Category market. A higher position (#1, #2, #3...) indicates that a business has met eligibility criteria and submitted a higher qualifying payment under our published ranking rules.
          </p>

          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              marginBottom: '20px',
            }}
          >
            A higher ranking <strong>does not certify that a business is objectively the best business</strong>, nor does it represent an editorial endorsement, qualitative rating, artistic award, or safety warranty by AageOnline. Consumers should always perform independent evaluation, request client references, inspect physically completed past projects, and sign comprehensive contracts with formal BOQs before making hiring decisions.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(234, 88, 12, 0.2)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 700,
            }}
          >
            <span>✓ Commercial Visibility Disclosed</span>
            <span>•</span>
            <span>✓ No Fake Reviews or Algorithmic Ratings</span>
            <span>•</span>
            <span>✓ Consumer Due Diligence Advised</span>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};
