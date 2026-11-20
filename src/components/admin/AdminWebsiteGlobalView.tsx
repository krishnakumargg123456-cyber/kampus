import React, { useEffect, useState } from 'react';
import { Monitor, RotateCcw, Save, Smartphone } from 'lucide-react';
import type { WebsiteConfig, WebsiteConfigVersion } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import {
  AdminCard,
  AdminConfirmModal,
  AdminFeedbackBanner,
  StatusLabel,
  formatDateTime,
} from './AdminShared';

export const AdminWebsiteGlobalView: React.FC<{ mode: 'website' | 'settings' }> = ({ mode }) => {
  const { adminFetch, isSuperAdmin } = useAdminAuth();
  const { refreshPlatformConfig } = usePlatformConfig();

  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [versions, setVersions] = useState<WebsiteConfigVersion[]>([]);
  const [changeNote, setChangeNote] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  const load = async () => {
    try {
      const data = await adminFetch<{ config: WebsiteConfig; versions: WebsiteConfigVersion[] }>('/api/admin/website');
      setConfig(data.config);
      setVersions(data.versions || []);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to load website settings.' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const performSave = async () => {
    if (!config) return;
    setConfirmOpen(false);
    setSaving(true);
    setNotice(null);
    try {
      const res = await adminFetch<{ config: WebsiteConfig; versions: WebsiteConfigVersion[] }>('/api/admin/website', {
        method: 'PUT',
        body: JSON.stringify({
          config,
          note: changeNote.trim() || `Updated ${mode === 'website' ? 'Website Control' : 'Global Settings'}`,
        }),
      });
      setConfig(res.config);
      setVersions(res.versions || []);
      setChangeNote('');
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: 'Website configuration saved and synchronized to live student app.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      const res = await adminFetch<{ config: WebsiteConfig; versions: WebsiteConfigVersion[] }>(
        `/api/admin/website/restore/${versionId}`,
        { method: 'POST' }
      );
      setConfig(res.config);
      setVersions(res.versions || []);
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: 'Restored configuration snapshot.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Restore failed.' });
    }
  };

  const handleSaveClick = () => {
    if (!config) return;
    if (!config.siteActive || config.maintenanceMode) {
      setConfirmOpen(true);
      return;
    }
    performSave();
  };

  if (!config) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading platform configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {mode === 'website' ? 'Website Control Center' : 'Global Platform Settings'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'website'
              ? 'Manage site identity, live availability, maintenance mode, theme palette, and preview changes.'
              : 'Configure localization, SEO metadata, timezone, date formats, and platform-wide defaults.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isSuperAdmin && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              View Only (Requires Super Admin to apply)
            </span>
          )}
          <button
            type="button"
            disabled={!isSuperAdmin || saving}
            onClick={handleSaveClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Applying...' : 'Save & Apply Live'}</span>
          </button>
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Controls */}
        <div className="lg:col-span-8 space-y-6">
          {mode === 'website' ? (
            <>
              <AdminCard title="Website Identity & Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Website Name</label>
                    <input
                      type="text"
                      value={config.siteName}
                      onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Tagline</label>
                    <input
                      type="text"
                      value={config.tagline}
                      onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Logo Image URL</label>
                    <input
                      type="text"
                      value={config.logoUrl}
                      onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Contact Support Email</label>
                    <input
                      type="email"
                      value={config.contactEmail}
                      onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Footer Mission Description</label>
                    <textarea
                      rows={2}
                      value={config.footerDescription}
                      onChange={(e) => setConfig({ ...config, footerDescription: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </AdminCard>

              <AdminCard
                title="Availability & Maintenance Controls"
                subtitle="Admin routes (/admin/*) always remain accessible to prevent administrator lockout."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'siteActive',
                        label: 'Student Website Live',
                        desc: 'Allow students to load the portal',
                      },
                      {
                        key: 'maintenanceMode',
                        label: 'Maintenance Mode',
                        desc: 'Show scheduled maintenance screen to students',
                      },
                      {
                        key: 'allowLogin',
                        label: 'Student Sign-In Enabled',
                        desc: 'Allow student account logins',
                      },
                      {
                        key: 'allowRegistration',
                        label: 'New Student Registration',
                        desc: 'Permit new student account signups',
                      },
                    ].map((toggle) => {
                      const val = Boolean((config as any)[toggle.key]);
                      return (
                        <label
                          key={toggle.key}
                          className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {toggle.label}
                            </div>
                            <div className="text-[11px] text-slate-500">{toggle.desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={(e) => setConfig({ ...config, [toggle.key]: e.target.checked })}
                            className="mt-1 accent-blue-600"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Maintenance Notice Message</label>
                      <input
                        type="text"
                        value={config.maintenanceMessage}
                        onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Scheduled Maintenance Window</label>
                      <input
                        type="text"
                        placeholder="e.g. Sunday 02:00 - 03:00 IST"
                        value={config.scheduledMaintenanceWindow}
                        onChange={(e) =>
                          setConfig({ ...config, scheduledMaintenanceWindow: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </AdminCard>

              <AdminCard title="Appearance & Brand Design Tokens">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Deep Navy</label>
                    <input
                      type="color"
                      value={config.navyColor}
                      onChange={(e) => setConfig({ ...config, navyColor: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Accent Color</label>
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Button Radius</label>
                    <select
                      value={config.buttonStyle}
                      onChange={(e) =>
                        setConfig({ ...config, buttonStyle: e.target.value as WebsiteConfig['buttonStyle'] })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="rounded">Rounded</option>
                      <option value="pill">Pill</option>
                      <option value="sharp">Sharp</option>
                    </select>
                  </div>
                </div>
              </AdminCard>
            </>
          ) : (
            <AdminCard title="Localization, SEO & Global Defaults">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Default Theme</label>
                  <select
                    value={config.defaultTheme}
                    onChange={(e) =>
                      setConfig({ ...config, defaultTheme: e.target.value as 'light' | 'dark' })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="light">Light Workspace</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Default Language</label>
                  <select
                    value={config.defaultLanguage}
                    onChange={(e) =>
                      setConfig({ ...config, defaultLanguage: e.target.value as 'en' | 'hi' })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="en">English (IN)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Timezone</label>
                  <input
                    type="text"
                    value={config.timezone}
                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Date Display Format</label>
                  <select
                    value={config.dateFormat}
                    onChange={(e) =>
                      setConfig({ ...config, dateFormat: e.target.value as WebsiteConfig['dateFormat'] })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="DD MMM YYYY">DD MMM YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">SEO Meta Title</label>
                  <input
                    type="text"
                    value={config.seoTitle}
                    onChange={(e) => setConfig({ ...config, seoTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    value={config.seoDescription}
                    onChange={(e) => setConfig({ ...config, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={config.supportPhone}
                    onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={config.footerCopyright}
                    onChange={(e) => setConfig({ ...config, footerCopyright: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </AdminCard>
          )}

          {/* Audit Change Note */}
          <AdminCard title="Commit Change Note">
            <input
              type="text"
              placeholder="Optional changelog note recorded in version history..."
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </AdminCard>
        </div>

        {/* Right Column: Live Preview & Version History */}
        <div className="lg:col-span-4 space-y-6">
          <AdminCard
            title="Live Identity Preview"
            action={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded ${
                    previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded ${
                    previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            }
          >
            <div
              className={`mx-auto border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 ${
                previewDevice === 'mobile' ? 'max-w-[260px]' : 'w-full'
              }`}
            >
              <div
                className="px-4 py-3 text-white flex items-center justify-between"
                style={{ backgroundColor: config.navyColor }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.siteName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">{config.siteName}</div>
                    <div className="text-[10px] opacity-80 truncate">{config.tagline}</div>
                  </div>
                </div>
                <StatusLabel
                  status={config.maintenanceMode ? 'Maintenance' : config.siteActive ? 'Live' : 'Offline'}
                />
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {config.maintenanceMode ? config.maintenanceMessage : config.seoTitle}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2">{config.footerDescription}</div>
                <div className="pt-2 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-white text-[11px] font-semibold ${
                      config.buttonStyle === 'pill'
                        ? 'rounded-full'
                        : config.buttonStyle === 'sharp'
                        ? 'rounded-sm'
                        : 'rounded-lg'
                    }`}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Primary CTA
                  </span>
                  <span
                    className="px-2 py-1 text-[10px] font-semibold text-white rounded"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    Accent
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Configuration Versions" subtitle="Restore previous site configurations">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {versions.map((ver) => (
                <div key={ver.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ver.note}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {formatDateTime(ver.createdAt)} · {ver.createdBy}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRestore(ver.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600"
                      title="Restore version"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>

      <AdminConfirmModal
        open={confirmOpen}
        title="Confirm Student Site Availability Change"
        description={
          !config.siteActive
            ? 'Turning off Student Website Live will show the offline screen to students across all non-admin routes. Super Admin portal (/admin/*) stays active.'
            : 'Enabling Maintenance Mode will restrict student access with your scheduled maintenance banner until cleared.'
        }
        confirmLabel="Apply Critical Change"
        danger={!config.siteActive}
        onConfirm={performSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
