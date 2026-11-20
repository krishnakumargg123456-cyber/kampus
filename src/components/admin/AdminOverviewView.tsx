import React, { useEffect, useState } from 'react';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import type { AdminSectionId, AdminSupportTicket, AdminUserRecord, AuditLogEntry, SystemHealthSnapshot, UnifiedContentItem } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminCard, AdminMetricTile, StatusLabel, formatDateTime } from './AdminShared';

interface OverviewResponse {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    suspendedUsers: number;
    totalPublishedContent: number;
    totalActiveFeatures: number;
    totalFeatures: number;
    totalEvents: number;
    pendingReports: number;
    pendingSupportTickets: number;
  };
  featureBreakdown: Array<{ id: string; name: string; category: string; enabled: boolean; recordsCount: number }>;
  recentUsers: AdminUserRecord[];
  recentContent: UnifiedContentItem[];
  recentAuditLogs: AuditLogEntry[];
  recentTickets: AdminSupportTicket[];
  systemHealth: SystemHealthSnapshot;
  integrationsSummary: { total: number; connected: number; notConfigured: number };
}

export const AdminOverviewView: React.FC<{ onNavigate: (sec: AdminSectionId) => void }> = ({ onNavigate }) => {
  const { adminFetch } = useAdminAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<OverviewResponse>('/api/admin/overview');
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading real-time platform overview...</div>;
  }

  if (error || !data) {
    return (
      <AdminCard title="Overview Unavailable">
        <p className="text-xs text-red-600">{error || 'Unable to compute platform overview.'}</p>
      </AdminCard>
    );
  }

  const maxRecords = Math.max(1, ...data.featureBreakdown.map((f) => f.recordsCount));

  return (
    <div className="space-y-6">
      {/* Executive Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Platform Operations Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Backend {data.systemHealth.appStatus} · {data.systemHealth.databaseFilesCount} datastores · {data.integrationsSummary.connected}/{data.integrationsSummary.total} integrations connected
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('homepage')}
            className="px-3 py-1.5 rounded-lg bg-[#172554] hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
          >
            Edit Homepage
          </button>
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
          >
            Add Announcement
          </button>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
          Quick Actions:
        </span>
        {(
          [
            ['Edit Homepage', 'homepage'],
            ['Add Announcement', 'notifications'],
            ['Create Page', 'pages'],
            ['Manage Users', 'users'],
            ['Configure Features', 'features'],
            ['Review Reports', 'support'],
          ] as Array<[string, AdminSectionId]>
        ).map(([label, target]) => (
          <button
            key={target}
            type="button"
            onClick={() => onNavigate(target)}
            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500 transition-colors whitespace-nowrap"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricTile
          label="Total Registered Users"
          value={data.metrics.totalUsers}
          detail={`${data.metrics.activeUsers} active · ${data.metrics.newRegistrations} recent · ${data.metrics.suspendedUsers} suspended`}
          tone="blue"
        />
        <AdminMetricTile
          label="Active Feature Modules"
          value={`${data.metrics.totalActiveFeatures} / ${data.metrics.totalFeatures}`}
          detail="Live across student super app"
          tone="success"
        />
        <AdminMetricTile
          label="Published Content"
          value={data.metrics.totalPublishedContent}
          detail={`${data.metrics.totalEvents} campus events indexed`}
        />
        <AdminMetricTile
          label="Pending Reports & Tickets"
          value={data.metrics.pendingSupportTickets}
          detail={`${data.metrics.pendingReports} flagged safety/content items`}
          tone={data.metrics.pendingSupportTickets > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Feature Record Volume + Recent System & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <AdminCard
          className="lg:col-span-7"
          title="21-Module Live Data Volume"
          subtitle="Actual stored records per enabled or configured module"
          action={
            <button
              type="button"
              onClick={() => onNavigate('features')}
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Manage Modules <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {data.featureBreakdown.map((f) => (
              <div key={f.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {f.name}
                    </span>
                    <StatusLabel status={f.enabled ? 'Active' : 'Disabled'} />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {f.recordsCount}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.enabled ? 'bg-blue-600' : 'bg-slate-400'}`}
                    style={{ width: `${Math.max(4, Math.round((f.recordsCount / maxRecords) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard
          className="lg:col-span-5"
          title="Recent Admin Actions"
          subtitle="Immutable control center audit stream"
          action={
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All Logs
            </button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
            {data.recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {log.action}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {log.target} · {log.actor}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <StatusLabel status={log.result} />
                  <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Bottom 3 Queues: Recent Users, Recent Content, Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard
          title="Recent Users"
          action={
            <button
              type="button"
              onClick={() => onNavigate('users')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              User Directory
            </button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentUsers.map((u) => (
              <div key={u.userId} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {u.college || u.enrollmentNo}
                  </div>
                </div>
                <StatusLabel status={u.accountStatus} />
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard
          title="Latest Platform Content"
          action={
            <button
              type="button"
              onClick={() => onNavigate('content')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Moderate Content
            </button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentContent.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {c.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{c.module}</div>
                </div>
                <StatusLabel status={c.status} />
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard
          title="Support & Safety Queue"
          action={
            <button
              type="button"
              onClick={() => onNavigate('support')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Open Queue
            </button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentTickets.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No active support or safety tickets.
              </div>
            ) : (
              data.recentTickets.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t.subject}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {t.sourceModule} · {t.requesterName}
                    </div>
                  </div>
                  <StatusLabel status={t.status} />
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};
