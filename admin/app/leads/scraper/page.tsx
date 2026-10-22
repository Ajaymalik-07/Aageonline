'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScraperMetrics {
  totalDiscovered: number;
  newLeadsAdded: number;
  existingUpdated: number;
  duplicateRecords: number;
  invalidIneligible: number;
  connectorErrors: number;
  lastRunAt: string | null;
  nextScheduledRunAt: string | null;
  currentExecutionStatus: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FAILED';
}

interface ScraperConfig {
  id: string;
  enabledConnectors: string[];
  locations: string[];
  categories: string[];
  searchKeywords: string[];
  perSourceLimit: number;
  crawlDepth: number;
  requestTimeoutMs: number;
  scheduleFrequency: string;
  scheduleTimezone: string;
  maxRetries: number;
  concurrencyLimit: number;
  geminiExtractionEnabled: boolean;
  paused: boolean;
}

interface ConnectorInfo {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'CONFIG_REQUIRED' | 'OFFLINE';
  permitted: boolean;
  description: string;
  notes?: string;
}

interface ScraperJob {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalDiscovered: number;
  newLeadsAdded: number;
  duplicateCount: number;
  errorCount: number;
  errorMessage?: string;
  sourcesUsed: string[];
}

export default function ScraperDashboardPage() {
  const [metrics, setMetrics] = useState<ScraperMetrics | null>(null);
  const [config, setConfig] = useState<ScraperConfig | null>(null);
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for config
  const [locationsInput, setLocationsInput] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [perSourceLimit, setPerSourceLimit] = useState(50);
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [enabledConnectors, setEnabledConnectors] = useState<string[]>([]);
  const [scheduleFreq, setScheduleFreq] = useState('0 2 * * *');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);

      const [resMetrics, resConfig, resConnectors, resJobs] = await Promise.all([
        fetch('/api/scraper?action=metrics'),
        fetch('/api/scraper?action=config'),
        fetch('/api/scraper?action=connectors'),
        fetch('/api/scraper?action=jobs'),
      ]);

      if (resMetrics.status === 401 || resConfig.status === 401) {
        window.location.href = '/login?from=/leads/scraper';
        return;
      }

      if (resMetrics.ok) {
        const d = await resMetrics.json();
        setMetrics(d.metrics);
      }
      if (resConfig.ok) {
        const d = await resConfig.json();
        if (d.config) {
          setConfig(d.config);
          setLocationsInput(d.config.locations?.join(', ') || '');
          setCategoriesInput(d.config.categories?.join(', ') || '');
          setKeywordsInput(d.config.searchKeywords?.join(', ') || '');
          setPerSourceLimit(d.config.perSourceLimit || 50);
          setGeminiEnabled(!!d.config.geminiExtractionEnabled);
          setEnabledConnectors(d.config.enabledConnectors || []);
          setScheduleFreq(d.config.scheduleFrequency || '0 2 * * *');
        }
      }
      if (resConnectors.ok) {
        const d = await resConnectors.json();
        setConnectors(d.connectors || []);
      }
      if (resJobs.ok) {
        const d = await resJobs.json();
        setJobs(d.jobs || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching scraper data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const updated = {
        locations: locationsInput.split(',').map((s) => s.trim()).filter(Boolean),
        categories: categoriesInput.split(',').map((s) => s.trim()).filter(Boolean),
        searchKeywords: keywordsInput.split(',').map((s) => s.trim()).filter(Boolean),
        perSourceLimit: Number(perSourceLimit) || 50,
        geminiExtractionEnabled: geminiEnabled,
        enabledConnectors,
        scheduleFrequency: scheduleFreq,
      };

      const res = await fetch('/api/scraper?action=config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update discovery configuration');
      }

      setSuccessMsg('Discovery configuration successfully saved.');
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTriggerJob() {
    try {
      setTriggering(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/scraper?action=run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to trigger discovery job');
      }

      const data = await res.json();
      setSuccessMsg(`Discovery job ${data.job?.id || 'completed'} executed successfully. Discovered: ${data.job?.totalDiscovered || 0}, New: ${data.job?.newLeadsAdded || 0}`);
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error executing discovery job');
    } finally {
      setTriggering(false);
    }
  }

  function toggleConnector(id: string) {
    if (enabledConnectors.includes(id)) {
      setEnabledConnectors(enabledConnectors.filter((c) => c !== id));
    } else {
      setEnabledConnectors([...enabledConnectors, id]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <Link
          href="/leads"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          🧲 Lead Registry
        </Link>
        <Link
          href="/leads/scraper"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            color: '#FB923C',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            textDecoration: 'none',
          }}
        >
          🕷️ Scraper Dashboard
        </Link>
        <Link
          href="/leads/email-automation"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          ✉️ Email Automation (Zero)
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Unified Business Lead Scraper
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Automated discovery from permitted sources, Indic/Bengali glyph normalization, SSRF-safe crawling, and PostgreSQL deduplication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleTriggerJob}
            disabled={triggering || loading}
            className="admin-btn admin-btn-primary"
            style={{
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: triggering ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {triggering ? '🔄 Scraping...' : '▶️ Run Scraper Now'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#F87171', fontSize: '13px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '14px 18px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34D399', fontSize: '13px' }}>
          {successMsg}
        </div>
      )}

      {/* Metrics KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Discovered</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>{metrics?.totalDiscovered || 0}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>All-time candidates</div>
        </div>

        <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>New Leads Added</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '6px' }}>{metrics?.newLeadsAdded || 0}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Ingested to SQL</div>
        </div>

        <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600 }}>Records Updated</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#93C5FD', marginTop: '6px' }}>{metrics?.existingUpdated || 0}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Enriched fields</div>
        </div>

        <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>Duplicates Blocked</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24', marginTop: '6px' }}>{metrics?.duplicateRecords || 0}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Deduplication filter</div>
        </div>

        <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>Errors / Ineligible</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F87171', marginTop: '6px' }}>{(metrics?.invalidIneligible || 0) + (metrics?.connectorErrors || 0)}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Filtered out</div>
        </div>

        <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Scheduler Status</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: metrics?.currentExecutionStatus === 'RUNNING' ? '#F59E0B' : '#34D399', marginTop: '10px' }}>
            {metrics?.currentExecutionStatus || 'IDLE'}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
            Next: {metrics?.nextScheduledRunAt ? new Date(metrics.nextScheduledRunAt).toLocaleDateString() : '02:00 Daily'}
          </div>
        </div>
      </div>

      {/* Discovery Configuration & Connectors (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Discovery Configuration Form */}
        <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            ⚙️ Discovery Configuration
          </h2>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Target Locations (Comma separated)
              </label>
              <input
                type="text"
                value={locationsInput}
                onChange={(e) => setLocationsInput(e.target.value)}
                placeholder="Hisar, Noida, Jaipur, Gurugram"
                className="admin-input"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locations matching AageOnline taxonomy</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Target Categories (Comma separated)
              </label>
              <input
                type="text"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
                placeholder="Hospitals, Diagnostic Centres, Interior Designers"
                className="admin-input"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Business categories to query and normalize</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Search Keywords
              </label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="hospital, clinic, diagnostic, interior design"
                className="admin-input"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Per-Source Limit
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={perSourceLimit}
                  onChange={(e) => setPerSourceLimit(Number(e.target.value))}
                  className="admin-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Schedule (Cron)
                </label>
                <input
                  type="text"
                  value={scheduleFreq}
                  onChange={(e) => setScheduleFreq(e.target.value)}
                  placeholder="0 2 * * *"
                  className="admin-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', padding: '10px', backgroundColor: '#0B1F33', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <input
                type="checkbox"
                id="geminiToggle"
                checked={geminiEnabled}
                onChange={(e) => setGeminiEnabled(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="geminiToggle" style={{ fontSize: '12px', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}>
                Enable Gemini API Extraction &amp; Classification
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="admin-btn admin-btn-secondary"
              style={{
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                fontWeight: 600,
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #334155',
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '10px',
              }}
            >
              {saving ? 'Saving...' : '💾 Save Discovery Settings'}
            </button>
          </form>
        </div>

        {/* Source Connectors Grid */}
        <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            🔌 Source Connectors ({connectors.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {connectors.map((c) => {
              const isEnabled = enabledConnectors.includes(c.id);
              const isActive = c.status === 'ACTIVE';

              return (
                <div
                  key={c.id}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    backgroundColor: '#0B1F33',
                    border: `1px solid ${isEnabled ? 'rgba(234, 88, 12, 0.4)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{c.name}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isActive ? '#34D399' : '#FBBF24',
                          border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{c.description}</p>
                    {c.notes && (
                      <span style={{ display: 'block', fontSize: '10px', color: '#CBD5E1', marginTop: '2px', fontStyle: 'italic' }}>
                        ℹ️ {c.notes}
                      </span>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => toggleConnector(c.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isEnabled ? '#EA580C' : '#1E293B',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Discovery Job History */}
      <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
            📜 Recent Discovery Execution Jobs ({jobs.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            PostgreSQL Append-Only Job Audit Log
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', backgroundColor: '#0B1F33' }}>
                <th style={{ padding: '12px 16px' }}>Job ID</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Discovered</th>
                <th style={{ padding: '12px 16px' }}>New Added</th>
                <th style={{ padding: '12px 16px' }}>Duplicates</th>
                <th style={{ padding: '12px 16px' }}>Sources</th>
                <th style={{ padding: '12px 16px' }}>Started At</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No discovery jobs recorded yet. Click &quot;Run Scraper Now&quot; to execute your first batch.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#93C5FD' }}>{job.id.slice(0, 8)}...</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : job.status === 'RUNNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: job.status === 'COMPLETED' ? '#34D399' : job.status === 'RUNNING' ? '#FBBF24' : '#F87171',
                        }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FFFFFF' }}>{job.totalDiscovered}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#34D399' }}>{job.newLeadsAdded}</td>
                    <td style={{ padding: '12px 16px', color: '#FBBF24' }}>{job.duplicateCount}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{job.sourcesUsed?.join(', ') || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{new Date(job.startedAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
