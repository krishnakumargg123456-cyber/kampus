import React, { useState } from 'react';
import {
  AlarmClock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  BellRing,
  Target,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { StudyReminder } from '../../types/studyHub';

export const StudyRemindersView: React.FC = () => {
  const {
    state,
    addReminder,
    toggleReminderComplete,
    deleteReminder,
    setDailyGoalMinutes,
  } = useStudyHub();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<StudyReminder['type']>('Chapter Completion');
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || 'subj-cs302');
  const [dueDateTime, setDueDateTime] = useState('Today · 8:00 PM');
  const [notes, setNotes] = useState('');
  const [syncNotif, setSyncNotif] = useState(true);
  const [goalInput, setGoalInput] = useState(state.dailyGoalMinutes);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addReminder({
      title: title.trim(),
      type,
      subjectId,
      dueDateTime: dueDateTime.trim() || 'Upcoming',
      syncedToNotifications: syncNotif,
      notes: notes.trim(),
    });
    setTitle('');
    setNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Reminder & Daily Learning Goal */}
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Daily Learning Goal
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={15}
              max={720}
              value={goalInput}
              onChange={(e) => setGoalInput(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums"
            />
            <span className="text-xs text-slate-500">minutes / day</span>
            <button
              onClick={() => setDailyGoalMinutes(goalInput)}
              className="ml-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Update Goal
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <AlarmClock className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Schedule Study Reminder
            </h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold mb-1">Reminder Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Revise BCNF proofs & solve 5 MCQs"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Reminder Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StudyReminder['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="Chapter Completion">Chapter Completion</option>
                  <option value="Practice Test">Practice Test</option>
                  <option value="Daily Goal">Daily Goal</option>
                  <option value="Revision">Revision</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Scheduled Date & Time</label>
              <input
                type="text"
                value={dueDateTime}
                onChange={(e) => setDueDateTime(e.target.value)}
                placeholder="Tomorrow · 7:30 PM"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Focus areas or target score..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={syncNotif}
                onChange={(e) => setSyncNotif(e.target.checked)}
                className="accent-blue-600"
              />
              <span>Push alert to KAMPUS Notification Center</span>
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Study Reminder</span>
            </button>
          </form>
        </div>
      </div>

      {/* Active & Completed Reminders List */}
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Upcoming Study Activities & Reminders ({state.reminders.length})
          </h3>
        </div>

        {state.reminders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No study reminders scheduled. Create one on the left.
          </div>
        ) : (
          <div className="space-y-3">
            {state.reminders.map((rem) => {
              const subj = state.subjects.find((s) => s.id === rem.subjectId);
              return (
                <div
                  key={rem.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition-colors ${
                    rem.completed
                      ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleReminderComplete(rem.id)}
                      className={`mt-0.5 shrink-0 cursor-pointer ${
                        rem.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-blue-600'
                      }`}
                    >
                      {rem.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                        <span className="text-blue-600 dark:text-blue-400">{rem.type}</span>
                        {subj && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-slate-500">{subj.code}</span>
                          </>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-orange-500">{rem.dueDateTime}</span>
                      </div>
                      <h4
                        className={`text-sm font-bold mt-0.5 ${
                          rem.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {rem.title}
                      </h4>
                      {rem.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">{rem.notes}</p>
                      )}
                      {rem.syncedToNotifications && (
                        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                          <BellRing className="w-3 h-3" />
                          <span>Synced with KAMPUS Notifications</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
