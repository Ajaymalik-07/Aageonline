import React from 'react';
import type { Metadata } from 'next';
import { Container } from '../../../components/layout/Container';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DiscoveryDashboardClient } from './DiscoveryDashboardClient';
import { getAdminDiscoveryQueues } from '../../../lib/taxonomy/admin-service';
import { getAuditLogs } from '../../../lib/taxonomy/audit';

export const metadata: Metadata = {
  title: 'Discovery & Taxonomy Governance — AageOnline Admin',
  description: 'Manage unlisted categories, cities, states, and market publication workflows.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDiscoveryPage() {
  const queues = getAdminDiscoveryQueues();
  const auditLogs = getAuditLogs().slice(-50).reverse();

  return (
    <div style={{ padding: 'clamp(var(--space-8), 4vw, var(--space-12)) 0', minHeight: 'calc(100vh - 200px)' }}>
      <Container>
        <PageHeader
          eyebrow="Admin Governance / Taxonomy Engine"
          title="Discovery & Taxonomy Control Center"
          description="Monitor incoming market demand, review discovered cities and categories, control publication lifecycles, and maintain zero unreviewed low-quality doorway routes."
        />

        <div style={{ marginTop: 'var(--space-6)' }}>
          <DiscoveryDashboardClient initialQueues={queues} initialAuditLogs={auditLogs} />
        </div>
      </Container>
    </div>
  );
}
