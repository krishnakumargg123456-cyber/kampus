import React from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  Play,
  ArrowRight,
  Flame,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TODAY_CLASSES, RECENT_COURSE } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { triggerMicroStreakConfetti } from '../../utils/confetti';

interface StudentDashboardPreviewProps {
  onContinueLesson: () => void;
  onOpenAi: () => void;
}

export const StudentDashboardPreview: React.FC<StudentDashboardPreviewProps> = ({
  onContinueLesson,
  onOpenAi,
}) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const streakDays = profile.studyStreakDays;
  const progressPercent = profile.learningProgress || 68;
  const nextClass = TODAY_CLASSES[1]; // 10:30 AM class

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>{t('dash.heading')}</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('dash.disclaimer')}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {profile.name} · {profile.college} · {profile.course}
          </p>
        </div>

        <button
          onClick={() => navigate('/tools/planner')}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{t('dash.btn.planner')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Key Student Metrics & Active Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Learning Progress */}
        <div
          onClick={() => navigate('/learn/study-hub')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                {t('dash.progress')}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {progressPercent}%
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
              {profile.semester || 'Current Semester'} Syllabus Pace
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('dash.progress.sub')}
            </p>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Today's Schedule */}
        <div
          onClick={() => navigate('/tools/planner')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                {t('dash.schedule')}
              </span>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                Next: 10:30 AM
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
              {nextClass.subject}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {nextClass.room} · {nextClass.professor}
            </p>
          </div>

          <div className="mt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between">
            <span>4 classes today</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 3. Attendance */}
        <div
          onClick={() => navigate('/tools/planner')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('dash.attendance')}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                88.5%
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
              Attendance Safe Zone
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('dash.attendance.sub')}
            </p>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88.5%' }} />
            </div>
          </div>
        </div>

        {/* 4. Upcoming Assignments */}
        <div
          onClick={() => navigate('/tools/planner')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                {t('dash.assignments')}
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                2 Pending
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
              AI Lab 4: Neural Search
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Due Tonight at 11:59 PM
            </p>
          </div>

          <div className="mt-3 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Graph Theory Set 3 due Fri</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Continue Learning Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-800/60 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border border-white/20">
            <img
              src={RECENT_COURSE.thumbnailUrl}
              alt={RECENT_COURSE.subject}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              {t('dash.continue')}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white truncate">
              {RECENT_COURSE.subject}
            </h4>
            <p className="text-xs text-blue-200/80 truncate">
              {RECENT_COURSE.chapter}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <span className="text-xs text-blue-200 font-medium hidden md:inline">
            {RECENT_COURSE.currentLesson}
          </span>
          <button
            onClick={onContinueLesson}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Resume Lesson</span>
          </button>
        </div>
      </div>
    </section>
  );
};
