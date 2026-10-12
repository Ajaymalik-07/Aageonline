'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface NavSectionItem {
  id: string;
  label: string;
}

interface PageContentsNavProps {
  sections: NavSectionItem[];
}

export const PageContentsNav: React.FC<PageContentsNavProps> = ({ sections }) => {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || '');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const isClickScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set default active section if not set
  useEffect(() => {
    if (sections.length > 0 && !activeId) {
      setActiveId(sections[0].id);
    }
  }, [sections, activeId]);

  // Scrollspy: Track active section on window scroll
  useEffect(() => {
    if (sections.length === 0) return;

    const handleScroll = () => {
      // If user recently clicked a pill, wait for smooth scroll to settle
      if (isClickScrollRef.current) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // When near bottom of page, activate the last section
      if (windowHeight + scrollY >= docHeight - 60) {
        setActiveId(sections[sections.length - 1].id);
        return;
      }

      // When near top of page, activate the first section
      if (scrollY < 200) {
        setActiveId(sections[0].id);
        return;
      }

      // Check sections from top to bottom
      // 140px threshold accounts for sticky header (64px) + sticky nav (48px) + offset buffer (28px)
      const headerThreshold = 140;
      let currentActive = sections[0].id;

      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerThreshold) {
            currentActive = sections[i].id;
          }
        }
      }

      setActiveId(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial detection
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  // Keep active pill scrolled into view in horizontal container ("moving")
  useEffect(() => {
    if (!activeId || !navContainerRef.current) return;

    const activeEl = pillRefs.current[activeId];
    const container = navContainerRef.current;

    if (activeEl && container) {
      const elLeft = activeEl.offsetLeft;
      const elWidth = activeEl.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft = elLeft - containerWidth / 2 + elWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    setIsOpenMobile(false);

    const target = document.getElementById(id);
    if (target) {
      isClickScrollRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      const headerOffset = 120; // 64px header + ~48px sticky nav + 8px buffer
      const elementTop = target.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: Math.max(0, elementTop - headerOffset),
        behavior: 'smooth',
      });

      if (window.history.pushState) {
        window.history.pushState(null, '', `#${id}`);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isClickScrollRef.current = false;
      }, 700);
    }
  };

  const activeSection = sections.find((s) => s.id === activeId);

  return (
    <nav
      aria-label="Table of contents"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: '64px',
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'background-color var(--motion-fast)',
      }}
    >
      <div className="container">
        {/* Mobile Accordion Toggle */}
        <div className="mobile-nav-toggle" style={{ width: '100%', padding: '10px 0' }}>
          <button
            type="button"
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            aria-expanded={isOpenMobile}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📑</span>
              <span>
                On this page: <strong style={{ color: '#EA580C' }}>{activeSection?.label || `${sections.length} topics`}</strong>
              </span>
            </span>
            <span>{isOpenMobile ? '▲ Close' : '▼ Topics'}</span>
          </button>

          {isOpenMobile && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px 16px',
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {sections.map((sec) => {
                const isActive = sec.id === activeId;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleSectionClick(e, sec.id)}
                    aria-current={isActive ? 'true' : undefined}
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#EA580C' : 'var(--text-secondary)',
                      textDecoration: 'none',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid #EA580C' : '3px solid transparent',
                      transition: 'all var(--motion-fast)',
                    }}
                  >
                    {sec.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Horizontal Scrollable Pill Navigation */}
        <div
          ref={navContainerRef}
          className="desktop-nav hide-scrollbar"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 0',
            whiteSpace: 'nowrap',
            scrollBehavior: 'smooth',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#EA580C',
              marginRight: '6px',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            ON THIS PAGE:
          </span>

          {sections.map((sec) => {
            const isActive = sec.id === activeId;
            return (
              <a
                key={sec.id}
                ref={(el) => {
                  pillRefs.current[sec.id] = el;
                }}
                href={`#${sec.id}`}
                onClick={(e) => handleSectionClick(e, sec.id)}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? '#EA580C' : 'var(--surface-raised)',
                  border: isActive ? '1px solid #EA580C' : '1px solid var(--border-subtle)',
                  boxShadow: isActive ? '0 2px 8px rgba(234, 88, 12, 0.35)' : 'none',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  flexShrink: 0,
                  transition: 'all var(--motion-fast)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.08)';
                    e.currentTarget.style.color = '#EA580C';
                    e.currentTarget.style.borderColor = '#EA580C';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }
                }}
              >
                {sec.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
