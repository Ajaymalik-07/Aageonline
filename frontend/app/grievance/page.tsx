import React from 'react';
import type { Metadata } from 'next';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/ui/PageHeader';
import { siteConfig } from '../../config/site';

export const metadata: Metadata = {
  title: 'Grievance Officer & Statutory Redressal — AageOnline',
  description: 'Consumer and business grievance redressal mechanism pursuant to Rule 5(2) of the Information Technology Rules, 2021.',
  alternates: {
    canonical: `${siteConfig.url}/grievance`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GrievanceOfficerPage() {
  return (
    <div style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0', minHeight: '80vh' }}>
      <Container>
        <PageHeader
          eyebrow="Statutory Redressal Mechanism"
          title="Grievance Redressal Officer"
          description="In compliance with Rule 5(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and consumer protection regulations."
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
          {/* Official Grievance Officer Particulars Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚖️</span> Designated Grievance Officer Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>
                  Designated Officer
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Grievance Redressal Officer
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: '#EA580C', marginTop: '2px' }}>
                  <code>[LEGAL REVIEW REQUIRED — Officer Appointee Name to be formally designated by Board]</code>
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>
                  Direct Redressal Email
                </span>
                <a
                  href="mailto:grievance@aageonline.in"
                  style={{
                    fontWeight: 800,
                    color: 'var(--action-primary)',
                    textDecoration: 'none',
                    fontSize: '15px',
                  }}
                >
                  grievance@aageonline.in
                </a>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Official statutory mailbox for complaints
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>
                  Corporate Entity
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  AageOnline Platform
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: '#EA580C', marginTop: '2px' }}>
                  <code>[LEGAL REVIEW REQUIRED — Formal Entity Name &amp; CIN]</code>
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>
                  Physical &amp; Postal Address
                </span>
                <span style={{ fontSize: '13px', color: '#EA580C' }}>
                  <code>[LEGAL REVIEW REQUIRED — Official Registered Office Address]</code>
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Timelines Callout */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              1. Statutory Redressal Timelines
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Pursuant to the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, AageOnline adheres to strict, legally mandated operational timelines:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                  Stage 1: Acknowledgment
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>
                  Within 48 Hours
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  A unique Ticket Reference Number is issued upon receipt of any written grievance.
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(234, 88, 12, 0.08)',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                  Stage 2: Resolution &amp; Disposal
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>
                  Within 15 Days
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Thorough investigation and written determination or remediation delivered to complainant.
                </p>
              </div>
            </div>
          </section>

          {/* Submission Process */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              2. How to File a Grievance
            </h2>
            <p style={{ marginBottom: '12px' }}>
              To ensure prompt investigation, your complaint email to <a href="mailto:grievance@aageonline.in" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>grievance@aageonline.in</a> should include:
            </p>
            <ol style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Complainant Identification:</strong> Full legal name, contact telephone number, and postal or verified email address.
              </li>
              <li>
                <strong>Representation Capacity:</strong> Clear statement whether filing as an individual consumer, authorized business owner, or legal counsel.
              </li>
              <li>
                <strong>Target Listing / Market:</strong> Specific URL on AageOnline (e.g. <code>https://aageonline.com/jaipur/interior-designers</code> or business profile URL) and entity name.
              </li>
              <li>
                <strong>Nature of Complaint:</strong> Detailed description of the issue (e.g. business identity impersonation, unauthorized representative claim, technical discrepancy in published records, or intellectual property infringement).
              </li>
              <li>
                <strong>Supporting Evidence:</strong> Verifiable documentation supporting the grievance (e.g. certificate of incorporation, trademark registration, or identity documents).
              </li>
            </ol>
          </section>

          {/* Scope of Redressal */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              3. Scope &amp; Commercial Clarification
            </h2>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface-soft)',
                border: '1px solid var(--border-subtle)',
                fontSize: '14px',
              }}
            >
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Commercial Visibility Disputes:</strong> Ranking positions on AageOnline represent transparent paid competitive visibility purchased via verified transactions. Competitor rank adjustments resulting from higher qualifying payments are part of normal platform mechanics and do not constitute a platform defect.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Quality &amp; Fulfillment Disputes:</strong> AageOnline is a discovery and positioning directory and is not a party to commercial contracts or services executed between consumers and listed commercial vendors.
              </p>
            </div>
          </section>

          <section>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Statutory Disclosure under Information Technology Rules, 2021 · Last Updated: October 2026
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
