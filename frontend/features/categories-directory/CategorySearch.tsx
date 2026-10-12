'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { CategorySummary } from '../../data-access/types.ts';

interface CategorySearchProps {
  categories?: CategorySummary[];
}

export function CategorySearch({ categories = [] }: CategorySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [results, setResults] = useState<CategorySummary[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter categories on query change
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );

    setResults(filtered);
    setIsOpen(true);
    setRequestSubmitted(false);
  }, [query, categories]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRequestCategory = async () => {
    if (!query.trim() || isRequesting) return;
    setIsRequesting(true);

    try {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: query.trim(),
          requestType: 'CATEGORY',
        }),
      });

      if (res.ok) {
        setRequestSubmitted(true);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 8px 6px 20px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '12px', flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search a business category (e.g. Interior Designers, Restaurants, Dentists)..."
          aria-label="Search commercial business categories"
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: '15px',
            fontFamily: 'inherit',
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            aria-label="Clear category query"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && query.trim() && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: '#0B1F33',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '380px',
            overflowY: 'auto',
          }}
        >
          {results.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              <div
                style={{
                  padding: '8px 16px 4px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                Published Industry Categories ({results.length})
              </div>

              {results.map((cat) => (
                <a
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{cat.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {cat.description || 'Commercial business category'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        backgroundColor: 'rgba(234, 88, 12, 0.25)',
                        color: '#FB923C',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      {cat.activeMarketCount ?? cat.marketCount} markets
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '6px',
                }}
              >
                We don't have this category available yet
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.65)',
                  margin: '0 0 16px 0',
                  lineHeight: 1.4,
                }}
              >
                AageOnline continuously activates new industry verticals based on commercial demand.
              </p>

              {requestSubmitted ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-pill)',
                    color: '#4ADE80',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Category request submitted for review!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestCategory}
                  disabled={isRequesting}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isRequesting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  {isRequesting ? 'Submitting Request...' : `Request "${query.trim()}" Category`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
