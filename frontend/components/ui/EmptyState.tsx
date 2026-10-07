'use client';

import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = '🔍',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-6)',
        textAlign: 'center',
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-strong)',
        maxWidth: '540px',
        margin: '0 auto',
      }}
      className="aage-empty-state"
    >
      <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }} aria-hidden="true">
        {icon}
      </div>
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: actionText ? 'var(--space-5)' : 0,
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--action-primary)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
