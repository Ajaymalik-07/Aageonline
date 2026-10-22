import React from 'react';
import type { Metadata } from 'next';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/ui/PageHeader';
import { siteConfig } from '../../config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy — AageOnline',
  description: 'How AageOnline collects, uses, and safeguards information in accordance with Indian information technology regulations.',
  alternates: {
    canonical: `${siteConfig.url}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0', minHeight: '80vh' }}>
      <Container>
        <PageHeader
          eyebrow="Governance & Data Protection"
          title="Privacy Policy"
          description="How AageOnline collects, processes, and protects representative and commercial business data across our transparent competitive visibility platform."
        />

        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            color: 'var(--text-primary)',
            fontSize: '15px',
            lineHeight: 1.75,
          }}
        >
          {/* Statutory Review Notice Callout */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              marginBottom: 'var(--space-8)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          >
            <strong>Statutory Transparency Notice:</strong> AageOnline operates in accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023. Certain operational entities and registered office particulars are highlighted below with <code>[LEGAL REVIEW REQUIRED]</code> flags pending final corporate filing disclosures.
          </div>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              1. Platform Purpose &amp; Scope
            </h2>
            <p style={{ marginBottom: '12px' }}>
              AageOnline (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) is a commercial business visibility and competitive positioning platform. We enable verified Indian business entities to achieve transparent paid ranking positions (#1, #2, #3, etc.) within distinct municipal <strong>Location + Category</strong> markets.
            </p>
            <p>
              This Privacy Policy governs the collection, use, and disclosure of information when authorized business representatives, consumers, and directory visitors access or interact with our web services.
            </p>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              2. Information We Collect
            </h2>
            <p style={{ marginBottom: '12px' }}>
              We collect information strictly necessary to establish business identity, verify representative authority, process qualifying visibility transactions, and maintain immutable audit histories:
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Representative Identity &amp; Auth:</strong> Authorized representative full name, contact email address, and mobile phone number collected during representative verification and OTP authentication.
              </li>
              <li>
                <strong>Commercial Business Details:</strong> Legal business name, trade name, operational address, municipal location, business category, telephone numbers, public website URLs, and optional tax/entity identifiers (GSTIN/CIN) provided during registration or claim.
              </li>
              <li>
                <strong>Claim &amp; Verification Evidence:</strong> Documentation submitted to verify operational authority over a business profile (e.g. utility bills, registration certificates, or authorized domain verification).
              </li>
              <li>
                <strong>Financial Transaction Metadata:</strong> Qualifying transaction amounts (in Indian Rupees), payment gateway transaction identifiers, order tokens, and timestamps.
              </li>
            </ul>
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
            >
              <strong>Zero Cardholder Data Storage Invariant:</strong> We do not store, process, or transmit credit/debit card primary account numbers (PAN), CVVs, UPI PINs, or net banking passwords on our servers. All financial payment entries are handled directly by certified, PCI-DSS compliant payment gateways.
            </div>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              3. Purpose &amp; Lawful Basis of Processing
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Data collected is processed pursuant to valid contractual performance, statutory compliance, and legitimate operational interests:
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>To verify identity and prevent unauthorized business claims or identity impersonation.</li>
              <li>To allocate ranking positions deterministically inside atomic database transactions.</li>
              <li>To maintain immutable, append-only position movement ledgers and audit records.</li>
              <li>To communicate transaction receipts, outbid notifications, and security alerts.</li>
              <li>To enforce statutory regulatory disclosures required by consumer protection and intermediary guidelines.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              4. Data Retention &amp; Security Controls
            </h2>
            <p style={{ marginBottom: '12px' }}>
              We enforce multi-layered defense-in-depth security to protect platform records:
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>All web communications are encrypted in transit using Transport Layer Security (TLS 1.3).</li>
              <li>Database credentials and server secrets are strictly isolated server-side.</li>
              <li>Authentication cookies utilize HttpOnly, SameSite=Strict, and cryptographic HMAC-SHA256 signing.</li>
              <li>Financial transaction logs and audit trail records are retained pursuant to statutory Indian tax and corporate recordkeeping mandates.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              5. Corporate Entity &amp; Grievance Redressal
            </h2>
            <p style={{ marginBottom: '12px' }}>
              For queries, data rights requests, or statutory redressal, you may contact our designated Grievance Officer:
            </p>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Platform Operator:</strong> AageOnline
              </p>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Corporate Registration:</strong> <code>[LEGAL REVIEW REQUIRED — Formal Entity Name &amp; CIN Pending Incorporation Details]</code>
              </p>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Registered Office Address:</strong> <code>[LEGAL REVIEW REQUIRED — Official Registered Office Address]</code>
              </p>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Privacy &amp; Data Protection Officer:</strong> <a href="mailto:privacy@aageonline.in" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>privacy@aageonline.in</a>
              </p>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Grievance Redressal Email:</strong> <a href="mailto:grievance@aageonline.in" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>grievance@aageonline.in</a>
              </p>
              <p style={{ margin: 0 }}>
                <strong>Dedicated Grievance Portal:</strong> <a href="/grievance" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>View Grievance Redressal Mechanism &amp; Timelines →</a>
              </p>
            </div>
          </section>

          <section>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Last Updated: October 2026 · Version 1.0
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
