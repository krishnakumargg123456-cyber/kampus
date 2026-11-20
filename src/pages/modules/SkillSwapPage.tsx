import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Bell,
  Bot,
  CheckCircle2,
  Plus,
  Search,
} from 'lucide-react';
import { SkillSwapProvider, useSkillSwap } from '../../context/SkillSwapContext';
import { useNotifications } from '../../context/NotificationContext';
import { getStudentInitials } from '../../data/skillSwapData';
import {
  ListingIntent,
  SkillCategoryId,
  SkillExchange,
  SkillListing,
  SkillSwapReport,
  StudentSkillProfile,
} from '../../types/skillSwap';
import { SkillSwapDashboard } from '../../components/skillswap/SkillSwapDashboard';
import { ExploreSkillsView } from '../../components/skillswap/ExploreSkillsView';
import { FindLearningPartnerView } from '../../components/skillswap/FindLearningPartnerView';
import { MySkillSwapView } from '../../components/skillswap/MySkillSwapView';
import { SkillExchangeWorkspace } from '../../components/skillswap/SkillExchangeWorkspace';
import { OfferSkillWizardModal } from '../../components/skillswap/OfferSkillWizardModal';
import {
  SendExchangeRequestModal,
  ShareCommunityModal,
  SkillSwapAiModal,
  SkillSwapSafetyReportModal,
  StudentSkillProfileModal,
} from '../../components/skillswap/SkillSwapModals';

type SkillSwapViewMode = 'home' | 'explore' | 'match' | 'my-skillswap' | 'exchange';

interface SkillSwapPageProps {
  onOpenNotifications?: () => void;
}

const SkillSwapWorkspaceInner: React.FC<SkillSwapPageProps> = ({
  onOpenNotifications,
}) => {
  const { unreadCount } = useNotifications();
  const {
    currentUserName,
    currentUserCourse,
    myProfile,
    exchanges,
    requests,
    error,
    toastMessage,
  } = useSkillSwap();

  const [view, setView] = useState<SkillSwapViewMode>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreCategory, setExploreCategory] = useState<SkillCategoryId | 'all'>('all');
  const [activeExchangeId, setActiveExchangeId] = useState<string | null>(null);

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDefaultIntent, setWizardDefaultIntent] =
    useState<ListingIntent>('Teaching Offer');
  const [editingListing, setEditingListing] = useState<SkillListing | null>(null);

  const [profileModalTarget, setProfileModalTarget] =
    useState<StudentSkillProfile | null>(null);
  const [connectTarget, setConnectTarget] = useState<{
    profile: StudentSkillProfile;
    listing?: SkillListing;
  } | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiDefaultSkill, setAiDefaultSkill] = useState<string | undefined>(undefined);
  const [communityShareDraft, setCommunityShareDraft] = useState<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    targetType: SkillSwapReport['targetType'];
    targetId: string;
    targetSummary: string;
  } | null>(null);

  const activeExchange = useMemo(
    () => exchanges.find((e) => e.id === activeExchangeId) || null,
    [exchanges, activeExchangeId]
  );

  const pendingRequestsCount = useMemo(
    () =>
      requests.filter(
        (r) => r.recipientId === myProfile?.userId && r.status === 'Pending'
      ).length,
    [requests, myProfile]
  );

  const openOfferWizard = (intent: ListingIntent = 'Teaching Offer') => {
    setEditingListing(null);
    setWizardDefaultIntent(intent);
    setWizardOpen(true);
  };

  const handleOpenExchange = (ex: SkillExchange) => {
    setActiveExchangeId(ex.id);
    setView('exchange');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 md:pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                SkillSwap
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Peer-to-peer skill exchange, structured mentorship tracks, and student learning partnerships.
              </p>
            </div>

            {/* Search, Notifications, Student Profile */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() && view === 'home') {
                      setView('explore');
                    }
                  }}
                  placeholder="Search skills or students..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => myProfile && setProfileModalTarget(myProfile)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#172554] text-white text-[11px] font-extrabold flex items-center justify-center">
                  {getStudentInitials(currentUserName)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUserName}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">
                    {currentUserCourse}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => {
                  setActiveExchangeId(null);
                  setView('home');
                }}
                className={`px-3.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                  view === 'home'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveExchangeId(null);
                  setView('explore');
                }}
                className={`px-3.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                  view === 'explore'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Explore Skills
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveExchangeId(null);
                  setView('match');
                }}
                className={`px-3.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                  view === 'match'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Find Learning Partner
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveExchangeId(null);
                  setView('my-skillswap');
                }}
                className={`px-3.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  view === 'my-skillswap' || view === 'exchange'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>My SkillSwap</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold tabular-nums">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiDefaultSkill(undefined);
                  setAiModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
              >
                <Bot className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Skill Advisor</span>
              </button>
              <button
                type="button"
                onClick={() => openOfferWizard('Teaching Offer')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Offer a Skill</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {view === 'home' && (
          <SkillSwapDashboard
            searchQuery={searchQuery}
            onNavigateExplore={(cat) => {
              setExploreCategory(cat || 'all');
              setView('explore');
            }}
            onNavigateMatch={() => setView('match')}
            onNavigateMySkillSwap={() => setView('my-skillswap')}
            onOpenOfferWizard={() => openOfferWizard('Teaching Offer')}
            onOpenAi={(skill) => {
              setAiDefaultSkill(skill);
              setAiModalOpen(true);
            }}
            onOpenProfile={(p) => setProfileModalTarget(p)}
            onConnect={(p, l) => setConnectTarget({ profile: p, listing: l })}
            onOpenExchange={handleOpenExchange}
          />
        )}

        {view === 'explore' && (
          <ExploreSkillsView
            initialCategory={exploreCategory}
            globalSearch={searchQuery}
            onOpenProfile={(p) => setProfileModalTarget(p)}
            onConnect={(p, l) => setConnectTarget({ profile: p, listing: l })}
            onReport={(t) => setReportTarget(t)}
          />
        )}

        {view === 'match' && (
          <FindLearningPartnerView
            onOpenProfile={(p) => setProfileModalTarget(p)}
            onConnect={(p, l) => setConnectTarget({ profile: p, listing: l })}
          />
        )}

        {view === 'my-skillswap' && (
          <MySkillSwapView
            onOpenOfferWizard={(intent) => openOfferWizard(intent || 'Teaching Offer')}
            onEditListing={(l) => {
              setEditingListing(l);
              setWizardOpen(true);
            }}
            onOpenProfile={(p) => setProfileModalTarget(p)}
            onConnect={(p) => setConnectTarget({ profile: p })}
            onOpenExchange={handleOpenExchange}
            onShareCommunity={(draft) => setCommunityShareDraft(draft)}
          />
        )}

        {view === 'exchange' && activeExchange && (
          <SkillExchangeWorkspace
            exchange={activeExchange}
            onBack={() => {
              setActiveExchangeId(null);
              setView('my-skillswap');
            }}
            onOpenAi={(skill) => {
              setAiDefaultSkill(skill);
              setAiModalOpen(true);
            }}
            onShareCommunity={(draft) => setCommunityShareDraft(draft)}
          />
        )}
      </main>

      {/* Modals */}
      <OfferSkillWizardModal
        isOpen={wizardOpen}
        editingListing={editingListing}
        defaultIntent={wizardDefaultIntent}
        onClose={() => {
          setWizardOpen(false);
          setEditingListing(null);
        }}
      />

      <SendExchangeRequestModal
        target={connectTarget}
        onClose={() => setConnectTarget(null)}
      />

      <StudentSkillProfileModal
        profile={profileModalTarget}
        onClose={() => setProfileModalTarget(null)}
        onConnect={(p) => {
          setProfileModalTarget(null);
          setConnectTarget({ profile: p });
        }}
        onReport={(t) => setReportTarget(t)}
      />

      <SkillSwapAiModal
        isOpen={aiModalOpen}
        defaultSkill={aiDefaultSkill}
        onClose={() => setAiModalOpen(false)}
      />

      <ShareCommunityModal
        draft={communityShareDraft}
        onClose={() => setCommunityShareDraft(null)}
      />

      <SkillSwapSafetyReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />

      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const SkillSwapPage: React.FC<SkillSwapPageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <SkillSwapProvider>
      <SkillSwapWorkspaceInner onOpenNotifications={onOpenNotifications} />
    </SkillSwapProvider>
  );
};
