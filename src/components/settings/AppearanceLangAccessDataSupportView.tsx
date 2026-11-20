import React, { useState } from 'react';
import {
  Accessibility,
  Bell,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FolderLock,
  Globe,
  HelpCircle,
  Info,
  Link2,
  Monitor,
  Moon,
  Palette,
  Send,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccountProfileSettings } from '../../context/AccountProfileSettingsContext';
import { PreferencesAndHistoryView } from '../notifications/PreferencesAndHistoryView';
import type { SupportTicketRecord } from '../../types/accountProfileSettings';

interface Props {
  activeSection:
    | 'notifications'
    | 'appearance'
    | 'language'
    | 'accessibility'
    | 'connected'
    | 'data'
    | 'support'
    | 'about';
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const AppearanceLangAccessDataSupportView: React.FC<Props> = ({ activeSection }) => {
  const {
    settings,
    connectedServices,
    storageOverview,
    supportTickets,
    saving,
    saveSettingsPatch,
    disconnectService,
    exportUserDataJson,
    submitSupportTicket,
  } = useAccountProfileSettings();

  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Support ticket state
  const [ticketCat, setTicketCat] = useState<SupportTicketRecord['category']>('General Help');
  const [ticketSubj, setTicketSubj] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketAttach, setTicketAttach] = useState('');

  if (!settings) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
        Loading preferences...
      </div>
    );
  }

  const handleExportDownload = async () => {
    const res = await exportUserDataJson();
    if (!res.ok || !res.data) {
      setNotice({ type: 'err', text: res.error || 'Export failed.' });
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kampus-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ type: 'ok', text: 'Your KAMPUS data archive (JSON) has been downloaded.' });
  };

  const handleClearCache = () => {
    const preserve = ['kampus_auth_user', 'kampus_student_profile', 'kampus-theme', 'kampus_language'];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && !preserve.includes(k)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setNotice({
      type: 'ok',
      text: `Cleared ${keysToRemove.length} temporary local cache key(s). Your active session and saved server records remain intact.`,
    });
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submitSupportTicket({
      category: ticketCat,
      subject: ticketSubj,
      description: ticketDesc,
      attachmentName: ticketAttach || undefined,
    });
    if (res.ok && res.ticket) {
      setTicketSubj('');
      setTicketDesc('');
      setTicketAttach('');
      setNotice({ type: 'ok', text: `Support ticket ${res.ticket.id} submitted.` });
    } else {
      setNotice({ type: 'err', text: res.error || 'Could not submit ticket.' });
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
            notice.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 5: NOTIFICATIONS (CENTRALIZED FEATURE 19 INTEGRATION) */}
      {activeSection === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Synchronized directly with your centralized KAMPUS Notification Center.</span>
            </div>
            <Link
              to="/account/notifications"
              className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1 hover:underline"
            >
              <span>Open Full Notification Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <PreferencesAndHistoryView mode="preferences" />
        </div>
      )}

      {/* SECTION 6: APPEARANCE */}
      {activeSection === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              <span>Appearance & Display Density</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Changes apply immediately across the KAMPUS workspace and persist to your account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { id: 'light', label: 'Light Mode', desc: 'Clean academic daylight palette', icon: Sun },
                { id: 'dark', label: 'Dark Mode', desc: 'Low-glare late-night study mode', icon: Moon },
                { id: 'system', label: 'System Default', desc: 'Follows your OS preference', icon: Monitor },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = settings.appearance.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    saveSettingsPatch({ appearance: { ...settings.appearance, theme: opt.id } })
                  }
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interface Density
              </label>
              <select
                value={settings.appearance.density}
                onChange={(e) =>
                  saveSettingsPatch({
                    appearance: {
                      ...settings.appearance,
                      density: e.target.value as 'comfortable' | 'compact',
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="comfortable">Comfortable (Default)</option>
                <option value="compact">Compact (Denser layout)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Sidebar State
              </label>
              <select
                value={settings.appearance.sidebarBehavior}
                onChange={(e) =>
                  saveSettingsPatch({
                    appearance: {
                      ...settings.appearance,
                      sidebarBehavior: e.target.value as 'expanded' | 'collapsed',
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="expanded">Expanded Navigation</option>
                <option value="collapsed">Collapsed Icons</option>
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer text-xs sm:text-sm">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Reduce Motion & Transitions</p>
              <p className="text-xs text-slate-500">Minimizes UI animations across pages.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.appearance.reduceMotion}
              onChange={() =>
                saveSettingsPatch({
                  appearance: { ...settings.appearance, reduceMotion: !settings.appearance.reduceMotion },
                })
              }
            />
          </label>
        </div>
      )}

      {/* SECTION 7: LANGUAGE & REGION */}
      {activeSection === 'language' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 text-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Language & Regional Formatting</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Updating language updates the live interface; timezone syncs with Notification Center Quiet Hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interface Language
              </label>
              <select
                value={settings.languageRegion.language}
                onChange={(e) =>
                  saveSettingsPatch({
                    languageRegion: { ...settings.languageRegion, language: e.target.value as 'en' | 'hi' },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="en">English (Supported)</option>
                <option value="hi">हिन्दी · Hindi (Supported)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Hinglish output is supported inside KAMPUS AI; full UI localization currently supports English and Hindi.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Country / Region</label>
              <input
                type="text"
                value={settings.languageRegion.country}
                onChange={(e) =>
                  saveSettingsPatch({
                    languageRegion: { ...settings.languageRegion, country: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
              <select
                value={settings.languageRegion.timezone}
                onChange={(e) =>
                  saveSettingsPatch({
                    languageRegion: { ...settings.languageRegion, timezone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Format</label>
              <select
                value={settings.languageRegion.dateFormat}
                onChange={(e) =>
                  saveSettingsPatch({
                    languageRegion: {
                      ...settings.languageRegion,
                      dateFormat: e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Format</label>
              <select
                value={settings.languageRegion.timeFormat}
                onChange={(e) =>
                  saveSettingsPatch({
                    languageRegion: { ...settings.languageRegion, timeFormat: e.target.value as '12h' | '24h' },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Week Start Day</label>
              <select
                value={settings.languageRegion.weekStartDay}
                onChange={(e) =>
                  saveSettingsPatch({
                    languageRegion: {
                      ...settings.languageRegion,
                      weekStartDay: e.target.value as 'Monday' | 'Sunday',
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: ACCESSIBILITY */}
      {activeSection === 'accessibility' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-blue-600" />
              <span>Accessibility & Readability</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize typography scaling, contrast, focus indicators, and motion preferences globally.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Base Text Size</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['default', 'Default (16px)'],
                  ['large', 'Large (17px)'],
                  ['xlarge', 'Extra Large (18.5px)'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    saveSettingsPatch({ accessibility: { ...settings.accessibility, textSize: val } })
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    settings.accessibility.textSize === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
            {(
              [
                ['highContrast', 'High Contrast Mode', 'Increases visual contrast across text and borders.'],
                ['reduceMotion', 'Reduce Motion', 'Disables non-essential animations across KAMPUS.'],
                ['enhancedFocusIndicators', 'Enhanced Keyboard Focus Rings', 'Highlights interactive elements for keyboard navigation.'],
                ['screenReaderHints', 'Screen Reader ARIA Hints', 'Enables verbose landmark and label hints.'],
              ] as const
            ).map(([key, title, desc]) => (
              <label key={key} className="py-3 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.accessibility[key]}
                  onChange={() =>
                    saveSettingsPatch({
                      accessibility: { ...settings.accessibility, [key]: !settings.accessibility[key] },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 9: CONNECTED SERVICES */}
      {activeSection === 'connected' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              <span>Connected Services & Ecosystem Bridges</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Only authentic active integrations configured inside this KAMPUS instance are displayed.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {connectedServices.map((svc) => (
              <div key={svc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{svc.name}</p>
                    <span
                      className={`font-semibold ${
                        svc.status === 'Connected' ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      · {svc.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{svc.permissions}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                    Account: {svc.accountLabel}
                    {svc.lastSyncedAt ? ` · Last synced ${svc.lastSyncedAt.slice(0, 10)}` : ''}
                  </p>
                </div>
                {svc.canDisconnect && svc.status === 'Connected' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await disconnectService(svc.id);
                      if (res.ok) setNotice({ type: 'ok', text: `Disconnected ${svc.name}.` });
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 font-semibold self-start cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 10: DATA & STORAGE */}
      {activeSection === 'data' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Data, Storage & Export Controls</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live breakdown from your Digital Locker, Student Profile, and Notification Center records.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500">Digital Locker Used</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {formatBytes(storageOverview?.lockerBytes || 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500">Locker Documents</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {storageOverview?.lockerDocumentsCount ?? 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500">Profile Records</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {storageOverview?.profileItemsCount ?? 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500">Notifications Stored</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {storageOverview?.notificationsCount ?? 0}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleExportDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download My Data (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>Clear Local Cache</span>
              </button>

              <Link
                to="/tools/digital-locker"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600"
              >
                <FolderLock className="w-4 h-4" />
                <span>Manage Digital Locker Files</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 11: HELP & SUPPORT */}
      {activeSection === 'support' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Help, Policies & Support Ticket</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submit real support tickets or review platform policies and FAQs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">How does Profile Privacy work?</p>
                <p className="text-slate-500 mt-1">
                  Private fields like email, phone, DOB, and gender are stripped by the server from public profile views unless explicitly toggled visible.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">KAMPUS Community & Safety Guidelines</p>
                <p className="text-slate-500 mt-1">
                  Academic integrity, respectful peer communication, and zero fabricated credentials are enforced across all 21 modules.
                </p>
              </div>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit a Support Request</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={ticketCat}
                    onChange={(e) => setTicketCat(e.target.value as SupportTicketRecord['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="General Help">General Help</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Privacy & Safety">Privacy & Safety</option>
                    <option value="Feature Feedback">Feature Feedback</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attachment Filename (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. screenshot-issue.png"
                    value={ticketAttach}
                    onChange={(e) => setTicketAttach(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your issue or feedback"
                  value={ticketSubj}
                  onChange={(e) => setTicketSubj(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide details so our support team can assist you..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{saving ? 'Submitting...' : 'Submit Ticket'}</span>
              </button>
            </form>

            {supportTickets.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  Your Support Tickets ({supportTickets.length})
                </p>
                {supportTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {t.id} · {t.subject}
                      </p>
                      <p className="text-slate-500">
                        {t.category} · {t.status}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 12: ABOUT KAMPUS */}
      {activeSection === 'about' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">About KAMPUS</h2>
          </div>
          <p className="font-semibold text-blue-600">Your Student Life, Connected.</p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            KAMPUS unifies 21 integrated student modules — from Study Hub, KAMPUS AI, Notes Exchange, and Study Rooms to Digital Locker, KAMPUS Planner, KAMPUS Rewards, Notification Center, Student Profile, and Settings.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400">Platform Version</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">KAMPUS Super App v1.0.0</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400">Open-Source Foundation</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                React 19, TypeScript, Tailwind CSS, Express, Lucide Icons
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
