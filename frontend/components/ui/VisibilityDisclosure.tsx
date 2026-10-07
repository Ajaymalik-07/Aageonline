import React from 'react';
import { siteConfig } from '../../config/site';

export interface VisibilityDisclosureProps {
  compact?: boolean;
}

export const VisibilityDisclosure: React.FC<VisibilityDisclosureProps> = ({ compact = false }) => {
  return (
    <aside
      aria-label="Paid Visibility Disclosure"
      style={{
        padding: compact ? 'var(--space-2) var(--space-3)' : 'var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(11, 31, 59, 0.04)',
        borderLeft: '3px solid var(--brand-teal)',
        margin: 'var(--space-3) 0',
      }}
      className="aage-visibility-disclosure"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-deep-emerald)', textTransform: 'uppercase' }}>
          Sponsored Visibility Notice
        </span>
      </div>
      <p
        style={{
          fontSize: compact ? '12px' : '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          marginTop: '4px',
        }}
      >
        {siteConfig.disclosures.paidVisibility}
      </p>
    </aside>
  );
};
