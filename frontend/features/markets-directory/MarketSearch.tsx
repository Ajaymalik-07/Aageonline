'use client';

import React, { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import type { MarketSearchResult } from '../../data-access/types.ts';

interface MarketSearchProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

interface SearchState {
  query: string;
  results: MarketSearchResult[];
  showResults: boolean;
  noResults: boolean;
  loading: boolean;
}

export function MarketSearch({ initialQuery = '', onSearch }: MarketSearchProps) {
  const [state, setState] = useState<SearchState>({
    query: initialQuery,
    results: [],
    showResults: false,
    noResults: false,
    loading: false,
  });
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setState((s) => ({ ...s, showResults: false }));
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setState((s) => ({ ...s, results: [], showResults: false, noResults: false, loading: false }));
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    try {
      const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results: MarketSearchResult[] = data.results ?? [];

      startTransition(() => {
        setState((s) => ({
          ...s,
          results,
          showResults: true,
          noResults: results.length === 0,
          loading: false,
        }));
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [startTransition]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setState((s) => ({ ...s, query: q }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(q);
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setState((s) => ({ ...s, showResults: false }));
    }
    if (e.key === 'Enter' && state.query.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(state.query);
      onSearch?.(state.query);
    }
  }

  function handleFocus() {
    if (state.results.length > 0 || state.noResults) {
      setState((s) => ({ ...s, showResults: true }));
    }
  }

  function handleResultClick(result: MarketSearchResult) {
    if (result.href) {
      window.location.href = result.href;
    } else if (result.citySlug) {
      window.location.href = `/markets?location=${result.citySlug}`;
    } else if (result.categorySlug) {
      window.location.href = `/markets?category=${result.categorySlug}`;
    }
    setState((s) => ({ ...s, showResults: false }));
  }

  function handleRequestMarket() {
    const q = state.query.trim();
    if (!q) return;

    // Post to discovery API — non-blocking, fire-and-forget
    fetch('/api/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawInput: q, requestType: 'MARKET' }),
    }).catch(() => {/* silent */});

    setState((s) => ({
      ...s,
      showResults: false,
      noResults: false,
      query: '',
    }));
    alert(`Your interest in "${q}" has been recorded. We'll review it soon.`);
  }

  const iconColor = 'var(--text-muted)';

  return (
    <div
      ref={panelRef}
      style={{ position: 'relative', width: '100%', maxWidth: '640px' }}
      role="search"
    >
      {/* Search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--surface-raised)',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '12px 18px',
          boxShadow: 'var(--elevation-2)',
          transition: 'border-color var(--motion-fast), box-shadow var(--motion-fast)',
        }}
        onFocus={() => {
          const el = document.getElementById('market-search-wrapper');
          if (el) {
            el.style.borderColor = 'var(--accent-focus)';
            el.style.boxShadow = `var(--elevation-2), 0 0 0 3px rgba(249,115,22,0.12)`;
          }
        }}
        onBlur={() => {
          const el = document.getElementById('market-search-wrapper');
          if (el) {
            el.style.borderColor = 'var(--border-subtle)';
            el.style.boxShadow = 'var(--elevation-2)';
          }
        }}
        id="market-search-wrapper"
      >
        {/* Search icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          id="market-search-input"
          type="search"
          role="combobox"
          aria-expanded={state.showResults}
          aria-autocomplete="list"
          aria-controls="market-search-results"
          aria-label="Search markets by city, category, or market name"
          placeholder="Search city, category, or market…"
          value={state.query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '16px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {/* Loading indicator */}
        {state.loading && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor}
            strokeWidth="2"
            aria-hidden="true"
            style={{ flexShrink: 0, animation: 'spin 0.7s linear infinite' }}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        )}

        {/* Clear button */}
        {state.query && !state.loading && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setState({ query: '', results: [], showResults: false, noResults: false, loading: false });
              inputRef.current?.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Hint pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-3)',
        }}
        aria-hidden="true"
      >
        {['Jaipur', 'Interior Designers', 'Delhi Restaurants', 'Mumbai'].map((hint) => (
          <button
            key={hint}
            type="button"
            onClick={() => {
              setState((s) => ({ ...s, query: hint }));
              doSearch(hint);
              inputRef.current?.focus();
            }}
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--brand-emerald)',
              cursor: 'pointer',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249,115,22,0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(249,115,22,0.08)';
            }}
          >
            {hint}
          </button>
        ))}
      </div>

      {/* Results panel */}
      {state.showResults && (
        <div
          id="market-search-results"
          role="listbox"
          aria-label="Search results"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--elevation-4)',
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {/* Results */}
          {state.results.map((result, idx) => (
            <button
              key={idx}
              role="option"
              aria-selected={false}
              type="button"
              onClick={() => handleResultClick(result)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: idx < state.results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color var(--motion-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Icon */}
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: result.type === 'MARKET' ? 'rgba(234,88,12,0.1)' : 'rgba(249,115,22,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {result.type === 'MARKET' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
                {result.type === 'CITY' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )}
                {result.type === 'CATEGORY' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                )}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.label}
                </div>
                {result.sublabel && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    {result.sublabel}
                  </div>
                )}
              </div>

              {result.href && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}

          {/* No results state */}
          {state.noResults && (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No market found for &ldquo;{state.query}&rdquo;
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                This market isn&apos;t on AageOnline yet. Request it and we&apos;ll review it.
              </p>
              <button
                type="button"
                onClick={handleRequestMarket}
                style={{
                  backgroundColor: 'var(--action-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Request This Market
              </button>
            </div>
          )}
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
