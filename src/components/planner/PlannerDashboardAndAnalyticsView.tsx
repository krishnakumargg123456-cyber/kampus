import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  GraduationCap,
  Layers,
  ListTodo,
  Plus,
  Sparkles,
  StickyNote,
  Target,
  Timer,
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import {
  CATEGORY_COLOR_MAP,
  addDaysToISO,
  computeHabitStreak,
  daysUntilDate,
  formatReadableDate,
  getDayOfWeekFromISO,
  todayLocalISO,
} from '../../data/plannerData';

export type PlannerTabId =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'study'
  | 'timetable'
  | 'goals'
  | 'habits'
  | 'exams'
  | 'focus'
  | 'notes'
  | 'analytics';

interface Props {
  mode: 'dashboard' | 'analytics';
  onNavigate: (tab: PlannerTabId) => void;
  onOpenQuickTask: () => void;
  onOpenAiAssistant: () => void;
}

export const PlannerDashboardAndAnalyticsView: React.FC<Props> = ({
  mode,
  onNavigate,
  onOpenQuickTask,
  onOpenAiAssistant,
}) => {
  const {
    tasks,
    events,
    studySessions,
    timetable,
    goals,
    habits,
    exams,
    focusSessions,
    notes,
    partnerSessions,
    integrations,
    updateTask,
    updateEvent,
    createNote,
    importIntegrationItem,
  } = usePlanner();

  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);

  const todayISO = todayLocalISO();
  const todayDayName = getDayOfWeekFromISO(todayISO);

  // Real Today Overview calculations
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDateISO === todayISO && t.status !== 'Cancelled'),
    [tasks, todayISO]
  );
  const completedToday = useMemo(
    () => todayTasks.filter((t) => t.status === 'Completed').length,
    [todayTasks]
  );
  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.dueDateISO < todayISO && t.status !== 'Completed' && t.status !== 'Cancelled'
      ),
    [tasks, todayISO]
  );
  const pendingTotal = useMemo(
    () => tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length,
    [tasks]
  );
  const upcomingDeadlinesCount = useMemo(() => {
    const next7 = addDaysToISO(todayISO, 7);
    const tCount = tasks.filter(
      (t) => t.dueDateISO >= todayISO && t.dueDateISO <= next7 && t.status !== 'Completed'
    ).length;
    const xCount = exams.filter((x) => x.dateISO >= todayISO && x.dateISO <= next7).length;
    return tCount + xCount;
  }, [tasks, exams, todayISO]);

  const dailyCompletionPct = useMemo(() => {
    if (todayTasks.length === 0) return 0;
    return Math.round((completedToday / todayTasks.length) * 100);
  }, [todayTasks.length, completedToday]);

  // Chronological Today Schedule (merging Timetable, Calendar Events, Today Tasks, Study Sessions)
  const todaySchedule = useMemo(() => {
    const items: Array<{
      id: string;
      kind: 'timetable' | 'event' | 'task' | 'session';
      title: string;
      startTime: string;
      endTime: string;
      category: string;
      priority: string;
      completed: boolean;
      rawId: string;
    }> = [];

    for (const slot of timetable) {
      if (slot.dayOfWeek === todayDayName) {
        items.push({
          id: `tt_${slot.id}`,
          kind: 'timetable',
          title: `${slot.subject} (${slot.slotType})${slot.room ? ` · ${slot.room}` : ''}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          category: 'College',
          priority: 'Medium',
          completed: false,
          rawId: slot.id,
        });
      }
    }

    for (const ev of events) {
      if (ev.dateISO === todayISO) {
        items.push({
          id: `ev_${ev.id}`,
          kind: 'event',
          title: ev.title,
          startTime: ev.startTime,
          endTime: ev.endTime,
          category: ev.category,
          priority: ev.priority,
          completed: ev.completed,
          rawId: ev.id,
        });
      }
    }

    for (const t of todayTasks) {
      items.push({
        id: `tk_${t.id}`,
        kind: 'task',
        title: t.title,
        startTime: t.dueTime || '18:00',
        endTime: '',
        category: t.category,
        priority: t.priority,
        completed: t.status === 'Completed',
        rawId: t.id,
      });
    }

    for (const s of studySessions) {
      if (s.dateISO === todayISO) {
        items.push({
          id: `ss_${s.id}`,
          kind: 'session',
          title: `${s.subject}: ${s.chapterOrTopic}`,
          startTime: s.startTime,
          endTime: s.endTime,
          category: 'Study',
          priority: 'Medium',
          completed: s.status === 'Completed',
          rawId: s.id,
        });
      }
    }

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, todayDayName, events, todayISO, todayTasks, studySessions]);

  // Recorded Study Minutes & Analytics (strictly verified / recorded)
  const recordedStudyMinutes = useMemo(() => {
    const sessMins = studySessions
      .filter((s) => s.status === 'Completed')
      .reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
    const focusMins = focusSessions
      .filter((f) => f.mode === 'Focus' && f.confirmed)
      .reduce((acc, f) => acc + f.actualMinutes, 0);
    return sessMins + focusMins;
  }, [studySessions, focusSessions]);

  const subjectDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of studySessions) {
      if (s.status === 'Completed' && s.actualMinutes > 0) {
        map[s.subject] = (map[s.subject] || 0) + s.actualMinutes;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [studySessions]);

  const weeklyCompletionStats = useMemo(() => {
    const days: Array<{ label: string; iso: string; completed: number; total: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const iso = addDaysToISO(todayISO, -i);
      const dayTasks = tasks.filter((t) => t.dueDateISO === iso && t.status !== 'Cancelled');
      const done = dayTasks.filter((t) => t.status === 'Completed').length;
      const dt = new Date(iso + 'T12:00:00');
      days.push({
        label: dt.toLocaleDateString(undefined, { weekday: 'short' }),
        iso,
        completed: done,
        total: dayTasks.length,
      });
    }
    return days;
  }, [tasks, todayISO]);

  const habitConsistencyPct = useMemo(() => {
    if (habits.length === 0) return 0;
    const last7: string[] = [];
    for (let i = 0; i < 7; i++) last7.push(addDaysToISO(todayISO, -i));
    const totalChecks = habits.reduce(
      (acc, h) => acc + h.completedDates.filter((d) => last7.includes(d)).length,
      0
    );
    return Math.round((totalChecks / (habits.length * 7)) * 100);
  }, [habits, todayISO]);

  const upcomingFeed = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      sub: string;
      dateISO: string;
      type: string;
    }> = [];
    for (const x of exams) {
      if (x.dateISO >= todayISO) {
        list.push({
          id: `ex_${x.id}`,
          title: x.name,
          sub: `${x.examType} · ${x.subject || 'Academic'}`,
          dateISO: x.dateISO,
          type: 'Exam / Deadline',
        });
      }
    }
    for (const t of tasks) {
      if (t.dueDateISO >= todayISO && t.status !== 'Completed' && t.status !== 'Cancelled') {
        list.push({
          id: `tk_${t.id}`,
          title: t.title,
          sub: `${t.category} · ${t.priority}`,
          dateISO: t.dueDateISO,
          type: 'Task',
        });
      }
    }
    for (const ev of events) {
      if (ev.dateISO >= todayISO && !ev.completed) {
        list.push({
          id: `ev_${ev.id}`,
          title: ev.title,
          sub: `${ev.category}${ev.location ? ` · ${ev.location}` : ''}`,
          dateISO: ev.dateISO,
          type: 'Event',
        });
      }
    }
    for (const ps of partnerSessions) {
      if (ps.dateISO >= todayISO) {
        list.push({
          id: `ps_${ps.id}`,
          title: ps.title,
          sub: `${ps.subject} · ${ps.timeSlot}`,
          dateISO: ps.dateISO,
          type: 'Synced',
        });
      }
    }
    return list.sort((a, b) => a.dateISO.localeCompare(b.dateISO)).slice(0, 8);
  }, [exams, tasks, events, partnerSessions, todayISO]);

  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;
    setQuickNoteSaving(true);
    await createNote({
      noteType: 'Quick',
      title: quickNoteText.trim().slice(0, 44),
      content: quickNoteText.trim(),
    });
    setQuickNoteText('');
    setQuickNoteSaving(false);
  };

  if (mode === 'analytics') {
    const totalTasksAll = tasks.filter((t) => t.status !== 'Cancelled').length;
    const completedAll = tasks.filter((t) => t.status === 'Completed').length;
    const monthlyCutoff = addDaysToISO(todayISO, -30);
    const monthlyDone = tasks.filter(
      (t) => t.dueDateISO >= monthlyCutoff && t.status === 'Completed'
    ).length;
    const activeGoalsAvg =
      goals.length > 0
        ? Math.round(goals.reduce((a, g) => a + g.progressPct, 0) / goals.length)
        : 0;
    const bestStreak = habits.reduce((mx, h) => Math.max(mx, computeHabitStreak(h.completedDates)), 0);

    const upcomingWorkload = Array.from({ length: 7 }).map((_, idx) => {
      const iso = addDaysToISO(todayISO, idx);
      const count =
        tasks.filter((t) => t.dueDateISO === iso && t.status !== 'Completed').length +
        events.filter((e) => e.dateISO === iso).length +
        exams.filter((x) => x.dateISO === iso).length;
      return { iso, count };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Productivity Insights & Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every chart below is calculated directly from your completed tasks, recorded study/focus sessions, goals, and habits.
            </p>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">All-Time Tasks Done</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
              {completedAll} / {totalTasksAll}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Last 30 days completed: {monthlyDone}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Recorded Study Time</span>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {(recordedStudyMinutes / 60).toFixed(1)} hrs
            </div>
            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {recordedStudyMinutes} logged mins
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">Average Goal Progress</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {activeGoalsAvg}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Across {goals.length} goal(s)
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500">7-Day Habit Consistency</span>
            <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1 tabular-nums">
              {habitConsistencyPct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Active streak peak: {bestStreak}d
            </div>
          </div>
        </div>

        {/* 7-Day Task Completion Bar Chart + Upcoming Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Task Completion (Last 7 Days)
            </h3>
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
              {weeklyCompletionStats.map((day) => {
                const maxVal = Math.max(1, ...weeklyCompletionStats.map((d) => Math.max(d.total, d.completed)));
                const barH = Math.round((day.completed / maxVal) * 100);
                return (
                  <div key={day.iso} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                      {day.completed}/{day.total}
                    </span>
                    <div className="w-full max-w-[32px] h-24 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-blue-600 rounded-t-md transition-all"
                        style={{ height: `${barH}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upcoming 7-Day Workload Forecast
            </h3>
            <div className="space-y-2.5">
              {upcomingWorkload.map((w) => (
                <div key={w.iso} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-slate-500 tabular-nums shrink-0">
                    {formatReadableDate(w.iso)}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        w.count >= 5 ? 'bg-rose-500' : w.count >= 3 ? 'bg-orange-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, w.count * 20)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    {w.count} item(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Study Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Subject-Wise Recorded Study Distribution
          </h3>
          {subjectDistribution.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No completed study sessions recorded yet. Log study sessions or complete Focus timer blocks to populate subject distribution.
            </p>
          ) : (
            <div className="space-y-3">
              {subjectDistribution.map(([subj, mins]) => (
                <div key={subj} className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{subj}</span>
                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((mins / Math.max(1, recordedStudyMinutes)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums w-16 text-right">
                      {mins} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Mode
  return (
    <div className="space-y-6">
      {/* Top Productivity Hero */}
      <div className="rounded-2xl bg-[#172554] text-white p-6 sm:p-7 border border-blue-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            My Planner · Plan Better. Stay Focused. Achieve More.
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Make today count. Your goals are one step away.
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 tabular-nums">
            Today: {formatReadableDate(todayISO)} ({todayDayName})
          </p>
        </div>

        {/* Today Overview Stats Strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 shrink-0">
          {[
            { label: 'Today Tasks', val: todayTasks.length },
            { label: 'Completed', val: completedToday },
            { label: 'Pending', val: pendingTotal },
            { label: 'Overdue', val: overdueTasks.length },
            { label: 'Next 7d', val: upcomingDeadlinesCount },
            { label: 'Today %', val: `${dailyCompletionPct}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-center min-w-[76px]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 block">
                {stat.label}
              </span>
              <span className="text-lg font-extrabold text-white tabular-nums mt-0.5 block">
                {stat.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: 'Create Task', icon: Plus, onClick: onOpenQuickTask, accent: 'bg-blue-600 text-white border-blue-600' },
          { label: 'Add Study Session', icon: BookOpen, onClick: () => onNavigate('study'), accent: '' },
          { label: 'Create Timetable', icon: Layers, onClick: () => onNavigate('timetable'), accent: '' },
          { label: 'Set Reminder', icon: Clock, onClick: () => onNavigate('tasks'), accent: '' },
          { label: 'Add Goal', icon: Target, onClick: () => onNavigate('goals'), accent: '' },
          { label: 'View Calendar', icon: CalendarIcon, onClick: () => onNavigate('calendar'), accent: '' },
        ].map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              onClick={act.onClick}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors ${
                act.accent
                  ? act.accent + ' hover:bg-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split: Today's Schedule + Upcoming & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Chronological Schedule */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-blue-600" />
                Today&apos;s Schedule
              </h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open Full Calendar
              </button>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 px-4">
                <CalendarIcon className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Nothing scheduled for today yet
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add a task, build your weekly timetable, or ask KAMPUS AI to structure a realistic daily study plan.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={onOpenQuickTask}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    Create First Task
                  </button>
                  <button
                    onClick={onOpenAiAssistant}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Draft with AI
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaySchedule.map((item) => {
                  const catStyle =
                    CATEGORY_COLOR_MAP[item.category as keyof typeof CATEGORY_COLOR_MAP] ||
                    CATEGORY_COLOR_MAP.Other;
                  return (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {item.kind === 'task' || item.kind === 'event' ? (
                          <button
                            onClick={() => {
                              if (item.kind === 'task') {
                                updateTask(item.rawId, {
                                  status: item.completed ? 'To Do' : 'Completed',
                                });
                              } else {
                                updateEvent(item.rawId, { completed: !item.completed });
                              }
                            }}
                            className="mt-0.5 text-slate-400 hover:text-blue-600"
                            aria-label="Toggle completion"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${catStyle.dot}`} />
                        )}
                        <div className="min-w-0">
                          <div
                            className={`font-semibold truncate ${
                              item.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5 tabular-nums">
                            <span>
                              {item.startTime}
                              {item.endTime ? ` – ${item.endTime}` : ''}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className={catStyle.text}>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.priority} Priority</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        {item.completed ? 'Done' : 'Scheduled'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ecosystem Synced Feed (if items exist in Career, Events, College, Locker, Study Hub) */}
          {integrations.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  KAMPUS Ecosystem Suggestions ({integrations.length})
                </h3>
                <span className="text-[11px] text-slate-400">Live from your other modules</span>
              </div>
              <div className="space-y-2">
                {integrations.slice(0, 4).map((intItem) => (
                  <div
                    key={intItem.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {intItem.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {intItem.sourceModule} · {intItem.dateISO} · {intItem.subtitle}
                      </div>
                    </div>
                    <button
                      onClick={() => importIntegrationItem(intItem)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shrink-0 hover:bg-blue-700"
                    >
                      Add to Planner
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upcoming Deadlines + Productivity Insights + Quick Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Productivity Snapshot */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Productivity Snapshot
              </h3>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Analytics
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Recorded Study</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                  {recordedStudyMinutes} min
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">7-Day Habits</span>
                <span className="text-lg font-extrabold text-emerald-600 tabular-nums mt-0.5 block">
                  {habitConsistencyPct}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Active Goals</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                  {goals.filter((g) => g.status === 'Active').length}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Focus Logs</span>
                <span className="text-lg font-extrabold text-blue-600 tabular-nums mt-0.5 block">
                  {focusSessions.length}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('focus')}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <Timer className="w-4 h-4" />
              Launch Distraction-Free Focus Timer
            </button>
          </div>

          {/* Upcoming Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Upcoming Deadlines & Events
              </h3>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Exams
              </button>
            </div>
            {upcomingFeed.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No upcoming tasks, exams, or registered events yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {upcomingFeed.map((u) => {
                  const dLeft = daysUntilDate(u.dateISO);
                  return (
                    <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {u.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {u.type} · {u.sub}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                        {dLeft === 0 ? 'Today' : `${dLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Notes Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-blue-600" />
                Quick Capture Notes
              </h3>
              <button
                onClick={() => onNavigate('notes')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                All Notes ({notes.length})
              </button>
            </div>

            <form onSubmit={handleSaveQuickNote} className="space-y-2">
              <textarea
                rows={2}
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                placeholder="Jot down a quick reminder, formula, or lecture takeaway..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={quickNoteSaving || !quickNoteText.trim()}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {quickNoteSaving ? 'Saving...' : 'Save Quick Note'}
              </button>
            </form>

            {notes.slice(0, 2).map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300"
              >
                <div className="font-bold text-slate-900 dark:text-white truncate">{n.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{n.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
