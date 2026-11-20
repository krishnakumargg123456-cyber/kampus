import React, { useEffect, useState } from 'react';
import { Download, Send } from 'lucide-react';
import type { AdminSupportTicket, AdminTeamMember } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminCard, AdminFeedbackBanner, AdminMetricTile, StatusLabel, formatDateTime } from './AdminShared';

export const AdminAnalyticsSupportView: React.FC<{ mode: 'analytics' | 'support' }> = ({ mode }) => {
  const { adminFetch, token, hasPermission } = useAdminAuth();

  // Analytics
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  // Support
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [team, setTeam] = useState<AdminTeamMember[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [replyText, setReplyText] = useState('');

  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  const loadAnalytics = async () => {
    try {
      const qs = new URLSearchParams();
      if (fromDate) qs.set('from', fromDate);
      if (toDate) qs.set('to', toDate);
      const res = await adminFetch<any>(`/api/admin/analytics?${qs.toString()}`);
      setAnalytics(res);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to load analytics.' });
    }
  };

  useEffect(() => {
    if (mode === 'analytics') {
      loadAnalytics();
    } else {
      adminFetch<{ tickets: AdminSupportTicket[]; team: AdminTeamMember[] }>('/api/admin/support')
        .then((d) => {
          setTickets(d.tickets || []);
          setTeam(d.team || []);
          if (d.tickets?.length) setSelectedTicket(d.tickets[0]);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    }
  }, [mode]);

  const exportDataset = async (dataset: 'users' | 'content' | 'audit' | 'support', format: 'csv' | 'json') => {
    try {
      const res = await fetch(`/api/admin/export/${dataset}?format=${format}`, {
        headers: token ? { 'X-Admin-Token': token } : {},
      });
      if (!res.ok) throw new Error('Export authorization failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kampus-${dataset}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice({ kind: 'success', message: `Exported ${dataset} dataset (${format.toUpperCase()}). Private Locker files excluded.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Export failed.' });
    }
  };

  const updateTicket = async (
    ticketId: string,
    payload: { status?: AdminSupportTicket['status']; assignedTo?: string | null; internalNote?: string; replyText?: string }
  ) => {
    try {
      const res = await adminFetch<{ ticket: AdminSupportTicket; tickets: AdminSupportTicket[] }>(
        `/api/admin/support/${ticketId}/action`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      setTickets(res.tickets);
      setSelectedTicket(res.ticket);
      setInternalNote('');
      setReplyText('');
      setNotice({ kind: 'success', message: `Updated ticket ${res.ticket.id}.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Ticket update failed.' });
    }
  };

  if (mode === 'support') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Support Center & Safety Triage
          </h1>
          <p className="text-xs text-slate-500">
            Unified queue across Account Support, Student Voice grievances, and Marketplace/Community moderation reports.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <AdminCard className="lg:col-span-5" title={`Support Tickets (${tickets.length})`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[560px] overflow-y-auto">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No support or moderation tickets recorded.</p>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`py-3 px-2 rounded-lg cursor-pointer ${
                      selectedTicket?.id === t.id ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{t.subject}</span>
                      <StatusLabel status={t.status} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t.sourceModule} · {t.type} · {t.requesterName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminCard>

          <div className="lg:col-span-7">
            {selectedTicket ? (
              <AdminCard title={selectedTicket.subject} subtitle={`${selectedTicket.sourceModule} · ${selectedTicket.priority} Priority`}>
                <div className="space-y-4 text-xs">
                  <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 leading-relaxed">
                    {selectedTicket.description || 'No additional description provided.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Workflow Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) =>
                          updateTicket(selectedTicket.id, {
                            status: e.target.value as AdminSupportTicket['status'],
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Open">Open</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting for Response">Waiting for Response</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Assign Administrator</label>
                      <select
                        value={selectedTicket.assignedTo || ''}
                        onChange={(e) =>
                          updateTicket(selectedTicket.id, { assignedTo: e.target.value || null })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="">Unassigned</option>
                        {team.map((m) => (
                          <option key={m.id} value={m.email}>
                            {m.name} ({m.roleId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reply to requester */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold">Official Response Log ({selectedTicket.replies.length})</div>
                    {selectedTicket.replies.map((r) => (
                      <div key={r.id} className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30">
                        <div>{r.text}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {r.author} · {formatDateTime(r.createdAt)}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write response to requester..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => replyText.trim() && updateTicket(selectedTicket.id, { replyText })}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Reply
                      </button>
                    </div>
                  </div>

                  {/* Internal notes */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold">Internal Admin Notes ({selectedTicket.internalNotes.length})</div>
                    {selectedTicket.internalNotes.map((n) => (
                      <div key={n.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px]">
                        <span>{n.text}</span>
                        <span className="text-slate-400 ml-2">({n.author})</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Internal triage note..."
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => internalNote.trim() && updateTicket(selectedTicket.id, { internalNote })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              </AdminCard>
            ) : (
              <AdminCard title="Select a Ticket">
                <p className="text-xs text-slate-500">Choose any item from the support queue to inspect or triage.</p>
              </AdminCard>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Analytics & Authorized Data Exports
          </h1>
          <p className="text-xs text-slate-500">
            Real server-computed metrics from stored records with date filtering and privacy-safe CSV/JSON exports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="button"
            onClick={loadAnalytics}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
          >
            Apply Range
          </button>
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      {analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminMetricTile
              label="Students In Range"
              value={analytics.usersSummary.totalInRange}
              detail={`${analytics.usersSummary.verifiedCount} verified · ${analytics.usersSummary.suspendedCount} suspended`}
              tone="blue"
            />
            <AdminMetricTile
              label="Events & Registrations"
              value={analytics.eventsSummary.totalEvents}
              detail={`${analytics.eventsSummary.totalRegistrations} student registrations`}
              tone="success"
            />
            <AdminMetricTile
              label="Marketplace Listings"
              value={analytics.marketplaceSummary.totalListings}
              detail={`${analytics.marketplaceSummary.activeCategories.length} categories`}
            />
            <AdminMetricTile
              label="Rewards Ledger Events"
              value={analytics.rewardsSummary.transactionsCount}
              detail={`${analytics.rewardsSummary.redemptionsCount} redemptions`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminCard title="Content Records by Module">
              <div className="space-y-2 text-xs">
                {analytics.contentByModule.map((row: any) => (
                  <div key={row.module} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="font-semibold">{row.module}</span>
                    <span className="font-mono font-bold tabular-nums">{row.count}</span>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard
              title="Authorized CSV & JSON Exports"
              subtitle="Passwords, session tokens, API secrets, and private Locker files are excluded."
            >
              {!hasPermission('export') ? (
                <p className="text-xs text-slate-500">Your current admin role does not include export permission.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(['users', 'content', 'audit', 'support'] as const).map((ds) => (
                    <div
                      key={ds}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold capitalize">{ds} Dataset</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportDataset(ds, 'csv')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-blue-600 hover:text-white"
                        >
                          <Download className="w-3 h-3" /> CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => exportDataset(ds, 'json')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-blue-600 hover:text-white"
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        </>
      )}
    </div>
  );
};
