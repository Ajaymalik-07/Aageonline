'use client';

import React, { useEffect, useState } from 'react';

interface MailConfig {
  provider: string;
  host: string;
  port: number;
  fromEmail: string;
  status: string;
  tls: boolean;
}

interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  lastEdited: string;
}

export default function AdminMailPage() {
  const [config, setConfig] = useState<MailConfig | null>(null);
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('tpl-receipt');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadMailData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/mail');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/mail';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load mail configuration: HTTP ${res.status}`);
        }
        const data = await res.json();
        setConfig(data.config || null);
        setTemplates(Array.isArray(data.templates) ? data.templates : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching mail settings');
      } finally {
        setLoading(false);
      }
    }

    loadMailData();
  }, []);

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, templateId: selectedTemplate }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTestResult(data.message || 'Test email dispatched successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Test send failed');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Mail Server &amp; Transactional Notifications
        </h1>
        <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          Outbound SMTP configuration, transactional templates, and delivery simulation.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#F87171',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Configuration & Test Send Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Mail Server Details Card */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px 0' }}>
            SMTP Server Configuration
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Provider Type</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{config?.provider || 'SMTP Relay'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Relay Host</span>
              <code style={{ fontSize: '12px', color: 'var(--brand-highlight)' }}>{config?.host || 'mail.aageonline.com'}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Port / Encryption</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{config?.port || 587} (TLS Enabled)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>From Address</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{config?.fromEmail || 'notifications@aageonline.com'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Operating Mode</span>
              <span className="badge badge-success">{config?.status || 'Active (Mock Send)'}</span>
            </div>
          </div>
        </div>

        {/* Test Email Dispatch Card */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
            Dispatch Simulated Test Email
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Verify transactional template rendering and SMTP routing without sending spam.
          </p>

          {testResult && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34D399',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              {testResult}
            </div>
          )}

          <form onSubmit={handleTestSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Recipient Address
              </label>
              <input
                type="email"
                placeholder="developer@aageonline.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Transactional Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="admin-input"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              style={{
                marginTop: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--brand-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: sendingTest ? 'not-allowed' : 'pointer',
                opacity: sendingTest ? 0.7 : 1,
              }}
            >
              {sendingTest ? 'Sending...' : 'Send Test Notification'}
            </button>
          </form>
        </div>
      </div>

      {/* Transactional Templates Table */}
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
            Configured Email Templates ({templates.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            System Notifications &amp; Invoices
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Subject Line Template</th>
                <th>Classification</th>
                <th>Last Edited</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{tpl.name}</div>
                    <code style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{tpl.id}</code>
                  </td>
                  <td>
                    <code style={{ fontSize: '12px', color: '#E2E8F0' }}>{tpl.subject}</code>
                  </td>
                  <td>
                    <span className={`badge ${tpl.type === 'TRANSACTIONAL' ? 'badge-success' : 'badge-info'}`}>
                      {tpl.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(tpl.lastEdited).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
