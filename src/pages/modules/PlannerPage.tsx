import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  CheckSquare,
  Flame,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Link2,
  Plus,
  RefreshCw,
  Sparkles,
  StickyNote,
  Target,
  Timer,
  X,
} from 'lucide-react';
import { PlannerProvider, usePlanner } from '../../context/PlannerContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  PlannerDashboardAndAnalyticsView,
  type PlannerTabId,
} from '../../components/planner/PlannerDashboardAndAnalyticsView';
import { PlannerTasksAndNotesView } from '../../components/planner/PlannerTasksAndNotesView';
import { PlannerCalendarAndTimetableView } from '../../components/planner/PlannerCalendarAndTimetableView';
import { PlannerStudyAndExamsView } from '../../components/planner/PlannerStudyAndExamsView';
import { PlannerGoalsHabitsFocusView } from '../../components/planner/PlannerGoalsHabitsFocusView';
import {
  PlannerAiAssistantModal,
  PlannerIntegrationsModal,
  PlannerQuickTaskModal,
} from '../../components/planner/PlannerAiAndIntegrationsModal';

interface PlannerPageProps {
  onOpenNotifications?: () => void;
}

const PLANNER_NAV_ITEMS: Array<{
  id: PlannerTabId;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'study', label: 'Study Planner', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: Layers },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'habits', label: 'Habits', icon: Flame },
  { id: 'exams', label: 'Exams', icon: GraduationCap },
  { id: 'focus', label: 'Focus Timer', icon: Timer },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const PlannerWorkspaceInner: React.FC<PlannerPageProps> = ({ onOpenNotifications }) => {
  const {
    loading,
    error,
    actionBanner,
    clearError,
    clearBanner,
    tasks,
    integrations,
    refreshWorkspace,
  } = usePlanner();
  const { unreadCount } = useNotifications();

  const [activeTab, setActiveTab] = useState<PlannerTabId>('dashboard');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);

  const openTasksCount = tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Identity Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span>KAMPUS PLANNER · Plan Better. Stay Focused. Achieve More.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              My Planner
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Make today count. Your goals are one step away.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsQuickTaskOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>

            <button
              onClick={() => setIsIntegrationsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 tabular-nums"
            >
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sync Modules ({integrations.length})</span>
            </button>

            <button
              onClick={() => setIsAiOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-950 text-white text-xs font-semibold hover:bg-blue-900"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => refreshWorkspace()}
              disabled={loading}
              aria-label="Refresh planner workspace"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                aria-label="Open notifications"
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-200">
          <span>{error}</span>
          <button onClick={clearError} className="p-1 hover:opacity-70" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionBanner && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          <span>{actionBanner}</span>
          <button onClick={clearBanner} className="p-1 hover:opacity-70" aria-label="Dismiss message">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Horizontal Nav */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
        {PLANNER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Left Sidebar + Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1 sticky top-20">
          {PLANNER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'tasks' && openTasksCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                      active ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {openTasksCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-9 xl:col-span-10 min-w-0">
          {(activeTab === 'dashboard' || activeTab === 'analytics') && (
            <PlannerDashboardAndAnalyticsView
              mode={activeTab}
              onNavigate={setActiveTab}
              onOpenQuickTask={() => setIsQuickTaskOpen(true)}
              onOpenAiAssistant={() => setIsAiOpen(true)}
            />
          )}
          {(activeTab === 'tasks' || activeTab === 'notes') && (
            <PlannerTasksAndNotesView mode={activeTab} />
          )}
          {(activeTab === 'calendar' || activeTab === 'timetable') && (
            <PlannerCalendarAndTimetableView mode={activeTab} />
          )}
          {(activeTab === 'study' || activeTab === 'exams') && (
            <PlannerStudyAndExamsView mode={activeTab} />
          )}
          {(activeTab === 'goals' || activeTab === 'habits' || activeTab === 'focus') && (
            <PlannerGoalsHabitsFocusView mode={activeTab} />
          )}
        </section>
      </div>

      {/* Modals */}
      <PlannerAiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      <PlannerIntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
      />
      <PlannerQuickTaskModal isOpen={isQuickTaskOpen} onClose={() => setIsQuickTaskOpen(false)} />
    </div>
  );
};

export const PlannerPage: React.FC<PlannerPageProps> = ({ onOpenNotifications }) => {
  return (
    <PlannerProvider>
      <PlannerWorkspaceInner onOpenNotifications={onOpenNotifications} />
    </PlannerProvider>
  );
};
