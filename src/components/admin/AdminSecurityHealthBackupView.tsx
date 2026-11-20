import React, { useEffect, useState } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import type {
  AdminLoginEvent,
  AdminSessionRecord,
  AuditLogEntry,
  BackupRecord,
  IntegrationStatusItem,
  SystemHealthSnapshot,
} from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminCard, AdminFeedbackBanner, AdminMetricTile, StatusLabel, formatBytes, formatDateTime } from './AdminShared';

export const AdminSecurityHealthBackupView: React.FC<{
  mode: 'security' | 'health' | 'integrations' | 'audit';
}> = ({ mode }) => {
  const { adminFetch, isSuperAdmin } = useAdminAuth();

  // Security
  const [sessions, setSessions] = useState<AdminSessionRecord[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginEvent[]>([]);
  const [failedCount, setFailedCount] = useState(0);

  // Health & Backups
  const [health, setHealth] = useState<SystemHealthSnapshot | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [retention, setRetention] = useState<{ auditLogDays: number; resolvedTicketDays: number; backupRetentionCount: number } | null>(null);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);

  // Integrations
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);

  // Audit
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [auditQuery, setAuditQuery] = useState('');

  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  const load = async () => {
    try {
      if (mode === 'security') {
        const res = await adminFetch<any>('/api/admin/security');
        setSessions(res.signedInSessions || []);
        setLoginHistory(res.loginHistory || []);
        setFailedCount(res.failedAttemptsCount || 0);
      } else if (mode === 'health') {
        const res = await adminFetch<any>('/api/admin/backups');
        setBackups(res.backups || []);
        setRetention(res.retentionConfig || null);
        setDeletionRequests(res.deletionRequests || []);
        setHealth(res.health || null);
      } else if (mode === 'integrations') {
        const res = await adminFetch<{ integrations: IntegrationStatusItem[] }>('/api/admin/integrations');
        setIntegrations(res.integrations || []);
      } else {
        const res = await adminFetch<{ logs: AuditLogEntry[] }>('/api/admin/audit-logs');
        setLogs(res.logs || []);
      }
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to load operational telemetry.' });
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await adminFetch<{ signedInSessions: AdminSessionRecord[] }>('/api/admin/security/revoke-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      setSessions(res.signedInSessions);
      setNotice({ kind: 'success', message: 'Admin session revoked.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to revoke session.' });
    }
  };

  const createBackup = async () => {
    try {
      const res = await adminFetch<{ backup: BackupRecord; backups: BackupRecord[] }>('/api/admin/backups', {
        method: 'POST',
      });
      setBackups(res.backups);
      setNotice({
        kind: 'success',
        message: `Verified disk snapshot created: ${res.backup.fileName} (${formatBytes(res.backup.sizeBytes)})`,
      });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Backup creation failed.' });
    }
  };

  const testIntegration = async (id: string) => {
    try {
      const res = await adminFetch<{ integration: IntegrationStatusItem }>(`/api/admin/integrations/${id}/test`, {
        method: 'POST',
      });
      setIntegrations((prev) => prev.map((i) => (i.id === id ? res.integration : i)));
      setNotice({
        kind: res.integration.connectionStatus === 'Connected' ? 'success' : 'info',
        message: `${res.integration.name}: ${res.integration.connectionStatus} — ${res.integration.details}`,
      });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Integration check failed.' });
    }
  };

  if (mode === 'security') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Security Center & Session Control
          </h1>
          <p className="text-xs text-slate-500">
            Inspect active administrator sessions, review authentication events, and revoke suspicious access.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AdminMetricTile label="Active Admin Sessions" value={sessions.length} tone="blue" />
          <AdminMetricTile label="Total Auth Events" value={loginHistory.length} />
          <AdminMetricTile
            label="Failed Login Attempts"
            value={failedCount}
            tone={failedCount > 0 ? 'warning' : 'success'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title="Active Administrator Sessions">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold">
                      {s.adminName} <span className="font-mono text-slate-500">({s.roleId})</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {s.ipAddress} · Last active {formatDateTime(s.lastActiveAt)}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => revokeSession(s.id)}
                      className="px-2.5 py-1 rounded border border-red-200 text-red-600 font-semibold hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Recent Login History">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {loginHistory.map((ev) => (
                <div key={ev.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold">{ev.email}</div>
                    <div className="text-[11px] text-slate-500">{ev.reason}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <StatusLabel status={ev.success ? 'Success' : 'Failed'} />
                    <div className="text-[10px] font-mono text-slate-400">{formatDateTime(ev.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    );
  }

  if (mode === 'health') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              System Health & Verified Backups
            </h1>
            <p className="text-xs text-slate-500">
              Live Node.js process metrics, datastore footprint, and SHA-256 verified snapshot creation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={createBackup}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                <HardDrive className="w-3.5 h-3.5" /> Create Verified Backup
              </button>
            )}
          </div>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        {health && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminMetricTile
              label="Server Status"
              value={health.appStatus}
              detail={`Uptime ${health.backendUptimeSeconds}s · ${health.buildMode}`}
              tone="success"
            />
            <AdminMetricTile
              label="Memory Footprint"
              value={`${health.memoryHeapUsedMb} MB`}
              detail={`RSS ${health.memoryRssMb} MB · ${health.nodeVersion}`}
            />
            <AdminMetricTile
              label="Domain Datastores"
              value={`${health.databaseFilesCount} Files`}
              detail={formatBytes(health.databaseTotalBytes)}
              tone="blue"
            />
            <AdminMetricTile
              label="Storage & Media"
              value={health.storageWritable ? 'Writable' : 'Read-Only'}
              detail={`${health.mediaCount} indexed media assets`}
            />
          </div>
        )}

        <AdminCard
          title={`Verified Disk Snapshots (${backups.length})`}
          subtitle="Stored in .kampus_backups/ with SHA-256 integrity checksums (excludes private Locker documents)"
        >
          {backups.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No disk backups created yet. Click &ldquo;Create Verified Backup&rdquo; above.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {backups.map((b) => (
                <div key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-mono font-bold">{b.fileName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      SHA-256: {b.checksumSha256.slice(0, 18)}... · Stores: {b.includedStores.length}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums">{formatBytes(b.sizeBytes)}</span>
                    <StatusLabel status={b.verified ? 'Verified' : 'Unverified'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title="Data Retention Policies" subtitle="Active storage lifecycle guardrails">
            {retention ? (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-slate-500">Audit Logs</div>
                  <div className="text-base font-extrabold font-mono tabular-nums mt-1">{retention.auditLogDays}d</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-slate-500">Resolved Tickets</div>
                  <div className="text-base font-extrabold font-mono tabular-nums mt-1">{retention.resolvedTicketDays}d</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-slate-500">Snapshot Cap</div>
                  <div className="text-base font-extrabold font-mono tabular-nums mt-1">{retention.backupRetentionCount}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Retention policy loaded from datastore.</p>
            )}
          </AdminCard>

          <AdminCard title={`Account Deletion Requests (${deletionRequests.length})`} subtitle="Student privacy & erasure queue">
            {deletionRequests.length === 0 ? (
              <p className="text-xs text-slate-500">No pending student account deletion requests.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {deletionRequests.map((req: any, idx: number) => (
                  <div key={req.id || idx} className="py-2 flex items-center justify-between gap-2">
                    <span className="font-mono">{req.userId || req.email || 'Student Account'}</span>
                    <StatusLabel status={req.status || 'Pending'} />
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    );
  }

  if (mode === 'integrations') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Platform Integrations & Environment Services
          </h1>
          <p className="text-xs text-slate-500">
            Truthful runtime status of configured vs unconfigured environment secrets. API keys are never exposed.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((intItem) => (
            <div
              key={intItem.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-slate-900 dark:text-slate-100">{intItem.name}</div>
                <StatusLabel status={intItem.connectionStatus} />
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {intItem.category} · Config: {intItem.configurationStatus}
              </div>
              <p className="text-slate-600 dark:text-slate-400">{intItem.details}</p>
              {intItem.supportsTest && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => testIntegration(intItem.id)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Run Connection Check
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter((l) => {
    if (!auditQuery.trim()) return true;
    const q = auditQuery.toLowerCase();
    return (
      l.actor.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.target.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Immutable Control Center Audit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Trace every configuration edit, publish event, suspension, backup, and denied access attempt.
          </p>
        </div>
        <input
          type="text"
          placeholder="Filter by actor, action, target..."
          value={auditQuery}
          onChange={(e) => setAuditQuery(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        />
      </div>

      <AdminCard title={`Recorded Events (${filteredLogs.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2 pr-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.slice(0, 120).map((log) => (
                <tr key={log.id}>
                  <td className="py-2 pr-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-semibold">{log.actor}</span>
                    <span className="ml-1.5 text-[10px] font-mono text-slate-400">({log.actorRole})</span>
                  </td>
                  <td className="py-2 pr-3 font-mono font-semibold">{log.action}</td>
                  <td className="py-2 pr-3">{log.target}</td>
                  <td className="py-2 pr-3">
                    <StatusLabel status={log.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
};
