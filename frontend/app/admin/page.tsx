import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';

export const metadata: Metadata = {
  title: 'Platform Administration — AageOnline Admin',
  description: 'AageOnline administrative operations and governance control center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminIndexPage() {
  return (
    <div style={{ padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0', minHeight: 'calc(100vh - 200px)' }}>
      <Container>
        <PageHeader
          eyebrow="Platform Administration"
          title="AageOnline Control Center"
          description="Centralized administration for financial reconciliation, settlement recovery, taxonomy governance, and operational readiness."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-6)',
            marginTop: 'var(--space-8)',
          }}
        >
          <Card elevation={1} style={{ padding: 'var(--space-6)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--action-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Financial Reliability &amp; Jobs
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--space-2)' }}>
              Financial Operations &amp; Reconciler
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-3) 0 var(--space-6)', lineHeight: 1.6 }}>
              Inspect unresolved payment orders, trigger on-demand PayU reconciliation, monitor atomic ranking settlement recoveries, and observe scheduled worker heartbeats.
            </p>
            <Link
              href="/admin/operations"
              style={{
                display: 'inline-block',
                background: 'var(--brand-deep-emerald)',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                textDecoration: 'none',
              }}
            >
              Open Operations Center →
            </Link>
          </Card>

          <Card elevation={1} style={{ padding: 'var(--space-6)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--action-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Taxonomy &amp; Discovery
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--space-2)' }}>
              Discovery &amp; Taxonomy Governance
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-3) 0 var(--space-6)', lineHeight: 1.6 }}>
              Review unlisted categories, approve discovered cities, manage publication states, and ensure zero unreviewed doorway routes exist in the public sitemap.
            </p>
            <Link
              href="/admin/discovery"
              style={{
                display: 'inline-block',
                background: 'var(--brand-deep-emerald)',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                textDecoration: 'none',
              }}
            >
              Open Taxonomy Center →
            </Link>
          </Card>
        </div>
      </Container>
    </div>
  );
}
