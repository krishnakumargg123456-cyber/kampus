import React, { useEffect, useState } from 'react';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { CareerProvider, useCareer } from '../../context/CareerContext';
import {
  CareerDashboardView,
  CareerSectionTab,
} from '../../components/career/CareerDashboardView';
import { OpportunityDiscoveryAndDetailView } from '../../components/career/OpportunityDiscoveryAndDetailView';
import { ApplicationTrackerView } from '../../components/career/ApplicationTrackerView';
import { ResumeBuilderView } from '../../components/career/ResumeBuilderView';
import { PortfolioBuilderView } from '../../components/career/PortfolioBuilderView';
import { CareerPathsAndRoadmapView } from '../../components/career/CareerPathsAndRoadmapView';
import { InterviewAndAssessmentsView } from '../../components/career/InterviewAndAssessmentsView';
import {
  CareerProfileAndAlertsView,
  LearningScholarshipsEventsView,
  RecruiterAndAdminPortalView,
} from '../../components/career/LearningScholarshipsEventsProfileView';
import { PublicPortfolioViewer } from '../../components/career/PublicPortfolioViewer';
import type { CareerOpportunity } from '../../types/career';

interface CareerPageProps {
  onOpenNotifications?: () => void;
}

const CareerWorkspace: React.FC<CareerPageProps> = ({ onOpenNotifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    loading,
    statusToast,
    clearToast,
    roleInfo,
    runCareerAiAssistant,
  } = useCareer();

  const [activeTab, setActiveTab] = useState<CareerSectionTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<CareerOpportunity | null>(null);

  // Public portfolio viewer via ?portfolio=slug
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  // AI Career Assistant Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState<
    'career-paths' | 'skill-gaps' | 'project-ideas' | 'cover-letter' | 'email-draft' | 'interview-followup'
  >('career-paths');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<{ reply: string; sourceLabel: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slug = params.get('portfolio');
    setPublicSlug(slug);
  }, [location.search]);

  const handleOpenOpportunity = (opp: CareerOpportunity) => {
    setSelectedOpportunity(opp);
    setActiveTab('opportunities');
  };

  const handleRunCareerAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiBusy(true);
    try {
      const res = await runCareerAiAssistant(aiMode, aiPrompt);
      setAiResult(res);
    } finally {
      setAiBusy(false);
    }
  };

  if (publicSlug) {
    return (
      <PublicPortfolioViewer
        slug={publicSlug}
        onExitPublicView={() => {
          setPublicSlug(null);
          navigate('/career', { replace: true });
        }}
      />
    );
  }

  const navItems: Array<{ id: CareerSectionTab; label: string }> = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'tracker', label: 'Tracker' },
    { id: 'resume', label: 'Resume & AI' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'paths', label: 'Paths & Roadmap' },
    { id: 'interview', label: 'Interview & Tests' },
    { id: 'learning', label: 'Learning & Grants' },
    { id: 'profile', label: 'Profile & Saved' },
    { id: 'portal', label: 'Recruiter / Admin' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            <Briefcase className="w-4 h-4" />
            <span>KAMPUS Career · {roleInfo.role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] dark:text-slate-100 tracking-tight mt-1">
            Career & Opportunity Center
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
            Discover internships & jobs, build ATS resumes, publish portfolios, practice interviews, and track every step.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>KAMPUS AI Career Guide</span>
          </button>
          <button
            type="button"
            onClick={() => (onOpenNotifications ? onOpenNotifications() : navigate('/account/notifications'))}
            aria-label="Career notifications"
            className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#172033] dark:text-slate-200" />
            <span className="tabular-nums">{unreadCount}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/account/profile')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">{profile.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {statusToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            statusToast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : statusToast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusToast.message}</span>
          </div>
          <button type="button" onClick={clearToast} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === item.id
                ? 'bg-[#2563EB] text-white'
                : 'text-[#64748B] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Active Workspace Section */}
      {loading ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-[#64748B]">
          Loading KAMPUS Career workspace...
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <CareerDashboardView
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onNavigateTab={setActiveTab}
              onOpenOpportunity={handleOpenOpportunity}
              onOpenAiCareerModal={() => setAiModalOpen(true)}
            />
          )}
          {activeTab === 'opportunities' && (
            <OpportunityDiscoveryAndDetailView
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedOpportunity={selectedOpportunity}
              onSelectOpportunity={setSelectedOpportunity}
            />
          )}
          {activeTab === 'tracker' && <ApplicationTrackerView />}
          {activeTab === 'resume' && <ResumeBuilderView />}
          {activeTab === 'portfolio' && <PortfolioBuilderView />}
          {activeTab === 'paths' && <CareerPathsAndRoadmapView />}
          {activeTab === 'interview' && <InterviewAndAssessmentsView />}
          {activeTab === 'learning' && (
            <LearningScholarshipsEventsView onOpenAiCareerModal={() => setAiModalOpen(true)} />
          )}
          {activeTab === 'profile' && (
            <CareerProfileAndAlertsView onOpenOpportunity={handleOpenOpportunity} />
          )}
          {activeTab === 'portal' && <RecruiterAndAdminPortalView />}
        </>
      )}

      {/* KAMPUS AI Career Assistant Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <Sparkles className="w-4 h-4" />
                  <span>KAMPUS AI Career Assistant</span>
                </div>
                <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                  Career Guidance, Skill Gaps & Editable Drafts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleRunCareerAi(e)} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    ['career-paths', 'Career Path Ideas'],
                    ['skill-gaps', 'Skill Gap Check'],
                    ['project-ideas', 'Project Ideas'],
                    ['cover-letter', 'Cover Letter Draft'],
                    ['email-draft', 'Outreach Email Draft'],
                    ['interview-followup', 'Follow-Up Email'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAiMode(m)}
                    className={`p-2 rounded-lg border font-semibold cursor-pointer ${
                      aiMode === m
                        ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30 text-[#2563EB]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your target role, skills, or draft context..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#64748B]">
                  Outputs are clearly marked AI-generated drafts; never fabricates experience or guarantees hiring.
                </span>
                <button
                  type="submit"
                  disabled={aiBusy}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {aiBusy ? 'Generating...' : 'Generate Guidance'}
                </button>
              </div>
            </form>

            {aiResult && (
              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="font-bold text-[#2563EB]">{aiResult.sourceLabel}</div>
                <pre className="whitespace-pre-wrap font-sans text-[#172033] dark:text-slate-200 leading-relaxed">
                  {aiResult.reply}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CareerPage: React.FC<CareerPageProps> = ({ onOpenNotifications }) => {
  return (
    <CareerProvider>
      <CareerWorkspace onOpenNotifications={onOpenNotifications} />
    </CareerProvider>
  );
};
