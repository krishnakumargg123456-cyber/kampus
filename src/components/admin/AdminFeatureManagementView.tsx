import React, { useEffect, useState } from 'react';
import { ExternalLink, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ManagedFeatureConfig } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { AdminCard, AdminFeedbackBanner, StatusLabel, formatDateTime } from './AdminShared';

export const AdminFeatureManagementView: React.FC = () => {
  const { adminFetch, hasPermission } = useAdminAuth();
  const { refreshPlatformConfig } = usePlatformConfig();

  const [features, setFeatures] = useState<ManagedFeatureConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  const load = async () => {
    try {
      const data = await adminFetch<{ features: ManagedFeatureConfig[] }>('/api/admin/features');
      setFeatures(data.features || []);
      if (!selectedId && data.features?.length) setSelectedId(data.features[0].id);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to load features.' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = features.filter((f) => categoryFilter === 'all' || f.category === categoryFilter);
  const selected = features.find((f) => f.id === selectedId) || filtered[0] || null;

  const updateLocal = (id: string, patch: Partial<ManagedFeatureConfig>) => {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const saveFeature = async (target: ManagedFeatureConfig) => {
    setSaving(true);
    try {
      const res = await adminFetch<{ feature: ManagedFeatureConfig }>(`/api/admin/features/${target.id}`, {
        method: 'PUT',
        body: JSON.stringify(target),
      });
      setFeatures((prev) => prev.map((f) => (f.id === res.feature.id ? res.feature : f)));
      await refreshPlatformConfig();
      setNotice({
        kind: 'success',
        message: `Saved "${res.feature.name}" (${res.feature.enabled ? 'Enabled' : 'Disabled'}, Maintenance: ${
          res.feature.maintenanceMode ? 'On' : 'Off'
        }). Live student app synced.`,
      });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to update feature.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            21-Module Feature Management Center
          </h1>
          <p className="text-xs text-slate-500">
            Enable/disable modules, set maintenance screens, customize labels, permissions, and operational limits.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'learn', 'connect', 'campus', 'career', 'market', 'tools', 'account'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border ${
                categoryFilter === cat
                  ? 'bg-[#172554] text-white border-[#172554]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 21 Features List */}
        <AdminCard className="lg:col-span-5" title={`Platform Modules (${filtered.length})`}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
            {filtered.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={`py-2.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-3 ${
                  selected?.id === f.id ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    #{f.number} {f.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {f.route} · {f.usageCount} records
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {f.maintenanceMode && <StatusLabel status="Maintenance" />}
                  <StatusLabel status={f.enabled ? 'Enabled' : 'Disabled'} />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Dedicated Feature Control Detail Workspace */}
        <div className="lg:col-span-7 space-y-6">
          {selected && (
            <>
              <AdminCard
                title={`#${selected.number} ${selected.name}`}
                subtitle={`${selected.category.toUpperCase()} · Route ${selected.route}`}
                action={
                  <div className="flex items-center gap-2">
                    <Link
                      to={selected.route}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Module
                    </Link>
                    <button
                      type="button"
                      disabled={!hasPermission('configure') || saving}
                      onClick={() => saveFeature(selected)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Module Config
                    </button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                      <span className="text-xs font-bold">Feature Enabled</span>
                      <input
                        type="checkbox"
                        checked={selected.enabled}
                        onChange={(e) => updateLocal(selected.id, { enabled: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                      <span className="text-xs font-bold">Visible in Menus</span>
                      <input
                        type="checkbox"
                        checked={selected.visible}
                        onChange={(e) => updateLocal(selected.id, { visible: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                      <span className="text-xs font-bold">Maintenance Mode</span>
                      <input
                        type="checkbox"
                        checked={selected.maintenanceMode}
                        onChange={(e) => updateLocal(selected.id, { maintenanceMode: e.target.checked })}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Display Name</label>
                      <input
                        type="text"
                        value={selected.name}
                        onChange={(e) => updateLocal(selected.id, { name: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Access Scope</label>
                      <select
                        value={selected.accessPermission}
                        onChange={(e) =>
                          updateLocal(selected.id, {
                            accessPermission: e.target.value as ManagedFeatureConfig['accessPermission'],
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="all">All Authenticated Users</option>
                        <option value="verified">Verified Students Only</option>
                        <option value="students_only">Campus Enrolled Students</option>
                        <option value="beta">Beta Cohort</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Module Description</label>
                      <input
                        type="text"
                        value={selected.description}
                        onChange={(e) => updateLocal(selected.id, { description: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Maintenance Message</label>
                      <input
                        type="text"
                        value={selected.maintenanceMessage}
                        onChange={(e) => updateLocal(selected.id, { maintenanceMessage: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Operational Limits */}
                  {Object.keys(selected.limits || {}).length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Module Quotas & Operational Limits
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(selected.limits).map(([k, v]) => (
                          <div key={k}>
                            <label className="block text-[11px] font-mono text-slate-500 mb-1">{k}</label>
                            <input
                              type={typeof v === 'number' ? 'number' : 'text'}
                              value={v}
                              onChange={(e) =>
                                updateLocal(selected.id, {
                                  limits: {
                                    ...selected.limits,
                                    [k]: typeof v === 'number' ? Number(e.target.value) : e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature-Specific Settings */}
                  {Object.keys(selected.featureSettings || {}).length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Feature-Specific Behavior Controls
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(selected.featureSettings).map(([k, v]) =>
                          typeof v === 'boolean' ? (
                            <label
                              key={k}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer"
                            >
                              <span className="text-xs font-mono">{k}</span>
                              <input
                                type="checkbox"
                                checked={v}
                                onChange={(e) =>
                                  updateLocal(selected.id, {
                                    featureSettings: { ...selected.featureSettings, [k]: e.target.checked },
                                  })
                                }
                              />
                            </label>
                          ) : (
                            <div key={k}>
                              <label className="block text-[11px] font-mono text-slate-500 mb-1">{k}</label>
                              <input
                                type={typeof v === 'number' ? 'number' : 'text'}
                                value={String(v)}
                                onChange={(e) =>
                                  updateLocal(selected.id, {
                                    featureSettings: {
                                      ...selected.featureSettings,
                                      [k]: typeof v === 'number' ? Number(e.target.value) : e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AdminCard>

              <AdminCard title="Module Configuration Changelog">
                {selected.history.length === 0 ? (
                  <p className="text-xs text-slate-500">No admin modifications logged for this module yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selected.history.map((h) => (
                      <div key={h.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-semibold">{h.summary}</span>
                          <span className="text-slate-500 ml-2">by {h.actor}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {formatDateTime(h.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </AdminCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
