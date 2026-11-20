import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Accessibility,
  Bell,
  Database,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Link2,
  Palette,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
} from 'lucide-react';
import { AccountPrivacySecurityView } from '../../components/settings/AccountPrivacySecurityView';
import { AppearanceLangAccessDataSupportView } from '../../components/settings/AppearanceLangAccessDataSupportView';

type SettingsSectionId =
  | 'account'
  | 'profile'
  | 'privacy'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'accessibility'
  | 'connected'
  | 'data'
  | 'support'
  | 'about'
  | 'danger';

const SETTINGS_SECTIONS: Array<{
  id: SettingsSectionId;
  label: string;
  keywords: string;
  icon: any;
}> = [
  { id: 'account', label: 'Account', keywords: 'email phone username password verification', icon: UserCheck },
  { id: 'profile', label: 'Profile', keywords: 'bio photo academic portfolio edit', icon: User },
  { id: 'privacy', label: 'Privacy', keywords: 'visibility discovery mentions blocking muted messages', icon: Eye },
  { id: 'security', label: 'Security', keywords: 'sessions devices logout audit log authentication', icon: Shield },
  { id: 'notifications', label: 'Notifications', keywords: 'alerts push quiet hours digest channels', icon: Bell },
  { id: 'appearance', label: 'Appearance', keywords: 'theme light dark system density motion sidebar', icon: Palette },
  { id: 'language', label: 'Language & Region', keywords: 'english hindi country timezone date format', icon: Globe },
  { id: 'accessibility', label: 'Accessibility', keywords: 'text size contrast focus motion screen reader', icon: Accessibility },
  { id: 'connected', label: 'Connected Services', keywords: 'integrations permissions push planner sync', icon: Link2 },
  { id: 'data', label: 'Data & Storage', keywords: 'export json cache digital locker storage usage', icon: Database },
  { id: 'support', label: 'Help & Support', keywords: 'faq ticket bug report policy terms guidelines', icon: HelpCircle },
  { id: 'about', label: 'About KAMPUS', keywords: 'version tagline open source stack', icon: Info },
  { id: 'danger', label: 'Danger Zone', keywords: 'sign out deactivate delete account', icon: ShieldAlert },
];

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSectionParam = searchParams.get('section') as SettingsSectionId | null;
  const isValidSection = (val: string | null): val is SettingsSectionId =>
    Boolean(val && SETTINGS_SECTIONS.some((s) => s.id === val));

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    isValidSection(initialSectionParam) ? initialSectionParam : 'account'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const param = searchParams.get('section');
    if (isValidSection(param) && param !== activeSection) {
      setActiveSection(param);
    }
  }, [searchParams]);

  const handleSelectSection = (id: SettingsSectionId) => {
    setActiveSection(id);
    setSearchParams({ section: id }, { replace: true });
  };

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isFirstGroup =
    activeSection === 'account' ||
    activeSection === 'profile' ||
    activeSection === 'privacy' ||
    activeSection === 'security' ||
    activeSection === 'danger';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Settings className="w-4 h-4" />
            <span>ACCOUNT · Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account, privacy, security, notifications, appearance, accessibility, and data controls.
          </p>
        </div>

        {/* Settings Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="search"
            placeholder="Search settings (e.g. password, theme)..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              const q = val.trim().toLowerCase();
              if (q) {
                const match = SETTINGS_SECTIONS.find(
                  (s) => s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q)
                );
                if (match) setActiveSection(match.id);
              }
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Mobile Compact Section Selector */}
      <div className="lg:hidden">
        <select
          value={activeSection}
          onChange={(e) => handleSelectSection(e.target.value as SettingsSectionId)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
        >
          {filteredSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Split Layout: Left Categories + Right Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 space-y-1 sticky top-20">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            const isDanger = sec.id === 'danger';
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => handleSelectSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                  active
                    ? isDanger
                      ? 'bg-rose-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDanger
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-9 min-w-0">
          {isFirstGroup ? (
            <AccountPrivacySecurityView
              activeSection={
                activeSection as 'account' | 'profile' | 'privacy' | 'security' | 'danger'
              }
            />
          ) : (
            <AppearanceLangAccessDataSupportView
              activeSection={
                activeSection as
                  | 'notifications'
                  | 'appearance'
                  | 'language'
                  | 'accessibility'
                  | 'connected'
                  | 'data'
                  | 'support'
                  | 'about'
              }
            />
          )}
        </section>
      </div>
    </div>
  );
};
