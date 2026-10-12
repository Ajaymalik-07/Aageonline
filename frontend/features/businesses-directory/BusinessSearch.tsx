'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { BusinessSummary } from '../../data-access/types.ts';

interface BusinessSearchProps {
  businesses?: BusinessSummary[];
}

export function BusinessSearch({ businesses = [] }: BusinessSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [results, setResults] = useState<BusinessSummary[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const filtered = businesses.filter(
      (biz) =>
        biz.name.toLowerCase().includes(q) ||
        biz.slug.toLowerCase().includes(q) ||
        biz.description.toLowerCase().includes(q) ||
        (biz.primaryCategory && biz.primaryCategory.name.toLowerCase().includes(q)) ||
        (biz.primaryLocation && biz.primaryLocation.name.toLowerCase().includes(q))
    );

    setResults(filtered);
    setIsOpen(true);
    setRequestSubmitted(false);
  }, [query, businesses]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRequestBusiness = async () => {
    if (!query.trim() || isRequesting) return;
    setIsRequesting(true);

    try {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: query.trim(),
          requestType: 'BUSINESS',
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
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search businesses by name, sector, or city..."
          aria-label="Search businesses"
          aria-expanded={isOpen}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: 'var(--font-size-base)',
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
            aria-label="Clear search query"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Business search suggestions"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: '#071526',
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
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                Matching Businesses ({results.length})
              </div>

              {results.map((biz) => {
                const isVerified = biz.verificationStatus === 'VERIFIED';
                return (
                  <a
                    key={biz.id}
                    href={biz.publicUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {biz.name}
                        {isVerified && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#10B981',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              padding: '1px 6px',
                              borderRadius: '9999px',
                            }}
                          >
                            Verified
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                          marginTop: '2px',
                        }}
                      >
                        {biz.primaryCategory?.name}
                        {biz.primaryLocation ? ` · ${biz.primaryLocation.name}` : ''}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#FB923C',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View Profile →
                    </span>
                  </a>
                );
              })}
            </div>
          ) : (
            /* Discovery Request for Unlisted Business */
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '6px',
                }}
              >
                No business found matching &ldquo;{query}&rdquo;
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  margin: '0 0 16px 0',
                  lineHeight: 1.4,
                }}
              >
                Are you looking for this business or interested in participating? Submit a discovery request.
              </p>

              {requestSubmitted ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Discovery Request Received!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestBusiness}
                  disabled={isRequesting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isRequesting ? 'wait' : 'pointer',
                    opacity: isRequesting ? 0.7 : 1,
                  }}
                >
                  {isRequesting ? 'Submitting...' : 'Request This Business'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
