import React, { useMemo, useState } from 'react';
import {
  Archive,
  BellOff,
  Check,
  History,
  Lock,
  Moon,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NOTIFICATION_CATEGORIES, formatRelativeTimestamp } from '../../data/notificationsData';
import type { NotificationCategory, NotificationPreferences } from '../../types/notifications';

interface Props {
  mode: 'preferences' | 'history';
}

export const PreferencesAndHistoryView: React.FC<Props> = ({ mode }) => {
  const {
    notifications,
    preferences,
    channelCapabilities,
    pushSubscriptions,
    updatePreferences,
    requestBrowserPushPermission,
    disableBrowserPush,
    archiveNotification,
  } = useNotifications();

  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'archived' | 'read' | 'deleted'>('all');
  const [historyCat, setHistoryCat] = useState<'All' | NotificationCategory>('All');

  const historyItems = useMemo(() => {
    return notifications.filter((n) => {
      if (historyFilter === 'archived' && !n.archived) return false;
      if (historyFilter === 'read' && (!n.read || n.deleted)) return false;
      if (historyFilter === 'deleted' && !n.deleted) return false;
      if (historyCat !== 'All' && n.category !== historyCat) return false;
      return true;
    });
  }, [notifications, historyFilter, historyCat]);

  if (mode === 'history') {
    return (
      <div className="space-y-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>Notification History & Retention</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Audit read, archived, and removed notifications. Deleting a notification never erases underlying academic or system records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={historyFilter}
              onChange={(e) =>
                setHistoryFilter(e.target.value as 'all' | 'archived' | 'read' | 'deleted')
              }
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Records</option>
              <option value="archived">Archived</option>
              <option value="read">Read</option>
              <option value="deleted">Removed (Retention)</option>
            </select>

            <select
              value={historyCat}
              onChange={(e) => setHistoryCat(e.target.value as 'All' | NotificationCategory)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Categories</option>
              {NOTIFICATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {historyItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
            <Archive className="w-9 h-9 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No notification history records</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Read, archived, and cleared notifications appear here according to retention rules.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
            {historyItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{item.category}</span>
                    <span>·</span>
                    <span>{item.deleted ? 'Removed (Retention)' : item.archived ? 'Archived' : item.read ? 'Read' : 'Unread'}</span>
                    <span>·</span>
                    <span>{formatRelativeTimestamp(item.createdAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                </div>

                {item.archived && !item.deleted && (
                  <button
                    onClick={() => archiveNotification(item.id, false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // PREFERENCES MODE
  if (!preferences) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
        Loading notification preferences...
      </div>
    );
  }

  const toggleModuleKey = <K extends keyof NotificationPreferences['modules']>(
    group: K,
    key: keyof NotificationPreferences['modules'][K]
  ) => {
    if (group === 'system' && key === 'securityAlerts') return; // Locked mandatory policy
    const nextModules = {
      ...preferences.modules,
      [group]: {
        ...preferences.modules[group],
        [key]: !preferences.modules[group][key],
      },
    };
    void updatePreferences({ modules: nextModules });
  };

  const setAllOptional = (enabled: boolean) => {
    void updatePreferences({
      modules: {
        academic: {
          studyReminders: enabled,
          examAlerts: enabled,
          assignmentUpdates: enabled,
          goalReminders: enabled,
        },
        community: {
          mentions: enabled,
          replies: enabled,
          comments: enabled,
          announcements: enabled,
        },
        chat: {
          directMessages: enabled,
          groupMessages: enabled,
          messageRequests: enabled,
        },
        events: {
          eventReminders: enabled,
          registrationUpdates: enabled,
          clubAnnouncements: enabled,
        },
        career: {
          applicationReminders: enabled,
          interviewAlerts: enabled,
          opportunityUpdates: enabled,
        },
        market: {
          buyerInquiries: enabled,
          offers: enabled,
          listingUpdates: enabled,
        },
        rewards: {
          pointsUpdates: enabled,
          achievementUpdates: enabled,
          challengeReminders: enabled,
          redemptionUpdates: enabled,
        },
        system: {
          securityAlerts: true, // Always preserved
          serviceUpdates: enabled,
        },
      },
    });
  };

  const renderToggleRow = (
    label: string,
    checked: boolean,
    onChange: () => void,
    locked = false
  ) => (
    <label className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer">
      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <span>{label}</span>
        {locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={onChange}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 disabled:opacity-60"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Notification Preferences & Delivery Channels</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Control alerts by module, schedule quiet hours, and inspect configured delivery channels. Mandatory security alerts remain active.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAllOptional(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Enable All</span>
          </button>
          <button
            onClick={() => setAllOptional(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>Disable Optional</span>
          </button>
        </div>
      </div>

      {/* Delivery Channels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delivery Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* In-App */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">In-App Feed</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                {channelCapabilities?.inApp.statusText || 'Active'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.channels.inApp}
              onChange={() =>
                updatePreferences({
                  channels: { ...preferences.channels, inApp: !preferences.channels.inApp },
                })
              }
              className="w-4 h-4 rounded border-slate-300"
            />
          </div>

          {/* Browser Push */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Browser Push Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pushSubscriptions.some((s) => s.active && s.permissionState === 'granted')
                  ? 'Subscribed on this browser'
                  : channelCapabilities?.push.statusText || 'Permission required'}
              </p>
              {pushMessage && <p className="text-[11px] text-blue-600 mt-0.5">{pushMessage}</p>}
            </div>
            {preferences.channels.browserPush ? (
              <button
                onClick={disableBrowserPush}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={async () => {
                  const res = await requestBrowserPushPermission();
                  setPushMessage(res.statusText);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* Email */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Email Notifications</p>
              <p
                className={`text-xs mt-0.5 ${
                  channelCapabilities?.email.configured
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {channelCapabilities?.email.statusText || 'Checking configuration...'}
              </p>
            </div>
            <input
              type="checkbox"
              disabled={!channelCapabilities?.email.configured}
              checked={preferences.channels.email && Boolean(channelCapabilities?.email.configured)}
              onChange={() =>
                updatePreferences({
                  channels: { ...preferences.channels, email: !preferences.channels.email },
                })
              }
              className="w-4 h-4 rounded border-slate-300 disabled:opacity-50"
            />
          </div>

          {/* SMS */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">SMS Alerts</p>
              <p
                className={`text-xs mt-0.5 ${
                  channelCapabilities?.sms.configured
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {channelCapabilities?.sms.statusText || 'Checking configuration...'}
              </p>
            </div>
            <input
              type="checkbox"
              disabled={!channelCapabilities?.sms.configured}
              checked={preferences.channels.sms && Boolean(channelCapabilities?.sms.configured)}
              onChange={() =>
                updatePreferences({
                  channels: { ...preferences.channels, sms: !preferences.channels.sms },
                })
              }
              className="w-4 h-4 rounded border-slate-300 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours & Digest */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-600" />
              <span>Quiet Hours</span>
            </h3>
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={() =>
                updatePreferences({
                  quietHours: { ...preferences.quietHours, enabled: !preferences.quietHours.enabled },
                })
              }
              className="w-4 h-4 rounded border-slate-300"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Non-critical notifications arriving during Quiet Hours are held cleanly rather than discarded. Critical security alerts always deliver.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start</label>
              <input
                type="time"
                value={preferences.quietHours.startTime}
                onChange={(e) =>
                  updatePreferences({
                    quietHours: { ...preferences.quietHours, startTime: e.target.value },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">End</label>
              <input
                type="time"
                value={preferences.quietHours.endTime}
                onChange={(e) =>
                  updatePreferences({
                    quietHours: { ...preferences.quietHours, endTime: e.target.value },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Timezone</label>
              <select
                value={preferences.quietHours.timezone}
                onChange={(e) =>
                  updatePreferences({
                    quietHours: { ...preferences.quietHours, timezone: e.target.value },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
          </div>
        </div>

        {/* Digest */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification Digest</h3>
            <input
              type="checkbox"
              disabled={!channelCapabilities?.email.configured}
              checked={preferences.digest.enabled && Boolean(channelCapabilities?.email.configured)}
              onChange={() =>
                updatePreferences({
                  digest: { ...preferences.digest, enabled: !preferences.digest.enabled },
                })
              }
              className="w-4 h-4 rounded border-slate-300 disabled:opacity-50"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {channelCapabilities?.email.configured
              ? 'Receive a Daily or Weekly summary of selected categories.'
              : 'Digest emails require an active Email provider configuration on the server.'}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={preferences.digest.frequency}
              onChange={(e) =>
                updatePreferences({
                  digest: {
                    ...preferences.digest,
                    frequency: e.target.value as 'Daily' | 'Weekly',
                  },
                })
              }
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="Daily">Daily Summary</option>
              <option value="Weekly">Weekly Summary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Module Preference Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Academic</h3>
          {renderToggleRow('Study Reminders', preferences.modules.academic.studyReminders, () =>
            toggleModuleKey('academic', 'studyReminders')
          )}
          {renderToggleRow('Exam Alerts', preferences.modules.academic.examAlerts, () =>
            toggleModuleKey('academic', 'examAlerts')
          )}
          {renderToggleRow('Assignment Updates', preferences.modules.academic.assignmentUpdates, () =>
            toggleModuleKey('academic', 'assignmentUpdates')
          )}
          {renderToggleRow('Goal Reminders', preferences.modules.academic.goalReminders, () =>
            toggleModuleKey('academic', 'goalReminders')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Community</h3>
          {renderToggleRow('Mentions', preferences.modules.community.mentions, () =>
            toggleModuleKey('community', 'mentions')
          )}
          {renderToggleRow('Replies', preferences.modules.community.replies, () =>
            toggleModuleKey('community', 'replies')
          )}
          {renderToggleRow('Comments', preferences.modules.community.comments, () =>
            toggleModuleKey('community', 'comments')
          )}
          {renderToggleRow('Community Announcements', preferences.modules.community.announcements, () =>
            toggleModuleKey('community', 'announcements')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Chat</h3>
          {renderToggleRow('Direct Messages', preferences.modules.chat.directMessages, () =>
            toggleModuleKey('chat', 'directMessages')
          )}
          {renderToggleRow('Group Messages', preferences.modules.chat.groupMessages, () =>
            toggleModuleKey('chat', 'groupMessages')
          )}
          {renderToggleRow('Message Requests', preferences.modules.chat.messageRequests, () =>
            toggleModuleKey('chat', 'messageRequests')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Events & Clubs</h3>
          {renderToggleRow('Event Reminders', preferences.modules.events.eventReminders, () =>
            toggleModuleKey('events', 'eventReminders')
          )}
          {renderToggleRow('Registration Updates', preferences.modules.events.registrationUpdates, () =>
            toggleModuleKey('events', 'registrationUpdates')
          )}
          {renderToggleRow('Club Announcements', preferences.modules.events.clubAnnouncements, () =>
            toggleModuleKey('events', 'clubAnnouncements')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Career</h3>
          {renderToggleRow('Application Reminders', preferences.modules.career.applicationReminders, () =>
            toggleModuleKey('career', 'applicationReminders')
          )}
          {renderToggleRow('Interview Alerts', preferences.modules.career.interviewAlerts, () =>
            toggleModuleKey('career', 'interviewAlerts')
          )}
          {renderToggleRow('Opportunity Updates', preferences.modules.career.opportunityUpdates, () =>
            toggleModuleKey('career', 'opportunityUpdates')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">KAMPUS Market</h3>
          {renderToggleRow('Buyer Inquiries', preferences.modules.market.buyerInquiries, () =>
            toggleModuleKey('market', 'buyerInquiries')
          )}
          {renderToggleRow('Offers & Counteroffers', preferences.modules.market.offers, () =>
            toggleModuleKey('market', 'offers')
          )}
          {renderToggleRow('Listing Updates', preferences.modules.market.listingUpdates, () =>
            toggleModuleKey('market', 'listingUpdates')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">KAMPUS Rewards</h3>
          {renderToggleRow('Points Updates', preferences.modules.rewards.pointsUpdates, () =>
            toggleModuleKey('rewards', 'pointsUpdates')
          )}
          {renderToggleRow('Achievement Updates', preferences.modules.rewards.achievementUpdates, () =>
            toggleModuleKey('rewards', 'achievementUpdates')
          )}
          {renderToggleRow('Challenge Reminders', preferences.modules.rewards.challengeReminders, () =>
            toggleModuleKey('rewards', 'challengeReminders')
          )}
          {renderToggleRow('Redemption Updates', preferences.modules.rewards.redemptionUpdates, () =>
            toggleModuleKey('rewards', 'redemptionUpdates')
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">System & Security</h3>
          {renderToggleRow(
            'Critical Security Alerts (Mandatory)',
            true,
            () => {},
            true
          )}
          {renderToggleRow('Service Status & Announcements', preferences.modules.system.serviceUpdates, () =>
            toggleModuleKey('system', 'serviceUpdates')
          )}
        </div>
      </div>
    </div>
  );
};
