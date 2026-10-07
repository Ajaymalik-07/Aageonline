import React from 'react';
import { siteConfig } from '../../config/site';

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--brand-deep-navy)',
        color: 'rgba(255, 255, 255, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 'var(--space-10) 0 var(--space-6) 0',
        marginTop: 'var(--space-12)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#ffffff',
                display: 'block',
                marginBottom: 'var(--space-2)',
              }}
            >
              AageOnline
            </span>
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.7)' }}>
              Transparent paid competitive business visibility platform. Businesses compete for verifiable ranking positions within distinct Location + Category markets.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: 'var(--space-3)' }}>
              Transparency &amp; Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li><a href="/trust" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Trust &amp; Governance</a></li>
              <li><a href="/terms" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Terms of Service</a></li>
              <li><a href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Privacy Policy</a></li>
              <li><a href="/grievance" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Grievance Officer</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: 'var(--space-3)' }}>
              Markets
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li><a href="/jaipur/interior-designers" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Jaipur Interior Designers</a></li>
              <li><a href="/noida/restaurants" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Noida Restaurants</a></li>
              <li><a href="/hisar/hospitals" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Hisar Hospitals</a></li>
              <li><a href="/explore" style={{ color: 'var(--brand-lime)', textDecoration: 'none', fontWeight: 600 }}>Explore All Markets →</a></li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 'var(--space-6)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span>© {new Date().getFullYear()} AageOnline. All rights reserved.</span>
          <span>Paid visibility positions do not certify objective business quality.</span>
        </div>
      </div>
    </footer>
  );
}
