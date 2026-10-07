'use client';

import React from 'react';
import { siteConfig } from '../../config/site';

export function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: 'var(--brand-deep-navy)',
        color: 'rgba(255, 255, 255, 0.85)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 'var(--space-12) 0 var(--space-8) 0',
        marginTop: 'var(--space-12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-150px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        {/* Top Section: Brand Statement & Market Alerts (Norma style) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-8)',
            paddingBottom: 'var(--space-10)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: 'var(--space-10)',
          }}
        >
          {/* Brand Vision */}
          <div>
            <span
              style={{
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                display: 'block',
                lineHeight: 1.1,
                marginBottom: 'var(--space-2)',
              }}
            >
              Aage<span style={{ color: 'var(--brand-teal)' }}>Online</span>
            </span>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--brand-lime)',
                letterSpacing: '-0.01em',
                marginBottom: 'var(--space-3)',
              }}
            >
              {siteConfig.tagline}
            </p>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '460px',
              }}
            >
              The transparent competitive visibility platform for local businesses across India. Qualifying payments purchase verifiable ranking positions inside defined Location + Category markets.
            </p>
          </div>

          {/* Market Alerts / Subscription Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h4
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 'var(--space-1)',
              }}
            >
              Get Local Market Activity Updates
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.65)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Receive alerts when position movements, new bids, or competitor qualifications occur in your city.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Market alerts subscription recorded for your market.');
              }}
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="email"
                required
                placeholder="Enter your business email"
                aria-label="Email for market activity alerts"
                style={{
                  flex: '1 1 200px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 22px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--brand-lime)',
                  color: 'var(--brand-deep-navy)',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: '44px',
                  boxShadow: '0 4px 12px rgba(199, 240, 0, 0.25)',
                  transition: 'opacity var(--motion-fast)',
                }}
              >
                Subscribe →
              </button>
            </form>
          </div>
        </div>

        {/* Multi-Column Editorial Links Grid (Norma style) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-10)',
          }}
        >
          {/* Col 1: Explore Markets */}
          <div>
            <h5
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-teal)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Active Markets
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><a href="/jaipur/interior-designers" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Jaipur · Interior Designers</a></li>
              <li><a href="/noida/restaurants" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Noida · Restaurants</a></li>
              <li><a href="/delhi/digital-marketing-agencies" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Delhi · Digital Agencies</a></li>
              <li><a href="/gurugram/architects" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Gurugram · Commercial Architects</a></li>
              <li><a href="/hisar/hospitals" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Hisar · Hospitals</a></li>
              <li><a href="/explore" style={{ color: 'var(--brand-lime)', textDecoration: 'none', fontWeight: 700 }}>Browse All Markets →</a></li>
            </ul>
          </div>

          {/* Col 2: For Businesses */}
          <div>
            <h5
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-teal)',
                marginBottom: 'var(--space-4)',
              }}
            >
              For Businesses
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><a href="/claim" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Claim Your Listing</a></li>
              <li><a href="/workspace" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Business Workspace</a></li>
              <li><a href="/how-it-works" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Position Ladder Rules</a></li>
              <li><a href="/how-it-works#rules" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Whole Rupee Bidding Policy</a></li>
              <li><a href="/workspace/rankings" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Position History &amp; Audits</a></li>
            </ul>
          </div>

          {/* Col 3: Platform & Trust */}
          <div>
            <h5
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-teal)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Trust &amp; Governance
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><a href="/trust" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Trust Architecture</a></li>
              <li><a href="/trust#security" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Security Invariants (SEC-01–20)</a></li>
              <li><a href="/trust#integrity" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Payment Finality &amp; No Refunds</a></li>
              <li><a href="/grievance" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Grievance Officer (IT Act)</a></li>
              <li><a href="/terms" style={{ color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none' }}>Terms of Service</a></li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div>
            <h5
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-teal)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Platform Identity
            </h5>
            <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.65)' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>Zero Algorithmic Bias:</strong> Rankings are strictly governed by transparent, verified qualifying amounts within atomic database transactions.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Authoritative Ledger:</strong> Every position mutation produces an immutable, append-only history record.
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Statutory Paid Visibility Disclosure */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4) var(--space-6)',
            marginBottom: 'var(--space-6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              lineHeight: 1.55,
              color: 'rgba(255, 255, 255, 0.65)',
              margin: 0,
            }}
          >
            <strong>Mandatory Consumer Disclosure:</strong> Visibility rankings displayed on AageOnline represent verified paid competitive visibility positions and do not constitute an objective certification, accreditation, or endorsement of business quality, customer service, or organic excellence. All transactions are denominated exclusively in Indian Rupees (INR).
          </p>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div>
            © {new Date().getFullYear()} AageOnline Platform. All rights reserved. Get Seen. Get Ahead.
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <a href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Terms of Service</a>
            <a href="/grievance" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Grievance Officer</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
