import React from 'react';
import { Skeleton } from '../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Hero Shell Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <Skeleton width="180px" height="24px" borderRadius="var(--radius-pill)" />
        <Skeleton width="80%" height="48px" />
        <Skeleton width="95%" height="24px" />
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <Skeleton width="160px" height="44px" borderRadius="var(--radius-pill)" />
          <Skeleton width="140px" height="44px" borderRadius="var(--radius-pill)" />
        </div>
      </div>

      {/* Spotlight Shell Skeleton */}
      <Skeleton width="100%" height="220px" borderRadius="var(--radius-xl)" />

      {/* Market Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <Skeleton width="100%" height="130px" borderRadius="var(--radius-md)" />
        <Skeleton width="100%" height="130px" borderRadius="var(--radius-md)" />
        <Skeleton width="100%" height="130px" borderRadius="var(--radius-md)" />
        <Skeleton width="100%" height="130px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}
