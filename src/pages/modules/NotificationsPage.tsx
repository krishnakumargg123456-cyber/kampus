import React, { useEffect, useState } from 'react';
import {
  AlarmClock,
  Bell,
  History,
  Inbox,
  Megaphone,
  RefreshCw,
  Shield,
  Sliders,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationFeedAndDetailView } from '../../components/notifications/NotificationFeedAndDetailView';
import { RemindersAndSocialView } from '../../components/notifications/RemindersAndSocialView';
import { AnnouncementsAndAdminView } from '../../components/notifications/AnnouncementsAndAdminView';
import { PreferencesAndHistoryView } from '../../components/notifications/PreferencesAndHistoryView';

type NotificationCenterTab =
  | 'inbox'
  | 'reminders'
  | 'social'
  | 'announcements'
  | 'preferences'
  | 'history'
  | 'admin';

const NAV_TABS: Array<{
  id: NotificationCenterTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'reminders', label: 'Reminders', icon: AlarmClock },
  { id: 'social', label: 'Mentions & Social', icon: Users },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'history', label: 'History', icon: History },
  { id: 'admin', label: 'Publisher Console', icon: Shield },
];

export const NotificationsPage: React.FC = () => {
  const location = useLocation();
  const {
    loading,
    error,
    actionBanner,
    clearError,
    clearBanner,
    connectionStatus,
    unreadCount,
    reminders,
    refreshNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<NotificationCenterTab>('inbox');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as NotificationCenterTab | null;
    if (
      tabParam &&
      ['inbox', 'reminders', 'social', 'announcements', 'preferences', 'history', 'admin'].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const upcomingRemindersCount = reminders.filter((r) => r.status === 'Upcoming').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
              <span>KAMPUS · Stay Updated. Never Miss What Matters.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Notification Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {unreadCount} unread alert(s) · {upcomingRemindersCount} upcoming reminder(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Wifi
                className={`w-3.5 h-3.5 ${
                  connectionStatus === 'Live WebSocket' ? 'text-emerald-600' : 'text-amber-500'
                }`}
              />
              <span>{connectionStatus}</span>
            </div>

            <button
              onClick={() => setActiveTab('preferences')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Notification Settings
            </button>

            <button
              onClick={() => refreshNotifications()}
              disabled={loading}
              aria-label="Sync notifications"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-200">
          <span>{error}</span>
          <button onClick={clearError} aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionBanner && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          <span>{actionBanner}</span>
          <button onClick={clearBanner} aria-label="Dismiss message">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border ${
                active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Sidebar + Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1 sticky top-20">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </span>
                {tab.id === 'inbox' && unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
                {tab.id === 'reminders' && upcomingRemindersCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {upcomingRemindersCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-9 xl:col-span-10 min-w-0">
          {activeTab === 'inbox' && (
            <NotificationFeedAndDetailView onOpenSettings={() => setActiveTab('preferences')} />
          )}
          {(activeTab === 'reminders' || activeTab === 'social') && (
            <RemindersAndSocialView mode={activeTab} />
          )}
          {(activeTab === 'announcements' || activeTab === 'admin') && (
            <AnnouncementsAndAdminView mode={activeTab} />
          )}
          {(activeTab === 'preferences' || activeTab === 'history') && (
            <PreferencesAndHistoryView mode={activeTab} />
          )}
        </section>
      </div>
    </div>
  );
};
