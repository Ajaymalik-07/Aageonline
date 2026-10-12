import React from 'react';
import type { Metadata } from 'next';
import { Container } from '../../../components/layout/Container';
import { PageHeader } from '../../../components/ui/PageHeader';
import { OperationsDashboardClient } from './OperationsDashboardClient';

export const metadata: Metadata = {
  title: 'Financial Operations & Reconciliation — AageOnline Admin',
  description: 'Monitor payment reconciliation, ranking settlement recovery, and worker heartbeats.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOperationsPage() {
  return (
    <div style={{ padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0', minHeight: 'calc(100vh - 200px)' }}>
      <Container>
        <PageHeader
          eyebrow="Admin Operations & Production Reliability"
          title="Financial Operations & Reconciliation Center"
          description="Inspect unresolved payment orders, monitor atomic ranking settlement recoveries, observe background reconciler heartbeats, and audit manual operational interventions."
        />
        <div style={{ marginTop: 'var(--space-6)' }}>
          <OperationsDashboardClient />
        </div>
      </Container>
    </div>
  );
}
