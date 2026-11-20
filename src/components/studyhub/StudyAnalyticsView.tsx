import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Flame,
  TrendingUp,
  Target,
  Plus,
  Info,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { useAuth } from '../../context/AuthContext';

export const StudyAnalyticsView: React.FC = () => {
  const { state, logStudyMinutes, openSubjectChapterTopic } = useStudyHub();
  const { profile } = useAuth();
  const [customMins, setCustomMins] = useState(45);

  const allChapters = state.subjects.flatMap((s) => s.chapters);
  const completedChapters = allChapters.filter((c) => c.completed).length;

  const allTopics = allChapters.flatMap((c) => c.topics);
  const completedTopics = allTopics.filter((t) => t.completed).length;
  const overallPct =
    allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

  const avgAccuracy =
    state.testHistory.length > 0
      ? Math.round(
          state.testHistory.reduce((acc, h) => acc + h.accuracyPercent, 0) /
            state.testHistory.length
        )
      : 0;

  const totalWeekMins = state.weeklyLogs.reduce((acc, l) => acc + l.minutes, 0);
  const maxDayMins = Math.max(180, ...state.weeklyLogs.map((l) => l.minutes));
  const completedGoals = state.reminders.filter((r) => r.completed).length;

  return (
    <div className="space-y-6">
      {/* Honest Data Source Notice */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold text-slate-900 dark:text-slate-100">Analytics Source:</span>{' '}
            Chapter completion, test accuracy, and today&apos;s logged sessions update live from your Study Hub actions (stored locally in your browser). Prior Mon–Sat bars reflect baseline sample history.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={5}
            max={360}
            value={customMins}
            onChange={(e) => setCustomMins(Number(e.target.value))}
            className="w-16 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums"
          />
          <button
            onClick={() => logStudyMinutes(customMins)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Study Mins</span>
          </button>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Overall Progress</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
            {overallPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {completedTopics}/{allTopics.length} topics · {completedChapters}/{allChapters.length} chapters
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Test Accuracy Avg</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2 tabular-nums">
            {avgAccuracy}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Across {state.testHistory.length} recorded test(s)
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-extrabold text-orange-500 mt-2 tabular-nums">
            {profile.studyStreakDays} Days
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {(totalWeekMins / 60).toFixed(1)} hrs logged this week
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Completed Goals</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
            {completedGoals}/{state.reminders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Daily target: {state.dailyGoalMinutes} min
          </div>
        </div>
      </div>

      {/* Subject-wise Progress + Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Subject-wise Progress & Chapter Completion
          </h3>
          <div className="space-y-4">
            {state.subjects.map((subj) => {
              const tTotal = subj.chapters.reduce((a, c) => a + c.topics.length, 0);
              const tDone = subj.chapters.reduce(
                (a, c) => a + c.topics.filter((t) => t.completed).length,
                0
              );
              const cDone = subj.chapters.filter((c) => c.completed).length;
              const pct = tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0;

              return (
                <div key={subj.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => openSubjectChapterTopic(subj.id)}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left truncate cursor-pointer"
                    >
                      {subj.code} · {subj.name}
                    </button>
                    <span className="text-slate-500 shrink-0 tabular-nums">
                      {cDone}/{subj.chapters.length} ch ·{' '}
                      <span className="font-bold text-blue-600">{pct}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Weekly Study Activity & Accuracy Trend
          </h3>

          <div className="grid grid-cols-7 gap-2 items-end h-36">
            {state.weeklyLogs.map((log) => {
              const hPct = Math.max(10, Math.round((log.minutes / maxDayMins) * 100));
              return (
                <div key={log.dayLabel} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {log.minutes}m
                  </span>
                  <div className="w-full max-w-[28px] flex-1 flex items-end bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg ${
                        log.isRecordedUserActivity ? 'bg-orange-500' : 'bg-blue-600'
                      }`}
                      style={{ height: `${hPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{log.dayLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Test Performance Bars */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Recent Test Performance
            </div>
            {state.testHistory.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs gap-2">
                <span className="truncate text-slate-600 dark:text-slate-300">{t.title}</span>
                <span className="font-mono font-bold text-emerald-600 shrink-0 tabular-nums">
                  {t.accuracyPercent}% ({t.score}/{t.maxScore})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
