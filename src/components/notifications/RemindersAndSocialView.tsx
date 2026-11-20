import React, { useMemo, useState } from 'react';
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTimestamp } from '../../data/notificationsData';
import type { AggregatedReminder, ReminderStatus } from '../../types/notifications';

interface Props {
  mode: 'reminders' | 'social';
}

export const RemindersAndSocialView: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const { reminders, socialActivity, performReminderAction } = useNotifications();

  const [remTab, setRemTab] = useState<ReminderStatus>('Upcoming');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('18:00');
  const [socialFilter, setSocialFilter] = useState<'all' | 'Student Community' | 'KAMPUS Chat'>('all');

  const filteredReminders = useMemo(
    () => reminders.filter((r) => r.status === remTab),
    [reminders, remTab]
  );

  const counts = useMemo(
    () => ({
      Upcoming: reminders.filter((r) => r.status === 'Upcoming').length,
      Snoozed: reminders.filter((r) => r.status === 'Snoozed').length,
      Completed: reminders.filter((r) => r.status === 'Completed').length,
      Missed: reminders.filter((r) => r.status === 'Missed').length,
    }),
    [reminders]
  );

  const handleOpenReschedule = (r: AggregatedReminder) => {
    setRescheduleId(r.id);
    setRescheduleDate(r.dueDateISO);
    setRescheduleTime(r.dueTime || '18:00');
  };

  if (mode === 'reminders') {
    return (
      <div className="space-y-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-blue-600" />
                <span>Centralized Reminder Manager</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Live reminders synced directly from Planner, Study Hub, Career, Events, College Explorer, and Digital Locker without creating duplicates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
            {(['Upcoming', 'Snoozed', 'Completed', 'Missed'] as ReminderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setRemTab(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                  remTab === status
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {status} ({counts[status]})
              </button>
            ))}
          </div>
        </div>

        {filteredReminders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
            <CalendarClock className="w-9 h-9 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No {remTab.toLowerCase()} reminders
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Schedule tasks in Planner, register for campus events, save college deadlines, or set document renewals to track them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{rem.sourceModule}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rem.subtitle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {rem.dueDateISO} at {rem.dueTime}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{rem.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {rem.status !== 'Completed' && (
                      <>
                        <button
                          onClick={() =>
                            performReminderAction({
                              sourceModule: rem.sourceModule,
                              sourceItemId: rem.sourceItemId,
                              action: 'snooze',
                            })
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Snooze 1d
                        </button>
                        <button
                          onClick={() => handleOpenReschedule(rem)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() =>
                            performReminderAction({
                              sourceModule: rem.sourceModule,
                              sourceItemId: rem.sourceItemId,
                              action: 'complete',
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(rem.linkRoute)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {rescheduleId === rem.id && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs tabular-nums"
                    />
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs tabular-nums"
                    />
                    <button
                      onClick={async () => {
                        await performReminderAction({
                          sourceModule: rem.sourceModule,
                          sourceItemId: rem.sourceItemId,
                          action: 'reschedule',
                          dateISO: rescheduleDate,
                          time: rescheduleTime,
                        });
                        setRescheduleId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                    >
                      Save Date
                    </button>
                    <button
                      onClick={() => setRescheduleId(null)}
                      className="px-2.5 py-1.5 text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // SOCIAL ACTIVITY & MENTIONS MODE
  const filteredSocial = socialActivity.filter(
    (s) => socialFilter === 'all' || s.sourceModule === socialFilter
  );

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Mentions & Social Activity</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Live replies, mentions, accepted answers, and message requests connected directly to Student Community and KAMPUS Chat.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {(['all', 'Student Community', 'KAMPUS Chat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSocialFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                socialFilter === tab
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab === 'all' ? 'All Activity' : tab}
            </button>
          ))}
        </div>
      </div>

      {filteredSocial.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
          <MessageSquare className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No social activity yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mentions, question replies, accepted answers, and chat message requests appear here automatically.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => navigate('/connect/community')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Visit Student Community
            </button>
            <button
              onClick={() => navigate('/connect/chat')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Open KAMPUS Chat
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSocial.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.linkRoute)}
              className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {item.sourceModule}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.actorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTimestamp(item.timestamp)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.excerpt}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
