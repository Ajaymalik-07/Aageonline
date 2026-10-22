'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface EmailOverviewMetrics {
  totalLeadsInSql: number;
  eligibleRecipients: number;
  activeCampaigns: number;
  queuedMessages: number;
  sentAttempts: number;
  confirmedDelivered: number;
  bouncesFailures: number;
  optOutsSuppressed: number;
  registeredConversions: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  templateId: string;
  targetLocations: string[];
  targetCategories: string[];
  dailySendLimit: number;
  cooldownDays: number;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  bounceCount: number;
  lastRunAt?: string;
  nextRunAt?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  active: boolean;
}

interface OutboxMessage {
  id: string;
  campaignId: string;
  leadId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED';
  providerMessageId?: string;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

export default function EmailAutomationPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CAMPAIGNS' | 'TEMPLATES' | 'OUTBOX'>('OVERVIEW');
  const [metrics, setMetrics] = useState<EmailOverviewMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [messages, setMessages] = useState<OutboxMessage[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<OutboxMessage | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Campaign creation form state
  const [newCampName, setNewCampName] = useState('');
  const [newCampLocations, setNewCampLocations] = useState('Hisar, Noida, Jaipur');
  const [newCampCategories, setNewCampCategories] = useState('Hospitals, Interior Designers');
  const [newCampTemplateId, setNewCampTemplateId] = useState('');
  const [newCampLimit, setNewCampLimit] = useState(50);
  const [newCampCooldown, setNewCampCooldown] = useState(30);

  // Template creation form state
  const [newTplName, setNewTplName] = useState('');
  const [newTplSubject, setNewTplSubject] = useState('');
  const [newTplHtml, setNewTplHtml] = useState('');
  const [newTplText, setNewTplText] = useState('');

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Manual suppression input
  const [suppressEmailInput, setSuppressEmailInput] = useState('');
  const [suppressReasonInput, setSuppressReasonInput] = useState('ADMIN_MANUAL');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);

      const [resMetrics, resCamps, resTpls, resMsgs] = await Promise.all([
        fetch('/api/email-automation?action=overview'),
        fetch('/api/email-automation?action=campaigns'),
        fetch('/api/email-automation?action=templates'),
        fetch('/api/email-automation?action=messages'),
      ]);

      if (resMetrics.status === 401 || resCamps.status === 401) {
        window.location.href = '/login?from=/leads/email-automation';
        return;
      }

      if (resMetrics.ok) {
        const d = await resMetrics.json();
        setMetrics(d.metrics);
      }
      if (resCamps.ok) {
        const d = await resCamps.json();
        setCampaigns(d.campaigns || []);
        if (d.campaigns?.length > 0 && !selectedCampaign) {
          setSelectedCampaign(d.campaigns[0]);
        }
      }
      if (resTpls.ok) {
        const d = await resTpls.json();
        setTemplates(d.templates || []);
        if (d.templates?.length > 0) {
          if (!newCampTemplateId) setNewCampTemplateId(d.templates[0].id);
          if (!selectedTemplate) setSelectedTemplate(d.templates[0]);
        }
      }
      if (resMsgs.ok) {
        const d = await resMsgs.json();
        setMessages(d.messages || []);
        if (d.messages?.length > 0 && !selectedMessage) {
          setSelectedMessage(d.messages[0]);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading email automation data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/email-automation?action=campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampName,
          templateId: newCampTemplateId,
          targetLocations: newCampLocations.split(',').map((s) => s.trim()).filter(Boolean),
          targetCategories: newCampCategories.split(',').map((s) => s.trim()).filter(Boolean),
          dailySendLimit: Number(newCampLimit) || 50,
          cooldownDays: Number(newCampCooldown) || 30,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to create campaign');
      }

      const d = await res.json();
      setSuccessMsg(`Campaign "${d.campaign?.name}" created successfully.`);
      setNewCampName('');
      await loadAllData();
      setActiveTab('CAMPAIGNS');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating campaign');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/email-automation?action=templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTplName,
          subject: newTplSubject,
          bodyHtml: newTplHtml,
          bodyText: newTplText,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to create template');
      }

      setSuccessMsg('Email template created successfully.');
      setNewTplName('');
      setNewTplSubject('');
      setNewTplHtml('');
      setNewTplText('');
      await loadAllData();
      setActiveTab('TEMPLATES');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating template');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRunCampaign(campaignId: string) {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/email-automation?action=campaign_run&id=${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to execute campaign run');
      }

      const d = await res.json();
      setSuccessMsg(`Campaign execution completed! Sent: ${d.result?.sentCount || 0}, Blocked/Skipped: ${d.result?.skippedCount || 0}`);
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error executing campaign');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleStatus(campaignId: string, newStatus: string) {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/email-automation?action=campaign_status&id=${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to update campaign status');
      }

      setSuccessMsg(`Campaign status changed to ${newStatus}.`);
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating campaign status');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTestSend() {
    if (!testEmailAddress || !selectedTemplate) {
      setError('Please provide a recipient email and select a template.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/email-automation?action=test_send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipientEmail: testEmailAddress,
          recipientName: 'Test Recipient',
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to send test email');
      }

      const d = await res.json();
      setSuccessMsg(`Test email dispatched successfully (Message ID: ${d.messageId}).`);
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending test email');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManualSuppress(e: React.FormEvent) {
    e.preventDefault();
    if (!suppressEmailInput) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/email-automation?action=suppress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: suppressEmailInput,
          reason: suppressReasonInput,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to suppress email');
      }

      setSuccessMsg(`Email "${suppressEmailInput}" has been added to the authoritative suppression list.`);
      setSuppressEmailInput('');
      await loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding email to suppression list');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            fontWeight: 600,
            color: 'var(--text-muted)',
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
            fontWeight: 700,
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            color: '#FB923C',
            border: '1px solid rgba(234, 88, 12, 0.35)',
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
            Zero-Inspired Email Automation Workspace
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Independent SQL lead outreach, safe HTML personalization, cooldown controls, and one-click suppression.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeTab === 'OVERVIEW' ? '#EA580C' : '#0B1F33',
              color: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('CAMPAIGNS')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeTab === 'CAMPAIGNS' ? '#EA580C' : '#0B1F33',
              color: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            🎯 Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeTab === 'TEMPLATES' ? '#EA580C' : '#0B1F33',
              color: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            📝 Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('OUTBOX')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeTab === 'OUTBOX' ? '#EA580C' : '#0B1F33',
              color: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            📬 Outbox ({messages.length})
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

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SQL Leads Total</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>{metrics?.totalLeadsInSql || 0}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Authoritative Registry</div>
            </div>

            <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Eligible Recipients</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '6px' }}>{metrics?.eligibleRecipients || 0}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Uncontacted &amp; Cooled</div>
            </div>

            <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600 }}>Active Campaigns</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#93C5FD', marginTop: '6px' }}>{metrics?.activeCampaigns || 0}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Scheduled Runners</div>
            </div>

            <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>Queued in Outbox</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24', marginTop: '6px' }}>{metrics?.queuedMessages || 0}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Awaiting Provider Send</div>
            </div>

            <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>Confirmed Delivered</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '6px' }}>{metrics?.confirmedDelivered || 0}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Sent: {metrics?.sentAttempts || 0}</div>
            </div>

            <div className="admin-card" style={{ padding: '18px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>Suppressed / Opt-Outs</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F87171', marginTop: '6px' }}>{metrics?.optOutsSuppressed || 0}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Bounces: {metrics?.bouncesFailures || 0}</div>
            </div>
          </div>

          {/* Quick Actions & Suppression Management */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Quick Test Email */}
            <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px 0' }}>
                ✉️ Send Test Personalization Email
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Safely verify template HTML rendering and unsubscribe links without triggering an outreach campaign.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="admin-input"
                  style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Dispatching...' : '🚀 Send Test Message'}
                </button>
              </div>
            </div>

            {/* Manual Suppression Entry */}
            <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px 0' }}>
                🛡️ Authoritative Email Suppression
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Instantly suppress an email address from receiving any future outbound messages across all campaigns.
              </p>
              <form onSubmit={handleManualSuppress} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="suppress-email@business.com"
                  value={suppressEmailInput}
                  onChange={(e) => setSuppressEmailInput(e.target.value)}
                  className="admin-input"
                  style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <select
                  value={suppressReasonInput}
                  onChange={(e) => setSuppressReasonInput(e.target.value)}
                  className="admin-input"
                  style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                >
                  <option value="ADMIN_MANUAL">Admin Manual Suppression</option>
                  <option value="UNSUBSCRIBED">Requested Unsubscribe</option>
                  <option value="BOUNCED">Hard Bounce</option>
                  <option value="COMPLAINT">Spam Complaint</option>
                </select>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#1E293B',
                    color: '#F87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionLoading ? 'Suppressing...' : '⛔ Add to Suppression Registry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZERO-INSPIRED 3-PANE CAMPAIGNS & COMPOSER */}
      {activeTab === 'CAMPAIGNS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.5fr)', gap: '20px' }}>
          {/* Left / Middle Pane: Campaign List & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Active Campaigns</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{campaigns.length} total</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {campaigns.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No campaigns created yet.</p>
                ) : (
                  campaigns.map((c) => {
                    const isSelected = selectedCampaign?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCampaign(c)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.12)' : '#0B1F33',
                          border: `1px solid ${isSelected ? '#EA580C' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{c.name}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: c.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: c.status === 'ACTIVE' ? '#34D399' : '#FBBF24',
                            }}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Targets: {c.targetLocations?.join(', ')} × {c.targetCategories?.join(', ')}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94A3B8' }}>
                          <span>Sent: <strong style={{ color: '#FFFFFF' }}>{c.sentCount}</strong></span>
                          <span>Delivered: <strong style={{ color: '#34D399' }}>{c.deliveredCount}</strong></span>
                          <span>Daily Limit: <strong style={{ color: '#FFFFFF' }}>{c.dailySendLimit}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create Campaign Box */}
            <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px 0' }}>
                ➕ Create New Campaign
              </h3>
              <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Campaign Name (e.g. Haryana Healthcare Invitations)"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  required
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <input
                  type="text"
                  placeholder="Target Locations (Hisar, Noida)"
                  value={newCampLocations}
                  onChange={(e) => setNewCampLocations(e.target.value)}
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <input
                  type="text"
                  placeholder="Target Categories (Hospitals, Diagnostic Centres)"
                  value={newCampCategories}
                  onChange={(e) => setNewCampCategories(e.target.value)}
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <select
                  value={newCampTemplateId}
                  onChange={(e) => setNewCampTemplateId(e.target.value)}
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Daily Limit"
                    value={newCampLimit}
                    onChange={(e) => setNewCampLimit(Number(e.target.value))}
                    className="admin-input"
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                  />
                  <input
                    type="number"
                    placeholder="Cooldown Days"
                    value={newCampCooldown}
                    onChange={(e) => setNewCampCooldown(Number(e.target.value))}
                    className="admin-input"
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Create Campaign
                </button>
              </form>
            </div>
          </div>

          {/* Right Pane: Selected Campaign Inspector / Runner */}
          <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '20px' }}>
            {selectedCampaign ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {selectedCampaign.name}
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Campaign ID: {selectedCampaign.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedCampaign.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleToggleStatus(selectedCampaign.id, 'PAUSED')}
                        style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#F59E0B', color: '#000', border: 'none', cursor: 'pointer' }}
                      >
                        ⏸️ Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(selectedCampaign.id, 'ACTIVE')}
                        style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#10B981', color: '#FFF', border: 'none', cursor: 'pointer' }}
                      >
                        ▶️ Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleRunCampaign(selectedCampaign.id)}
                      disabled={actionLoading}
                      style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#EA580C', color: '#FFF', border: 'none', cursor: 'pointer' }}
                    >
                      🚀 Run Send Cycle Now
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#0B1F33', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Cap</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>{selectedCampaign.dailySendLimit} / day</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0B1F33', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact Cooldown</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#34D399' }}>{selectedCampaign.cooldownDays} days</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0B1F33', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Delivered Ratio</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#93C5FD' }}>{selectedCampaign.deliveredCount} / {selectedCampaign.sentCount || 1}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1', margin: '0 0 8px 0' }}>Target Market Criteria</h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <div><strong>Locations:</strong> {selectedCampaign.targetLocations?.join(', ') || 'All Locations'}</div>
                    <div><strong>Categories:</strong> {selectedCampaign.targetCategories?.join(', ') || 'All Categories'}</div>
                    <div><strong>Safety Policy:</strong> Strict suppression enforcement, deduplication by canonical email, cooldown window check.</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1', margin: '0 0 8px 0' }}>Associated Email Template</h4>
                  <div style={{ padding: '12px', backgroundColor: '#0B1F33', borderRadius: '6px', fontSize: '12px', color: '#CBD5E1' }}>
                    {templates.find((t) => t.id === selectedCampaign.templateId)?.name || 'Default Template'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Select a campaign from the left pane to view details and control delivery.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.5fr)', gap: '20px' }}>
          {/* Template list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
                Email Templates ({templates.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: selectedTemplate?.id === tpl.id ? 'rgba(234, 88, 12, 0.15)' : '#0B1F33',
                      border: `1px solid ${selectedTemplate?.id === tpl.id ? '#EA580C' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{tpl.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{tpl.subject}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Template Form */}
            <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
                ➕ Create Template
              </div>
              <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Template Name"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  required
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <input
                  type="text"
                  placeholder="Subject (e.g. {{business_name}} is now eligible for AageOnline)"
                  value={newTplSubject}
                  onChange={(e) => setNewTplSubject(e.target.value)}
                  required
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF' }}
                />
                <textarea
                  placeholder="HTML Body with {{business_name}}, {{location}}, {{claim_url}}"
                  rows={4}
                  value={newTplHtml}
                  onChange={(e) => setNewTplHtml(e.target.value)}
                  required
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF', fontFamily: 'monospace' }}
                />
                <textarea
                  placeholder="Plain Text fallback"
                  rows={2}
                  value={newTplText}
                  onChange={(e) => setNewTplText(e.target.value)}
                  required
                  className="admin-input"
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0B1F33', border: '1px solid var(--border-subtle)', color: '#FFFFFF', fontFamily: 'monospace' }}
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Template
                </button>
              </form>
            </div>
          </div>

          {/* Template Preview Pane */}
          <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '20px' }}>
            {selectedTemplate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {selectedTemplate.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#93C5FD', marginTop: '6px' }}>
                    <strong>Subject:</strong> {selectedTemplate.subject}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>Rendered Preview with Sample Data:</span>
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '16px',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      borderRadius: '6px',
                      minHeight: '200px',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: selectedTemplate.bodyHtml
                        .replace(/\{\{business_name\}\}/g, 'City Care Hospital')
                        .replace(/\{\{category\}\}/g, 'Hospitals')
                        .replace(/\{\{location\}\}/g, 'Hisar')
                        .replace(/\{\{claim_url\}\}/g, 'https://aage.online/business/claim?ref=test')
                        .replace(/\{\{opt_out_url\}\}/g, 'https://aage.online/api/public/leads/opt-out?email=test%40example.com'),
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a template to preview.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: OUTBOX MESSAGES */}
      {activeTab === 'OUTBOX' && (
        <div className="admin-card" style={{ backgroundColor: '#071526', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
              📬 Dispatch Outbox Messages ({messages.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Idempotent PostgreSQL Queue Log
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', backgroundColor: '#0B1F33' }}>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Recipient</th>
                  <th style={{ padding: '12px 16px' }}>Subject</th>
                  <th style={{ padding: '12px 16px' }}>Provider ID</th>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No dispatched or queued messages in outbox.
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: m.status === 'DELIVERED' || m.status === 'SENT' ? 'rgba(16, 185, 129, 0.2)' : m.status === 'QUEUED' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: m.status === 'DELIVERED' || m.status === 'SENT' ? '#34D399' : m.status === 'QUEUED' ? '#FBBF24' : '#F87171',
                          }}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>{m.recipientEmail}</td>
                      <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>{m.subject}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#94A3B8' }}>{m.providerMessageId || 'Pending'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
