'use client';

import React, { useState } from 'react';
import type {
  DiscoveryRequest,
  MarketEntity,
  AuditLogEntry,
} from '../../../types/taxonomy';

interface Props {
  initialQueues: {
    categoriesQueue: DiscoveryRequest[];
    citiesQueue: DiscoveryRequest[];
    statesQueue: DiscoveryRequest[];
    marketsQueue: DiscoveryRequest[];
    draftMarkets: MarketEntity[];
    publishedMarkets: MarketEntity[];
    archivedMarkets: MarketEntity[];
  };
  initialAuditLogs: AuditLogEntry[];
}

export function DiscoveryDashboardClient({ initialQueues, initialAuditLogs }: Props) {
  const [activeTab, setActiveTab] = useState<'markets' | 'categories' | 'cities' | 'audit'>('markets');
  const [queues, setQueues] = useState(initialQueues);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleAdminAction(action: string, payload: Record<string, unknown>) {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/taxonomy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'TAXONOMY_ADMIN',
          'x-admin-key': 'dev-admin-secret-2026',
        },
        body: JSON.stringify({ action, payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setActionMessage(`Success: ${action} executed successfully.`);
      // Refresh queues
      const getRes = await fetch('/api/admin/taxonomy', {
        headers: {
          'x-admin-role': 'TAXONOMY_ADMIN',
          'x-admin-key': 'dev-admin-secret-2026',
        },
      });
      if (getRes.ok) {
        const refreshed = await getRes.json();
        setQueues(refreshed.queues);
        setAuditLogs(refreshed.auditLogs);
      }
    } catch (err: unknown) {
      setActionMessage(err instanceof Error ? err.message : 'Error executing action');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories Queue
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">
            {queues.categoriesQueue.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending taxonomy review</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cities Queue
          </div>
          <div className="mt-2 text-3xl font-extrabold text-foreground">
            {queues.citiesQueue.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending location discovery</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Draft / Discovered
          </div>
          <div className="mt-2 text-3xl font-extrabold text-primary">
            {queues.draftMarkets.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Unpublished / Noindex</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Published
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {queues.publishedMarkets.length}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Live marketplace routes</p>
        </div>
      </div>

      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-lg text-sm font-medium ${
            actionMessage.startsWith('Success')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('markets')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'markets'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Markets Queue ({queues.draftMarkets.length} Drafts / {queues.publishedMarkets.length} Live)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          New Categories ({queues.categoriesQueue.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cities')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'cities'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          New Cities ({queues.citiesQueue.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Markets Tab */}
      {activeTab === 'markets' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Draft & Discovered Markets (Pending Publication)</h2>
            <p className="text-xs text-muted-foreground">
              These markets have been discovered or requested by users. They are strictly non-indexable until explicitly published.
            </p>
          </div>

          {queues.draftMarkets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground rounded-lg border border-dashed border-border">
              No pending draft markets in queue.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Route / Slug</th>
                    <th className="p-3">Publication</th>
                    <th className="p-3">Indexability</th>
                    <th className="p-3">Content Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queues.draftMarkets.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-medium text-foreground">
                        /{m.slug}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          {m.publicationStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {m.indexabilityStatus}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{m.contentStatus}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('PUBLISH_MARKET', {
                              marketId: m.id,
                              indexable: true,
                            })
                          }
                          className="px-3 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          Publish & Index
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('PUBLISH_MARKET', {
                              marketId: m.id,
                              indexable: false,
                            })
                          }
                          className="px-3 py-1 text-xs font-semibold rounded border border-border hover:bg-muted transition"
                        >
                          Publish (Noindex)
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('ARCHIVE_MARKET', {
                              marketId: m.id,
                              reason: 'Admin rejected/archived from queue',
                            })
                          }
                          className="px-3 py-1 text-xs font-semibold rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-4">
            <h2 className="text-lg font-bold text-foreground">Published Active Markets</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Route / Slug</th>
                    <th className="p-3">Publication</th>
                    <th className="p-3">Indexability</th>
                    <th className="p-3">Content</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queues.publishedMarkets.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-medium text-foreground">
                        <a
                          href={`/${m.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-primary"
                        >
                          /{m.slug} ↗
                        </a>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                          {m.publicationStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          {m.indexabilityStatus}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{m.contentStatus}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('SET_INDEXABILITY', {
                              marketId: m.id,
                              indexable: m.indexabilityStatus !== 'INDEXABLE',
                            })
                          }
                          className="px-3 py-1 text-xs font-medium rounded border border-border hover:bg-muted transition"
                        >
                          Toggle {m.indexabilityStatus === 'INDEXABLE' ? 'Noindex' : 'Index'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('ARCHIVE_MARKET', {
                              marketId: m.id,
                              reason: 'Admin archived live market',
                            })
                          }
                          className="px-3 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Categories Queue */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">New Category Discovery Requests</h2>
            <p className="text-xs text-muted-foreground">
              User-requested business categories that do not exist in the taxonomy. Demand is aggregated by normalized name.
            </p>
          </div>

          {queues.categoriesQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground rounded-lg border border-dashed border-border">
              No category discovery requests pending.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Raw Input</th>
                    <th className="p-3">Normalized Value</th>
                    <th className="p-3">Requests</th>
                    <th className="p-3">First Requested</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queues.categoriesQueue.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{req.rawInput}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{req.normalizedValue}</td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{req.requestCount}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(req.firstRequestedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('CREATE_CATEGORY', {
                              name: req.rawInput,
                              discoveryRequestId: req.id,
                            })
                          }
                          className="px-3 py-1 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 transition"
                        >
                          Create Category
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('REJECT_DISCOVERY', {
                              discoveryRequestId: req.id,
                              reason: 'Rejected by taxonomy admin',
                            })
                          }
                          className="px-3 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cities Queue */}
      {activeTab === 'cities' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">New City Discovery Requests</h2>
            <p className="text-xs text-muted-foreground">
              User-requested cities and municipalities. Administrative review ensures valid country and state relationships before creation.
            </p>
          </div>

          {queues.citiesQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground rounded-lg border border-dashed border-border">
              No city discovery requests pending.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Raw Input</th>
                    <th className="p-3">Normalized Value</th>
                    <th className="p-3">Requests</th>
                    <th className="p-3">First Requested</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queues.citiesQueue.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{req.rawInput}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{req.normalizedValue}</td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{req.requestCount}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(req.firstRequestedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('CREATE_CITY', {
                              name: req.rawInput,
                              countryId: 'country-india',
                              stateId: 'state-haryana', // Default fallback for demonstration
                              discoveryRequestId: req.id,
                            })
                          }
                          className="px-3 py-1 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 transition"
                        >
                          Approve City
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleAdminAction('REJECT_DISCOVERY', {
                              discoveryRequestId: req.id,
                              reason: 'Rejected by location admin',
                            })
                          }
                          className="px-3 py-1 text-xs font-medium rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Administrative Audit Trail</h2>
            <p className="text-xs text-muted-foreground">
              Append-only log of all taxonomy mutations, publication approvals, and entity mappings.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Entity ID</th>
                  <th className="p-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-foreground">{log.actor}</td>
                    <td className="p-3 font-mono text-xs font-bold text-primary">{log.action}</td>
                    <td className="p-3 text-xs">{log.entityType}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{log.entityId}</td>
                    <td className="p-3 text-xs text-muted-foreground">{log.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
