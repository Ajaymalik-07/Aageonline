import React from 'react';
import type { Metadata } from 'next';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/ui/PageHeader';
import { siteConfig } from '../../config/site';

export const metadata: Metadata = {
  title: 'Terms of Service — AageOnline',
  description: 'Contractual terms governing participation, competitive paid visibility purchasing, and commercial use of the AageOnline platform.',
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0', minHeight: '80vh' }}>
      <Container>
        <PageHeader
          eyebrow="Platform Governance & Contracts"
          title="Terms of Service"
          description="Legal terms and operating conditions governing competitive paid visibility, market participation, and business profile ownership on AageOnline."
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
          {/* Statutory Review Callout */}
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
            <strong>Core Product Summary:</strong> AageOnline provides transparent, paid commercial visibility positions within defined municipal markets. All payments purchase designated rank positions at the atomic moment of transaction and are <strong>strictly non-refundable</strong> when overtaken by higher qualifying payments.
          </div>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              1. Acceptance &amp; Market Definition
            </h2>
            <p style={{ marginBottom: '12px' }}>
              By accessing, browsing, claiming a business profile, or completing a visibility transaction on AageOnline (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you are acting on behalf of a business entity, you represent and warrant that you hold actual legal authority to bind that commercial enterprise.
            </p>
            <p>
              <strong>Defined Market Invariant:</strong> Inside AageOnline, a &quot;Market&quot; is strictly defined as exactly one <strong>Location + Category</strong> pair (e.g., <em>Jaipur + Interior Designers</em>, <em>Delhi + Restaurants</em>). Businesses compete exclusively within their registered and verified market pair.
            </p>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              2. Nature of Paid Visibility Rankings (Statutory Disclosure)
            </h2>
            <p style={{ marginBottom: '12px' }}>
              <strong>Notice:</strong> Visibility rankings displayed on AageOnline represent paid competitive visibility positions (#1, #2, #3, etc.) determined strictly by qualifying payment transactions recorded in our immutable transaction ledger.
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Rankings do <strong>NOT</strong> represent an independent editorial endorsement, quality assessment, consumer satisfaction score, or government certification.</li>
              <li>AageOnline does not rate, review, or evaluate business craftsmanship, product safety, or service fulfillment.</li>
              <li>Consumers are explicitly advised to conduct independent due diligence prior to engaging any listed commercial vendor.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              3. Payment Finality &amp; Strict No-Refund Rule
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The competitive mechanism operates on strict, irrevocable financial finality:
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Atomic Position Allocation:</strong> When an eligible business completes a verified payment via our integrated payment gateways, the target ranking position is updated immediately inside an atomic database transaction.
              </li>
              <li>
                <strong>Payment Finality (No Refunds for Overtaken Positions):</strong> In the event another eligible competitor completes a higher qualifying transaction and overtakes your position, moving your business down in rank, <strong>previous payments remain non-refundable</strong>.
              </li>
              <li>
                <strong>Distinct Transactions:</strong> Each upward movement on the ranking ladder requires a distinct, freshly calculated server transaction.
              </li>
              <li>
                <strong>Whole Rupee Denomination:</strong> All transactions are calculated and executed strictly in whole Indian Rupees (INR) without fractional currency units.
              </li>
            </ul>
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
            >
              <strong>V1 Platform Boundaries:</strong> AageOnline V1 does NOT offer pre-funded wallets, cash withdrawals, balance credits, automated bidding bots, or recurring subscription billing locks. Every position change is an intentional, manually authorized discrete transaction.
            </div>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              4. Business Claims &amp; Verification Warranties
            </h2>
            <p style={{ marginBottom: '12px' }}>
              When claiming a commercial profile on AageOnline, the representative warrants and agrees that:
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>All submitted identification evidence, business documents, and contact details are genuine, accurate, and current.</li>
              <li>Impersonation of any third party, fraudulent registration, or unauthorized claiming of an operating entity constitutes a material breach and grounds for immediate profile suspension and reporting.</li>
              <li>AageOnline reserves the right to request renewed evidence of operational authority at any time.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              5. Prohibited Practices &amp; Platform Integrity
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Users and businesses are strictly prohibited from:
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Deploying automated scripts, headless browsers, or bot networks to execute artificial transactions or manipulate rank ladders.</li>
              <li>Circumventing server-side rate limits, CSRF defenses, or payment verification signatures.</li>
              <li>Submitting defamatory, deceptive, or infringing content in business showcases or social profiles.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              6. Dispute Resolution &amp; Governing Law
            </h2>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Governing Legislation:</strong> Laws of the Republic of India.
              </p>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Dispute Jurisdiction:</strong> <code>[LEGAL REVIEW REQUIRED — Exclusive Jurisdiction Venue (Jaipur/Delhi, India) Pending Final Counsel Designation]</code>
              </p>
              <p style={{ margin: 0 }}>
                <strong>Grievances:</strong> For statutory redressal, submit notice to <a href="mailto:grievance@aageonline.in" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>grievance@aageonline.in</a> per our <a href="/grievance" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>Grievance Redressal Policy</a>.
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
