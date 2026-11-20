import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Award,
  Bell,
  BookmarkCheck,
  Briefcase,
  Calendar,
  Compass,
  GitCompare,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  CollegeExplorerProvider,
  ExplorerAiMode,
  useCollegeExplorer,
} from '../../context/CollegeExplorerContext';
import { ExplorerDashboardView } from '../../components/collegeExplorer/ExplorerDashboardView';
import { ExploreCollegesView } from '../../components/collegeExplorer/ExploreCollegesView';
import { CollegeDetailAndReviewsView } from '../../components/collegeExplorer/CollegeDetailAndReviewsView';
import { CoursesExplorerView } from '../../components/collegeExplorer/CoursesExplorerView';
import { CollegeCompareAndShortlistView } from '../../components/collegeExplorer/CollegeCompareAndShortlistView';
import { AdmissionsAndScholarshipsView } from '../../components/collegeExplorer/AdmissionsAndScholarshipsView';
import { ExplorerAdminView } from '../../components/collegeExplorer/ExplorerAdminView';
import type { CollegeType } from '../../types/collegeExplorer';

type ExplorerTab =
  | 'overview'
  | 'explore'
  | 'courses'
  | 'compare'
  | 'admissions'
  | 'scholarships'
  | 'shortlist'
  | 'admin';

const AI_MODES: Array<{ id: ExplorerAiMode; label: string }> = [
  { id: 'course-fit', label: 'Course Fit' },
  { id: 'eligibility', label: 'Eligibility Check' },
  { id: 'compare-colleges', label: 'Compare Colleges' },
  { id: 'admission-steps', label: 'Admission Steps' },
  { id: 'fee-breakdown', label: 'Fee Breakdown' },
  { id: 'prep-checklist', label: 'Document Checklist' },
  { id: 'scholarship-eligibility', label: 'Scholarship Match' },
];

interface CollegeExplorerWorkspaceProps {
  onOpenNotifications?: () => void;
}

const CollegeExplorerWorkspace: React.FC<CollegeExplorerWorkspaceProps> = ({
  onOpenNotifications,
}) => {
  const location = useLocation();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    loading,
    statusToast,
    clearToast,
    providerInfo,
    colleges,
    compareIds,
    savedColleges,
    admissions,
    roleInfo,
    crossModule,
    markCollegeViewed,
    setCompareCollegeIds,
    loadSharedComparison,
    runExplorerAiAssistant,
  } = useCollegeExplorer();

  const [activeTab, setActiveTab] = useState<ExplorerTab>('overview');
  const [activeCollegeId, setActiveCollegeId] = useState<string | null>(null);
  const [exploreSeedFilters, setExploreSeedFilters] = useState<
    { query?: string; state?: string; city?: string; type?: CollegeType } | undefined
  >(undefined);
  const [sharedBanner, setSharedBanner] = useState<{ title: string; shareCode: string } | null>(
    null
  );

  // KAMPUS AI Modal State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<ExplorerAiMode>('course-fit');
  const [aiQuery, setAiQuery] = useState('');
  const [aiCollegeIds, setAiCollegeIds] = useState<string[]>([]);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<{ reply: string; sourceLabel: string } | null>(null);

  // Handle ?cmp=shareCode deep links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cmpCode = params.get('cmp');
    if (!cmpCode) return;
    let active = true;
    loadSharedComparison(cmpCode).then((res) => {
      if (active && res && res.comparison) {
        setCompareCollegeIds(res.comparison.collegeIds);
        setSharedBanner({
          title: res.comparison.title,
          shareCode: res.comparison.shareCode,
        });
        setActiveCollegeId(null);
        setActiveTab('compare');
      }
    });
    return () => {
      active = false;
    };
  }, [location.search, loadSharedComparison, setCompareCollegeIds]);

  const activeCollege = useMemo(
    () => colleges.find((c) => c.id === activeCollegeId) || null,
    [colleges, activeCollegeId]
  );

  const openCollegeDetail = (collegeId: string) => {
    setActiveCollegeId(collegeId);
    markCollegeViewed(collegeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAi = (presetPrompt?: string, focusCollegeId?: string) => {
    if (presetPrompt) setAiQuery(presetPrompt);
    if (focusCollegeId) {
      setAiCollegeIds([focusCollegeId]);
    } else if (compareIds.length > 0) {
      setAiCollegeIds(compareIds.slice(0, 3));
    }
    setIsAiOpen(true);
  };

  const handleRunAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiRunning(true);
    const res = await runExplorerAiAssistant(aiMode, aiQuery, aiCollegeIds);
    setAiResult(res);
    setAiRunning(false);
  };

  const tabs: Array<{ id: ExplorerTab; label: string; badge?: number; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'explore', label: 'Explore Colleges', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'courses', label: 'Courses', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    {
      id: 'compare',
      label: 'Compare',
      badge: compareIds.length,
      icon: <GitCompare className="w-3.5 h-3.5" />,
    },
    {
      id: 'admissions',
      label: 'My Admissions',
      badge: admissions.length,
      icon: <ListChecks className="w-3.5 h-3.5" />,
    },
    { id: 'scholarships', label: 'Scholarships', icon: <Award className="w-3.5 h-3.5" /> },
    {
      id: 'shortlist',
      label: 'Shortlist',
      badge: savedColleges.length,
      icon: <BookmarkCheck className="w-3.5 h-3.5" />,
    },
    { id: 'admin', label: 'Admin Tools', icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Status Toast */}
      {statusToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            statusToast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              : statusToast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
          }`}
        >
          <span>{statusToast.message}</span>
          <button type="button" onClick={clearToast} aria-label="Dismiss notification">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editorial Module Header */}
      <header className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Compass className="w-4 h-4" />
            <span>CAMPUS · College Explorer</span>
            {providerInfo && (
              <span className="text-slate-400 font-normal normal-case">
                · {providerInfo.isVerifiedOfficialFeed ? 'Official Feed' : 'Sample Development Provider'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            College Discovery & Admission Research
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Profile: {profile.name} ({profile.course}) · {roleInfo.role} Mode
          </p>
        </div>

        {/* Cross-Module Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to="/campus/kampus-id"
            className={`px-3 py-1.5 rounded-xl border font-semibold inline-flex items-center gap-1.5 ${
              crossModule.isKampusIdVerified
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {crossModule.isKampusIdVerified ? 'KAMPUS ID Verified' : 'Verify KAMPUS ID'}
            </span>
          </Link>

          <Link
            to="/tools/planner"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Planner</span>
          </Link>

          <Link
            to="/career"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Career</span>
          </Link>

          <button
            type="button"
            onClick={() => handleOpenAi()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>AI Assistant</span>
          </button>

          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-orange-500" />
              <span className="tabular-nums">Alerts ({unreadCount})</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      {!activeCollege && (
        <nav
          aria-label="College Explorer sections"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[11px] tabular-nums ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Main Content */}
      {loading && colleges.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
          Loading College Explorer workspace...
        </div>
      ) : activeCollege ? (
        <CollegeDetailAndReviewsView
          college={activeCollege}
          onBack={() => setActiveCollegeId(null)}
          onOpenAiForCollege={(colId, prompt) => handleOpenAi(prompt, colId)}
        />
      ) : activeTab === 'overview' ? (
        <ExplorerDashboardView
          onOpenCollegeDetail={openCollegeDetail}
          onNavigateExplore={(opts) => {
            setExploreSeedFilters(opts);
            setActiveTab('explore');
          }}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenAi={(prompt) => handleOpenAi(prompt)}
        />
      ) : activeTab === 'explore' ? (
        <ExploreCollegesView
          initialFilters={exploreSeedFilters}
          onOpenCollegeDetail={openCollegeDetail}
        />
      ) : activeTab === 'courses' ? (
        <CoursesExplorerView onOpenCollegeDetail={openCollegeDetail} />
      ) : activeTab === 'compare' ? (
        <CollegeCompareAndShortlistView
          mode="compare"
          sharedBanner={sharedBanner}
          onDismissSharedBanner={() => setSharedBanner(null)}
          onOpenCollegeDetail={openCollegeDetail}
          onSwitchToCompare={() => setActiveTab('compare')}
        />
      ) : activeTab === 'shortlist' ? (
        <CollegeCompareAndShortlistView
          mode="shortlist"
          onOpenCollegeDetail={openCollegeDetail}
          onSwitchToCompare={() => setActiveTab('compare')}
        />
      ) : activeTab === 'admissions' ? (
        <AdmissionsAndScholarshipsView
          mode="admissions"
          onOpenCollegeDetail={openCollegeDetail}
        />
      ) : activeTab === 'scholarships' ? (
        <AdmissionsAndScholarshipsView
          mode="scholarships"
          onOpenCollegeDetail={openCollegeDetail}
        />
      ) : (
        <ExplorerAdminView />
      )}

      {/* KAMPUS AI College Assistant Modal */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>KAMPUS AI College Assistant</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Strictly grounded in cataloged institutions — explicitly flags missing info and never guarantees admission
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="flex flex-wrap gap-1.5">
                {AI_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAiMode(m.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold ${
                      aiMode === m.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300 block">
                  Focus Institutions ({aiCollegeIds.length} selected; defaults to top cataloged colleges if none picked):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {colleges.map((c) => {
                    const selected = aiCollegeIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setAiCollegeIds((prev) =>
                            prev.includes(c.id)
                              ? prev.filter((id) => id !== c.id)
                              : [...prev, c.id].slice(0, 4)
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg border font-medium ${
                          selected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {c.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleRunAi} className="space-y-2.5">
                <textarea
                  rows={3}
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask about eligibility, fee comparison, document checklist, course suitability, or scholarship fit..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={aiRunning}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
                >
                  {aiRunning ? 'Analyzing catalog records...' : 'Generate Grounded Guidance'}
                </button>
              </form>

              {aiResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {aiResult.sourceLabel}
                  </p>
                  <div className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {aiResult.reply}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CollegeExplorerPage: React.FC<{ onOpenNotifications?: () => void }> = ({
  onOpenNotifications,
}) => {
  return (
    <CollegeExplorerProvider>
      <CollegeExplorerWorkspace onOpenNotifications={onOpenNotifications} />
    </CollegeExplorerProvider>
  );
};
