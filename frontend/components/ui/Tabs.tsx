import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  style,
}) => {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        ...style,
      }}
      className={`aage-tabs ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--action-primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: isActive ? 'var(--action-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 700 : 500,
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--motion-fast)',
              outline: 'none',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
};
