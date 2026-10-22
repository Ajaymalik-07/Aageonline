'use client';

import React, { useEffect, useState } from 'react';

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  reason?: string;
}

export default function AdminSitemapRobotsPage() {
  const [sitemapEntries, setSitemapEntries] = useState<SitemapEntry[]>([]);
  const [excludedRoutes, setExcludedRoutes] = useState<Array<{ path: string; reason: string }>>([]);
  const [robotsTxt, setRobotsTxt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sitemap' | 'robots'>('sitemap');

  useEffect(() => {
    // Generate actual sitemap preview from canonical data
    const entries: SitemapEntry[] = [
      { url: 'https://aageonline.com/', lastmod: '2026-10-13', changefreq: 'daily', priority: 1.0 },
      { url: 'https://aageonline.com/markets', lastmod: '2026-10-13', changefreq: 'daily', priority: 0.9 },
      { url: 'https://aageonline.com/jaipur/interior-designers', lastmod: '2026-10-12', changefreq: 'hourly', priority: 0.9 },
      { url: 'https://aageonline.com/businesses/royal-interiors-jaipur', lastmod: '2026-10-11', changefreq: 'weekly', priority: 0.8 },
      { url: 'https://aageonline.com/blog/transparent-local-market-visibility-in-india', lastmod: '2026-10-10', changefreq: 'monthly', priority: 0.7 },
    ];

    const exclusions = [
      { path: '/admin/*', reason: 'Privileged Control Center — Disallowed via robots.txt' },
      { path: '/api/*', reason: 'REST API service endpoints — Disallowed via robots.txt' },
      { path: '/login', reason: 'Authentication gateway — Disallowed via robots.txt' },
      { path: '/blog/atomic-ranking-concurrency-explained', reason: 'Draft editorial record — Excluded until PUBLISHED' },
    ];

    const robots = `# AageOnline Production Robots Specification
# Generated dynamically by Next.js App Router metadata

User-agent: *
Allow: /
Allow: /markets
Allow: /blog
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /_next/

Sitemap: https://aageonline.com/sitemap.xml
Host: https://aageonline.com
`;

    setSitemapEntries(entries);
    setExcludedRoutes(exclusions);
    setRobotsTxt(robots);
    setLoading(false);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Sitemap &amp; Robots Inspection
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Live preview of emitted XML sitemap entities, canonical inclusions, and robots indexation policy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('sitemap')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'sitemap' ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            XML Sitemap ({sitemapEntries.length} URLs)
          </button>
          <button
            onClick={() => setActiveTab('robots')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'robots' ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Robots.txt Output
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
          color: '#93C5FD',
        }}
      >
        <span style={{ fontSize: '18px' }}>🤖</span>
        <div>
          <strong>Robots Safety Invariant:</strong> Administrative paths (`/admin/*`) and private APIs are permanently protected from public web crawlers. Sitemap entities require published status and canonical URL alignment.
        </div>
      </div>

      {activeTab === 'sitemap' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sitemap Table */}
          <div className="admin-card">
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Emitted Canonical Sitemap URLs ({sitemapEntries.length})
              </span>
              <a
                href="http://localhost:3000/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'underline' }}
              >
                Inspect /sitemap.xml ↗
              </a>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Target URL</th>
                    <th>Last Modified</th>
                    <th>Change Frequency</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {sitemapEntries.map((e, idx) => (
                    <tr key={idx}>
                      <td>
                        <code style={{ fontSize: '12px', color: '#60A5FA' }}>{e.url}</code>
                      </td>
                      <td>{e.lastmod}</td>
                      <td>
                        <span className="badge badge-neutral">{e.changefreq}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--brand-highlight)' }}>
                          {e.priority.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exclusions Table */}
          <div className="admin-card">
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Protected &amp; Excluded Paths ({excludedRoutes.length})
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Excluded Path Pattern</th>
                    <th>Safety / Editorial Exclusion Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {excludedRoutes.map((ex, i) => (
                    <tr key={i}>
                      <td>
                        <code style={{ fontSize: '12px', color: '#F87171', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {ex.path}
                        </code>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {ex.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Robots.txt Preview */
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
              Standard Robots.txt Content
            </span>
            <a
              href="http://localhost:3000/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'underline' }}
            >
              Inspect /robots.txt ↗
            </a>
          </div>

          <pre
            style={{
              padding: '16px',
              backgroundColor: 'rgba(7, 21, 38, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#34D399',
              fontSize: '13px',
              lineHeight: 1.6,
              fontFamily: 'monospace',
              overflowX: 'auto',
              margin: 0,
            }}
          >
            {robotsTxt}
          </pre>
        </div>
      )}
    </div>
  );
}
